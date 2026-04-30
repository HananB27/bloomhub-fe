import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuthRetry } from "../../refresh";
import {
  DOCUMENTS_API_BASE_PATH,
  documentDownloadPath,
} from "../../constants/documentsEndpoints";
import {
  DocumentAccessRole,
  DocumentCategory,
  SignatureStatus,
} from "@/lib/documents/documentsHelpers";

interface DocumentsListResponse<T> {
  count?: number;
  results?: T[];
}

interface ApiDocumentRecord {
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  category?: DocumentCategory;
  file_name?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by_name?: string;
  uploaded_at?: string;
  updated_at?: string;
  expiry_date?: string | null;
  signature_status?: SignatureStatus;
  is_confidential?: boolean;
  tags?: string[];
  allowed_roles?: DocumentAccessRole[];
}

export interface EmployeeDocument {
  id: number;
  name: string;
  description: string;
  category: DocumentCategory;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  expiryDate?: string;
  signatureStatus: SignatureStatus;
  isConfidential: boolean;
  tags: string[];
  allowedRoles: DocumentAccessRole[];
}

export interface UploadEmployeeDocumentPayload {
  file: File;
  name: string;
  category: DocumentCategory;
  description: string;
  expiryDate?: string;
  isConfidential: boolean;
  tags: string[];
  allowedRoles: DocumentAccessRole[];
}

function mapDocumentRecord(record: ApiDocumentRecord): EmployeeDocument {
  return {
    id: Number(record.id ?? 0),
    name: String(record.name ?? record.title ?? ""),
    description: String(record.description ?? ""),
    category: (record.category ?? DocumentCategory.Other) as DocumentCategory,
    fileName: String(record.file_name ?? record.original_filename ?? ""),
    fileSizeBytes: Number(record.file_size ?? 0),
    mimeType: String(record.mime_type ?? "application/octet-stream"),
    uploadedBy: String(record.uploaded_by_name ?? ""),
    uploadedAt: String(record.uploaded_at ?? ""),
    updatedAt: String(record.updated_at ?? record.uploaded_at ?? ""),
    expiryDate: record.expiry_date ?? undefined,
    signatureStatus: (record.signature_status ??
      SignatureStatus.NotRequired) as SignatureStatus,
    isConfidential: Boolean(record.is_confidential),
    tags: Array.isArray(record.tags) ? record.tags : [],
    allowedRoles: Array.isArray(record.allowed_roles)
      ? record.allowed_roles
      : [],
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
  return new Error(fallbackMessage);
}

function documentsEndpoint(query?: { category?: DocumentCategory }): string {
  const base = `${API_BASE_URL}${DOCUMENTS_API_BASE_PATH}`;
  if (!query?.category) return base;
  const params = new URLSearchParams({ category: query.category });
  return `${base}?${params.toString()}`;
}

export const documentsApi = {
  async list(query?: {
    category?: DocumentCategory;
  }): Promise<EmployeeDocument[]> {
    const response = await fetchWithAuthRetry(documentsEndpoint(query), {
      method: "GET",
    });
    if (!response.ok) {
      throw await parseResponseError(response, "Failed to fetch documents");
    }
    const data = (await response.json()) as
      | ApiDocumentRecord[]
      | DocumentsListResponse<ApiDocumentRecord>;
    const rows = Array.isArray(data) ? data : (data.results ?? []);
    return rows.map(mapDocumentRecord);
  },

  async upload(
    payload: UploadEmployeeDocumentPayload
  ): Promise<EmployeeDocument> {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("name", payload.name);
    formData.append("category", payload.category);
    formData.append("description", payload.description);
    formData.append("is_confidential", String(payload.isConfidential));
    payload.tags.forEach((tag) => formData.append("tags", tag));
    payload.allowedRoles.forEach((role) =>
      formData.append("allowed_roles", role)
    );
    if (payload.expiryDate) {
      formData.append("expiry_date", payload.expiryDate);
    }
    const response = await fetchWithAuthRetry(documentsEndpoint(), {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw await parseResponseError(response, "Failed to upload document");
    }
    const data = (await response.json()) as ApiDocumentRecord;
    return mapDocumentRecord(data);
  },

  async getDownloadUrl(documentId: number | string): Promise<string> {
    const response = await fetchWithAuthRetry(
      `${API_BASE_URL}${documentDownloadPath(documentId)}`,
      { method: "GET" }
    );
    if (!response.ok) {
      throw await parseResponseError(
        response,
        "Failed to get document download URL"
      );
    }
    const data = (await response.json()) as {
      url?: string;
      signed_url?: string;
      download_url?: string;
    };
    return data.signed_url ?? data.download_url ?? data.url ?? "";
  },
};
