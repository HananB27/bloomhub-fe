# Agent guide — BloomHub frontend

This repository is a **Next.js + React + TypeScript** frontend. It uses NextAuth, Tailwind, Radix UI components, and Vitest for unit testing.

## Where things live

| Area                   | Location                                 |
| ---------------------- | ---------------------------------------- |
| UI pages & flows       | `src/app/`, `src/components/`            |
| API client & endpoints | `src/lib/api/`, `src/lib/api/constants/` |
| Env-driven config      | `src/config.ts`, `src/lib/config.ts`     |
| Unit / component tests | Colocated `*.test.ts` / `*.test.tsx`     |
| Shared pure helpers    | `src/lib/`, feature-local `*Helpers.ts`  |

## Path aliases

Use **`@/*`** alias imports based on `tsconfig.json`.

## Quality gates (run before considering work done)

```bash
npm run lint          # type-check + eslint + stylelint
npm run test          # vitest run
npm run format:check  # optional; format with npm run format
```

Pre-commit hooks should pass for lint/test before merge.

## Code style

Keep components **readable and modular**: avoid copy-paste—**extract repeated logic** into helpers or hooks (see `.cursor/rules` and `src/lib/` patterns).

**Comments:** **none** in application source — no `//`, `/* */`, or JSDoc; use clear names and types.

## Agent behavior (Cursor)

The agent should be **strict and decisive**: evaluate suggestions against repo rules and code reality, **recommend one approach** with **short, concrete reasoning**, and **challenge** ideas that would hurt quality or consistency—not default to empty agreement.

## Deeper workflows

- Cursor rules: `.cursor/rules/*.mdc` (always-on + file-scoped conventions).
- Project skill: `.cursor/skills/bloomhub-fe-quality/SKILL.md` (tests, API changes, PR hygiene).
