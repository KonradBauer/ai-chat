import { ArrowUp, Square } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  isStreaming: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
}

export function ChatInput({ isStreaming, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = value.trim().length === 0;

  function handleSend() {
    if (isEmpty) return;
    onSend(value);
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        onStop();
        return;
      }
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-background px-2 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-input bg-background px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 sm:px-4",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            className={cn(
              "max-h-40 min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:border-0 focus-visible:ring-0 sm:text-base",
              "placeholder:text-muted-foreground/60",
            )}
            disabled={false}
          />

          {isStreaming ? (
            <Button
              variant="default"
              size="icon"
              onClick={onStop}
              className="mb-0.5 shrink-0"
              aria-label="Stop generating"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={isEmpty}
              className="mb-0.5 shrink-0"
              aria-label="Send message"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>

        <p className="mt-1.5 text-center text-[11px] text-muted-foreground/50">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
