## Cursor Cloud specific instructions

**bloomhub-fe** is a single Next.js 16 frontend application (no monorepo, no backend).

### Key commands

All standard commands are in `package.json` scripts — refer to `README.md` for getting started.

| Task         | Command                   |
| ------------ | ------------------------- |
| Dev server   | `npm run dev` (port 3000) |
| Lint         | `npm run lint`            |
| Format check | `npm run format:check`    |
| Tests        | `npm run test`            |
| Build        | `npm run build`           |

### Notes

- Node.js version must satisfy `^20.19.0 || ^22.13.0 || >=24` (see `engines` in `package.json`).
- Husky pre-commit hook runs `lint-staged` (Prettier + ESLint auto-fix) and `npm run test` on every commit.
- Husky `commit-msg` hook enforces [commitlint](https://commitlint.js.org/) conventional commits.
- ESLint produces one expected warning in `commitlint.config.mjs` (`import/no-anonymous-default-export`) — this is not an error.
- No external services, databases, or environment variables are required.
