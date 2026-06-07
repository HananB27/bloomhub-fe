<!-- gardener-maintenance-pr-plan-id: 9d403dbe-2e04-4e72-9813-df80c32d6c3d -->
# Plan 2 complexity_reduction maintenance opportunities

## Goal

33 complexity reduction signals found in src/app. | 155 complexity reduction signals found in src/lib.

## Evidence

src/app/api/auth/[...nextauth]/route.ts: Repowise health score 3.56. | src/app/(auth)/login/page.tsx: Repowise health score 6.15. | src/app/employee/[id]/page.tsx: Repowise health score 6.5. | src/lib/api/helpers/transformers.ts: Repowise health score 1.55. | src/lib/api/helpers/httpClient.ts: Repowise health score 4.15. | src/lib/api/permissions.ts: Repowise health score 4.57. Categories checked against constitution allowed fixes: complexity_reduction. Changed paths checked against protected modules and never-touch paths: src/app/(auth)/login/page.tsx, src/app/(auth)/register/page.tsx, src/app/api/auth/[...nextauth]/route.ts, src/app/employee/[id]/page.tsx, src/app/employees/page.tsx, src/app/layout.tsx, src/app/oauth/jira/callback/page.tsx, src/app/oauth/tempo/callback/page.tsx, src/app/page.tsx, src/lib/ai/entities.ts, src/lib/ai/schema.ts, src/lib/api/aiChat.ts, src/lib/api/announcements.ts, src/lib/api/assets.ts, src/lib/api/auth.ts, src/lib/api/compensation.ts, src/lib/api/conferenceCourseRegistrations.ts, src/lib/api/constants/certificatesEndpoints.ts, src/lib/api/constants/documentsEndpoints.ts, src/lib/api/constants/leaveAnalyticsEndpoints.ts, src/lib/api/constants/templatesEndpoints.ts, src/lib/api/constants/vacationsEndpoints.ts, src/lib/api/employees.ts, src/lib/api/feedback.ts, src/lib/api/helpers.ts, src/lib/api/helpers/httpClient.ts, src/lib/api/helpers/resolveApiMediaUrl.ts, src/lib/api/helpers/transformers.ts, src/lib/api/modules/certificates/index.ts.

## Entropy impact

Expected -1.8 entropy delta across 29 path(s).

## Verification

Required checks: none configured. Risk tier: tier_3_advisory. Minimum opportunity confidence 0.60; threshold 0.40; eligible for review-required PR. Changed paths: src/app/(auth)/login/page.tsx, src/app/(auth)/register/page.tsx, src/app/api/auth/[...nextauth]/route.ts, src/app/employee/[id]/page.tsx, src/app/employees/page.tsx, src/app/layout.tsx, src/app/oauth/jira/callback/page.tsx, src/app/oauth/tempo/callback/page.tsx, src/app/page.tsx, src/lib/ai/entities.ts, src/lib/ai/schema.ts, src/lib/api/aiChat.ts, src/lib/api/announcements.ts, src/lib/api/assets.ts, src/lib/api/auth.ts, src/lib/api/compensation.ts, src/lib/api/conferenceCourseRegistrations.ts, src/lib/api/constants/certificatesEndpoints.ts, src/lib/api/constants/documentsEndpoints.ts, src/lib/api/constants/leaveAnalyticsEndpoints.ts, src/lib/api/constants/templatesEndpoints.ts, src/lib/api/constants/vacationsEndpoints.ts, src/lib/api/employees.ts, src/lib/api/feedback.ts, src/lib/api/helpers.ts, src/lib/api/helpers/httpClient.ts, src/lib/api/helpers/resolveApiMediaUrl.ts, src/lib/api/helpers/transformers.ts, src/lib/api/modules/certificates/index.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 8.7–17.4 engineering hours saved. Assumptions: 1.0 hrs/file for complexity_reduction; confidence 0.60, 0.60; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
