export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function buildApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const tokenKeys = ["access", "accessToken", "token", "authToken", "jwt"];

  for (const key of tokenKeys) {
    const localToken = window.localStorage.getItem(key);
    if (localToken) {
      return localToken;
    }

    const sessionToken = window.sessionStorage.getItem(key);
    if (sessionToken) {
      return sessionToken;
    }
  }

  return null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (response.ok) {
    return payload as T;
  }

  let message = `Request failed with status ${response.status}`;

  if (typeof payload === "string" && payload.trim()) {
    message = payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    message = payload.error;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    message = payload.message;
  }

  throw new ApiError(message, response.status, payload);
}

export interface UploadRolePermissionsResponse {
  message: string;
  file_path: string;
}

export async function uploadRolePermissionsCsv(
  file: File,
  accessToken?: string
): Promise<UploadRolePermissionsResponse> {
  const token = accessToken ?? getStoredAccessToken();

  if (!token) {
    throw new ApiError(
      "Missing auth token. Please sign in as an admin user before uploading.",
      401
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    buildApiUrl("/api/admin/upload-role-permissions/"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return parseResponse<UploadRolePermissionsResponse>(response);
}
