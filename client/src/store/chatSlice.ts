import type { PersonaOption } from "./modeSlice";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatHistoryMessage = {
  role: Message["role"];
  content: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model: string;
  persona: PersonaOption["id"];
};

export type StoredMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  persona: PersonaOption["id"] | null;
  created_at: string;
};

export type ConversationDetail = ConversationSummary & {
  messages: StoredMessage[];
};

export type ChatApiResponse = {
  conversationId?: string;
  message?: {
    content?: string;
  };
  error?: string;
};

export type StreamEvent =
  | {
      type: "conversation";
      conversationId: string;
    }
  | {
      type: "chunk";
      content: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      error: string;
    };

export const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Hi, I am CodeChat. Ask me a coding question and I will help you work through it."
  }
];

export function isVisibleMessage(message: StoredMessage): message is StoredMessage & Message {
  return message.role === "user" || message.role === "assistant";
}

export function toChatHistory(messages: Message[]): ChatHistoryMessage[] {
  return messages
    .filter((message) => message.id !== "welcome" && message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
}

export function formatErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("ollama") ||
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("could not connect")
  ) {
    return "AI responses require the local CodeChat backend and Ollama to be running. Please run the project locally for full functionality.";
  }

  return message;
}
