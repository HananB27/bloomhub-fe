---
name: bloomhub-fe-quality
description: >-
  Maintains BloomHub frontend quality by running lint and unit tests, aligning changes
  with modular DRY code (helpers and hooks), no comments in source, decisive
  technical judgment with justified recommendations, React/TypeScript patterns,
  API consistency, and commit hygiene. Use when implementing features,
  fixing bugs, refactoring, preparing PRs, or when the user asks for code quality,
  DRY refactors, CI parity, or pre-commit checks.
---

# BloomHub frontend quality workflow

## Judgment

Do not treat every user idea as final. **Compare** it to project rules and existing patterns, **pick** the best approach, and **explain why** (risks, consistency, tests). Push back when a suggestion is weak; implement the user’s override only after explicit confirmation.

## Before finishing a change

1. Run **`npm run lint`** and **`npm run test`** from the repo root.
2. If you touched **CSS**, ensure style checks pass (included in lint if configured).
3. If you added or changed **HTTP calls** used from the UI, update test mocks/handlers to prevent unmocked requests.

## Implementation norms

- **Modularity / DRY**: eliminate repeated non-trivial logic by extracting **typed helpers** or **hooks**. Prefer one clear function over duplicated blocks; add tests for non-obvious helpers.
- **Comments**: **do not add any** — no line/block comments and **no JSDoc**; rely on names, types, and structure.
- **Tests**: colocated `*.test.ts(x)` where practical; prefer accessible queries.
- **API**: define and type endpoints in the central API layer and keep contracts in sync with shared types.

## Commits

Follow repository commit standards and do not bypass hooks.

## Optional deep dive

For a concise repo map and agent entrypoint, read [AGENTS.md](../../../AGENTS.md) at the repository root.
