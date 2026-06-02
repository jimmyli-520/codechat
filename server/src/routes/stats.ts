import { Router, type Request, type Response } from "express";

type OllamaModel = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
};

type OllamaTagsResponse = {
  models: OllamaModel[];
};

type ApiErrorResponse = {
  error: string;
};

export function createStatsRouter(ollamaBaseUrl: string) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "codechat-backend"
    });
  });

  router.get(
    "/models",
    async (
      _request: Request,
      response: Response<OllamaTagsResponse | ApiErrorResponse>
    ) => {
      try {
        const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/tags`);

        if (!ollamaResponse.ok) {
          response.status(ollamaResponse.status).json({
            error: "Failed to fetch Ollama models"
          });
          return;
        }

        const data = (await ollamaResponse.json()) as OllamaTagsResponse;
        response.json(data);
      } catch (error) {
        console.error("Error fetching Ollama models:", error);
        response.status(503).json({
          error: "Could not connect to Ollama"
        });
      }
    }
  );

  return router;
}
