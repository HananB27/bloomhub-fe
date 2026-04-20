import { getAccessToken } from "../tokens";
import { fetchWithAuthRetry } from "../refresh";

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export function getHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function extractErrorMessage(
  error: Record<string, unknown>,
  fallback: string
): string {
  if (typeof error.detail === "string") return error.detail;
  if (typeof error.message === "string") return error.message;

  const fieldErrors = Object.entries(error)
    .filter(([, v]) => Array.isArray(v) || typeof v === "string")
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);

  return fieldErrors.length > 0 ? fieldErrors.join("; ") : fallback;
}

async function handleResponse<T>(
  response: Response,
  errorMessage: string,
  parseBody = true
): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(error as Record<string, unknown>, errorMessage)
    );
  }
  return (parseBody ? response.json() : undefined) as T;
}

export async function get<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetchWithAuthRetry(url, { headers: getHeaders() });
  return handleResponse<T>(response, errorMessage);
}

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
  return handleResponse<T>(response, errorMessage);
}

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
  return handleResponse<T>(response, errorMessage);
}

export async function del(url: string, errorMessage: string): Promise<void> {
  const response = await fetchWithAuthRetry(url, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse<void>(response, errorMessage, false);
}

export function buildQueryString(
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) qs.append(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function handleListResponse<T>(
  data: { results?: T[]; count?: number } | T[]
): { results: T[]; count: number } {
  if (Array.isArray(data)) return { results: data, count: data.length };
  return { results: data.results ?? [], count: data.count ?? 0 };
}
