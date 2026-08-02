import type { StreamEvent } from "./chatSlice";

type StreamEventHandlers = {
  appendAssistantContent: (content: string) => void;
  refreshConversations: () => Promise<void>;
  setConversationId: (conversationId: string) => void;
};

export async function applyStreamEvent(
  event: StreamEvent,
  handlers: StreamEventHandlers
) {
  if (event.type === "conversation") {
    handlers.setConversationId(event.conversationId);
    await handlers.refreshConversations();
    return;
  }

  if (event.type === "chunk") {
    handlers.appendAssistantContent(event.content);
    return;
  }

  if (event.type === "error") {
    throw new Error(event.error);
  }
}
