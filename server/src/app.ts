import cors, { type CorsOptions } from "cors";
import express, {
  type ErrorRequestHandler,
  type RequestHandler
} from "express";
import { createChatRouter } from "./routes/chat.js";
import { createConversationsRouter } from "./routes/conversations.js";
import { createStatsRouter } from "./routes/stats.js";

type CreateAppOptions = {
  ollamaBaseUrl: string;
  trustedOrigins: string[];
};

const corsRejectionMessage = "Origin is not allowed to access the CodeChat API.";

export function isOriginAllowed(
  origin: string | undefined,
  trustedOrigins: readonly string[]
) {
  return origin === undefined || trustedOrigins.includes(origin);
}

function createCorsOptions(trustedOrigins: string[]): CorsOptions {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, trustedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(corsRejectionMessage));
    }
  };
}

export function createApp({
  ollamaBaseUrl,
  trustedOrigins
}: CreateAppOptions) {
  const app = express();
  const corsMiddleware = cors(createCorsOptions(trustedOrigins));

  app.use(corsMiddleware);
  app.options("*", corsMiddleware as RequestHandler);
  app.use(express.json());
  app.use("/api", createStatsRouter(ollamaBaseUrl));
  app.use("/api", createConversationsRouter());
  app.use("/api", createChatRouter(ollamaBaseUrl));

  const handleError: ErrorRequestHandler = (error, _request, response, next) => {
    if (error instanceof Error && error.message === corsRejectionMessage) {
      response.status(403).json({
        error: corsRejectionMessage
      });
      return;
    }

    next(error);
  };

  app.use(handleError);

  return app;
}
