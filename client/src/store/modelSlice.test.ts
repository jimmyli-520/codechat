import assert from "node:assert/strict";
import test from "node:test";
import {
  preferredDefaultModel,
  reconcileSelectedModel,
  type ModelOption
} from "./modelSlice.js";

const models: ModelOption[] = [
  { id: "qwen3:8b", label: "qwen3:8b", description: "8.2B · qwen3" },
  { id: preferredDefaultModel, label: preferredDefaultModel, description: "3.2B · llama" }
];

test("keeps a selected model while it remains installed", () => {
  assert.equal(reconcileSelectedModel({ models, selectedModel: "qwen3:8b" }), "qwen3:8b");
});

test("replaces a stale selection with the installed preferred default", () => {
  assert.equal(
    reconcileSelectedModel({ models, selectedModel: "removed-model" }),
    preferredDefaultModel
  );
});

test("uses the first installed model when the preferred default is unavailable", () => {
  assert.equal(
    reconcileSelectedModel({ models: [models[0]], selectedModel: "removed-model" }),
    "qwen3:8b"
  );
});

test("clears the selection when Ollama has no installed models", () => {
  assert.equal(reconcileSelectedModel({ models: [], selectedModel: "qwen3:8b" }), "");
});
