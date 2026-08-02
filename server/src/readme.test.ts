import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const readme = readFileSync(resolve(repositoryRoot, "README.md"), "utf8");
const packageJson = JSON.parse(
  readFileSync(resolve(repositoryRoot, "package.json"), "utf8")
) as { scripts?: Record<string, string> };

test("documents a complete first-run path in executable order", () => {
  const commands = ["npm install", "npm run setup", "ollama pull", "npm run dev"];
  let previousIndex = -1;

  for (const command of commands) {
    const commandIndex = readme.indexOf(command);
    assert.ok(commandIndex > previousIndex, `${command} should appear in quick-start order`);
    previousIndex = commandIndex;
  }

  assert.match(readme, /Node\.js[^\n]+20 or newer/);
  assert.match(readme, /PostgreSQL/);
  assert.match(readme, /server\/\.env/);
  assert.match(readme, /http:\/\/localhost:5173/);
});

test("only advertises root commands that exist", () => {
  for (const script of ["setup", "dev", "test", "typecheck", "build"]) {
    assert.equal(typeof packageJson.scripts?.[script], "string", `missing npm script: ${script}`);
  }
});

test("keeps setup references and repository paths current", () => {
  assert.equal(existsSync(resolve(repositoryRoot, "server/.env.example")), true);
  assert.doesNotMatch(readme, /run schema\.sql in pgAdmin/i);
  assert.match(readme, /Editor code included/);
  assert.match(readme, /Code Teacher/);
  assert.match(readme, /Code Reviewer/);
  assert.match(readme, /Code Generator/);
});
