# Changelog

All notable CodeChat changes are documented here.

## [2.0.0] - 2026-08-02

### Added

- Local Ollama model discovery, refresh, installed-model validation, and safe default selection.
- Code Reviewer, Code Teacher, and Code Generator conversation modes.
- Language-aware starter code for JavaScript, TypeScript, Python, HTML, and CSS.
- Explicit editor-code context for relevant first questions and preserved context for follow-ups.
- Smooth streamed responses with cancellation, stable rendering, and scroll-following control.
- PostgreSQL conversation history with refresh, reopening, and confirmed permanent deletion.
- Guided clean-install setup, database readiness checks, recovery states, and production-preview API routing.
- Core-flow integration coverage, documentation validation, screenshots, a short demo, architecture documentation, contribution guidance, and GitHub templates.

### Changed

- Reduced the initial frontend JavaScript payload from 584.81 kB to approximately 237 kB by deferring Monaco, Markdown, and syntax-highlighting code.
- Improved pasted-code formatting and exact copying from syntax-highlighted code blocks.
- Updated composer keyboard behavior: Enter sends and Shift+Enter creates a new line.
- Simplified visible editor context into a compact language-labelled attachment while retaining complete model context.
- Added distinct loading, empty, error, cancellation, completion, and recovery states.
- Reworked the README around user value and a verified local quick start.

### Security

- Bound the backend to localhost by default and restricted browser access to explicitly trusted origins.
- Validated requested Ollama models against the local installed inventory.
- Kept database credentials out of tracked files and recovery messages.
- Updated release toolchain dependencies; the release-candidate audit reports zero known vulnerabilities.

### Quality

- Release gate passes 80 automated tests, both TypeScript checks, both production builds, and the dependency audit.
- Clean-environment installation, guided setup, built-service startup, local APIs, Monaco, model settings, and browser console were verified for the release candidate.

[2.0.0]: https://github.com/jimmyli-520/codechat/releases/tag/v2.0.0
