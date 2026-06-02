# CodeChat

CodeChat is a locally run offline AI coding tutor. It includes a React + TypeScript + Vite frontend, a Node.js + Express + TypeScript backend, Ollama integration, and PostgreSQL persistence using the `pg` package.

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
```

Do not commit `server/.env`. It is ignored by Git. You can also use `DATABASE_URL` instead of the individual PostgreSQL variables.

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
- `npm run typecheck` type-checks all workspaces.
