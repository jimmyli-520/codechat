import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  databaseRecoveryMessage,
  describeDatabaseTarget,
  ensureLocalEnv,
  findPlaceholderDatabaseSettings
} from "./setupSupport.js";

test("creates a local environment file once without overwriting user settings", () => {
  const directory = mkdtempSync(join(tmpdir(), "codechat-setup-"));
  const examplePath = join(directory, ".env.example");
  const envPath = join(directory, ".env");

  try {
    writeFileSync(examplePath, "PGUSER=example\n");
    assert.equal(ensureLocalEnv(examplePath, envPath), true);
    assert.equal(readFileSync(envPath, "utf8"), "PGUSER=example\n");

    writeFileSync(envPath, "PGUSER=local-user\n");
    assert.equal(ensureLocalEnv(examplePath, envPath), false);
    assert.equal(readFileSync(envPath, "utf8"), "PGUSER=local-user\n");
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test("detects copied placeholder credentials before connecting", () => {
  assert.deepEqual(
    findPlaceholderDatabaseSettings({
      PGUSER: "your_postgres_username",
      PGPASSWORD: "your_postgres_password"
    }),
    ["PGUSER", "PGPASSWORD"]
  );
  assert.deepEqual(findPlaceholderDatabaseSettings({ PGUSER: "postgres", PGPASSWORD: "secret" }), []);
});

test("describes database targets without exposing credentials", () => {
  assert.equal(
    describeDatabaseTarget({ DATABASE_URL: "postgresql://private:secret@db.local:5433/codechat" }),
    "db.local:5433/codechat"
  );
  assert.equal(
    describeDatabaseTarget({ PGHOST: "localhost", PGPORT: "5432", PGDATABASE: "codechat" }),
    "localhost:5432/codechat"
  );
});

test("provides actionable database recovery guidance", () => {
  const message = databaseRecoveryMessage(new Error("password authentication failed"), {
    PGHOST: "localhost",
    PGDATABASE: "codechat"
  });

  assert.match(message, /Could not prepare PostgreSQL at localhost:5432\/codechat/);
  assert.match(message, /password authentication failed/);
  assert.match(message, /server\/.env/);
  assert.doesNotMatch(message, /PGPASSWORD/);
});
