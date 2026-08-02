import assert from "node:assert/strict";
import test from "node:test";
import { getHistoryViewState } from "./historyState.js";

test("does not show an empty state while History is loading", () => {
  assert.equal(
    getHistoryViewState({ conversationCount: 0, error: null, isLoading: true }),
    "loading"
  );
});

test("shows a recoverable error when the initial History request fails", () => {
  assert.equal(
    getHistoryViewState({ conversationCount: 0, error: "Backend unavailable", isLoading: false }),
    "error"
  );
});

test("keeps existing conversations visible during background refreshes", () => {
  assert.equal(
    getHistoryViewState({ conversationCount: 2, error: null, isLoading: true }),
    "ready"
  );
  assert.equal(
    getHistoryViewState({ conversationCount: 2, error: "Refresh failed", isLoading: false }),
    "ready"
  );
});

test("shows the true empty state only after loading succeeds", () => {
  assert.equal(
    getHistoryViewState({ conversationCount: 0, error: null, isLoading: false }),
    "empty"
  );
});
