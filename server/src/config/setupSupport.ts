const placeholderValues = new Set([
  "your_postgres_username",
  "your_postgres_password",
  "change-me",
  "changeme"
]);

export function ensureLocalEnv(examplePath: string, envPath: string) {
  if (existsSync(envPath)) {
    return false;
  }

  copyFileSync(examplePath, envPath);
  return true;
}

export function findPlaceholderDatabaseSettings(environment: NodeJS.ProcessEnv) {
  return ["PGUSER", "PGPASSWORD"].filter((key) => {
    const value = environment[key]?.trim().toLowerCase();
    return value ? placeholderValues.has(value) : false;
  });
}

export function describeDatabaseTarget(environment: NodeJS.ProcessEnv) {
  if (environment.DATABASE_URL) {
    try {
      const url = new URL(environment.DATABASE_URL);
      return `${url.hostname}:${url.port || "5432"}/${url.pathname.replace(/^\//, "")}`;
    } catch {
      return "the database configured by DATABASE_URL";
    }
  }

  return `${environment.PGHOST || "localhost"}:${environment.PGPORT || "5432"}/${environment.PGDATABASE || "codechat"}`;
}

export function databaseRecoveryMessage(
  error: unknown,
  environment: NodeJS.ProcessEnv = process.env
) {
  const detail = error instanceof Error ? error.message : String(error);

  return [
    `Could not prepare PostgreSQL at ${describeDatabaseTarget(environment)}.`,
    `Reason: ${detail}`,
    "Check server/.env, make sure PostgreSQL is running, then run npm run setup again."
  ].join("\n");
}
import { copyFileSync, existsSync } from "node:fs";
