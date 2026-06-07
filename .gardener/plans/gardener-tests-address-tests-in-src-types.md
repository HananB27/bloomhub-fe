<!-- gardener-maintenance-pr-plan-id: 122d7548-945b-4ad3-bad0-607553b86883 -->
# Plan 3 tests maintenance opportunities

## Goal

15 tests signals found in src/types. | 7 tests signals found in src/utils. | 1 tests signal found in vitest.config.ts.

## Evidence

src/types/vacations.ts: Repowise did not find a paired test file. | src/types/reviews.ts: Repowise did not find a paired test file. | src/types/jobListing.ts: Repowise did not find a paired test file. | src/utils/api.ts: Repowise did not find a paired test file. | src/utils/index.ts: Repowise did not find a paired test file. | src/utils/notificationHelpers.ts: Repowise did not find a paired test file. | vitest.config.ts: Repowise did not find a paired test file. Categories checked against constitution allowed fixes: tests. Changed paths checked against protected modules and never-touch paths: src/types/certificates.ts, src/types/conferenceCourseRegistration.ts, src/types/cpf.ts, src/types/dashboard.ts, src/types/documents.ts, src/types/jobListing.ts, src/types/leaveAnalytics.ts, src/types/mammoth.d.ts, src/types/peerSession.ts, src/types/promotion.ts, src/types/reviews.ts, src/types/technology-tags.ts, src/types/training.ts, src/types/trainingBudget.ts, src/types/vacations.ts, src/utils/api.ts, src/utils/date.ts, src/utils/filters.ts, src/utils/format.ts, src/utils/index.ts, src/utils/notificationHelpers.ts, src/utils/validators.ts, vitest.config.ts.

## Entropy impact

Expected -2.1 entropy delta across 23 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.70; threshold 0.40; eligible for assisted draft PR. Changed paths: src/types/certificates.ts, src/types/conferenceCourseRegistration.ts, src/types/cpf.ts, src/types/dashboard.ts, src/types/documents.ts, src/types/jobListing.ts, src/types/leaveAnalytics.ts, src/types/mammoth.d.ts, src/types/peerSession.ts, src/types/promotion.ts, src/types/reviews.ts, src/types/technology-tags.ts, src/types/training.ts, src/types/trainingBudget.ts, src/types/vacations.ts, src/utils/api.ts, src/utils/date.ts, src/utils/filters.ts, src/utils/format.ts, src/utils/index.ts, src/utils/notificationHelpers.ts, src/utils/validators.ts, vitest.config.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 8.0–16.1 engineering hours saved. Assumptions: 1.0 hrs/file for tests; confidence 0.70, 0.70, 0.70; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
