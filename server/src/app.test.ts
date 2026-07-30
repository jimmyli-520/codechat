import assert from "node:assert/strict";
import test from "node:test";
import { isOriginAllowed } from "./app.js";
import {
  getServerConfig,
  parseTrustedOrigins
} from "./config/serverConfig.js";

const trustedOrigin = "http://localhost:5173";

test("uses local-only server defaults", () => {
  const config = getServerConfig({});

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3001);
  assert.deepEqual(config.trustedOrigins, [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]);
});

test("accepts explicit host, port and trusted origins", () => {
  const config = getServerConfig({
    CORS_ORIGINS: "https://codechat.example, http://localhost:4173/",
    HOST: "0.0.0.0",
    PORT: "4000"
  });

  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.port, 4000);
  assert.deepEqual(config.trustedOrigins, [
    "https://codechat.example",
    "http://localhost:4173"
  ]);
});

test("rejects malformed trusted origins", () => {
  assert.throws(
    () => parseTrustedOrigins("file:///tmp/codechat"),
    /only supports http and https/
  );
  assert.throws(
    () => parseTrustedOrigins("https://codechat.example/app"),
    /must be origins without paths/
  );
});

test("allows the trusted frontend origins", () => {
  const trustedOrigins = [
    trustedOrigin,
    "http://127.0.0.1:5173"
  ];

  assert.equal(isOriginAllowed(trustedOrigin, trustedOrigins), true);
  assert.equal(
    isOriginAllowed("http://127.0.0.1:5173", trustedOrigins),
    true
  );
});

test("allows origin-less requests from local tools", () => {
  assert.equal(isOriginAllowed(undefined, [trustedOrigin]), true);
});

test("rejects untrusted browser origins", () => {
  assert.equal(
    isOriginAllowed("https://untrusted.example", [trustedOrigin]),
    false
  );
});

test("matches exact origins instead of trusting similar hosts", () => {
  assert.equal(
    isOriginAllowed("http://localhost:5173.evil.example", [trustedOrigin]),
    false
  );
  assert.equal(
    isOriginAllowed("http://localhost:5174", [trustedOrigin]),
    false
  );
});
