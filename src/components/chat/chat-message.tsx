import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export function ChatMessage({
  message,
  isStreaming,
  isError,
  onRetry,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-2 sm:px-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:size-7">
          AI
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]",
          isUser ? "flex flex-col items-end" : "flex flex-col items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed sm:px-4 sm:text-base",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-transparent text-foreground",
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : message.content ? (
            <>
              <ChatMarkdown content={message.content} />
              {isStreaming && (
                <p className="-mt-2 mb-0">
                  <span
                    aria-hidden
                    className="inline-block h-[1em] w-px animate-[blink_1s_ease-in-out_infinite] bg-current align-middle"
                  />
                </p>
              )}
            </>
          ) : isStreaming ? (
            <span
              aria-hidden
              className="inline-block h-[1em] w-px animate-[blink_1s_ease-in-out_infinite] bg-current align-middle"
            />
          ) : (
            <span className="italic text-muted-foreground">(empty response)</span>
          )}
        </div>

        {isError && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5" />
            <span>Failed to generate response</span>
            {onRetry && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onRetry}
                className="text-destructive hover:text-destructive"
              >
                <RefreshCw className="size-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground sm:size-7">
          You
        </div>
      )}
    </div>
  );
}
