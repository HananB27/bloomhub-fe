import {
  getRefreshToken,
  getAccessToken,
  storeTokens,
  clearTokens,
} from "./tokens";
import { API_BASE_URL } from "../config";

function buildAuthHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function fetchWithAuthRetry(
  input: RequestInfo,
  init?: RequestInit,
  retry = true
): Promise<Response> {
  const accessToken = getAccessToken();
  const authInit: RequestInit = {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? buildAuthHeader(accessToken) : {}),
    },
  };

  let response = await fetch(input, authInit);

  if ((response.status === 401 || response.status === 403) && retry) {
    try {
      const newToken = await refreshAccessToken();
      response = await fetch(input, {
        ...authInit,
        headers: { ...(authInit.headers ?? {}), ...buildAuthHeader(newToken) },
      });
    } catch (e) {
      if (typeof window !== "undefined") {
        clearTokens();
        window.location.href = "/login";
      }
      throw e;
    }
  }

  if (response.status === 403 && typeof window !== "undefined") {
    clearTokens();
    window.location.href = "/login";
  }

  return response;
}
