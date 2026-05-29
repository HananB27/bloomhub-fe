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
    const fallback =
      response.status === 403
        ? "Not allowed to perform this action"
        : errorMessage;
    throw new Error(
      extractErrorMessage(error as Record<string, unknown>, fallback)
    );
  }
  return (parseBody ? response.json() : undefined) as T;
}

export async function get<T>(
  url: string,
  errorMessage: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetchWithAuthRetry(url, {
    ...init,
    headers: {
      ...(getHeaders() as Record<string, string>),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  return handleResponse<T>(response, errorMessage);
}

/** GET that returns null on 404 (for optional composite endpoints). */
export async function getAllow404<T>(
  url: string,
  signal?: AbortSignal
): Promise<T | null> {
  const response = await fetchWithAuthRetry(url, {
    headers: getHeaders(),
    signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(error as Record<string, unknown>, "Request failed")
    );
  }
  return response.json() as Promise<T>;
}

/**
 * Authenticated GET with optional If-None-Match (bundle ETag revalidation).
 * — 200: JSON body + ETag header when present
 * — 304: unchanged (caller keeps cached bundle)
 * — 404: treat like missing optional resource
 */
export async function getJsonWithRevalidation<T>(
  url: string,
  options?: {
    signal?: AbortSignal;
    ifNoneMatch?: string;
  }
): Promise<
  | { status: "ok"; data: T; etag: string | null }
  | { status: "not_modified" }
  | { status: "not_found" }
> {
  const headers: Record<string, string> = {
    ...(getHeaders() as Record<string, string>),
  };
  if (options?.ifNoneMatch) {
    headers["If-None-Match"] = options.ifNoneMatch;
  }

  const response = await fetchWithAuthRetry(url, {
    headers,
    signal: options?.signal,
  });

  if (response.status === 404) {
    return { status: "not_found" };
  }
  if (response.status === 304) {
    return { status: "not_modified" };
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(error as Record<string, unknown>, "Request failed")
    );
  }

  const data = (await response.json()) as T;
  const etag = response.headers.get("ETag");
  return { status: "ok", data, etag };
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
