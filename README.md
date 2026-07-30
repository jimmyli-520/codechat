# CodeChat

CodeChat is a locally powered AI coding assistant. It includes a React + TypeScript + Vite frontend, a Node.js + Express + TypeScript backend, Ollama integration, and PostgreSQL persistence using the `pg` package.

Prisma is not used.

## Database Setup

Create a PostgreSQL database named `codechat`, then run this file in pgAdmin:

```text
server/src/db/schema.sql
```

Create a local `.env` file for your backend settings. You can copy the example:

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` and use your own local PostgreSQL credentials:

```text
PGHOST=localhost
PGPORT=5432
PGDATABASE=codechat
PGUSER=your_postgres_username
PGPASSWORD=your_postgres_password
HOST=127.0.0.1
PORT=3001
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Do not commit `server/.env`. It is ignored by Git. You can also use `DATABASE_URL` instead of the individual PostgreSQL variables.

## Local API Security

CodeChat binds its backend to `127.0.0.1` by default, so it is available only on the local machine. Browser access is limited to the configured trusted frontend origins.

- `HOST` controls the network interface used by the backend. Keep the default `127.0.0.1` for normal local use.
- `CORS_ORIGINS` is a comma-separated list of exact frontend origins allowed to call the API.
- Requests without an `Origin` header are supported for local command-line tools.

Exposing the backend to other devices, for example by setting `HOST=0.0.0.0`, expands the security boundary. Do this only on a trusted network and configure `CORS_ORIGINS` deliberately.

## Run Locally

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

The backend runs at `http://localhost:3001`.

Ollama should be running locally at `http://localhost:11434`.

## Scripts

- `npm run dev` starts frontend and backend together.
- `npm run dev:client` starts only the Vite frontend.
- `npm run dev:server` starts only the Express backend.
- `npm run build` builds all workspaces.
- `npm test` runs the backend security tests.
- `npm run typecheck` type-checks all workspaces.
