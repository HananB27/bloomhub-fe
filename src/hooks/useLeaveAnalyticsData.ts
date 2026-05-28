import { useCallback, useEffect, useState } from "react";

import type {
  LeaveAnalyticsDepartmentRow,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsYearTotals,
} from "@/types/leaveAnalytics";

import {
  loadDepartmentBreakdown,
  loadEmployeeSummaries,
  loadMonthlyTrend,
  loadYearOverYear,
  loadYearlyTotals,
} from "@/components/hr-dashboard/leave-analytics/analyticsModuleLoaders";

interface UseLeaveAnalyticsDataResult {
  monthlyTrend: LeaveAnalyticsMonthRow[];
  yearlyTotals: LeaveAnalyticsYearTotals | null;
  yearOverYear: LeaveAnalyticsYearTotals[];
  departments: LeaveAnalyticsDepartmentRow[];
  employees: LeaveAnalyticsEmployeeSummary[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches every analytics slice the Leave Analytics module needs for `year`.
 * Composes the network calls in parallel so a single render pass is enough to
 * populate KPI cards, charts, department breakdown, and per-employee summary.
 *
 * Errors are surfaced via `error` — callers decide whether to `notifyApiError`.
 */
export function useLeaveAnalyticsData(year: number): UseLeaveAnalyticsDataResult {
  const [monthlyTrend, setMonthlyTrend] = useState<LeaveAnalyticsMonthRow[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<LeaveAnalyticsYearTotals | null>(null);
  const [yearOverYear, setYearOverYear] = useState<LeaveAnalyticsYearTotals[]>([]);
  const [departments, setDepartments] = useState<LeaveAnalyticsDepartmentRow[]>([]);
  const [employees, setEmployees] = useState<LeaveAnalyticsEmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const [monthly, totals, yoy, depts, emps] = await Promise.all([
          loadMonthlyTrend(year),
          loadYearlyTotals(year),
          loadYearOverYear(year, 3),
          loadDepartmentBreakdown(year).catch(() => [] as LeaveAnalyticsDepartmentRow[]),
          loadEmployeeSummaries(year),
        ]);
        if (signal?.aborted) return;
        setMonthlyTrend(monthly);
        setYearlyTotals(totals);
        setYearOverYear(yoy);
        setDepartments(depts);
        setEmployees(emps);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [year]
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    monthlyTrend,
    yearlyTotals,
    yearOverYear,
    departments,
    employees,
    isLoading,
    error,
    refresh: () => void load(),
  };
}
