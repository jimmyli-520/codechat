const defaultHost = "127.0.0.1";
const defaultPort = 3001;
const defaultOllamaBaseUrl = "http://localhost:11434";
const defaultTrustedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

export type ServerConfig = {
  host: string;
  ollamaBaseUrl: string;
  port: number;
  trustedOrigins: string[];
};

function parsePort(value: string | undefined) {
  if (!value) {
    return defaultPort;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer between 1 and 65535. Received: ${value}`);
  }

  return port;
}

export function parseTrustedOrigins(value: string | undefined) {
  if (!value?.trim()) {
    return [...defaultTrustedOrigins];
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      const url = new URL(origin);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error(`CORS_ORIGINS only supports http and https origins: ${origin}`);
      }

      if (url.origin !== origin.replace(/\/$/, "")) {
        throw new Error(`CORS_ORIGINS entries must be origins without paths: ${origin}`);
      }

      return url.origin;
    });

  if (origins.length === 0) {
    throw new Error("CORS_ORIGINS must contain at least one trusted origin.");
  }

  return [...new Set(origins)];
}

export function getServerConfig(
  environment: NodeJS.ProcessEnv = process.env
): ServerConfig {
  return {
    host: environment.HOST?.trim() || defaultHost,
    ollamaBaseUrl: environment.OLLAMA_BASE_URL?.trim() || defaultOllamaBaseUrl,
    port: parsePort(environment.PORT),
    trustedOrigins: parseTrustedOrigins(environment.CORS_ORIGINS)
  };
}
