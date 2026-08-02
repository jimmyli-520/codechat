import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "./app.js";
import type { Conversation, StoredMessage } from "./db/pool.js";
import type { ChatRouterDependencies } from "./routes/chat.js";
import type { ConversationsRouterDependencies } from "./routes/conversations.js";

const installedModels = [
  {
    id: "llama3.2:3b",
    label: "llama3.2:3b",
    description: "3.2B · llama"
  }
];

function parseSseEvents(body: string) {
  return body
    .split("\n\n")
    .map((event) => event.trim())
    .filter(Boolean)
    .map((event) => JSON.parse(event.replace(/^data: /, "")) as Record<string, unknown>);
}

test("completes the core streamed code-conversation workflow", async (context) => {
  const conversations = new Map<string, Conversation & { messages: StoredMessage[] }>();
  const ollamaRequests: Array<Record<string, unknown>> = [];
  let nextConversationId = 1;
  let nextMessageId = 1;

  const createConversation: ChatRouterDependencies["createConversation"] = async ({
    title,
    model,
    persona
  }) => {
    const id = String(nextConversationId++);
    const conversation = {
      id,
      title,
      model,
      persona,
      created_at: "2026-08-02T10:00:00.000Z",
      updated_at: "2026-08-02T10:00:00.000Z",
      messages: []
    };
    conversations.set(id, conversation);
    return conversation;
  };

  const getConversation: ChatRouterDependencies["getConversation"] = async (id) =>
    conversations.get(id) ?? null;

  const saveMessage: ChatRouterDependencies["saveMessage"] = async ({
    content,
    conversationId,
    model,
    persona,
    role
  }) => {
    const conversation = conversations.get(conversationId);
    assert.ok(conversation);
    const message: StoredMessage = {
      id: String(nextMessageId++),
      conversation_id: conversationId,
      role,
      content,
      model: model ?? null,
      persona: persona ?? null,
      created_at: `2026-08-02T10:00:0${nextMessageId}.000Z`
    };
    conversation.messages.push(message);
    return message;
  };

  const fetchInstalledModels = async () => installedModels;
  const ollamaFetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    ollamaRequests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(
      [
        JSON.stringify({ message: { content: "It declares " } }),
        JSON.stringify({ message: { content: "a constant." }, done: true })
      ].join("\n") + "\n",
      { status: 200 }
    );
  }) as typeof fetch;

  const conversationDependencies: ConversationsRouterDependencies = {
    createConversation,
    deleteConversation: async (id) => conversations.delete(id),
    fetchInstalledModels,
    getConversation,
    listConversations: async () =>
      [...conversations.values()].map(({ messages: _messages, ...conversation }) => conversation)
  };
  const chatDependencies: ChatRouterDependencies = {
    createConversation,
    fetch: ollamaFetch,
    fetchInstalledModels,
    getConversation,
    saveMessage
  };
  const app = createApp({
    dependencies: {
      chat: chatDependencies,
      conversations: conversationDependencies,
      models: { fetchInstalledModels }
    },
    ollamaBaseUrl: "http://ollama.test",
    trustedOrigins: ["http://localhost:5173"]
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => server.close());
  const address = server.address() as AddressInfo;
  const apiUrl = `http://127.0.0.1:${address.port}/api`;

  const healthResponse = await fetch(`${apiUrl}/health`);
  assert.deepEqual(await healthResponse.json(), {
    status: "ok",
    service: "codechat-backend"
  });

  const modelsResponse = await fetch(`${apiUrl}/models`);
  assert.deepEqual(await modelsResponse.json(), { models: installedModels });

  const editorMessage = [
    "What does this code do?",
    "",
    "[Editor context included · JavaScript]",
    "```javascript",
    "const answer = 42;",
    "```"
  ].join("\n");
  const streamResponse = await fetch(`${apiUrl}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: editorMessage,
      messages: [{ role: "user", content: editorMessage }],
      model: "llama3.2:3b",
      persona: "code-teacher"
    })
  });

  assert.equal(streamResponse.status, 200);
  assert.match(streamResponse.headers.get("content-type") ?? "", /text\/event-stream/);
  assert.deepEqual(parseSseEvents(await streamResponse.text()), [
    { type: "conversation", conversationId: "1" },
    { type: "chunk", content: "It declares " },
    { type: "chunk", content: "a constant." },
    { type: "done" }
  ]);
  assert.equal(ollamaRequests.length, 1);
  assert.equal(ollamaRequests[0].model, "llama3.2:3b");
  assert.equal(ollamaRequests[0].stream, true);
  assert.match(JSON.stringify(ollamaRequests[0].messages), /const answer = 42/);
  assert.match(JSON.stringify(ollamaRequests[0].messages), /Never say that no code was provided/);

  const historyResponse = await fetch(`${apiUrl}/conversations`);
  const history = (await historyResponse.json()) as Conversation[];
  assert.equal(history.length, 1);
  assert.equal(history[0].title, "What does this code do?");

  const conversationResponse = await fetch(`${apiUrl}/conversations/1`);
  const conversation = (await conversationResponse.json()) as Conversation & {
    messages: StoredMessage[];
  };
  assert.deepEqual(
    conversation.messages.map(({ role, content }) => ({ role, content })),
    [
      { role: "user", content: editorMessage },
      { role: "assistant", content: "It declares a constant." }
    ]
  );

  const deleteResponse = await fetch(`${apiUrl}/conversations/1`, { method: "DELETE" });
  assert.deepEqual(await deleteResponse.json(), { deleted: true });
  assert.equal((await fetch(`${apiUrl}/conversations/1`)).status, 404);
});
