import assert from "node:assert/strict";
import test from "node:test";
import { buildChatMessages } from "./routes/chat.js";

test("identifies a genuinely new conversation without claiming context was lost", () => {
  const messages = buildChatMessages({
    history: [{ role: "user", content: "What is a closure?" }],
    message: "What is a closure?",
    persona: "code-teacher"
  });

  assert.match(messages[0].content, /first turn of a genuinely new conversation/);
  assert.match(messages[0].content, /Do not volunteer that context is missing/);
  assert.equal(messages.filter((entry) => entry.role === "user").length, 1);
});

test("identifies a follow-up and preserves saved conversation history", () => {
  const messages = buildChatMessages({
    history: [
      { role: "user", content: "Explain promises." },
      { role: "assistant", content: "A promise represents a future result." },
      { role: "user", content: "What was my first question?" }
    ],
    message: "What was my first question?",
    persona: "code-teacher"
  });

  assert.match(messages[0].content, /follow-up conversation with prior messages/);
  assert.match(messages[0].content, /Do not describe this as a new conversation/);
  assert.deepEqual(messages.slice(1).map((entry) => entry.content), [
    "Explain promises.",
    "A promise represents a future result.",
    "What was my first question?"
  ]);
});

test("explicitly tells the assistant when current editor code is included", () => {
  const editorMessage = `What does this code do?

[Editor context included · JavaScript]
\`\`\`javascript
const answer = 42;
\`\`\``;
  const messages = buildChatMessages({
    history: [{ role: "user", content: editorMessage }],
    message: editorMessage,
    persona: "code-reviewer"
  });

  assert.match(messages[0].content, /current user message explicitly includes current editor code/);
  assert.match(messages[0].content, /Never say that no code was provided/);
  assert.match(messages.at(-1)?.content ?? "", /const answer = 42/);
});

test("preserves earlier editor code for a later follow-up", () => {
  const messages = buildChatMessages({
    history: [
      {
        role: "user",
        content: "Explain this.\n\n[Editor context included · Python]\n```python\nprint('hello')\n```"
      },
      { role: "assistant", content: "It prints a greeting." },
      { role: "user", content: "What will it print?" }
    ],
    message: "What will it print?",
    persona: "code-teacher"
  });

  assert.match(messages[0].content, /Editor code was included earlier/);
  assert.match(messages[0].content, /Do not claim the conversation or code context is missing/);
});
