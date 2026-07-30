import assert from "node:assert/strict";
import test from "node:test";
import {
  includesEditorContext,
  prepareChatMessage
} from "./editorContext.js";

const editorCode = `function greet(name) {
  return \`Hello, \${name}!\`;
}`;

const defaults = {
  code: editorCode,
  language: "javascript" as const,
  languageLabel: "JavaScript",
  persona: "code-teacher" as const
};

test("the first editor-relevant question includes current editor code", () => {
  const message = prepareChatMessage({
    ...defaults,
    question: "What does this code do?"
  });

  assert.ok(message.startsWith("What does this code do?"));
  assert.match(message, /\[Editor context included · JavaScript\]/);
  assert.match(message, /function greet\(name\)/);
});

test("follow-up history preserves the editor context without attaching it again", () => {
  const firstMessage = prepareChatMessage({
    ...defaults,
    question: "Explain this code."
  });
  const followUpMessage = prepareChatMessage({
    ...defaults,
    question: "Why does it use a template literal?"
  });

  const history = [
    { role: "user", content: firstMessage },
    { role: "assistant", content: "It defines a greeting function." },
    { role: "user", content: followUpMessage }
  ];

  assert.equal(includesEditorContext(history[0].content), true);
  assert.equal(followUpMessage, "Why does it use a template literal?");
  assert.equal(includesEditorContext(followUpMessage), false);
  assert.match(history.map((message) => message.content).join("\n"), /function greet\(name\)/);
});

test("unrelated general questions do not send editor code", () => {
  const message = prepareChatMessage({
    ...defaults,
    question: "What is the difference between TCP and UDP?"
  });

  assert.equal(message, "What is the difference between TCP and UDP?");
  assert.equal(includesEditorContext(message), false);
  assert.doesNotMatch(message, /function greet/);
});

test("the editor CodeChat action explicitly includes code", () => {
  const message = prepareChatMessage({
    ...defaults,
    forceEditorContext: true,
    question: ""
  });

  assert.match(message, /Please explain this code step by step/);
  assert.equal(includesEditorContext(message), true);
  assert.match(message, /function greet\(name\)/);
});
