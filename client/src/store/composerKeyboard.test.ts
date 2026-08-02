import assert from "node:assert/strict";
import test from "node:test";
import {
  canSubmitComposer,
  getComposerKeyAction
} from "./composerKeyboard.js";

test("Ctrl+Enter sends a message", () => {
  const action = getComposerKeyAction({ ctrlKey: true, key: "Enter", shiftKey: false });

  assert.equal(action, "send");
  assert.equal(canSubmitComposer({ action, input: "Explain this code", isLoading: false }), true);
});

test("Enter inserts a new line", () => {
  assert.equal(
    getComposerKeyAction({ ctrlKey: false, key: "Enter", shiftKey: false }),
    "newline"
  );
});

test("Shift+Enter inserts a new line even when Control is also pressed", () => {
  assert.equal(
    getComposerKeyAction({ ctrlKey: false, key: "Enter", shiftKey: true }),
    "newline"
  );
  assert.equal(
    getComposerKeyAction({ ctrlKey: true, key: "Enter", shiftKey: true }),
    "newline"
  );
});

test("empty messages and messages during loading cannot be submitted", () => {
  assert.equal(canSubmitComposer({ action: "send", input: "   ", isLoading: false }), false);
  assert.equal(canSubmitComposer({ action: "send", input: "Hello", isLoading: true }), false);
});

test("non-Enter keys leave the composer unchanged", () => {
  assert.equal(
    getComposerKeyAction({ ctrlKey: true, key: "Space", shiftKey: false }),
    "ignore"
  );
});
