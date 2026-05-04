import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/chat-message";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import type { ChatStatus, Conversation } from "@/lib/types";

interface ChatMessageListProps {
  conversation: Conversation;
  status: ChatStatus;
  onRetry: () => void;
}

export function ChatMessageList({
  conversation,
  status,
  onRetry,
}: ChatMessageListProps) {
  const { containerRef, isUserScrolledUp, resumeAutoScroll } = useAutoScroll(
    conversation.messages,
  );

  const streamingMessageId =
    status.type === "streaming" ? status.messageId : null;
  const errorMessageId = status.type === "error" ? status.messageId : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 sm:gap-6 sm:py-6"
      >
        {conversation.messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-medium text-foreground sm:text-lg">
              What can I help you with?
            </p>
            <p className="text-sm text-muted-foreground">
              Start a conversation below.
            </p>
          </div>
        )}

        {conversation.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
            isError={message.id === errorMessageId}
            onRetry={message.id === errorMessageId ? onRetry : undefined}
          />
        ))}

        <div className="h-2 shrink-0" aria-hidden />
      </div>

      {isUserScrolledUp && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <Button
            variant="secondary"
            size="sm"
            onClick={resumeAutoScroll}
            className="gap-1.5 shadow-lg"
          >
            <ChevronDown className="size-3.5" />
            Scroll to bottom
          </Button>
        </div>
      )}
    </div>
  );
}
