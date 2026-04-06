---
name: debug-ci
description: Debug and fix CI pipeline failures. Use when CI is failing, hanging, or reporting unexpected errors.
allowed-tools: shell
---

## CI Pipeline Structure

File: `.github/workflows/ci.yml`
Triggers: push to main/master, pull requests to main/master
Runner: ubuntu-latest
Timeout: 12 minutes

Steps:

1. Checkout (fetch-depth: 1)
2. Setup Node 20 with npm cache
3. Install: `npm ci --legacy-peer-deps --prefer-offline`
4. Lint: `npm run lint -- src --max-warnings=25`
5. Format: `npm run format:check`
6. Test: `npm run test -- --run --reporter=verbose`

Concurrency: `cancel-in-progress: true` per branch.

## Common Failures

### Lint fails with "too many warnings"

Run `npm run lint -- src` locally to see the count. If warnings exceed 36, fix them using the `fix-lint-warnings` skill.

### Format check fails

Run `npm run format` to auto-fix, then commit the changes.

### Tests fail

Run `npm run test -- --run` locally. Check for:

- Failing assertions (update test expectations)
- Missing mocks (add vi.mock for new dependencies)
- Import errors (check barrel exports in index.ts)

### CI hangs / "Waiting for status"

1. Check GitHub Actions status page: https://www.githubstatus.com
2. Cancel the stuck run from the Actions tab.
3. Push a new commit to trigger a fresh run. Concurrency controls will cancel old runs.
4. If persistent, check runner quotas in Settings → Actions → Usage.

### npm ci fails

- `--legacy-peer-deps` handles peer dependency mismatches.
- `--prefer-offline` uses cache when available.
- If lock file is out of sync: run `npm install` locally, commit `package-lock.json`.

## Local Verification

Run these three commands before pushing:

```bash
npm run lint -- src --max-warnings=25
npm run format:check
npm run test -- --run
```

All three must pass.
