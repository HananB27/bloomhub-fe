<!-- gardener-maintenance-pr-plan-id: 2cb78e0d-85d4-4c48-9f5c-c5c81594c950 -->
# Plan 2 tests maintenance opportunities

## Goal

7 tests signals found in src/utils. | 1 tests signal found in vitest.config.ts.

## Evidence

src/utils/api.ts: Repowise did not find a paired test file. | src/utils/index.ts: Repowise did not find a paired test file. | src/utils/notificationHelpers.ts: Repowise did not find a paired test file. | src/utils/index.ts: New or worse since baseline 0bee35667d76 -> 5f532c275979: Repowise health score 6.5. | vitest.config.ts: Repowise did not find a paired test file. | vitest.config.ts: New or worse since baseline 0bee35667d76 -> 5f532c275979: Repowise health score 6.58. Categories checked against constitution allowed fixes: tests. Changed paths checked against protected modules and never-touch paths: src/utils/api.ts, src/utils/date.ts, src/utils/filters.ts, src/utils/format.ts, src/utils/index.ts, src/utils/notificationHelpers.ts, src/utils/validators.ts, vitest.config.ts.

## Entropy impact

Expected -1.4 entropy delta across 8 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.70; threshold 0.40; eligible for review-required PR. Changed paths: src/utils/api.ts, src/utils/date.ts, src/utils/filters.ts, src/utils/format.ts, src/utils/index.ts, src/utils/notificationHelpers.ts, src/utils/validators.ts, vitest.config.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 2.8–5.6 engineering hours saved. Assumptions: 1.0 hrs/file for tests; confidence 0.70, 0.70; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
