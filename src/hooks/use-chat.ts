import { useRef, useState } from "react";
import { streamChat } from "@/lib/llm-client";
import type { ChatStatus, Conversation, Message } from "@/lib/types";

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

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    makeConversation(),
  ]);
  const [activeId, setActiveId] = useState<string>(
    () => conversations[0].id,
  );
  const [status, setStatus] = useState<ChatStatus>({ type: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? conversations[0];

  function updateConversation(
    id: string,
    updater: (c: Conversation) => Conversation,
  ) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? updater(c) : c)),
    );
  }

  function createConversation() {
    const next = makeConversation();
    setConversations((prev) => [next, ...prev]);
    setActiveId(next.id);
    abortRef.current?.abort();
    setStatus({ type: "idle" });
  }

  function selectConversation(id: string) {
    if (id === activeId) return;
    abortRef.current?.abort();
    setStatus({ type: "idle" });
    setActiveId(id);
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = makeConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(next[0].id);
      }
      return next;
    });
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

    updateConversation(conversationId, (c) => {
      const isFirstMessage = c.messages.length === 0;
      return {
        ...c,
        title: isFirstMessage ? trimmed.slice(0, 40) : c.title,
        messages: [...c.messages, userMessage, assistantMessage],
        updatedAt: Date.now(),
      };
    });

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ type: "streaming", messageId: assistantId });

    const allMessages = [
      ...activeConversation.messages,
      userMessage,
    ];

    try {
      for await (const token of streamChat(allMessages, controller.signal)) {
        updateConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        }));
      }
      setStatus({ type: "idle" });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus({ type: "idle" });
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setStatus({ type: "error", error: message, messageId: assistantId });
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setStatus({ type: "idle" });
  }

  function retryLastMessage() {
    const messages = activeConversation.messages;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    updateConversation(activeId, (c) => ({
      ...c,
      messages: c.messages.filter((m) => m.id !== activeConversation.messages.at(-1)?.id),
    }));

    void sendMessage(lastUser.content);
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
