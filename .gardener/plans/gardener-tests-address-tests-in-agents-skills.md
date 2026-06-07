<!-- gardener-maintenance-pr-plan-id: b5e132ca-9693-4b0b-88c8-70c161f35465 -->
# Plan 3 tests maintenance opportunities

## Goal

7 tests signals found in .agents/skills. | 1 tests signal found in next.config.ts. | 1 tests signal found in playwright.config.ts.

## Evidence

.agents/skills/caveman-compress/scripts/compress.py: Repowise did not find a paired test file. | .agents/skills/caveman-compress/scripts/validate.py: Repowise did not find a paired test file. | .agents/skills/caveman-compress/scripts/detect.py: Repowise did not find a paired test file. | next.config.ts: Repowise did not find a paired test file. | playwright.config.ts: Repowise did not find a paired test file. Categories checked against constitution allowed fixes: tests. Changed paths checked against protected modules and never-touch paths: .agents/skills/caveman-compress/scripts/__init__.py, .agents/skills/caveman-compress/scripts/__main__.py, .agents/skills/caveman-compress/scripts/benchmark.py, .agents/skills/caveman-compress/scripts/cli.py, .agents/skills/caveman-compress/scripts/compress.py, .agents/skills/caveman-compress/scripts/detect.py, .agents/skills/caveman-compress/scripts/validate.py, next.config.ts, playwright.config.ts.

## Entropy impact

Expected -2.1 entropy delta across 9 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.70; threshold 0.40; eligible for assisted draft PR. Changed paths: .agents/skills/caveman-compress/scripts/__init__.py, .agents/skills/caveman-compress/scripts/__main__.py, .agents/skills/caveman-compress/scripts/benchmark.py, .agents/skills/caveman-compress/scripts/cli.py, .agents/skills/caveman-compress/scripts/compress.py, .agents/skills/caveman-compress/scripts/detect.py, .agents/skills/caveman-compress/scripts/validate.py, next.config.ts, playwright.config.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 3.1–6.3 engineering hours saved. Assumptions: 1.0 hrs/file for tests; confidence 0.70, 0.70, 0.70; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
