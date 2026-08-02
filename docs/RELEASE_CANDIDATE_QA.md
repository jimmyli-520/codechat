# CodeChat 2.0 release-candidate QA

**Date:** 2026-08-02  
**Branch:** `codechat-2.0`  
**Baseline commit:** `13f51c9`  
**Result:** Pass after resolving two release blockers

## Scope

This pass evaluated CodeChat from a dependency-free copy and then exercised the built application against local PostgreSQL and Ollama. No personal conversation content was created during release QA.

## Clean-environment results

The repository was copied to a temporary directory with the following deliberately excluded:

- `.git` metadata;
- every `node_modules` directory;
- existing production `dist` output;
- `server/.env` and local credentials.

| Check | Result | Evidence |
| --- | --- | --- |
| Deterministic install | Pass | `npm ci` installed 303 packages from `package-lock.json` |
| Dependency audit | Pass | 0 known vulnerabilities after targeted toolchain updates |
| First setup run | Pass | Created `server/.env` from the example and clearly requested PostgreSQL credentials |
| Environment safety | Pass | Generated `.env` exactly matched `.env.example`; no existing file was available to overwrite |
| Frontend tests | Pass | 45 passed |
| Backend tests | Pass | 33 passed |
| TypeScript checks | Pass | Client and server passed |
| Frontend production build | Pass | Vite 6.4.3 built all chunks without the previous initial-bundle warning |
| Backend production build | Pass | TypeScript production output completed |

## Production runtime smoke test

Built artifacts were started with a temporary backend port and trusted preview origin.

| Workflow | Result |
| --- | --- |
| Backend waits for PostgreSQL schema readiness before listening | Pass |
| `GET /api/health` returns the CodeChat backend status | Pass |
| Production frontend preview serves the CodeChat entry page | Pass |
| Trusted preview origin can load installed Ollama models | Pass |
| Welcome view renders | Pass |
| Editor opens and Monaco displays starter code | Pass |
| Chat opens with the selected installed model | Pass |
| Model and mode settings open and show local values | Pass |
| Browser console remains free of errors | Pass |

The smoke test did not submit a model prompt or create a conversation because the full streamed persistence path is already covered by the isolated core-flow integration test.

## Release blockers found and resolved

### 1. High and critical development dependency advisories

The initial audit reported nine findings, including critical `shell-quote` findings through `concurrently` and high findings through Vite/PostCSS.

Resolution:

- upgraded `concurrently` from 9.x to 10.0.4;
- upgraded Vite within the existing major line to 6.4.3;
- upgraded `tsx` to 4.23.4;
- refreshed compatible transitive packages with `npm audit fix`.

The final clean install reports zero known vulnerabilities.

### 2. Production preview API routing

The development server proxied `/api` to the local backend, but `vite preview` did not. A built frontend preview would therefore request the wrong origin.

Resolution:

- added the same local API proxy to the Vite preview configuration;
- added an automated production-configuration test;
- verified the built frontend against a running built backend.

## Environment note

The workstation’s default npm cache contains root-owned entries, which can cause npm metadata commands to fail with `EPERM`. Release QA did not change home-directory ownership. It used an isolated temporary npm cache, proving that a clean CodeChat installation itself is not dependent on the affected cache.

This is a machine-specific npm configuration issue, not a repository failure. The npm-provided repair is to restore ownership of the user’s npm cache outside the CodeChat workflow.

## Accepted documented limitations

The candidate still has the limitations listed in [ARCHITECTURE.md](ARCHITECTURE.md), including no account system, no context-window budgeting, no versioned database migrations, possible Monaco CDN access, and no browser end-to-end suite in CI. None blocked the tested local single-user release scope.

## Repeat the release gate

From the repository root with network access for the audit and temporary integration listener:

```bash
npm ci
npm run qa
```

`npm run qa` runs the dependency audit, all tests, both type checks, and both production builds.
