import assert from "node:assert/strict";
import test from "node:test";
import { toChatHistory, toDisplayMessage, type Message } from "./chatSlice.js";

const requestContent = [
  "What does this code do?",
  "",
  "[Editor context included · JavaScript]",
  "```javascript",
  "const answer = 42;",
  "```"
].join("\n");

test("shows attached editor code as a compact context label", () => {
  const displayMessage = toDisplayMessage({
    id: "message-1",
    role: "user",
    content: requestContent
  });

  assert.equal(displayMessage.content, "What does this code do?");
  assert.equal(displayMessage.editorContextLabel, "JavaScript");
  assert.equal(displayMessage.requestContent, requestContent);
});

test("preserves the complete editor request in follow-up history", () => {
  const messages: Message[] = [
    toDisplayMessage({ id: "message-1", role: "user", content: requestContent }),
    { id: "message-2", role: "assistant", content: "It declares a constant." },
    { id: "message-3", role: "user", content: "Why use const?" }
  ];

  assert.deepEqual(toChatHistory(messages), [
    { role: "user", content: requestContent },
    { role: "assistant", content: "It declares a constant." },
    { role: "user", content: "Why use const?" }
  ]);
});

test("leaves ordinary and assistant messages unchanged", () => {
  const userMessage = { id: "user", role: "user" as const, content: "Explain promises." };
  const assistantMessage = { id: "assistant", role: "assistant" as const, content: "Sure." };

  assert.deepEqual(toDisplayMessage(userMessage), userMessage);
  assert.deepEqual(toDisplayMessage(assistantMessage), assistantMessage);
});
