"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { API_BASE_URL } from "@/lib/config";
import { employeeApi } from "@/lib/api/modules/employees";

export interface AssignedProjectSummary {
  assignmentId: number;
  projectId: number;
  projectName: string;
  role: string | null;
  status: string;
  allocationPercentage: number;
}

interface UseUserRoleResult {
  /** Auth user id (User.pk). */
  userId: number | null;
  /** UserProfile id used by employee-scoped endpoints (vacations, projects). */
  profileId: number | null;
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
  isManager: boolean;
  /** Pre-resolved project assignments for the signed-in user (HR sees nothing here). */
  assignedProjects: AssignedProjectSummary[];
  isLoading: boolean;
  error: string | null;
}

interface ExtendedSession {
  accessToken?: string;
}

interface AuthProfileResponse {
  id?: number;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_manager?: boolean;
}

/**
 * Returns role flags + canonical identifiers for the signed-in user.
 *
 * - `userId` comes from `/api/auth/profile/` (auth User.pk).
 * - `profileId` is derived via `employeeApi.listEmployees({ search: email })`
 *   because the auth payload does not include the UserProfile pk that
 *   employee-scoped endpoints (vacations, project assignments, training
 *   budgets) actually filter by.
 *
 * Falls back to nulls on any error so callers can degrade to the employee
 * view without throwing.
 */
export function useUserRole(): UseUserRoleResult {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<
    AssignedProjectSummary[]
  >([]);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (status === "loading") {
        setIsLoading(true);
        return;
      }

      const accessToken = (session as ExtendedSession)?.accessToken;
      if (!accessToken) {
        setIsAdmin(false);
        setIsManager(false);
        setUserId(null);
        setProfileId(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          if (response.status !== 401 && response.status !== 403) {
            setError(`Profile fetch failed (${response.status})`);
          }
          setIsAdmin(false);
          setIsManager(false);
          return;
        }

        const data = (await response.json()) as AuthProfileResponse;
        if (cancelled) return;

        const resolvedEmail = data.email || data.username || null;
        const resolvedName =
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

        setUserId(typeof data.id === "number" ? data.id : null);
        setEmail(resolvedEmail);
        setFullName(resolvedName);
        setIsAdmin(Boolean(data.is_staff) || Boolean(data.is_superuser));
        setIsManager(Boolean(data.is_manager));

        try {
          // For non-HR users the `/api/employees/` queryset is already scoped
          // to their own profile — search may miss because `email_address` is
          // sometimes empty. Try with email first (HR/multi-result case), then
          // fall back to an unfiltered call and pick the row whose user id or
          // email matches.
          const lower = resolvedEmail?.toLowerCase() ?? null;
          const tryResolve = async (params: {
            search?: string;
            page_size?: number;
          }) => {
            const { results } = await employeeApi.listEmployees(params);
            if (cancelled) return null;
            const match =
              results.find(
                (r) =>
                  (lower && r.email?.toLowerCase() === lower) ||
                  String(r.id) === String(data.id)
              ) || (results.length === 1 ? results[0] : null);
            return match;
          };

          let match =
            lower != null
              ? await tryResolve({ search: lower, page_size: 5 })
              : null;
          if (!match) {
            match = await tryResolve({ page_size: 5 });
          }
          if (match) {
            setProfileId(Number(match.id));
            const projects = (match.assigned_projects ?? [])
              .filter((p) => p.status === "active")
              .map((p) => ({
                assignmentId: p.id,
                projectId: p.project_id,
                projectName: p.project_name,
                role: p.role ?? null,
                status: p.status,
                allocationPercentage: Number(p.allocation_percentage ?? 0),
              }));
            setAssignedProjects(projects);
          }
        } catch {
          // ignore — caller degrades to org-wide view
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsAdmin(false);
        setIsManager(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  return {
    userId,
    profileId,
    assignedProjects,
    email,
    fullName,
    isAdmin,
    isManager,
    isLoading,
    error,
  };
}
