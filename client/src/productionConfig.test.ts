import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

test("production preview uses the same local API boundary as development", () => {
  assert.match(viteConfig, /server:\s*\{[\s\S]*?"\/api":\s*"http:\/\/localhost:3001"/);
  assert.match(viteConfig, /preview:\s*\{[\s\S]*?"\/api":\s*"http:\/\/localhost:3001"/);
  assert.match(viteConfig, /preview:\s*\{\s*port:\s*4173/);
});
