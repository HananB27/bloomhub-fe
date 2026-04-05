/**
 * Token management utilities for authentication
 */

export interface StoredToken {
  access: string;
  refresh?: string;
  user?: Record<string, unknown>;
}

const TOKEN_STORAGE_KEY = "auth_tokens";
const USER_STORAGE_KEY = "auth_user";

/**
 * Store authentication tokens after login
 */
export function storeTokens(data: {
  access?: string;
  access_token?: string;
  refresh?: string;
  refresh_token?: string;
  user?: Record<string, unknown>;
}): void {
  const accessToken = data.access || data.access_token;
  const refreshToken = data.refresh || data.refresh_token;

  if (!accessToken) {
    console.error("No access token provided to storeTokens");
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  // Store in localStorage
  const tokens: StoredToken = {
    access: accessToken,
    ...(refreshToken && { refresh: refreshToken }),
    ...(data.user && { user: data.user }),
  };

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

  if (data.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }

  // Store in cookies for middleware
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    if (refreshToken) {
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
    }
  }
}

/**
 * Get the access token
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const tokens = JSON.parse(stored) as StoredToken;
      return tokens.access || null;
    }
  } catch (e) {
    console.error("Error parsing stored tokens:", e);
  }

  // Fallback: check individual keys
  return localStorage.getItem("access_token");
}

/**
 * Get the refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const tokens = JSON.parse(stored) as StoredToken;
      return tokens.refresh || null;
    }
  } catch (e) {
    console.error("Error parsing stored tokens:", e);
  }

  return localStorage.getItem("refresh_token");
}

/**
 * Get stored user data
 */
export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const tokens = JSON.parse(stored) as StoredToken;
      if (tokens.user) {
        return tokens.user;
      }
    }

    const userStored = localStorage.getItem(USER_STORAGE_KEY);
    if (userStored) {
      return JSON.parse(userStored);
    }
  } catch (e) {
    console.error("Error retrieving user data:", e);
  }

  return null;
}

/**
 * Clear all authentication tokens and user data
 */
export function clearTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Clear cookies
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "refresh_token=; path=/; max-age=0";
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Get user's permission bits from the backend API
 * @returns The permission bits integer, or 0 if request fails
 */
export async function getUserPermissions(): Promise<number> {
  const token = getAccessToken();
  if (!token) {
    console.warn("No access token found for getUserPermissions");
    return 0;
  }

  try {
    // Dynamically import to avoid SSR issues
    const { getApiBaseUrl } = await import("../config");
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/api/auth/permissions/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch permissions:", response.status);
      return 0;
    }

    const data = await response.json();

    // Handle different response formats
    let permissionBits = 0;

    // Format 1: { permissions: <number> }
    if (typeof data.permissions === "number") {
      permissionBits = data.permissions;
    }
    // Format 2: { permission_bits: <number> }
    else if (typeof data.permission_bits === "number") {
      permissionBits = data.permission_bits;
    }
    // Format 3: { permissions: [{bit_position: number}, ...] }
    else if (Array.isArray(data.permissions)) {
      permissionBits = data.permissions.reduce(
        (bits: number, perm: { bit_position: number }) => {
          return bits | (1 << (perm.bit_position - 1));
        },
        0
      );
    }

    return permissionBits;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return 0;
  }
}
