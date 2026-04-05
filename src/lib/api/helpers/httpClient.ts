/**
 * HTTP Client Helper - Centralizes all HTTP request logic
 * Reduces code duplication and provides consistent error handling
 */

import { getAccessToken } from "../tokens";
import { fetchWithAuthRetry } from "../refresh";

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Standard headers for API requests
 */
export function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(getAccessToken() && {
      Authorization: `Bearer ${getAccessToken()}`,
    }),
  };
}

/**
 * Generic GET request
 */
export async function get<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetchWithAuthRetry(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as ApiError).detail || errorMessage);
  }

  return response.json();
}

/**
 * Generic POST request
 */
export async function post<T>(
  url: string,
  body: unknown,
  errorMessage: string
): Promise<T> {
  const response = await fetchWithAuthRetry(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as ApiError).detail || errorMessage);
  }

  return response.json();
}

/**
 * Generic PATCH request
 */
export async function patch<T>(
  url: string,
  body: unknown,
  errorMessage: string
): Promise<T> {
  const response = await fetchWithAuthRetry(url, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as ApiError).detail || errorMessage);
  }

  return response.json();
}

/**
 * Generic DELETE request
 */
export async function del(url: string, errorMessage: string): Promise<void> {
  const response = await fetchWithAuthRetry(url, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as ApiError).detail || errorMessage);
  }
}

/**
 * Build query string from params object
 */
export function buildQueryString(
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return "";

  const queryString = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, String(value));
    }
  });

  const str = queryString.toString();
  return str ? "?" + str : "";
}

/**
 * Handle array or paginated response formats
 */
export function handleListResponse<T>(
  data: { results?: T[]; count?: number } | T[]
): { results: T[]; count: number } {
  if (Array.isArray(data)) {
    return { results: data, count: data.length };
  }

  return {
    results: data.results || [],
    count: data.count || 0,
  };
}
