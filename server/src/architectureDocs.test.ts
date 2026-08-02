import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const architecturePath = resolve(repositoryRoot, "docs/ARCHITECTURE.md");
const architecture = readFileSync(architecturePath, "utf8");
const readme = readFileSync(resolve(repositoryRoot, "README.md"), "utf8");

test("links the architecture guide from the user README", () => {
  assert.match(readme, /\[CodeChat 2\.0 architecture\]\(docs\/ARCHITECTURE\.md\)/);
});

test("documents the runtime boundary, main flow, tradeoffs, and limitations", () => {
  for (const heading of [
    "System overview",
    "Client architecture",
    "Server architecture",
    "Streamed conversation flow",
    "Persistence",
    "Configuration and security boundary",
    "Testing strategy",
    "Design tradeoffs",
    "Current limitations"
  ]) {
    assert.match(architecture, new RegExp(`## ${heading}`));
  }

  assert.match(architecture, /```mermaid/);
  assert.match(architecture, /POST \/chat\/stream/);
  assert.match(architecture, /no accounts, authentication, authorization/);
  assert.match(architecture, /token counting, truncation, summarization/);
});

test("keeps documented source boundaries tied to existing files", () => {
  for (const path of [
    "client/src/App.tsx",
    "client/src/services/api.ts",
    "client/src/store/store.ts",
    "server/src/app.ts",
    "server/src/index.ts",
    "server/src/db/schema.sql",
    "server/src/config/loadEnv.ts"
  ]) {
    assert.equal(existsSync(resolve(repositoryRoot, path)), true, `missing documented path: ${path}`);
    assert.match(architecture, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
