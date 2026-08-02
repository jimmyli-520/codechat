import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchInstalledModels,
  ModelInventoryError,
  normalizeInstalledModels,
  preferredDefaultModel,
  resolveInstalledModel
} from "./ollama/models.js";

const installedModels = normalizeInstalledModels({
  models: [
    {
      name: "qwen3:8b",
      details: { family: "qwen3", parameter_size: "8.2B", quantization_level: "Q4_K_M" }
    },
    {
      name: preferredDefaultModel,
      details: { family: "llama", parameter_size: "3.2B" }
    },
    { name: "qwen3:8b" },
    { name: "   " }
  ]
});

test("normalizes, describes, sorts, and deduplicates installed Ollama models", () => {
  assert.deepEqual(installedModels, [
    {
      id: preferredDefaultModel,
      label: preferredDefaultModel,
      description: "3.2B · llama"
    },
    {
      id: "qwen3:8b",
      label: "qwen3:8b",
      description: "8.2B · qwen3 · Q4_K_M"
    }
  ]);
});

test("accepts only a requested model that is installed", () => {
  assert.equal(
    resolveInstalledModel({ installedModels, requestedModel: "qwen3:8b" }),
    "qwen3:8b"
  );
  assert.throws(
    () => resolveInstalledModel({ installedModels, requestedModel: "mistral" }),
    (error) =>
      error instanceof ModelInventoryError && error.code === "MODEL_NOT_INSTALLED"
  );
});

test("uses the preferred safe default only when no model was requested", () => {
  assert.equal(resolveInstalledModel({ installedModels }), preferredDefaultModel);
  assert.equal(
    resolveInstalledModel({ installedModels: [installedModels[1]] }),
    "qwen3:8b"
  );
});

test("rejects chat when no Ollama models are installed", () => {
  assert.throws(
    () => resolveInstalledModel({ installedModels: [] }),
    (error) =>
      error instanceof ModelInventoryError && error.code === "NO_MODELS_INSTALLED"
  );
});

test("loads the installed inventory from the Ollama tags endpoint", async () => {
  const requestedUrls: string[] = [];
  const mockFetch = (async (url: string | URL | Request) => {
    requestedUrls.push(String(url));
    return new Response(
      JSON.stringify({
        models: [{ name: "codellama:latest", details: { family: "llama" } }]
      }),
      { status: 200 }
    );
  }) as typeof fetch;

  assert.deepEqual(await fetchInstalledModels("http://localhost:11434", mockFetch), [
    {
      id: "codellama:latest",
      label: "codellama:latest",
      description: "llama"
    }
  ]);
  assert.deepEqual(requestedUrls, ["http://localhost:11434/api/tags"]);
});

test("reports Ollama unavailability without inventing model options", async () => {
  const unavailableFetch = (async () => {
    throw new Error("connection refused");
  }) as typeof fetch;

  await assert.rejects(
    () => fetchInstalledModels("http://localhost:11434", unavailableFetch),
    (error) =>
      error instanceof ModelInventoryError && error.code === "OLLAMA_UNAVAILABLE"
  );
});
