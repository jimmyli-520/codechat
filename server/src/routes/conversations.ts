import { Router, type Request, type Response } from "express";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations
} from "../db/pool.js";

const defaultModel = "llama3.2:3b";

type Persona = "code-reviewer" | "code-teacher" | "code-generator";

type ApiErrorResponse = {
  error: string;
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

export function createConversationsRouter() {
  const router = Router();

  router.post(
    "/conversations",
    async (
      request: Request<
        Record<string, never>,
        Awaited<ReturnType<typeof createConversation>> | ApiErrorResponse,
        { title?: string; model?: string; persona?: string }
      >,
      response: Response<Awaited<ReturnType<typeof createConversation>> | ApiErrorResponse>
    ) => {
      const title = request.body.title?.trim() || "New conversation";
      const model = request.body.model?.trim() || defaultModel;
      const persona = resolvePersona(request.body.persona);

      try {
        const conversation = await createConversation({
          title,
          model,
          persona
        });

        response.status(201).json(conversation);
      } catch (error) {
        console.error("Error creating conversation:", error);
        response.status(500).json({
          error: "Could not create conversation"
        });
      }
    }
  );

  router.get(
    "/conversations",
    async (
      _request: Request,
      response: Response<Awaited<ReturnType<typeof listConversations>> | ApiErrorResponse>
    ) => {
      try {
        const conversations = await listConversations();
        response.json(conversations);
      } catch (error) {
        console.error("Error listing conversations:", error);
        response.status(500).json({
          error: "Could not list conversations"
        });
      }
    }
  );

  router.get(
    "/conversations/:id",
    async (
      request: Request<{ id: string }>,
      response: Response<Awaited<ReturnType<typeof getConversation>> | ApiErrorResponse>
    ) => {
      try {
        const conversation = await getConversation(request.params.id);

        if (!conversation) {
          response.status(404).json({
            error: "Conversation not found"
          });
          return;
        }

        response.json(conversation);
      } catch (error) {
        console.error("Error getting conversation:", error);
        response.status(500).json({
          error: "Could not get conversation"
        });
      }
    }
  );

  router.delete(
    "/conversations/:id",
    async (
      request: Request<{ id: string }>,
      response: Response<{ deleted: true } | ApiErrorResponse>
    ) => {
      try {
        const deleted = await deleteConversation(request.params.id);

        if (!deleted) {
          response.status(404).json({
            error: "Conversation not found"
          });
          return;
        }

        response.json({
          deleted: true
        });
      } catch (error) {
        console.error("Error deleting conversation:", error);
        response.status(500).json({
          error: "Could not delete conversation"
        });
      }
    }
  );

  return router;
}
