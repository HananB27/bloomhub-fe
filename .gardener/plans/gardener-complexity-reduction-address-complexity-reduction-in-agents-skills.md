<!-- gardener-maintenance-pr-plan-id: 37d8ef52-ea34-4446-b2e6-9840bdab495d -->
# Plan 3 complexity_reduction maintenance opportunities

## Goal

5 complexity reduction signals found in .agents/skills. | 487 complexity reduction signals found in src/components. | 11 complexity reduction signals found in src/hooks.

## Evidence

.agents/skills/caveman-compress/scripts/compress.py: compress_file has cyclomatic complexity 16 | .agents/skills/caveman-compress/scripts/compress.py: compress_file is 81 lines long | .agents/skills/caveman-compress/scripts/detect.py: detect_file_type has cyclomatic complexity 11 | src/components/hr-dashboard/AIAssistant.tsx: Repowise health score 1.9. | src/components/hr-dashboard/AssetsModule.tsx: Repowise health score 2.39. | src/components/hr-dashboard/DocumentsModule.tsx: Repowise health score 3.8. | src/hooks/useAdminAccess.ts: 58% of file duplicated; worst clone shares 23 lines with src/hooks/useUserRole.ts | src/hooks/useDashboardData.ts: useDashboardData nests 4 levels deep | src/hooks/useDashboardData.ts: useDashboardData has cyclomatic complexity 14 Categories checked against constitution allowed fixes: complexity_reduction. Changed paths checked against protected modules and never-touch paths: .agents/skills/caveman-compress/scripts/compress.py, .agents/skills/caveman-compress/scripts/detect.py, .agents/skills/caveman-compress/scripts/validate.py, src/components/hr-dashboard/AIAssistant.tsx, src/components/hr-dashboard/AdminDepartmentsTab.tsx, src/components/hr-dashboard/AdminModule.tsx, src/components/hr-dashboard/AnalyticsModule.tsx, src/components/hr-dashboard/AnnouncementsModule.tsx, src/components/hr-dashboard/App.tsx, src/components/hr-dashboard/AssetsModule.tsx, src/components/hr-dashboard/CollapsibleSidebar.tsx, src/components/hr-dashboard/DashboardView.tsx, src/components/hr-dashboard/DatePicker.tsx, src/components/hr-dashboard/DocumentsModule.tsx, src/components/hr-dashboard/FeedbackModule.tsx, src/components/hr-dashboard/MobilityModule.tsx, src/components/hr-dashboard/OnboardingModule.tsx, src/components/hr-dashboard/OrgChartModule.tsx, src/components/hr-dashboard/ProfilesModule.tsx, src/components/hr-dashboard/ReviewsModule.tsx, src/components/hr-dashboard/TimeTrackingModule.tsx, src/components/hr-dashboard/TrainingModule.tsx, src/components/hr-dashboard/VacationsModule.tsx, src/hooks/useAdminAccess.ts, src/hooks/useDashboardData.ts, src/hooks/useEmployeeLeaveHistory.ts, src/hooks/useLeaveAnalyticsData.ts, src/hooks/useTeamAvailability.ts, src/hooks/useUserRole.ts.

## Entropy impact

Expected -3.0 entropy delta across 29 path(s).

## Verification

Required checks: none configured. Risk tier: tier_2_assisted. Minimum opportunity confidence 0.60; threshold 0.40; eligible for assisted draft PR. Changed paths: .agents/skills/caveman-compress/scripts/compress.py, .agents/skills/caveman-compress/scripts/detect.py, .agents/skills/caveman-compress/scripts/validate.py, src/components/hr-dashboard/AIAssistant.tsx, src/components/hr-dashboard/AdminDepartmentsTab.tsx, src/components/hr-dashboard/AdminModule.tsx, src/components/hr-dashboard/AnalyticsModule.tsx, src/components/hr-dashboard/AnnouncementsModule.tsx, src/components/hr-dashboard/App.tsx, src/components/hr-dashboard/AssetsModule.tsx, src/components/hr-dashboard/CollapsibleSidebar.tsx, src/components/hr-dashboard/DashboardView.tsx, src/components/hr-dashboard/DatePicker.tsx, src/components/hr-dashboard/DocumentsModule.tsx, src/components/hr-dashboard/FeedbackModule.tsx, src/components/hr-dashboard/MobilityModule.tsx, src/components/hr-dashboard/OnboardingModule.tsx, src/components/hr-dashboard/OrgChartModule.tsx, src/components/hr-dashboard/ProfilesModule.tsx, src/components/hr-dashboard/ReviewsModule.tsx, src/components/hr-dashboard/TimeTrackingModule.tsx, src/components/hr-dashboard/TrainingModule.tsx, src/components/hr-dashboard/VacationsModule.tsx, src/hooks/useAdminAccess.ts, src/hooks/useDashboardData.ts, src/hooks/useEmployeeLeaveHistory.ts, src/hooks/useLeaveAnalyticsData.ts, src/hooks/useTeamAvailability.ts, src/hooks/useUserRole.ts. Rollback: revert the focused PR branch if checks or review fail.

## ROI impact

Estimated 8.7–17.4 engineering hours saved. Assumptions: 1.0 hrs/file for complexity_reduction; confidence 0.60, 0.60, 0.60; conservative scale 0.5–1.0×. Estimates are conservative and indicative only.
