import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  databaseRecoveryMessage,
  ensureLocalEnv,
  findPlaceholderDatabaseSettings
} from "./config/setupSupport.js";

const serverDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(serverDirectory, ".env");
const examplePath = resolve(serverDirectory, ".env.example");

if (ensureLocalEnv(examplePath, envPath)) {
  console.log("Created server/.env from server/.env.example.");
}

await import("./config/loadEnv.js");

const placeholders = findPlaceholderDatabaseSettings(process.env);

if (placeholders.length > 0) {
  console.log(
    `Setup needs your local PostgreSQL credentials. Edit ${placeholders.join(" and ")} in server/.env, then run npm run setup again.`
  );
} else {
  const { ensureSchema, pool } = await import("./db/pool.js");

  try {
    await ensureSchema();
    console.log("PostgreSQL connected and the CodeChat schema is ready.");

    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434";

    try {
      const response = await fetch(`${ollamaBaseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      console.log("Ollama is available.");
    } catch {
      console.warn(`Ollama is not available at ${ollamaBaseUrl}. Start Ollama before chatting.`);
    }

    console.log("CodeChat is ready. Start it with: npm run dev");
  } catch (error) {
    console.error(databaseRecoveryMessage(error));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
