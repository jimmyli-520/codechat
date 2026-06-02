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

type ViteImportMeta = ImportMeta & {
  env: {
    VITE_API_URL?: string;
  };
};

const backendUnavailableMessage =
  "AI responses require the local CodeChat backend and Ollama to be running.";

function getApiUrl(path: string) {
  const apiBaseUrl = (import.meta as ViteImportMeta).env.VITE_API_URL?.trim();

  if (!apiBaseUrl) {
    return path;
  }

  try {
    const url = new URL(apiBaseUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid API URL protocol.");
    }

    return `${url.toString().replace(/\/$/, "")}${path}`;
  } catch {
    throw new Error(backendUnavailableMessage);
  }
}

async function fetchApi(path: string, options?: RequestInit) {
  try {
    return await fetch(getApiUrl(path), options);
  } catch (caughtError) {
    if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
      throw caughtError;
    }

    throw new Error(backendUnavailableMessage);
  }
}

async function readApiJson<T>(response: Response, fallbackMessage: string) {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(response.ok ? fallbackMessage : backendUnavailableMessage);
  }
}

async function getApiErrorMessage(response: Response, fallbackMessage: string) {
  const data = await readApiJson<ApiErrorResponse>(response, fallbackMessage);

  return getApiErrorFromData(data, fallbackMessage);
}

function getApiErrorFromData(data: unknown, fallbackMessage: string) {
  if (typeof data !== "object" || data === null || !("error" in data)) {
    return fallbackMessage;
  }

  const error = (data as { error?: unknown }).error;

  return typeof error === "string" && error ? error : fallbackMessage;
}

export async function fetchConversations() {
  const response = await fetchApi("/api/conversations");
  const data = await readApiJson<ConversationSummary[] | ApiErrorResponse>(
    response,
    "Could not load conversations."
  );

  if (!response.ok) {
    throw new Error(getApiErrorFromData(data, "Could not load conversations."));
  }

  if (!Array.isArray(data)) {
    throw new Error("Could not load conversations.");
  }

  return data;
}

export async function fetchConversation(id: string) {
  const response = await fetchApi(`/api/conversations/${id}`);
  const data = await readApiJson<ConversationDetail | ApiErrorResponse>(
    response,
    "Could not load conversation."
  );

  if (!response.ok) {
    throw new Error(getApiErrorFromData(data, "Could not load conversation."));
  }

  return data as ConversationDetail;
}

export async function deleteConversation(id: string) {
  const response = await fetchApi(`/api/conversations/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Could not delete conversation."));
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
  const response = await fetchApi("/api/chat", {
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

  const data = await readApiJson<ChatApiResponse>(response, "CodeChat could not send your message.");

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
  const response = await fetchApi("/api/chat/stream", {
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

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "CodeChat could not start streaming."));
  }

  return response;
}
