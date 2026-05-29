import type {
  LeaveAnalyticsDepartmentRow,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsRefreshResponse,
  LeaveAnalyticsYearTotals,
} from "@/types/leaveAnalytics";
import { leaveAnalyticsApi } from "@/lib/api/modules/leave-analytics";

// Thin orchestration layer between the AnalyticsModule and the backend
// `leaveAnalyticsApi`. Each function is a single network call; the hook in
// `useLeaveAnalyticsData.ts` composes them in parallel for one render pass.

export async function loadMonthlyTrend(year: number): Promise<LeaveAnalyticsMonthRow[]> {
  return leaveAnalyticsApi.monthly({ year });
}

export async function loadYearlyTotals(year: number): Promise<LeaveAnalyticsYearTotals> {
  return leaveAnalyticsApi.yearlyTotals({ year });
}

export async function loadYearOverYear(
  currentYear: number,
  years = 3
): Promise<LeaveAnalyticsYearTotals[]> {
  const targets = Array.from({ length: years }, (_, i) => currentYear - (years - 1 - i));
  return Promise.all(targets.map((y) => leaveAnalyticsApi.yearlyTotals({ year: y })));
}

export async function loadDepartmentBreakdown(
  year: number
): Promise<LeaveAnalyticsDepartmentRow[]> {
  return leaveAnalyticsApi.departments({ year });
}

export async function loadEmployeeSummaries(
  year: number
): Promise<LeaveAnalyticsEmployeeSummary[]> {
  return leaveAnalyticsApi.employees({ year });
}

export async function triggerAnalyticsRefresh(payload: {
  yearFrom?: number;
  yearTo?: number;
}): Promise<LeaveAnalyticsRefreshResponse> {
  return leaveAnalyticsApi.refresh(payload);
}
