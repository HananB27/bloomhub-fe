import { API_BASE_URL } from "../../../config";
import { fetchWithAuthRetry } from "../../refresh";

export interface EmployeeCVVersion {
  id: number;
  profile: number;
  file_key: string;
  uploaded_at: string;
  is_current: boolean;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  source_type?: "file" | "external_link";
  provider?: "internal" | "canva" | "other";
  external_url?: string;
  canva_design_id?: string;
}

/** File CV: signed_url / download_url. External-link CV row: `{ "url": "<external_url>" }` (no bucket file). */
interface EmployeeCVDownloadResponse {
  url?: string;
  signed_url?: string;
  download_url?: string;
}

export interface CreateCVLinkPayload {
  external_url: string;
  file_name?: string;
  provider?: "canva" | "other";
}

export function mapCvVersionRecord(
  data: Record<string, unknown>
): EmployeeCVVersion {
  return {
    id: Number(data.id ?? 0),
    profile: Number(data.profile ?? data.employee ?? 0),
    file_key: String(data.file_key ?? data.path ?? data.key ?? ""),
    uploaded_at: String(data.uploaded_at ?? data.created_at ?? ""),
    is_current: Boolean(data.is_current),
    file_name:
      typeof data.file_name === "string"
        ? data.file_name
        : typeof data.name === "string"
          ? data.name
          : undefined,
    file_size:
      typeof data.file_size === "number"
        ? data.file_size
        : typeof data.size === "number"
          ? data.size
          : undefined,
    mime_type:
      typeof data.mime_type === "string"
        ? data.mime_type
        : typeof data.content_type === "string"
          ? data.content_type
          : undefined,
    source_type:
      data.source_type === "external_link" ? "external_link" : "file",
    provider:
      data.provider === "canva"
        ? "canva"
        : data.provider === "other"
          ? "other"
          : "internal",
    external_url:
      typeof data.external_url === "string"
        ? data.external_url
        : typeof data.url === "string" && data.source_type === "external_link"
          ? data.url
          : undefined,
    canva_design_id:
      typeof data.canva_design_id === "string"
        ? data.canva_design_id
        : undefined,
  };
}

async function parseResponseError(
  response: Response,
  fallbackMessage: string
): Promise<Error> {
  const errorData = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (errorData) {
    if (typeof errorData.detail === "string") {
      return new Error(errorData.detail);
    }
    if (typeof errorData.message === "string") {
      return new Error(errorData.message);
    }
  }

  return new Error(fallbackMessage);
}

function cvEndpoint(employeeId: number | string): string {
  return `${API_BASE_URL}/api/employees/${employeeId}/cvs/`;
}

export const employeeCVApi = {
  async list(employeeId: number | string): Promise<EmployeeCVVersion[]> {
    const response = await fetchWithAuthRetry(cvEndpoint(employeeId), {
      method: "GET",
    });

    if (!response.ok) {
      throw await parseResponseError(response, "Failed to fetch CV versions");
    }

    const data = (await response.json()) as
      | Record<string, unknown>
      | Record<string, unknown>[];
    const rawList = Array.isArray(data)
      ? data
      : ((data.results as Record<string, unknown>[]) ?? []);
    return rawList.map((item) => mapCvVersionRecord(item));
  },

  async upload(
    employeeId: number | string,
    file: File
  ): Promise<EmployeeCVVersion> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithAuthRetry(cvEndpoint(employeeId), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw await parseResponseError(response, "Failed to upload CV");
    }

    const data = (await response.json()) as Record<string, unknown>;
    return mapCvVersionRecord(data);
  },

  async createLink(
    employeeId: number | string,
    payload: CreateCVLinkPayload
  ): Promise<EmployeeCVVersion> {
    const response = await fetchWithAuthRetry(cvEndpoint(employeeId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_type: "external_link",
        provider: payload.provider ?? "canva",
        external_url: payload.external_url,
        file_name: payload.file_name,
      }),
    });

    if (!response.ok) {
      throw await parseResponseError(response, "Failed to add CV link");
    }

    const data = (await response.json()) as Record<string, unknown>;
    return mapCvVersionRecord(data);
  },

  async getDownloadUrl(
    employeeId: number | string,
    cvId: number | string
  ): Promise<string> {
    const response = await fetchWithAuthRetry(
      `${cvEndpoint(employeeId)}${cvId}/download/`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw await parseResponseError(response, "Failed to get CV download URL");
    }

    const data = (await response.json()) as EmployeeCVDownloadResponse;
    const downloadUrl = data.signed_url ?? data.download_url ?? data.url;
    if (!downloadUrl) {
      return `${cvEndpoint(employeeId)}${cvId}/download/`;
    }

    return downloadUrl;
  },

  async resolveAccessUrl(
    employeeId: number | string,
    cv: EmployeeCVVersion
  ): Promise<string> {
    if (cv.source_type === "external_link" && cv.external_url) {
      return cv.external_url;
    }

    return this.getDownloadUrl(employeeId, cv.id);
  },

  async delete(
    employeeId: number | string,
    cvId: number | string
  ): Promise<void> {
    const response = await fetchWithAuthRetry(
      `${cvEndpoint(employeeId)}${cvId}/`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw await parseResponseError(response, "Failed to delete CV version");
    }
  },
};
