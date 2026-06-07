<!-- gardener-maintenance-pr-plan-id: 95c704ce-d105-48a0-97ee-f28557eca76e -->
# Plan 3 layer_violation_repair maintenance opportunities

## Goal

41 layer violation repair signals found in src/components. | 1 layer violation repair signal found in src/types. | 2 layer violation repair signals found in src/utils.

## Evidence

src/components/hr-dashboard/AnalyticsModule.tsx: src/lib/api/modules/leave-analytics/index.ts co-changes with this file 4 times (80% of shared commits) but no static dependency exists | src/components/hr-dashboard/AnalyticsModule.tsx: src/components/hr-dashboard/ProfilesModule.tsx co-changes with this file 4 times (67% of shared commits) but no static dependency exists | src/components/hr-dashboard/AnalyticsModule.tsx: src/components/hr-dashboard/OrgChartModule.tsx co-changes with this file 4 times (57% of shared commits) but no static dependency exists | src/types/vacations.ts: src/lib/api/vacations.ts co-changes with this file 4 times (57% of shared commits) but no static dependency exists | src/utils/index.ts: src/components/hr-dashboard/MobilityModule.tsx co-changes with this file 3 times (50% of shared commits) but no static dependency exists | src/utils/index.ts: src/components/hr-dashboard/DashboardView.tsx co-changes with this file 3 times (50% of shared commits) but no static dependency exists Categories checked against constitution allowed fixes: layer_violation_repair. Changed paths checked against protected modules and never-touch paths: src/components/hr-dashboard/AnalyticsModule.tsx, src/components/hr-dashboard/AnnouncementsModule.tsx, src/components/hr-dashboard/App.tsx, src/components/hr-dashboard/AssetsModule.tsx, src/components/hr-dashboard/DashboardView.tsx, src/components/hr-dashboard/DocumentsModule.tsx, src/components/hr-dashboard/FeedbackModule.tsx, src/components/hr-dashboard/MobilityModule.tsx, src/components/hr-dashboard/OnboardingModule.tsx, src/components/hr-dashboard/OrgChartModule.tsx, src/components/hr-dashboard/ProfilesModule.tsx, src/components/hr-dashboard/TimeTrackingModule.tsx, src/components/hr-dashboard/TrainingModule.tsx, src/components/hr-dashboard/VacationsModule.tsx, src/components/hr-dashboard/employee-profiles/ProfilesDetailView.tsx, src/components/hr-dashboard/employee-profiles/ProfilesModule.tsx, src/components/hr-dashboard/training/TrainingEntryForm.tsx, src/components/hr-dashboard/training/TrainingEntryList.tsx, src/types/vacations.ts, src/utils/index.ts.

## Entropy impact

Expected -7.2 entropy delta across 20 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.60; threshold 0.40; eligible for review-required PR. Changed paths: src/components/hr-dashboard/AnalyticsModule.tsx, src/components/hr-dashboard/AnnouncementsModule.tsx, src/components/hr-dashboard/App.tsx, src/components/hr-dashboard/AssetsModule.tsx, src/components/hr-dashboard/DashboardView.tsx, src/components/hr-dashboard/DocumentsModule.tsx, src/components/hr-dashboard/FeedbackModule.tsx, src/components/hr-dashboard/MobilityModule.tsx, src/components/hr-dashboard/OnboardingModule.tsx, src/components/hr-dashboard/OrgChartModule.tsx, src/components/hr-dashboard/ProfilesModule.tsx, src/components/hr-dashboard/TimeTrackingModule.tsx, src/components/hr-dashboard/TrainingModule.tsx, src/components/hr-dashboard/VacationsModule.tsx, src/components/hr-dashboard/employee-profiles/ProfilesDetailView.tsx, src/components/hr-dashboard/employee-profiles/ProfilesModule.tsx, src/components/hr-dashboard/training/TrainingEntryForm.tsx, src/components/hr-dashboard/training/TrainingEntryList.tsx, src/types/vacations.ts, src/utils/index.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 6.0–12.0 engineering hours saved. 3 high-entropy-delta path(s) addressed. Assumptions: 1.0 hrs/file for layer_violation_repair; confidence 0.60, 0.60, 0.60; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
