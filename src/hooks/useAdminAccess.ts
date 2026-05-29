"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

interface AdminAccessResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ExtendedSession {
  accessToken?: string;
  user?: { name?: string; email?: string; image?: string };
}

interface AuthProfileResponse {
  id?: number;
  username?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  career_level?: string;
  is_manager?: boolean;
}

/**
 * Returns whether the current user can access the Admin Panel.
 *
 * Admin = backend reports `is_staff` or `is_superuser` on `/api/auth/profile/`.
 * Previous heuristic (count of employees visible) was unreliable for small
 * tenants and broke for paginated responses.
 */
export function useAdminAccess(): AdminAccessResult {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (status === "loading") {
        setIsLoading(true);
        return;
      }

      const accessToken = (session as ExtendedSession)?.accessToken;
      if (!accessToken) {
        setIsAdmin(false);
        setIsLoading(false);
        setError("No access token found");
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
          setIsAdmin(false);
          if (response.status !== 401 && response.status !== 403) {
            setError(`Profile fetch failed (${response.status})`);
          }
          return;
        }

        const data = (await response.json()) as AuthProfileResponse;
        setIsAdmin(Boolean(data.is_staff) || Boolean(data.is_superuser));
      } catch (err) {
        console.error("Error checking admin access:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [session, status]);

  return { isAdmin, isLoading, error };
}
