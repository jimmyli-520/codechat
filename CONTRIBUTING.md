# Contributing to CodeChat

Thank you for helping improve CodeChat. This guide describes how to propose a change, run the project safely, and prepare a reviewable pull request.

## Before you begin

- Search the existing issues before opening a new one.
- Use the bug or feature issue template and include the requested details.
- Keep each issue and pull request focused on one behavior or closely related change.
- Never include passwords, `.env` files, private source code, personal chat history, or other sensitive data in an issue, screenshot, test fixture, or commit.

By contributing, you agree that your contribution will be licensed under the project’s [MIT License](LICENSE).

## Development setup

CodeChat requires Node.js 20 or newer, PostgreSQL, Ollama, and at least one installed Ollama chat model. Follow the [README quick start](README.md#quick-start) for full installation instructions.

For a clean checkout:

```bash
npm ci
npm run setup
npm run dev
```

`npm run setup` creates `server/.env` if it does not exist. Add only your own local PostgreSQL credentials, and never commit that file.

## Branch and commit workflow

1. Create a branch from the current target branch.
2. Use a short descriptive branch name, such as `fix/history-retry` or `feature/model-capabilities`.
3. Make the smallest coherent change that resolves the issue.
4. Add or update automated tests for behavior changes.
5. Keep unrelated formatting or cleanup out of the pull request.
6. Write an imperative commit message that describes the outcome, for example `Improve History recovery state`.

Do not rewrite another contributor’s work or force-push a shared branch without coordinating first.

## Required verification

Run all checks from the repository root before opening a pull request:

```bash
npm test
npm run typecheck
npm run build
```

For user-interface changes, also run `npm run dev` and verify the affected workflow in a browser. Check both light and dark themes when colors or contrast change, and check keyboard operation when controls or dialogs change.

For clean-installation changes, validate the documented path from a fresh checkout or temporary clean copy rather than relying only on an existing `node_modules` or `.env` file.

## Project expectations

- Preserve the default local-only network boundary.
- Validate requested Ollama models against the installed inventory.
- Do not send editor code for unrelated general questions.
- Keep editor context explicit when it is sent.
- Do not overwrite user-written editor content.
- Keep loading, empty, error, cancellation, and completion states accessible.
- Avoid adding large dependencies to the initial frontend bundle; use an interaction boundary for editor-only or otherwise heavy code.
- Use parameterized SQL queries and never expose database credentials in logs or errors.

See [CodeChat 2.0 architecture](docs/ARCHITECTURE.md) for system boundaries, tradeoffs, limitations, and safe extension points.

## Pull requests

A good pull request includes:

- a concise explanation of the problem and solution;
- the related issue number;
- testing and manual-verification results;
- before-and-after screenshots for visible changes;
- any configuration, migration, privacy, security, or bundle-size impact;
- documentation updates when behavior or setup changes.

Reviewers may ask for a smaller scope, additional tests, or clearer recovery behavior. Resolve discussions without deleting useful review context.

## Reporting security problems

Do not include exploitable details, credentials, or private data in a public issue. Use GitHub’s private vulnerability-reporting feature when it is available for this repository. If private reporting is unavailable, open a minimal issue asking the maintainer for a private contact channel without disclosing the vulnerability.
