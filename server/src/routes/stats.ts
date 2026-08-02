import { Router } from "express";

export function createStatsRouter() {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "codechat-backend"
    });
  });

  return router;
}
