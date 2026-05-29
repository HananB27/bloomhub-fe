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

export interface AnalyticsScope {
  department?: string;
  month?: number;
}

export async function loadMonthlyTrend(
  year: number,
  scope: AnalyticsScope = {}
): Promise<LeaveAnalyticsMonthRow[]> {
  return leaveAnalyticsApi.monthly({ year, ...scope });
}

export async function loadYearlyTotals(
  year: number,
  scope: AnalyticsScope = {}
): Promise<LeaveAnalyticsYearTotals> {
  return leaveAnalyticsApi.yearlyTotals({ year, ...scope });
}

export async function loadYearOverYear(
  currentYear: number,
  years = 3,
  scope: AnalyticsScope = {}
): Promise<LeaveAnalyticsYearTotals[]> {
  const targets = Array.from(
    { length: years },
    (_, i) => currentYear - (years - 1 - i)
  );
  return Promise.all(
    targets.map((y) => leaveAnalyticsApi.yearlyTotals({ year: y, ...scope }))
  );
}

export async function loadDepartmentBreakdown(
  year: number,
  scope: Pick<AnalyticsScope, "month"> = {}
): Promise<LeaveAnalyticsDepartmentRow[]> {
  return leaveAnalyticsApi.departments({ year, ...scope });
}

export async function loadEmployeeSummaries(
  year: number,
  scope: AnalyticsScope = {}
): Promise<LeaveAnalyticsEmployeeSummary[]> {
  return leaveAnalyticsApi.employees({ year, ...scope });
}

export async function triggerAnalyticsRefresh(payload: {
  yearFrom?: number;
  yearTo?: number;
}): Promise<LeaveAnalyticsRefreshResponse> {
  return leaveAnalyticsApi.refresh(payload);
}
