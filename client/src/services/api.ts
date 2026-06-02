import type {
  ChatApiResponse,
  ChatHistoryMessage,
  ConversationDetail,
  ConversationSummary
} from "../store/chatSlice";
import type { PersonaOption } from "../store/modeSlice";

type ApiErrorResponse = {
  error?: string;
};

export async function fetchConversations() {
  const response = await fetch("/api/conversations");
  const data = (await response.json()) as ConversationSummary[] | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in data ? data.error : "Could not load conversations.");
  }

  if (!Array.isArray(data)) {
    throw new Error("Could not load conversations.");
  }

  return data;
}

export async function fetchConversation(id: string) {
  const response = await fetch(`/api/conversations/${id}`);
  const data = (await response.json()) as ConversationDetail | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in data ? data.error : "Could not load conversation.");
  }

  return data as ConversationDetail;
}

export async function deleteConversation(id: string) {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const data = (await response.json()) as ApiErrorResponse;
    throw new Error(data.error ?? "Could not delete conversation.");
  }
}

export async function sendChatMessage({
  conversationId,
  message,
  model,
  messages,
  persona
}: {
  conversationId: string | null;
  message: string;
  model: string;
  messages: ChatHistoryMessage[];
  persona: PersonaOption["id"];
}) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      conversationId,
      message,
      messages,
      model,
      persona
    })
  });

  const data = (await response.json()) as ChatApiResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "CodeChat could not send your message.");
  }

  return data;
}

export async function startChatStream({
  conversationId,
  message,
  model,
  messages,
  persona,
  signal
}: {
  conversationId: string | null;
  message: string;
  model: string;
  messages: ChatHistoryMessage[];
  persona: PersonaOption["id"];
  signal: AbortSignal;
}) {
  return fetch("/api/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      conversationId,
      message,
      messages,
      model,
      persona
    }),
    signal
  });
}
