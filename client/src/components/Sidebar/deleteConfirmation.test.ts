import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteConfirmationReducer,
  initialDeleteConfirmationState
} from "./deleteConfirmation.js";

const conversation = {
  id: "conversation-1",
  title: "Explain async functions"
};

test("requesting deletion identifies the exact conversation without deleting it", () => {
  const state = deleteConfirmationReducer(initialDeleteConfirmationState, {
    type: "request",
    target: conversation
  });

  assert.deepEqual(state, {
    isDeleting: false,
    target: conversation
  });
});

test("cancelling clears the confirmation and preserves the conversation", () => {
  const pendingState = {
    isDeleting: false,
    target: conversation
  };

  assert.deepEqual(
    deleteConfirmationReducer(pendingState, { type: "cancel" }),
    initialDeleteConfirmationState
  );
});

test("a deletion in progress cannot be cancelled, replaced, or started twice", () => {
  const deletingState = {
    isDeleting: true,
    target: conversation
  };

  assert.equal(
    deleteConfirmationReducer(deletingState, { type: "start" }),
    deletingState
  );
  assert.equal(
    deleteConfirmationReducer(deletingState, { type: "cancel" }),
    deletingState
  );
  assert.equal(
    deleteConfirmationReducer(deletingState, {
      type: "request",
      target: { id: "conversation-2", title: "Another conversation" }
    }),
    deletingState
  );
});

test("success closes the dialog while failure permits a safe retry", () => {
  const deletingState = {
    isDeleting: true,
    target: conversation
  };

  assert.deepEqual(
    deleteConfirmationReducer(deletingState, { type: "success" }),
    initialDeleteConfirmationState
  );
  assert.deepEqual(deleteConfirmationReducer(deletingState, { type: "failure" }), {
    isDeleting: false,
    target: conversation
  });
});
