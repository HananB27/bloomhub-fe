<!-- gardener-maintenance-pr-plan-id: 2e3ebacb-1be4-4c2f-96db-1ec5e3a695b3 -->
# Plan 2 tests maintenance opportunities

## Goal

4 tests signals found in src/app. | 64 tests signals found in src/lib.

## Evidence

src/app/api/auth/[...nextauth]/route.ts: Repowise did not find a paired test file. | src/app/layout.tsx: Repowise did not find a paired test file. | src/app/(auth)/layout.tsx: Repowise did not find a paired test file. | src/app/api/auth/[...nextauth]/route.ts: New or worse since baseline 0bee35667d76 -> 5f532c275979: co-changes with 10 distinct files — editing this file tends to ripple across the codebase (shotgun surgery) | src/lib/api/helpers/transformers.ts: Repowise did not find a paired test file. | src/lib/api/helpers/httpClient.ts: Repowise did not find a paired test file. | src/lib/api/permissions.ts: Repowise did not find a paired test file. | src/lib/api/assets.ts: New or worse since baseline 0bee35667d76 -> 5f532c275979: Repowise health score 6.79. Categories checked against constitution allowed fixes: tests. Changed paths checked against protected modules and never-touch paths: src/app/(auth)/layout.tsx, src/app/api/auth/[...nextauth]/route.ts, src/app/employee/[id]/profilePageHelpers.ts, src/app/layout.tsx, src/lib/ai/entities.ts, src/lib/api/aiChat.ts, src/lib/api/announcements.ts, src/lib/api/assets.ts, src/lib/api/auth.ts, src/lib/api/celebrations.ts, src/lib/api/compensation.ts, src/lib/api/conferenceCourseRegistrations.ts, src/lib/api/constants/certificatesEndpoints.ts, src/lib/api/constants/documentsEndpoints.ts, src/lib/api/constants/hrEmployeeProfilesEndpoints.ts, src/lib/api/constants/leaveAnalyticsEndpoints.ts, src/lib/api/constants/notificationsEndpoints.ts, src/lib/api/constants/templateSnippetsEndpoints.ts, src/lib/api/constants/templatesEndpoints.ts, src/lib/api/constants/trainingBudgetsEndpoints.ts, src/lib/api/constants/vacationsEndpoints.ts, src/lib/api/cpf-levels.ts, src/lib/api/departments.ts, src/lib/api/employees.ts.

## Entropy impact

Expected -1.4 entropy delta across 24 path(s).

## Verification

Required checks: none configured. Risk tier: tier_3_advisory. Minimum opportunity confidence 0.70; threshold 0.40; eligible for review-required PR. Changed paths: src/app/(auth)/layout.tsx, src/app/api/auth/[...nextauth]/route.ts, src/app/employee/[id]/profilePageHelpers.ts, src/app/layout.tsx, src/lib/ai/entities.ts, src/lib/api/aiChat.ts, src/lib/api/announcements.ts, src/lib/api/assets.ts, src/lib/api/auth.ts, src/lib/api/celebrations.ts, src/lib/api/compensation.ts, src/lib/api/conferenceCourseRegistrations.ts, src/lib/api/constants/certificatesEndpoints.ts, src/lib/api/constants/documentsEndpoints.ts, src/lib/api/constants/hrEmployeeProfilesEndpoints.ts, src/lib/api/constants/leaveAnalyticsEndpoints.ts, src/lib/api/constants/notificationsEndpoints.ts, src/lib/api/constants/templateSnippetsEndpoints.ts, src/lib/api/constants/templatesEndpoints.ts, src/lib/api/constants/trainingBudgetsEndpoints.ts, src/lib/api/constants/vacationsEndpoints.ts, src/lib/api/cpf-levels.ts, src/lib/api/departments.ts, src/lib/api/employees.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 8.4–16.8 engineering hours saved. Assumptions: 1.0 hrs/file for tests; confidence 0.70, 0.70; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
