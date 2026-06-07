<!-- gardener-maintenance-pr-plan-id: 9da4d594-1d4e-4ee2-a6b3-d4cec235638d -->
# Address layer violation repair in vitest.config.ts

## Goal

1 layer violation repair signal found in vitest.config.ts.

## Evidence

vitest.config.ts: src/components/hr-dashboard/App.tsx co-changes with this file 4 times (57% of shared commits) but no static dependency exists Categories checked against constitution allowed fixes: layer_violation_repair. Changed paths checked against protected modules and never-touch paths: vitest.config.ts.

## Entropy impact

Expected -2.4 entropy delta across 1 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.60; threshold 0.40; eligible for review-required PR. Changed paths: vitest.config.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 0.3–0.6 engineering hours saved. 1 high-entropy-delta path(s) addressed. Assumptions: 1.0 hrs/file for layer_violation_repair; confidence 0.60; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
