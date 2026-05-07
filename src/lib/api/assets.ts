import { getApiBaseUrl } from "@/lib/config";
import { ApiError } from "@/utils/api";

export interface AssetApiItem {
  id: number;
  asset_id?: string;
  name: string;
  category?: string;
  serial_number?: string;
  asset_tag?: string;
  brand?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  image?: string;
  purchase_date?: string;
  purchase_price?: number | string;
  warranty?: string;
  warranty_until?: string;
  status?: string;
  condition?: string;
  current_assignment?: Record<string, unknown> | null;
  is_available?: boolean;
  location?: string;
  assigned_to?: string;
  assigned_employee_name?: string;
  assigned_date?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  specifications?: Record<string, string>;
  capabilities?: AssetItemCapabilities;
}

export interface AssetItemCapabilities {
  can_view?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  can_assign?: boolean;
  can_request_return?: boolean;
  can_process_return?: boolean;
  can_view_history?: boolean;
  can_update_condition?: boolean;
  can_generate_qr_code?: boolean;
}

export interface AssetCapabilities {
  permissions?: string[];
  scope?: "none" | "own" | "team" | "all" | string;
  capabilities?: {
    can_view_any_assets?: boolean;
    can_create_assets?: boolean;
    can_update_assets?: boolean;
    can_delete_assets?: boolean;
    can_assign_assets?: boolean;
    can_request_return?: boolean;
    can_process_return?: boolean;
    can_export_inventory?: boolean;
    can_view_asset_history?: boolean;
    can_update_asset_condition?: boolean;
    can_generate_qr_codes?: boolean;
  };
}

export interface AssetAssignmentApiItem {
  id: number;
  asset?: number;
  asset_id: number;
  employee?: number;
  employee_id?: string;
  employee_name?: string;
  assigned_at?: string;
  assigned_date?: string;
  returned_at?: string;
  returned_date?: string;
  return_request_status?: "none" | "pending" | "approved" | "rejected";
  return_requested_by?: number | null;
  return_requested_at?: string | null;
  return_reviewed_by?: number | null;
  return_reviewed_at?: string | null;
  return_rejection_reason?: string | null;
  return_description?: string | null;
  return_checklist?: unknown;
  return_requested?: Record<string, unknown> | null;
  assigned_by?: string | number;
  return_condition?: string;
  notes?: string;
  condition?: string;
  asset_details?: {
    id?: number;
    name?: string;
    asset_id?: string;
    condition?: string;
  };
  employee_details?: {
    id?: number;
    full_name?: string;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      username?: string;
    };
  };
  assigned_by_details?: {
    id?: number;
    full_name?: string;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      username?: string;
    };
  };
  is_active?: boolean;
}

interface UserProfileApiItem {
  id?: number;
  full_name?: string | null;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
  };
}

export interface PendingReturnRequestApiItem {
  id?: number;
  assignment_id?: number;
  assignment?: number;
  asset?: AssetApiItem;
  employee?: UserProfileApiItem;
  requested_by?: UserProfileApiItem;
  return_request_status?: "none" | "pending" | "approved" | "rejected";
  return_requested_at?: string | null;
  return_description?: string | null;
  return_checklist?: unknown;
  return_requested?: Record<string, unknown> | null;
  return_rejection_reason?: string | null;
  requested_at?: string;
  notes?: string;
  assignment_details?: AssetAssignmentApiItem;
  employee_name?: string;
  employee_details?: UserProfileApiItem;
  asset_name?: string;
  asset_details?: {
    id?: number;
    name?: string;
    asset_id?: string;
  };
}

export interface AssetReplacementLogApiItem {
  id: number;
  asset?: number;
  asset_id: number;
  date?: string;
  created_at?: string;
  reason?: string;
  notes?: string;
  old_asset_tag?: string;
  new_asset_tag?: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string;
  body?: unknown;
}

export interface AssetExportPayload {
  filters?: {
    status?: "active" | "lost" | "returned" | "damaged";
    condition?: "excellent" | "good" | "fair" | "poor" | "damaged";
    category?:
      | "laptops"
      | "phones"
      | "monitors"
      | "headphones"
      | "cameras"
      | "vehicles"
      | "furniture"
      | "other";
    available?: boolean;
    assigned_employee_id?: number;
  };
  fields?: string[];
  include_assignment?: boolean;
  filename?: string;
}

export interface AssetExportResult {
  blob: Blob;
  filename: string;
}

const ASSETS_PATH = process.env.NEXT_PUBLIC_ASSETS_API_PATH || "/api/assets/";
const ASSET_CAPABILITIES_PATH =
  process.env.NEXT_PUBLIC_ASSET_CAPABILITIES_API_PATH ||
  "/api/assets/capabilities/";
const ASSIGNMENTS_PATH =
  process.env.NEXT_PUBLIC_ASSET_ASSIGNMENTS_API_PATH || "/api/assignments/";
const REPLACEMENTS_PATH =
  process.env.NEXT_PUBLIC_ASSET_REPLACEMENTS_API_PATH ||
  "/api/replacement-logs/";
const USERS_PATH =
  process.env.NEXT_PUBLIC_ASSIGNABLE_USERS_API_PATH || "/api/user-profiles/";
const ASSETS_EXPORT_PATH =
  process.env.NEXT_PUBLIC_ASSETS_EXPORT_API_PATH || "/api/assets/export/";

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const tokenKeys = ["access", "accessToken", "token", "authToken", "jwt"];

  for (const key of tokenKeys) {
    const local = window.localStorage.getItem(key);
    if (local) {
      return local;
    }

    const session = window.sessionStorage.getItem(key);
    if (session) {
      return session;
    }
  }

  return null;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) {
    const trimmedPayload = payload.trim();
    if (/^\s*<(?:!doctype\s+html|html|head|body)\b/i.test(trimmedPayload)) {
      return `Request failed with status ${status}`;
    }
    return trimmedPayload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>;

    if (typeof candidate.detail === "string") {
      return candidate.detail;
    }

    if (typeof candidate.error === "string") {
      return candidate.error;
    }

    if (typeof candidate.message === "string") {
      return candidate.message;
    }
  }

  return `Request failed with status ${status}`;
}

function parseContentDispositionFilename(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }

  const filenameMatch = value.match(/filename=([^;]+)/i);
  if (!filenameMatch?.[1]) {
    return null;
  }

  return filenameMatch[1].trim().replace(/^"|"$/g, "");
}

async function requestJson<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = options.token || getStoredAccessToken();
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${getApiBaseUrl()}${normalizePath(path)}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      payload
    );
  }

  return payload as T;
}

export async function listAssets(token?: string): Promise<AssetApiItem[]> {
  return requestJson<AssetApiItem[]>(ASSETS_PATH, { token });
}

export async function getAssetCapabilities(
  token?: string
): Promise<AssetCapabilities> {
  return requestJson<AssetCapabilities>(ASSET_CAPABILITIES_PATH, { token });
}

export async function createAsset(
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetApiItem> {
  return requestJson<AssetApiItem>(ASSETS_PATH, {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateAsset(
  assetId: number,
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetApiItem> {
  return requestJson<AssetApiItem>(`${ASSETS_PATH}${assetId}/`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteAssetById(
  assetId: number,
  token?: string
): Promise<void> {
  await requestJson<unknown>(`${ASSETS_PATH}${assetId}/`, {
    method: "DELETE",
    token,
  });
}

export async function listAssignments(
  token?: string
): Promise<AssetAssignmentApiItem[]> {
  return requestJson<AssetAssignmentApiItem[]>(ASSIGNMENTS_PATH, { token });
}

export async function assignAssetToEmployee(
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetAssignmentApiItem> {
  const normalizedPayload = {
    ...payload,
    asset:
      payload.asset ??
      payload.asset_id ??
      (typeof payload.assetId === "number" ? payload.assetId : undefined),
    employee:
      payload.employee ??
      payload.employee_id ??
      (typeof payload.employeeId === "number" ? payload.employeeId : undefined),
  };

  delete (normalizedPayload as Record<string, unknown>).asset_id;
  delete (normalizedPayload as Record<string, unknown>).assetId;
  delete (normalizedPayload as Record<string, unknown>).employee_id;
  delete (normalizedPayload as Record<string, unknown>).employeeId;

  return requestJson<AssetAssignmentApiItem>(ASSIGNMENTS_PATH, {
    method: "POST",
    token,
    body: normalizedPayload,
  });
}

export async function processAssetReturn(
  assignmentId: number,
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetAssignmentApiItem> {
  const primaryPath = `${ASSIGNMENTS_PATH}${assignmentId}/return/`;
  const fallbackPath = `${ASSETS_PATH}${assignmentId}/return/`;

  try {
    return await requestJson<AssetAssignmentApiItem>(primaryPath, {
      method: "POST",
      token,
      body: payload,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return requestJson<AssetAssignmentApiItem>(fallbackPath, {
        method: "POST",
        token,
        body: payload,
      });
    }
    throw error;
  }
}

export async function requestAssetReturn(
  assignmentId: number,
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetAssignmentApiItem> {
  return requestJson<AssetAssignmentApiItem>(
    `${ASSIGNMENTS_PATH}${assignmentId}/request-return/`,
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

export async function approveAssetReturn(
  assignmentId: number,
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetAssignmentApiItem> {
  return requestJson<AssetAssignmentApiItem>(
    `${ASSIGNMENTS_PATH}${assignmentId}/return/`,
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

export async function rejectAssetReturn(
  assignmentId: number,
  payload: Record<string, unknown>,
  token?: string
): Promise<AssetAssignmentApiItem> {
  return requestJson<AssetAssignmentApiItem>(
    `${ASSIGNMENTS_PATH}${assignmentId}/reject-return/`,
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

export async function listPendingReturnRequests(
  token?: string
): Promise<PendingReturnRequestApiItem[]> {
  return requestJson<PendingReturnRequestApiItem[]>(
    `/api/return-requests/?status=pending`,
    { token }
  );
}

export async function listReplacementLogs(
  assetId: number,
  token?: string
): Promise<AssetReplacementLogApiItem[]> {
  return requestJson<AssetReplacementLogApiItem[]>(
    `${REPLACEMENTS_PATH}?asset=${assetId}`,
    { token }
  );
}

export async function listAssignableUsers(
  token?: string
): Promise<Array<{ id: string; name: string }>> {
  const profiles = await requestJson<UserProfileApiItem[]>(USERS_PATH, {
    token,
  });

  return profiles.map((profile) => {
    const first = profile.user?.first_name?.trim() || "";
    const last = profile.user?.last_name?.trim() || "";
    const joinedName = `${first} ${last}`.trim();

    return {
      id: String(profile.id),
      name:
        profile.full_name?.trim() ||
        joinedName ||
        profile.user?.email ||
        profile.user?.username ||
        `User ${profile.id}`,
    };
  });
}

export async function exportAssetsCsv(
  payload: AssetExportPayload,
  token?: string
): Promise<AssetExportResult> {
  const authToken = token || getStoredAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}${normalizePath(ASSETS_EXPORT_PATH)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const errorPayload = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");

    throw new ApiError(
      extractErrorMessage(errorPayload, response.status),
      response.status,
      errorPayload
    );
  }

  const blob = await response.blob();
  const filenameFromHeader = parseContentDispositionFilename(
    response.headers.get("content-disposition")
  );

  return {
    blob,
    filename: filenameFromHeader || payload.filename || "asset_export.csv",
  };
}
