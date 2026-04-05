import { getRefreshToken, storeTokens, clearTokens } from "./tokens";

/**
 * Refresh the access token using the refresh token.
 * Calls POST /api/auth/refresh/ and updates stored tokens on success.
 * Throws if refresh fails (e.g., refresh token expired).
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    throw new Error("No refresh token available");
  }

  const response = await fetch("/api/auth/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  if (!data.access && !data.access_token) {
    clearTokens();
    throw new Error("No access token returned from refresh endpoint");
  }

  storeTokens(data);
  return data.access || data.access_token;
}

/**
 * Utility to wrap fetch and auto-refresh token on 401/expired.
 * Usage: await fetchWithAuthRetry(url, options)
 */
export async function fetchWithAuthRetry(
  input: RequestInfo,
  init?: RequestInit,
  retry = true
): Promise<Response> {
  let accessToken =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (accessToken) {
    init = init || {};
    init.headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };
  }

  let response = await fetch(input, init);
  // Try to refresh on 401 (Unauthorized) or 403 (Forbidden)
  if ((response.status === 401 || response.status === 403) && retry) {
    try {
      accessToken = await refreshAccessToken();
      init = init || {};
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      };
      response = await fetch(input, init);
    } catch (e) {
      // Refresh failed or not applicable, redirect to login if in browser
      if (typeof window !== "undefined") {
        clearTokens();
        window.location.href = "/login";
      }
      throw e;
    }
  }
  // If still forbidden after refresh, redirect to login
  if (response.status === 403 && typeof window !== "undefined") {
    clearTokens();
    window.location.href = "/login";
  }
  return response;
}
