import { Menu, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useChat } from "@/hooks/use-chat";

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const {
    conversations,
    activeConversation,
    status,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
    retryLastMessage,
  } = useChat();

  const isStreaming = status.type === "streaming";

  function handleSelectConversation(id: string) {
    selectConversation(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversation.id}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={() => {
          createConversation();
          setSidebarOpen(false);
        }}
        onSelect={handleSelectConversation}
        onDelete={deleteConversation}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="size-4" />
          </Button>

          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {activeConversation.title}
          </h1>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              createConversation();
              setSidebarOpen(false);
            }}
            aria-label="New conversation"
          >
            <Plus className="size-4" />
          </Button>
        </header>

        {/* Messages */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col px-2 sm:px-4">
            <ChatMessageList
              conversation={activeConversation}
              status={status}
              onRetry={retryLastMessage}
            />
          </div>
        </div>

        {/* Input */}
        <ChatInput
          isStreaming={isStreaming}
          onSend={sendMessage}
          onStop={stopStreaming}
        />
      </div>
    </div>
  );
}
