import { useEffect, useRef, useState } from "react";
import { streamChat } from "@/lib/llm-client";
import type { ChatStatus, Conversation, Message } from "@/lib/types";

const STORAGE_KEY = "agentica:conversations";
const ACTIVE_ID_KEY = "agentica:activeId";

function makeId(): string {
  return crypto.randomUUID();
}

function makeConversation(): Conversation {
  return {
    id: makeId(),
    title: "New chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function loadInitialState(): {
  conversations: Conversation[];
  activeId: string;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedActiveId =
          localStorage.getItem(ACTIVE_ID_KEY) ?? parsed[0].id;
        const activeId = parsed.find((c) => c.id === storedActiveId)
          ? storedActiveId
          : parsed[0].id;
        return { conversations: parsed, activeId };
      }
    }
  } catch {
    // corrupted data — fall through to fresh state
  }
  const fresh = makeConversation();
  return { conversations: [fresh], activeId: fresh.id };
}

export function useChat() {
  // Single useState call prevents two separate loadInitialState() calls from
  // generating different UUIDs, which caused activeId to not match any conversation.
  const [{ conversations, activeId }, setCoreState] =
    useState(loadInitialState);
  const [status, setStatus] = useState<ChatStatus>({ type: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? conversations[0];

  function updateConversation(
    id: string,
    updater: (c: Conversation) => Conversation,
  ) {
    setCoreState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? updater(c) : c,
      ),
    }));
  }

  function createConversation() {
    const next = makeConversation();
    setCoreState((prev) => ({
      conversations: [next, ...prev.conversations],
      activeId: next.id,
    }));
    abortRef.current?.abort();
    setStatus({ type: "idle" });
  }

  function selectConversation(id: string) {
    if (id === activeId) return;
    abortRef.current?.abort();
    setStatus({ type: "idle" });
    setCoreState((prev) => ({ ...prev, activeId: id }));
  }

  function deleteConversation(id: string) {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fresh = makeConversation();
      setCoreState({ conversations: [fresh], activeId: fresh.id });
      return;
    }
    const newActiveId = id === activeId ? remaining[0].id : activeId;
    setCoreState({ conversations: remaining, activeId: newActiveId });
  }

  async function streamResponse(
    conversationId: string,
    assistantId: string,
    history: Message[],
  ) {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ type: "streaming", messageId: assistantId });

    try {
      for await (const token of streamChat(history, controller.signal)) {
        updateConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        }));
      }
      // Only update status if this stream is still the active one
      if (abortRef.current === controller) {
        setStatus({ type: "idle" });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (abortRef.current === controller) {
          setStatus({ type: "idle" });
        }
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setStatus({ type: "error", error: message, messageId: assistantId });
    }
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (status.type === "streaming") {
      abortRef.current?.abort();
    }

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    const assistantId = makeId();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    const conversationId = activeId;

    updateConversation(conversationId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? trimmed.slice(0, 40) : c.title,
      messages: [...c.messages, userMessage, assistantMessage],
      updatedAt: Date.now(),
    }));

    // Snapshot before state update flushes — correct history for LLM
    const history = [...activeConversation.messages, userMessage];
    await streamResponse(conversationId, assistantId, history);
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setStatus({ type: "idle" });
  }

  function retryLastMessage() {
    const messages = activeConversation.messages;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    const assistantId = makeId();
    const freshAssistant: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    // Replace last (failed) assistant message with fresh placeholder
    updateConversation(activeId, (c) => ({
      ...c,
      messages: [...c.messages.slice(0, -1), freshAssistant],
      updatedAt: Date.now(),
    }));

    // History = messages up to and including the last user message (no failed assistant)
    const history = messages.slice(0, -1);
    void streamResponse(activeId, assistantId, history);
  }

  return {
    conversations,
    activeConversation,
    status,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
    retryLastMessage,
  };
}
