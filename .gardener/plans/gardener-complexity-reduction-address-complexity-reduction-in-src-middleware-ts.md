<!-- gardener-maintenance-pr-plan-id: f7c60d86-1eed-4784-be5a-a822bc57856c -->
# Plan 3 complexity_reduction maintenance opportunities

## Goal

2 complexity reduction signals found in src/middleware.ts. | 18 complexity reduction signals found in src/types. | 11 complexity reduction signals found in src/utils.

## Evidence

src/middleware.ts: middleware has cyclomatic complexity 12 | src/middleware.ts: 2 bug-fixes touched this file in the last ~6 months; recent defect history is the strongest cost-effective predictor of further defects | src/types/vacations.ts: Repowise health score 6.15. | src/types/conferenceCourseRegistration.ts: 100% of file duplicated; worst clone shares 46 lines with src/types/reviews.ts | src/types/cpf.ts: 100% of file duplicated; worst clone shares 46 lines with src/types/reviews.ts | src/utils/api.ts: Repowise health score 6.04. | src/utils/api.ts: parseResponse has cyclomatic complexity 19 | src/utils/api.ts: 40% of file duplicated; worst clone shares 24 lines with src/lib/api/assets.ts Categories checked against constitution allowed fixes: complexity_reduction. Changed paths checked against protected modules and never-touch paths: src/middleware.ts, src/types/conferenceCourseRegistration.ts, src/types/cpf.ts, src/types/dashboard.ts, src/types/jobListing.ts, src/types/leaveAnalytics.ts, src/types/peerSession.ts, src/types/promotion.ts, src/types/reviews.ts, src/types/training.ts, src/types/vacations.ts, src/utils/api.ts, src/utils/date.ts, src/utils/index.ts, src/utils/notificationHelpers.ts, src/utils/validators.ts.

## Entropy impact

Expected -3.0 entropy delta across 16 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.60; threshold 0.40; eligible for assisted draft PR. Changed paths: src/middleware.ts, src/types/conferenceCourseRegistration.ts, src/types/cpf.ts, src/types/dashboard.ts, src/types/jobListing.ts, src/types/leaveAnalytics.ts, src/types/peerSession.ts, src/types/promotion.ts, src/types/reviews.ts, src/types/training.ts, src/types/vacations.ts, src/utils/api.ts, src/utils/date.ts, src/utils/index.ts, src/utils/notificationHelpers.ts, src/utils/validators.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 4.8–9.6 engineering hours saved. Assumptions: 1.0 hrs/file for complexity_reduction; confidence 0.60, 0.60, 0.60; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
