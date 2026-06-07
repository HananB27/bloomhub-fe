<!-- gardener-maintenance-pr-plan-id: b669d4ac-d57b-4167-8181-8073f0c73c7d -->
# Plan 3 tests maintenance opportunities

## Goal

310 tests signals found in src/components. | 7 tests signals found in src/hooks. | 1 tests signal found in src/middleware.ts.

## Evidence

src/components/hr-dashboard/AIAssistant.tsx: Repowise did not find a paired test file. | src/components/hr-dashboard/DocumentsModule.tsx: Repowise did not find a paired test file. | src/components/hr-dashboard/MobilityModule.tsx: Repowise did not find a paired test file. | src/hooks/useDashboardData.ts: Repowise did not find a paired test file. | src/hooks/useTeamAvailability.ts: Repowise did not find a paired test file. | src/hooks/useLeaveAnalyticsData.ts: Repowise did not find a paired test file. | src/middleware.ts: Repowise did not find a paired test file. Categories checked against constitution allowed fixes: tests. Changed paths checked against protected modules and never-touch paths: src/components/Providers.tsx, src/components/hr-dashboard/AIAssistant.tsx, src/components/hr-dashboard/AdminDepartmentsTab.tsx, src/components/hr-dashboard/AdminModule.tsx, src/components/hr-dashboard/AnalyticsModule.tsx, src/components/hr-dashboard/AnnouncementsModule.tsx, src/components/hr-dashboard/App.tsx, src/components/hr-dashboard/DashboardView.tsx, src/components/hr-dashboard/DatePicker.tsx, src/components/hr-dashboard/DocumentsModule.tsx, src/components/hr-dashboard/FeedbackModule.tsx, src/components/hr-dashboard/FormComponents.tsx, src/components/hr-dashboard/MobilityModule.tsx, src/components/hr-dashboard/OnboardingModule.tsx, src/components/hr-dashboard/OrgChartModule.tsx, src/components/hr-dashboard/ProfilesModule.tsx, src/components/hr-dashboard/QuickActionButton.tsx, src/components/hr-dashboard/ReviewsModule.tsx, src/components/hr-dashboard/TrainingModule.tsx, src/components/hr-dashboard/VacationsModule.tsx, src/hooks/useAdminAccess.ts, src/hooks/useDashboardData.ts, src/hooks/useEmployeeLeaveHistory.ts, src/hooks/useLeaveAnalyticsData.ts, src/hooks/usePendingExpiry.ts, src/hooks/useTeamAvailability.ts, src/hooks/useUserRole.ts, src/middleware.ts.

## Entropy impact

Expected -2.1 entropy delta across 28 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.70; threshold 0.40; eligible for assisted draft PR. Changed paths: src/components/Providers.tsx, src/components/hr-dashboard/AIAssistant.tsx, src/components/hr-dashboard/AdminDepartmentsTab.tsx, src/components/hr-dashboard/AdminModule.tsx, src/components/hr-dashboard/AnalyticsModule.tsx, src/components/hr-dashboard/AnnouncementsModule.tsx, src/components/hr-dashboard/App.tsx, src/components/hr-dashboard/DashboardView.tsx, src/components/hr-dashboard/DatePicker.tsx, src/components/hr-dashboard/DocumentsModule.tsx, src/components/hr-dashboard/FeedbackModule.tsx, src/components/hr-dashboard/FormComponents.tsx, src/components/hr-dashboard/MobilityModule.tsx, src/components/hr-dashboard/OnboardingModule.tsx, src/components/hr-dashboard/OrgChartModule.tsx, src/components/hr-dashboard/ProfilesModule.tsx, src/components/hr-dashboard/QuickActionButton.tsx, src/components/hr-dashboard/ReviewsModule.tsx, src/components/hr-dashboard/TrainingModule.tsx, src/components/hr-dashboard/VacationsModule.tsx, src/hooks/useAdminAccess.ts, src/hooks/useDashboardData.ts, src/hooks/useEmployeeLeaveHistory.ts, src/hooks/useLeaveAnalyticsData.ts, src/hooks/usePendingExpiry.ts, src/hooks/useTeamAvailability.ts, src/hooks/useUserRole.ts, src/middleware.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 9.8–19.6 engineering hours saved. Assumptions: 1.0 hrs/file for tests; confidence 0.70, 0.70, 0.70; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
