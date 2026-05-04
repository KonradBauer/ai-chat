import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string;
  isOpen: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onClose,
  onNew,
  onSelect,
  onDelete,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col border-r border-border bg-sidebar transition-transform duration-300 ease-in-out",
          "lg:relative lg:inset-y-0 lg:z-auto lg:transition-none",
          isOpen ? "translate-x-0 lg:translate-x-0" : "-translate-x-full",
          !isOpen && "lg:hidden",
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Conversations
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNew}
              aria-label="New conversation"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-0.5 p-2">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
      )}
    >
      <button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        aria-current={isActive ? "true" : undefined}
        onClick={() => onSelect(conversation.id)}
      >
        <MessageSquare className="size-3.5 shrink-0 opacity-60" />
        <span className="truncate text-sm">{conversation.title}</span>
      </button>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversation.id);
        }}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Delete conversation"
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}
