import "./config/loadEnv.js";
import cors from "cors";
import express from "express";
import { createChatRouter } from "./routes/chat.js";
import { createConversationsRouter } from "./routes/conversations.js";
import { createStatsRouter } from "./routes/stats.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

app.use(cors());
app.use(express.json());
app.use("/api", createStatsRouter(ollamaBaseUrl));
app.use("/api", createConversationsRouter());
app.use("/api", createChatRouter(ollamaBaseUrl));

app.listen(port, () => {
  console.log(`CodeChat backend listening on http://localhost:${port}`);
});
