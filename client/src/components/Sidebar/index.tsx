import { ChevronRight, PanelLeftClose, PanelLeftOpen, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useReducer, useRef } from "react";
import type { ConversationSummary } from "../../store/chatSlice";
import {
  deleteConfirmationReducer,
  initialDeleteConfirmationState
} from "./deleteConfirmation";
import { getHistoryViewState } from "./historyState";

type SidebarProps = {
  conversationId: string | null;
  conversations: ConversationSummary[];
  historyError: string | null;
  isHistoryLoading: boolean;
  isConversationLoading: boolean;
  isHistoryOpen: boolean;
  isLoading: boolean;
  onDeleteConversation: (id: string) => Promise<boolean>;
  onNewChat: () => void;
  onRetryHistory: () => void;
  onSelectConversation: (id: string) => void;
  onSetHistoryOpen: (isOpen: boolean) => void;
  formatTimestamp: (timestamp: string) => string;
};

export function Sidebar({
  conversationId,
  conversations,
  formatTimestamp,
  historyError,
  isConversationLoading,
  isHistoryLoading,
  isHistoryOpen,
  isLoading,
  onDeleteConversation,
  onNewChat,
  onRetryHistory,
  onSelectConversation,
  onSetHistoryOpen
}: SidebarProps) {
  const historyViewState = getHistoryViewState({
    conversationCount: conversations.length,
    error: historyError,
    isLoading: isHistoryLoading
  });
  const [deleteConfirmation, dispatchDeleteConfirmation] = useReducer(
    deleteConfirmationReducer,
    initialDeleteConfirmationState
  );
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteRequestInFlightRef = useRef(false);
  const lastDeleteTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dialog = deleteDialogRef.current;

    if (deleteConfirmation.target && dialog && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!deleteConfirmation.target) {
      const deleteTrigger = lastDeleteTriggerRef.current;

      if (deleteTrigger?.isConnected) {
        deleteTrigger.focus();
      }

      lastDeleteTriggerRef.current = null;
    }
  }, [deleteConfirmation.target]);

  async function confirmDeletion() {
    const target = deleteConfirmation.target;

    if (!target || deleteConfirmation.isDeleting || deleteRequestInFlightRef.current) {
      return;
    }

    deleteRequestInFlightRef.current = true;
    dispatchDeleteConfirmation({ type: "start" });

    try {
      const wasDeleted = await onDeleteConversation(target.id);
      dispatchDeleteConfirmation({ type: wasDeleted ? "success" : "failure" });
    } finally {
      deleteRequestInFlightRef.current = false;
    }
  }

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
        {isConversationLoading ? (
          <div className="history-progress" role="status">
            Opening conversation…
          </div>
        ) : null}

        {historyError && historyViewState === "ready" ? (
          <div className="history-inline-error" role="alert">
            <span>History could not refresh.</span>
            <button onClick={onRetryHistory} type="button">Retry</button>
          </div>
        ) : null}

        {historyViewState === "loading" ? (
          <div className="empty-state" role="status">
            <RefreshCw aria-hidden="true" className="is-spinning" size={18} />
            <strong>Loading conversations…</strong>
            <span>Checking your saved local history.</span>
          </div>
        ) : historyViewState === "error" ? (
          <div className="empty-state history-error-state" role="alert">
            <strong>History could not load.</strong>
            <span>{historyError}</span>
            <button className="ghost-button" onClick={onRetryHistory} type="button">
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        ) : historyViewState === "empty" ? (
          <div className="empty-state">
            <strong>No saved conversations yet.</strong>
            <span>Send a message and CodeChat will save the thread here.</span>
          </div>
        ) : historyViewState === "ready" ? (
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
                onClick={(event) => {
                  lastDeleteTriggerRef.current = event.currentTarget;
                  dispatchDeleteConfirmation({
                    type: "request",
                    target: {
                      id: conversation.id,
                      title: conversation.title
                    }
                  });
                }}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        ) : null}
      </div>

      {deleteConfirmation.target ? (
        <dialog
          aria-labelledby="delete-conversation-title"
          aria-describedby="delete-conversation-description"
          className="confirmation-dialog"
          onCancel={(event) => {
            if (deleteConfirmation.isDeleting) {
              event.preventDefault();
              return;
            }

            dispatchDeleteConfirmation({ type: "cancel" });
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleteConfirmation.isDeleting) {
              dispatchDeleteConfirmation({ type: "cancel" });
            }
          }}
          ref={deleteDialogRef}
        >
          <div className="confirmation-dialog-content">
            <div>
              <p className="eyebrow">Permanent action</p>
              <h2 id="delete-conversation-title">Delete conversation?</h2>
            </div>
            <p id="delete-conversation-description">
              “{deleteConfirmation.target.title}” will be permanently deleted. This cannot be
              undone.
            </p>
            <div className="confirmation-actions">
              <button
                autoFocus
                className="confirmation-cancel"
                disabled={deleteConfirmation.isDeleting}
                onClick={() => dispatchDeleteConfirmation({ type: "cancel" })}
                type="button"
              >
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={deleteConfirmation.isDeleting}
                onClick={() => void confirmDeletion()}
                type="button"
              >
                {deleteConfirmation.isDeleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </aside>
  );
}
