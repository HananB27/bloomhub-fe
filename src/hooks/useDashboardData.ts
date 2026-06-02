"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import {
  loadEmployeeDashboard,
  loadHrDashboard,
  loadManagerDashboard,
  type DashboardCtx,
} from "@/components/hr-dashboard/dashboard/dashboardModuleLoaders";
import { getAccessToken } from "@/lib/api/tokens";
import type {
  DashboardPersona,
  EmployeeDashboardData,
  HrDashboardData,
  ManagerDashboardData,
} from "@/types/dashboard";

interface UseDashboardDataArgs {
  persona: DashboardPersona;
  userId: number | null;
  profileId: number | null;
  assignedProjects?: {
    projectId: number;
    projectName: string;
    role: string | null;
    allocationPercentage: number;
  }[];
  /** External readiness gate; load defers until true (e.g. role hook loaded). */
  ready?: boolean;
}

interface UseDashboardDataResult {
  hr: HrDashboardData | null;
  manager: ManagerDashboardData | null;
  employee: EmployeeDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

interface ExtendedSession {
  accessToken?: string;
}

/**
 * Fetches the dashboard payload for the active persona.
 *
 * Defers the first load until NextAuth reports `authenticated` AND a usable
 * access token is in storage. This prevents the dashboard from firing
 * unauthenticated requests right after login, which would otherwise trip
 * `fetchWithAuthRetry` into a `/login` redirect loop.
 *
 * Errors are surfaced via `error` — callers decide whether to `notifyApiError`.
 */
export function useDashboardData({
  persona,
  userId,
  profileId,
  assignedProjects,
  ready = true,
}: UseDashboardDataArgs): UseDashboardDataResult {
  const { data: session, status } = useSession();
  const [hr, setHr] = useState<HrDashboardData | null>(null);
  const [manager, setManager] = useState<ManagerDashboardData | null>(null);
  const [employee, setEmployee] = useState<EmployeeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionToken = (session as ExtendedSession | null)?.accessToken ?? null;

  const projectsKey = JSON.stringify(assignedProjects ?? []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const accessToken = getAccessToken() ?? sessionToken;
      const ctx: DashboardCtx = {
        accessToken,
        userId,
        profileId,
        assignedProjects,
      };
      setIsLoading(true);
      setError(null);
      try {
        if (persona === "hr") {
          const data = await loadHrDashboard(ctx, signal);
          if (signal?.aborted) return;
          setHr(data);
        } else if (persona === "manager") {
          const data = await loadManagerDashboard(ctx, signal);
          if (signal?.aborted) return;
          setManager(data);
        } else {
          const data = await loadEmployeeDashboard(ctx, signal);
          if (signal?.aborted) return;
          setEmployee(data);
        }
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    // assignedProjects is held stable via projectsKey to avoid reload churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persona, userId, profileId, sessionToken, projectsKey]
  );

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;

    const controller = new AbortController();
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      if (!getAccessToken()) {
        window.setTimeout(start, 60);
        return;
      }
      void load(controller.signal);
    };

    start();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [load, status, ready]);

  return {
    hr,
    manager,
    employee,
    isLoading,
    error,
    refresh: () => void load(),
  };
}
