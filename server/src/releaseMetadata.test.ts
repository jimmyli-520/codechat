import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const releaseVersion = "2.0.0";

function readRepositoryFile(path: string) {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

test("keeps all package versions synchronized for CodeChat 2.0", () => {
  for (const path of ["package.json", "client/package.json", "server/package.json"]) {
    const packageJson = JSON.parse(readRepositoryFile(path)) as { version?: string };
    assert.equal(packageJson.version, releaseVersion, `${path} has the wrong release version`);
  }

  const lockfile = JSON.parse(readRepositoryFile("package-lock.json")) as {
    version?: string;
    packages?: Record<string, { version?: string }>;
  };
  assert.equal(lockfile.version, releaseVersion);
  assert.equal(lockfile.packages?.[""]?.version, releaseVersion);
  assert.equal(lockfile.packages?.client?.version, releaseVersion);
  assert.equal(lockfile.packages?.server?.version, releaseVersion);
});

test("publishes complete versioned release notes", () => {
  const releaseNotesPath = "docs/releases/v2.0.0.md";
  assert.equal(existsSync(resolve(repositoryRoot, releaseNotesPath)), true);

  const releaseNotes = readRepositoryFile(releaseNotesPath);
  const changelog = readRepositoryFile("CHANGELOG.md");
  const readme = readRepositoryFile("README.md");

  assert.match(releaseNotes, /^# CodeChat 2\.0\.0/);
  assert.match(releaseNotes, /## Highlights/);
  assert.match(releaseNotes, /## Install/);
  assert.match(releaseNotes, /## Known limitations/);
  assert.match(releaseNotes, /zero known vulnerabilities/);
  assert.match(changelog, /## \[2\.0\.0\] - 2026-08-02/);
  assert.match(readme, /\[changelog\]\(CHANGELOG\.md\)/);
  assert.match(readme, /releases\/latest/);
});
