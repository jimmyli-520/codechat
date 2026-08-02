import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readRepositoryFile(path: string) {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

test("publishes a standard MIT license and package metadata", () => {
  const license = readRepositoryFile("LICENSE");
  const packageJson = JSON.parse(readRepositoryFile("package.json")) as { license?: string };

  assert.match(license, /^MIT License/);
  assert.match(license, /Copyright \(c\) 2026 jimmyli-520/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.equal(packageJson.license, "MIT");
});

test("documents a safe contribution and verification workflow", () => {
  const contributing = readRepositoryFile("CONTRIBUTING.md");

  for (const command of ["npm ci", "npm run setup", "npm test", "npm run typecheck", "npm run build"]) {
    assert.match(contributing, new RegExp(command));
  }

  assert.match(contributing, /never commit that file/i);
  assert.match(contributing, /private (source )?code/i);
  assert.match(contributing, /MIT License/);
});

test("provides structured issue and pull-request templates", () => {
  const requiredFiles = [
    ".github/ISSUE_TEMPLATE/bug_report.yml",
    ".github/ISSUE_TEMPLATE/feature_request.yml",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/PULL_REQUEST_TEMPLATE.md"
  ];

  for (const path of requiredFiles) {
    assert.equal(existsSync(resolve(repositoryRoot, path)), true, `missing community file: ${path}`);
  }

  const bugTemplate = readRepositoryFile(requiredFiles[0]);
  const featureTemplate = readRepositoryFile(requiredFiles[1]);
  const pullRequestTemplate = readRepositoryFile(requiredFiles[3]);

  assert.match(bugTemplate, /id: steps/);
  assert.match(bugTemplate, /id: environment/);
  assert.match(bugTemplate, /private code/);
  assert.match(featureTemplate, /id: problem/);
  assert.match(featureTemplate, /id: proposal/);
  assert.match(pullRequestTemplate, /npm test/);
  assert.match(pullRequestTemplate, /npm run typecheck/);
  assert.match(pullRequestTemplate, /npm run build/);
});
