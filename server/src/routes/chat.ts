import { Router, type Request, type Response } from "express";
import {
  createConversation,
  getConversation,
  saveMessage
} from "../db/pool.js";

const defaultModel = "llama3.2:3b";

type Persona = "code-reviewer" | "code-teacher" | "code-generator";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  conversationId?: string;
  message?: string;
  messages?: ChatMessage[];
  model?: string;
  persona?: string;
};

type OllamaChatResponse = {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
};

type ChatResponse = OllamaChatResponse & {
  conversationId: string;
};

type OllamaStreamChunk = {
  message?: {
    content?: string;
  };
  done?: boolean;
};

type ApiErrorResponse = {
  error: string;
};

const systemPrompts: Record<Persona, string> = {
  "code-reviewer":
    "You are CodeChat in Code Reviewer mode. Review code with a focus on correctness, maintainability, edge cases, security, and clear actionable feedback. Be concise and point out the most important issues first.",
  "code-teacher":
    "You are CodeChat in Code Teacher mode. Explain programming concepts clearly and patiently. Guide the learner step by step, ask useful questions when needed, and favor understanding over simply giving answers.",
  "code-generator":
    "You are CodeChat in Code Generator mode. Help produce clean, practical code. Explain key choices briefly, include complete snippets when useful, and avoid unnecessary complexity."
};

function resolvePersona(persona?: string): Persona {
  if (
    persona === "code-reviewer" ||
    persona === "code-teacher" ||
    persona === "code-generator"
  ) {
    return persona;
  }

  return "code-teacher";
}

function isHistoryMessage(message: ChatMessage) {
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

function buildChatMessages({
  history,
  message,
  persona
}: {
  history?: ChatMessage[];
  message: string;
  persona: Persona;
}): ChatMessage[] {
  const sanitizedHistory = (history ?? [])
    .filter(isHistoryMessage)
    .map((historyMessage) => ({
      role: historyMessage.role,
      content: historyMessage.content.trim()
    }));

  const hasLatestUserMessage =
    sanitizedHistory.at(-1)?.role === "user" &&
    sanitizedHistory.at(-1)?.content === message;

  return [
    {
      role: "system",
      content: systemPrompts[persona]
    },
    ...(hasLatestUserMessage
      ? sanitizedHistory
      : [
          ...sanitizedHistory,
          {
            role: "user" as const,
            content: message
          }
        ])
  ];
}

function writeSse(response: Response, event: unknown) {
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

function createTitle(message: string) {
  return message.length > 48 ? `${message.slice(0, 48)}...` : message;
}

async function getOrCreateConversation({
  conversationId,
  message,
  model,
  persona
}: {
  conversationId?: string;
  message: string;
  model: string;
  persona: Persona;
}) {
  if (conversationId) {
    const conversation = await getConversation(conversationId);

    if (conversation) {
      return conversation.id;
    }
  }

  const conversation = await createConversation({
    title: createTitle(message),
    model,
    persona
  });

  return conversation.id;
}

export function createChatRouter(ollamaBaseUrl: string) {
  const router = Router();

  router.post(
    "/chat",
    async (
      request: Request<Record<string, never>, ChatResponse | ApiErrorResponse, ChatRequestBody>,
      response: Response<ChatResponse | ApiErrorResponse>
    ) => {
      const message = request.body.message?.trim();
      const model = request.body.model?.trim() || defaultModel;
      const persona = resolvePersona(request.body.persona);

      if (!message) {
        response.status(400).json({
          error: "Message is required"
        });
        return;
      }

      let conversationId: string;

      try {
        conversationId = await getOrCreateConversation({
          conversationId: request.body.conversationId,
          message,
          model,
          persona
        });

        await saveMessage({
          conversationId,
          role: "user",
          content: message,
          model,
          persona
        });
      } catch (error) {
        console.error("Error saving chat to PostgreSQL:", error);
        response.status(500).json({
          error: "Could not save chat to PostgreSQL. Check your database connection and run schema.sql in pgAdmin."
        });
        return;
      }

      try {
        const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: buildChatMessages({
              history: request.body.messages,
              message,
              persona
            })
          })
        });

        if (!ollamaResponse.ok) {
          response.status(ollamaResponse.status).json({
            error: "Failed to generate Ollama response"
          });
          return;
        }

        const data = (await ollamaResponse.json()) as OllamaChatResponse;
        await saveMessage({
          conversationId,
          role: "assistant",
          content: data.message.content,
          model,
          persona
        });

        response.json({
          ...data,
          conversationId
        });
      } catch (error) {
        console.error("Error chatting with Ollama:", error);
        response.status(503).json({
          error: "Could not connect to Ollama"
        });
      }
    }
  );

  router.post(
    "/chat/stream",
    async (
      request: Request<Record<string, never>, ApiErrorResponse, ChatRequestBody>,
      response: Response<ApiErrorResponse>
    ) => {
      const message = request.body.message?.trim();
      const model = request.body.model?.trim() || defaultModel;
      const persona = resolvePersona(request.body.persona);

      if (!message) {
        response.status(400).json({
          error: "Message is required"
        });
        return;
      }

      const abortController = new AbortController();
      let conversationId = "";
      let assistantContent = "";

      try {
        try {
          conversationId = await getOrCreateConversation({
            conversationId: request.body.conversationId,
            message,
            model,
            persona
          });

          await saveMessage({
            conversationId,
            role: "user",
            content: message,
            model,
            persona
          });
        } catch (error) {
          console.error("Error saving chat to PostgreSQL:", error);
          response.status(500).json({
            error: "Could not save chat to PostgreSQL. Check your database connection and run schema.sql in pgAdmin."
          });
          return;
        }

        const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            stream: true,
            messages: buildChatMessages({
              history: request.body.messages,
              message,
              persona
            })
          }),
          signal: abortController.signal
        });

        if (!ollamaResponse.ok || !ollamaResponse.body) {
          response.status(ollamaResponse.status).json({
            error: "Failed to start Ollama stream"
          });
          return;
        }

        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.flushHeaders();
        response.on("close", () => {
          if (!response.writableEnded) {
            abortController.abort();
          }
        });

        writeSse(response, {
          type: "conversation",
          conversationId
        });

        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (!trimmedLine) {
              continue;
            }

            const chunk = JSON.parse(trimmedLine) as OllamaStreamChunk;
            const content = chunk.message?.content;

            if (content) {
              assistantContent += content;
              writeSse(response, {
                type: "chunk",
                content
              });
            }

            if (chunk.done) {
              if (assistantContent.trim()) {
                await saveMessage({
                  conversationId,
                  role: "assistant",
                  content: assistantContent,
                  model,
                  persona
                });
              }

              writeSse(response, {
                type: "done"
              });
              response.end();
              return;
            }
          }
        }

        if (assistantContent.trim()) {
          await saveMessage({
            conversationId,
            role: "assistant",
            content: assistantContent,
            model,
            persona
          });
        }

        writeSse(response, {
          type: "done"
        });
        response.end();
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Error streaming chat with Ollama:", error);

        if (!response.headersSent) {
          response.status(503).json({
            error: "Could not connect to Ollama"
          });
          return;
        }

        writeSse(response, {
          type: "error",
          error: "Could not connect to Ollama"
        });
        response.end();
      }
    }
  );

  return router;
}
