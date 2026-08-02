import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("loads Monaco only through the editor interaction boundary", () => {
  const editorSource = readSource("./components/CodeEditor/index.tsx");

  assert.doesNotMatch(editorSource, /import Editor from ["']@monaco-editor\/react["']/);
  assert.match(editorSource, /lazy\(\(\) => import\(["']@monaco-editor\/react["']\)\)/);
});

test("loads Markdown and syntax highlighting only when message content renders", () => {
  const chatWindowSource = readSource("./components/ChatWindow/index.tsx");
  const messageContentSource = readSource("./components/ChatWindow/MessageContent.tsx");

  assert.doesNotMatch(chatWindowSource, /from ["']react-markdown["']/);
  assert.match(chatWindowSource, /lazy\(\(\) => import\(["']\.\/MessageContent["']\)\)/);
  assert.match(messageContentSource, /from ["']react-markdown["']/);
  assert.match(messageContentSource, /from ["']rehype-highlight["']/);
});

test("keeps ordinary user messages on the lightweight rendering path", () => {
  const chatWindowSource = readSource("./components/ChatWindow/index.tsx");

  assert.match(
    chatWindowSource,
    /message\.role === ["']user["'] && !message\.content\.includes\(["']```["']\)/
  );
  assert.match(chatWindowSource, /return <p>\{message\.content\}<\/p>/);
});
