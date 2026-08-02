import assert from "node:assert/strict";
import test from "node:test";
import { applyStreamEvent } from "./streamEvents.js";

test("refreshes History as soon as the first message creates a conversation", async () => {
  const actions: string[] = [];

  await applyStreamEvent(
    {
      type: "conversation",
      conversationId: "conversation-1"
    },
    {
      appendAssistantContent: (content) => actions.push(`append:${content}`),
      refreshConversations: async () => {
        actions.push("refresh");
      },
      setConversationId: (conversationId) => actions.push(`select:${conversationId}`)
    }
  );

  assert.deepEqual(actions, ["select:conversation-1", "refresh"]);
});

test("assistant chunks do not trigger duplicate History refreshes", async () => {
  const actions: string[] = [];
  const handlers = {
    appendAssistantContent: (content: string) => actions.push(`append:${content}`),
    refreshConversations: async () => {
      actions.push("refresh");
    },
    setConversationId: (conversationId: string) => actions.push(`select:${conversationId}`)
  };

  await applyStreamEvent(
    { type: "conversation", conversationId: "conversation-1" },
    handlers
  );
  await applyStreamEvent({ type: "chunk", content: "Hello" }, handlers);
  await applyStreamEvent({ type: "chunk", content: " world" }, handlers);

  assert.deepEqual(actions, [
    "select:conversation-1",
    "refresh",
    "append:Hello",
    "append: world"
  ]);
});
