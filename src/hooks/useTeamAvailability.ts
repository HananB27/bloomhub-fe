"use client";

import { useCallback, useEffect, useState } from "react";

import { leaveAnalyticsApi } from "@/lib/api/modules/leave-analytics";
import type {
  LeaveAvailabilityParams,
  LeaveAvailabilityResponse,
} from "@/types/leaveAnalytics";

interface UseTeamAvailabilityResult {
  data: LeaveAvailabilityResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches the team availability heatmap payload for the given window/scope.
 *
 * The window cap is enforced by the backend (35 days) — the hook does not
 * validate it client-side so the user sees the server's error message verbatim
 * if the range is too wide.
 */
export function useTeamAvailability(
  params: LeaveAvailabilityParams
): UseTeamAvailabilityResult {
  const { startDate, endDate, project, leaveTypes, statuses } = params;
  const [data, setData] = useState<LeaveAvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stringify multi-value params so `useCallback` only re-fires when the
  // resolved query actually changes.
  const leaveTypesKey = leaveTypes ? leaveTypes.join(",") : "";
  const statusesKey = statuses ? statuses.join(",") : "";

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!startDate || !endDate) {
        setData(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const payload = await leaveAnalyticsApi.availability({
          startDate,
          endDate,
          project,
          leaveTypes: leaveTypesKey
            ? (leaveTypesKey.split(
                ","
              ) as LeaveAvailabilityParams["leaveTypes"])
            : undefined,
          statuses: statusesKey
            ? (statusesKey.split(",") as LeaveAvailabilityParams["statuses"])
            : undefined,
        });
        if (signal?.aborted) return;
        setData(payload);
      } catch (err) {
        if (signal?.aborted) return;
        setData(null);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [startDate, endDate, project, leaveTypesKey, statusesKey]
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    refresh: () => void load(),
  };
}
