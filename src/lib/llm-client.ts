import type { Message } from "@/lib/types";

interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function toApiMessages(messages: Message[]): LlmMessage[] {
  return messages.map(({ role, content }) => ({ role, content }));
}

function parseChunk(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  const payload = line.slice(6).trim();
  if (payload === "[DONE]") return null;
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

export async function* streamChat(
  messages: Message[],
  signal: AbortSignal,
): AsyncGenerator<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "unsloth/Qwen3.5-9B",
      messages: toApiMessages(messages),
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`API error ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("Response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const token = parseChunk(line.trim());
        if (token) yield token;
      }
    }

    if (buffer.trim()) {
      const token = parseChunk(buffer.trim());
      if (token) yield token;
    }
  } finally {
    reader.releaseLock();
  }
}
