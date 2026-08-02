# CodeChat

CodeChat is a locally powered AI coding assistant. It includes a React + TypeScript + Vite frontend, a Node.js + Express + TypeScript backend, Ollama integration, and PostgreSQL persistence using the `pg` package.

Prisma is not used.

## Quick Start

You need Node.js 20 or newer, PostgreSQL, and [Ollama](https://ollama.com/) installed locally. Ollama also needs at least one chat model, for example `llama3.2:3b`.

From a fresh clone, install dependencies and start the guided setup:

```bash
npm install
npm run setup
```

The setup command creates `server/.env` when needed. Open that file and replace the example PostgreSQL username and password with your local credentials, then run `npm run setup` again. It connects to PostgreSQL, creates the required tables and indexes automatically, and checks Ollama.

PostgreSQL must already contain a database named `codechat`. You can create it with pgAdmin or:

```bash
createdb -U postgres codechat
```

When setup reports that CodeChat is ready, start both services:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Configuration

The generated `server/.env` contains:

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

Do not commit `server/.env`. It is ignored by Git. You can also use `DATABASE_URL` instead of the individual PostgreSQL variables. Running `npm run setup` again is safe and never overwrites an existing `.env` file.

If setup cannot connect, its error identifies the database it tried without printing the password. Check that PostgreSQL is running, confirm the values in `server/.env`, and rerun `npm run setup`.

## Local API Security

CodeChat binds its backend to `127.0.0.1` by default, so it is available only on the local machine. Browser access is limited to the configured trusted frontend origins.

- `HOST` controls the network interface used by the backend. Keep the default `127.0.0.1` for normal local use.
- `CORS_ORIGINS` is a comma-separated list of exact frontend origins allowed to call the API.
- Requests without an `Origin` header are supported for local command-line tools.

Exposing the backend to other devices, for example by setting `HOST=0.0.0.0`, expands the security boundary. Do this only on a trusted network and configure `CORS_ORIGINS` deliberately.

The frontend runs at `http://localhost:5173`, the backend at `http://localhost:3001`, and Ollama normally at `http://localhost:11434`. The backend verifies PostgreSQL and initializes the schema before announcing that it is ready.

## Scripts

- `npm run dev` starts frontend and backend together.
- `npm run setup` creates the local environment file, prepares PostgreSQL, and checks Ollama.
- `npm run dev:client` starts only the Vite frontend.
- `npm run dev:server` starts only the Express backend.
- `npm run build` builds all workspaces.
- `npm test` runs all frontend and backend tests.
- `npm run typecheck` type-checks all workspaces.
