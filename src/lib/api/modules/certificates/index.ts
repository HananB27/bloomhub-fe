import { API_BASE_URL } from "@/lib/config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
} from "../../helpers/httpClient";
import { fetchWithAuthRetry } from "../../refresh";
import { resolveApiMediaUrl } from "../../helpers/resolveApiMediaUrl";
import {
  CERTIFICATES_API_BASE_PATH,
  certificateDetailPath,
  certificateDownloadPath,
} from "../../constants/certificatesEndpoints";
import type {
  Certificate,
  CertificateFilters,
  CreateCertificatePayload,
} from "@/types/certificates";

interface ApiCertificate {
  id: number;
  employee_id: number;
  employee_name: string;
  title: string;
  issuer?: string | null;
  issued_date: string;
  expiration_date?: string | null;
  is_expired: boolean;
  file_url?: string | null;
  created_at: string;
  updated_at?: string;
}

function transformCertificate(raw: ApiCertificate): Certificate {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeName: raw.employee_name || "Unknown",
    title: raw.title,
    issuer: raw.issuer ?? undefined,
    issuedDate: raw.issued_date,
    expirationDate: raw.expiration_date ?? undefined,
    isExpired: Boolean(raw.is_expired),
    fileUrl: raw.file_url ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
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
  if (errorData && typeof errorData.detail === "string") {
    return new Error(errorData.detail);
  }
  if (errorData && typeof errorData.message === "string") {
    return new Error(errorData.message);
  }
  if (errorData) {
    const fieldErrors = Object.entries(errorData)
      .filter(([, v]) => Array.isArray(v) || typeof v === "string")
      .map(
        ([k, v]) => `${k}: ${Array.isArray(v) ? (v as string[]).join(", ") : v}`
      );
    if (fieldErrors.length > 0) {
      return new Error(fieldErrors.join("; "));
    }
  }
  return new Error(fallbackMessage);
}

export const certificatesApi = {
  async list(filters?: CertificateFilters): Promise<Certificate[]> {
    const qs = buildQueryString({
      employee: filters?.employeeId,
      search: filters?.search,
      ordering: filters?.ordering,
    });
    const data = await get<
      ApiCertificate[] | { results?: ApiCertificate[]; count?: number }
    >(
      `${API_BASE_URL}${CERTIFICATES_API_BASE_PATH}${qs}`,
      "Failed to fetch certificates"
    );
    const { results } = handleListResponse(data);
    return results.map(transformCertificate);
  },

  async getById(id: number | string): Promise<Certificate> {
    const data = await get<ApiCertificate>(
      `${API_BASE_URL}${certificateDetailPath(id)}`,
      "Failed to fetch certificate"
    );
    return transformCertificate(data);
  },

  async upload(payload: CreateCertificatePayload): Promise<Certificate> {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("title", payload.title);
    formData.append("issued_date", payload.issuedDate);
    if (payload.expirationDate) {
      formData.append("expiration_date", payload.expirationDate);
    }
    if (payload.issuer) {
      formData.append("issuer", payload.issuer);
    }
    if (payload.employeeId !== undefined) {
      formData.append("employee_id", String(payload.employeeId));
    }

    const response = await fetchWithAuthRetry(
      `${API_BASE_URL}${CERTIFICATES_API_BASE_PATH}`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      throw await parseResponseError(response, "Failed to upload certificate");
    }
    return transformCertificate((await response.json()) as ApiCertificate);
  },

  async getDownloadUrl(id: number | string): Promise<string> {
    const data = await get<{ signed_url?: string; url?: string }>(
      `${API_BASE_URL}${certificateDownloadPath(id)}`,
      "Failed to get certificate download URL"
    );
    return resolveApiMediaUrl(data.signed_url ?? data.url ?? "");
  },

  async remove(id: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}${certificateDetailPath(id)}`,
      "Failed to delete certificate"
    );
  },
};

export type { Certificate, CertificateFilters, CreateCertificatePayload };
