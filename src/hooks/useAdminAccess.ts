"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

interface AdminAccessResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

// Extend session type to include accessToken
interface ExtendedSession {
  accessToken?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

/**
 * Hook to check if the current user has admin access
 * Checks by attempting to fetch employees - admins can see all, regular users get 403
 */
export function useAdminAccess(): AdminAccessResult {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
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

        // Try to fetch employees - admins will get all, regular users get 403 or only their profile
        const response = await fetch(`${API_BASE_URL}/api/employees/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const employees = await response.json();
          // If user can see multiple employees, they're an admin
          // Regular employees might only see their own profile (array of 1)
          setIsAdmin(Array.isArray(employees) && employees.length > 1);
        } else if (response.status === 403) {
          // Forbidden - definitely not an admin
          setIsAdmin(false);
        } else {
          setIsAdmin(false);
          setError("Failed to check admin access");
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminAccess();
  }, [session, status]);

  return { isAdmin, isLoading, error };
}
