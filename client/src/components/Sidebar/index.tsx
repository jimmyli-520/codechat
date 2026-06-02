import { ChevronRight, PanelLeftClose, PanelLeftOpen, Trash2 } from "lucide-react";
import type { ConversationSummary } from "../../store/chatSlice";

type SidebarProps = {
  conversationId: string | null;
  conversations: ConversationSummary[];
  isConversationLoading: boolean;
  isHistoryOpen: boolean;
  isLoading: boolean;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSetHistoryOpen: (isOpen: boolean) => void;
  formatTimestamp: (timestamp: string) => string;
};

export function Sidebar({
  conversationId,
  conversations,
  formatTimestamp,
  isConversationLoading,
  isHistoryOpen,
  isLoading,
  onDeleteConversation,
  onNewChat,
  onSelectConversation,
  onSetHistoryOpen
}: SidebarProps) {
  if (!isHistoryOpen) {
    return (
      <button
        aria-label="Expand history"
        className="history-rail"
        onClick={() => onSetHistoryOpen(true)}
        type="button"
      >
        <PanelLeftOpen size={18} />
        <span>History</span>
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <aside className="conversation-sidebar" aria-label="Saved conversations">
      <div className="sidebar-header">
        <div>
          <p className="eyebrow">History</p>
          <h1>Conversations</h1>
        </div>
        <div className="history-actions">
          <button className="ghost-button" onClick={onNewChat} type="button">
            New
          </button>
          <button
            aria-label="Collapse history"
            className="icon-button"
            onClick={() => onSetHistoryOpen(false)}
            type="button"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <strong>No saved conversations yet.</strong>
            <span>Send a message and CodeChat will save the thread here.</span>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              className={`conversation-item${conversation.id === conversationId ? " active" : ""}`}
              key={conversation.id}
            >
              <button
                className="conversation-select"
                disabled={isConversationLoading}
                onClick={() => onSelectConversation(conversation.id)}
                type="button"
              >
                <span>{conversation.title}</span>
                <time dateTime={conversation.updated_at}>
                  {formatTimestamp(conversation.updated_at)}
                </time>
              </button>
              <button
                aria-label={`Delete ${conversation.title}`}
                className="conversation-delete icon-button"
                disabled={isLoading}
                onClick={() => onDeleteConversation(conversation.id)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
