import { useCallback, useEffect, useState } from "react";

import type { LeaveAnalyticsEmployeeHistory } from "@/types/leaveAnalytics";
import type { LeaveType } from "@/types/vacations";

import { loadEmployeeHistory } from "@/components/hr-dashboard/leave-analytics/analyticsModuleLoaders";

interface UseEmployeeLeaveHistoryParams {
  employeeId: number | null;
  yearFrom?: number;
  yearTo?: number;
  leaveType?: LeaveType;
}

interface UseEmployeeLeaveHistoryResult {
  history: LeaveAnalyticsEmployeeHistory | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches the composite per-employee leave history (monthly aggregates,
 * balance snapshots, leave requests) for a single employee. When
 * `employeeId` is null the hook stays idle.
 */
export function useEmployeeLeaveHistory(
  params: UseEmployeeLeaveHistoryParams
): UseEmployeeLeaveHistoryResult {
  const { employeeId, yearFrom, yearTo, leaveType } = params;
  const [history, setHistory] = useState<LeaveAnalyticsEmployeeHistory | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (employeeId === null) {
        setHistory(null);
        setIsLoading(false);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await loadEmployeeHistory({
          employeeId,
          yearFrom,
          yearTo,
          leaveType,
        });
        if (signal?.aborted) return;
        setHistory(data);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [employeeId, yearFrom, yearTo, leaveType]
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    history,
    isLoading,
    error,
    refresh: () => void load(),
  };
}
