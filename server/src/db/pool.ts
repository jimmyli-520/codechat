import "../config/loadEnv.js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const currentDir = dirname(fileURLToPath(import.meta.url));

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model: string;
  persona: string;
};

export type StoredMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  persona: string | null;
  created_at: string;
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "codechat",
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD
});

let schemaReadyPromise: Promise<void> | null = null;

function getSchemaPath() {
  const sourceSchemaPath = resolve(currentDir, "schema.sql");
  const workspaceSchemaPath = resolve(process.cwd(), "src/db/schema.sql");

  return existsSync(sourceSchemaPath) ? sourceSchemaPath : workspaceSchemaPath;
}

export async function ensureSchema() {
  schemaReadyPromise ??= pool
    .query(readFileSync(getSchemaPath(), "utf8"))
    .then(() => undefined);

  return schemaReadyPromise;
}

export async function createConversation({
  title,
  model,
  persona
}: {
  title: string;
  model: string;
  persona: string;
}) {
  await ensureSchema();

  const result = await pool.query<Conversation>(
    `INSERT INTO conversations (title, model, persona)
     VALUES ($1, $2, $3)
     RETURNING id::text, title, created_at::text, updated_at::text, model, persona`,
    [title, model, persona]
  );

  return result.rows[0];
}

export async function listConversations() {
  await ensureSchema();

  const result = await pool.query<Conversation>(
    `SELECT id::text, title, created_at::text, updated_at::text, model, persona
     FROM conversations
     ORDER BY updated_at DESC`
  );

  return result.rows;
}

export async function getConversation(id: string) {
  await ensureSchema();

  const conversationResult = await pool.query<Conversation>(
    `SELECT id::text, title, created_at::text, updated_at::text, model, persona
     FROM conversations
     WHERE id = $1`,
    [id]
  );

  const conversation = conversationResult.rows[0];

  if (!conversation) {
    return null;
  }

  const messagesResult = await pool.query<StoredMessage>(
    `SELECT id::text, conversation_id::text, role, content, model, persona, created_at::text
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  return {
    ...conversation,
    messages: messagesResult.rows
  };
}

export async function deleteConversation(id: string) {
  await ensureSchema();

  const result = await pool.query(
    `DELETE FROM conversations
     WHERE id = $1`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function saveMessage({
  conversationId,
  role,
  content,
  model,
  persona
}: {
  conversationId: string;
  role: StoredMessage["role"];
  content: string;
  model?: string;
  persona?: string;
}) {
  await ensureSchema();

  const result = await pool.query<StoredMessage>(
    `INSERT INTO messages (conversation_id, role, content, model, persona)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id::text, conversation_id::text, role, content, model, persona, created_at::text`,
    [conversationId, role, content, model ?? null, persona ?? null]
  );

  await pool.query(
    `UPDATE conversations
     SET updated_at = NOW(), model = $2, persona = $3
     WHERE id = $1`,
    [conversationId, model, persona]
  );

  return result.rows[0];
}
