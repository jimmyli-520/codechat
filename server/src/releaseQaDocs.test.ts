import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const qaPath = resolve(repositoryRoot, "docs/RELEASE_CANDIDATE_QA.md");
const report = readFileSync(qaPath, "utf8");
const readme = readFileSync(resolve(repositoryRoot, "README.md"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};

test("records the clean-environment release-candidate evidence", () => {
  assert.equal(existsSync(qaPath), true);
  assert.match(report, /Result:\*\* Pass/);
  assert.match(report, /Deterministic install \| Pass/);
  assert.match(report, /Dependency audit \| Pass/);
  assert.match(report, /Frontend tests \| Pass/);
  assert.match(report, /Backend tests \| Pass/);
  assert.match(report, /Production runtime smoke test/);
  assert.match(report, /Release blockers found and resolved/);
});

test("provides one repeatable release gate", () => {
  assert.equal(
    packageJson.scripts?.qa,
    "npm audit --audit-level=low && npm test && npm run typecheck && npm run build"
  );
  assert.match(readme, /npm run qa/);
  assert.match(readme, /docs\/RELEASE_CANDIDATE_QA\.md/);
});
