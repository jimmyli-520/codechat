import { Router } from "express";
import {
  fetchInstalledModels,
  ModelInventoryError
} from "../ollama/models.js";

export type ModelsRouterDependencies = {
  fetchInstalledModels: typeof fetchInstalledModels;
};

export function createModelsRouter(
  ollamaBaseUrl: string,
  dependencies: ModelsRouterDependencies = { fetchInstalledModels }
) {
  const router = Router();

  router.get("/models", async (_request, response) => {
    try {
      response.json({
        models: await dependencies.fetchInstalledModels(ollamaBaseUrl)
      });
    } catch (error) {
      const message =
        error instanceof ModelInventoryError
          ? error.message
          : "Could not load installed Ollama models.";

      response.status(503).json({
        error: message,
        models: []
      });
    }
  });

  return router;
}
