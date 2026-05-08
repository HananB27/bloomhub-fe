import { API_BASE_URL } from "@/lib/config";
import { resolveApiMediaUrl } from "../../helpers/resolveApiMediaUrl";
import { get, post, patch, del } from "../../helpers/httpClient";
import { fetchWithAuthRetry } from "../../refresh";
import {
  DOCUMENTS_API_BASE_PATH,
  DOCUMENTS_BULK_DELETE_PATH,
  DOCUMENTS_BULK_ARCHIVE_PATH,
  DOCUMENTS_BULK_DOWNLOAD_PATH,
  DOCUMENTS_EXPORT_PATH,
  documentDownloadPath,
  documentPreviewPath,
  documentArchivePath,
  documentUnarchivePath,
  documentVersionsPath,
  documentSignaturePath,
  documentReminderPath,
  documentVisibilityPath,
} from "../../constants/documentsEndpoints";
import {
  DocumentAccessRole,
  DocumentCategory,
  SignatureStatus,
  DocumentFileDisplayType,
  getFileDisplayType,
  formatFileSizeMB,
} from "@/lib/documents/documentsHelpers";
import type { DocumentVisibilityScope } from "@/lib/documents/documentVisibilityPresets";

// ─── API-layer interfaces (raw backend shape) ─────────────────────────────────

interface ApiDocumentSigner {
  id?: number;
  name?: string;
  email?: string;
  /** "signed" | "pending" | "notsent" */
  status?: string;
  signed_at?: string;
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
  last_modified?: string;
  expiry_date?: string | null;
  signature_status?: SignatureStatus;
  is_confidential?: boolean;
  tags?: string[];
  allowed_roles?: DocumentAccessRole[];
  // TODO [BACKEND REQUIRED]: GET/POST/PATCH /api/documents/ — include visibility_scope
  // ("roles" | "only_me" | "project_group"); defaults to "roles" for legacy rows.
  visibility_scope?: DocumentVisibilityScope;
  // TODO [BACKEND REQUIRED]: GET /api/documents/ & GET /api/documents/{id}/
  // — include current_version (e.g. "2.1") and version_count (e.g. 3)
  current_version?: string;
  version_count?: number;
  // TODO [BACKEND REQUIRED]: GET /api/documents/{id}/ — include signers array
  signers?: ApiDocumentSigner[];
  /** True when the document was created from a template. */
  from_template?: boolean;
  template_id?: number | null;
}

interface ApiDocumentVersion {
  id?: number;
  version?: string;
  version_number?: string;
  uploaded_at?: string;
  uploaded_by_name?: string;
  file_size?: number;
  notes?: string;
}

// ─── Frontend-layer types (exported for component use) ────────────────────────

export interface DocumentSigner {
  id?: number;
  name: string;
  email: string;
  status: "signed" | "pending" | "notsent";
  signedAt?: string;
}

export interface DocumentVersion {
  id?: number;
  version: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSizeDisplay: string;
  notes: string;
}

export interface EmployeeDocument {
  id: number;
  name: string;
  description: string;
  category: DocumentCategory;
  /** Derived from mimeType / fileName for the FileTile UI component. */
  fileType: DocumentFileDisplayType;
  fileName: string;
  fileSizeBytes: number;
  /** Pre-formatted size string, e.g. "1.2 MB". */
  fileSizeDisplay: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  /** Alias for updatedAt — kept as lastModified for backwards UI compatibility. */
  lastModified: string;
  expiryDate?: string;
  signatureStatus: SignatureStatus;
  isConfidential: boolean;
  tags: string[];
  allowedRoles: DocumentAccessRole[];
  visibilityScope: DocumentVisibilityScope;
  currentVersion: string;
  versionCount: number;
  signers: DocumentSigner[];
  /** True when this document was generated from a template. */
  fromTemplate: boolean;
  templateId?: number;
}

export interface UploadEmployeeDocumentPayload {
  file: File;
  name: string;
  category: DocumentCategory;
  description: string;
  expiryDate?: string;
  tags: string[];
  allowedRoles: DocumentAccessRole[];
  visibilityScope: DocumentVisibilityScope;
  /**
   * When true, trigger signature workflow immediately after upload.
   * TODO [BACKEND REQUIRED]: POST /api/documents/{id}/request-signature/
   * — accept signer email list and initiate e-sign flow.
   */
  requestSignatures?: boolean;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapDocumentSigner(raw: ApiDocumentSigner): DocumentSigner {
  const status = raw.status as DocumentSigner["status"];
  return {
    id: raw.id,
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    status: status === "signed" || status === "pending" ? status : "notsent",
    signedAt: raw.signed_at,
  };
}

function mapDocumentVersion(raw: ApiDocumentVersion): DocumentVersion {
  const fileSizeBytes = Number(raw.file_size ?? 0);
  return {
    id: raw.id,
    version: String(raw.version ?? raw.version_number ?? "1.0"),
    uploadedAt: String(raw.uploaded_at ?? ""),
    uploadedBy: String(raw.uploaded_by_name ?? ""),
    fileSizeDisplay: formatFileSizeMB(fileSizeBytes),
    notes: String(raw.notes ?? ""),
  };
}

function mapDocumentRecord(record: ApiDocumentRecord): EmployeeDocument {
  const fileSizeBytes = Number(record.file_size ?? 0);
  const fileName = String(record.file_name ?? record.original_filename ?? "");
  const mimeType = String(record.mime_type ?? "application/octet-stream");
  const updatedAt = String(
    record.last_modified ?? record.updated_at ?? record.uploaded_at ?? ""
  );

  return {
    id: Number(record.id ?? 0),
    name: String(record.name ?? record.title ?? ""),
    description: String(record.description ?? ""),
    category: (record.category ?? DocumentCategory.Other) as DocumentCategory,
    fileType: getFileDisplayType(mimeType, fileName),
    fileName,
    fileSizeBytes,
    fileSizeDisplay: formatFileSizeMB(fileSizeBytes),
    mimeType,
    uploadedBy: String(record.uploaded_by_name ?? ""),
    uploadedAt: String(record.uploaded_at ?? ""),
    lastModified: updatedAt,
    expiryDate: record.expiry_date ?? undefined,
    signatureStatus: (record.signature_status ??
      SignatureStatus.NotRequired) as SignatureStatus,
    isConfidential: Boolean(record.is_confidential),
    tags: Array.isArray(record.tags) ? record.tags : [],
    allowedRoles: Array.isArray(record.allowed_roles)
      ? record.allowed_roles
      : [],
    visibilityScope: (record.visibility_scope ??
      "roles") as DocumentVisibilityScope,
    currentVersion: String(record.current_version ?? "1.0"),
    versionCount: Number(record.version_count ?? 1),
    signers: Array.isArray(record.signers)
      ? record.signers.map(mapDocumentSigner)
      : [],
    fromTemplate: Boolean(record.from_template),
    templateId: record.template_id ?? undefined,
  };
}

// ─── URL builder ──────────────────────────────────────────────────────────────

function documentsListEndpoint(query?: {
  category?: DocumentCategory;
  search?: string;
  signature_status?: SignatureStatus;
  expiry_filter?: "expiring_soon" | "expired";
  archived?: boolean;
}): string {
  const base = `${API_BASE_URL}${DOCUMENTS_API_BASE_PATH}`;
  if (!query) return base;
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.signature_status)
    params.set("signature_status", query.signature_status);
  if (query.expiry_filter) params.set("expiry_filter", query.expiry_filter);
  if (query.archived) params.set("archived", "true");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// ─── Error parser (FormData responses bypass httpClient helpers) ───────────────

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

// ─── API client ───────────────────────────────────────────────────────────────

export const documentsApi = {
  /**
   * List documents with optional server-side filters.
   * NOTE: search, signature_status and expiry_filter params are forwarded
   * but may be ignored if the backend does not yet support them —
   * the component falls back to client-side filtering in that case.
   * TODO [BACKEND REQUIRED]: GET /api/documents/ — support query params:
   *   category, search, signature_status, expiry_filter, ordering, page, page_size
   */
  async list(query?: {
    category?: DocumentCategory;
    search?: string;
    signature_status?: SignatureStatus;
    expiry_filter?: "expiring_soon" | "expired";
    /** When true, fetches the archived (soft-deleted) document list. */
    archived?: boolean;
  }): Promise<EmployeeDocument[]> {
    const data = await get<
      ApiDocumentRecord[] | { results?: ApiDocumentRecord[]; count?: number }
    >(documentsListEndpoint(query), "Failed to fetch documents");
    const rows = Array.isArray(data) ? data : (data.results ?? []);
    return rows.map(mapDocumentRecord);
  },

  /**
   * Upload a new document (multipart/form-data).
   * Uses fetchWithAuthRetry directly because httpClient helpers use JSON body.
   */
  async upload(
    payload: UploadEmployeeDocumentPayload
  ): Promise<EmployeeDocument> {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("name", payload.name);
    formData.append("category", payload.category);
    formData.append("description", payload.description);
    payload.tags.forEach((tag) => formData.append("tags", tag));
    payload.allowedRoles.forEach((role) =>
      formData.append("allowed_roles", role)
    );
    // TODO [BACKEND REQUIRED]: POST /api/documents/ — accept visibility_scope
    // ("roles" | "only_me" | "project_group") on the multipart payload.
    formData.append("visibility_scope", payload.visibilityScope);
    if (payload.expiryDate) {
      formData.append("expiry_date", payload.expiryDate);
    }

    const response = await fetchWithAuthRetry(
      `${API_BASE_URL}${DOCUMENTS_API_BASE_PATH}`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      throw await parseResponseError(response, "Failed to upload document");
    }
    return mapDocumentRecord((await response.json()) as ApiDocumentRecord);
  },

  /**
   * Update the visibility settings (scope + allowed roles) of an existing document.
   * TODO [BACKEND REQUIRED]: PATCH /api/documents/{id}/visibility/
   * Body: { allowed_roles: DocumentAccessRole[]; visibility_scope: "roles" | "only_me" | "project_group" }
   * — HR/Admin only (or owner when scope === "only_me"); returns the updated document record.
   */
  async updateVisibility(
    documentId: number | string,
    settings: {
      scope: DocumentVisibilityScope;
      allowedRoles: DocumentAccessRole[];
    }
  ): Promise<EmployeeDocument> {
    const data = await patch<ApiDocumentRecord>(
      `${API_BASE_URL}${documentVisibilityPath(documentId)}`,
      {
        allowed_roles: settings.allowedRoles,
        visibility_scope: settings.scope,
      },
      "Failed to update document visibility"
    );
    return mapDocumentRecord(data);
  },

  /**
   * Get a short-lived signed download URL for a document.
   */
  async getDownloadUrl(documentId: number | string): Promise<string> {
    const data = await get<{
      url?: string;
      signed_url?: string;
      download_url?: string;
    }>(
      `${API_BASE_URL}${documentDownloadPath(documentId)}`,
      "Failed to get document download URL"
    );
    return resolveApiMediaUrl(
      data.signed_url ?? data.download_url ?? data.url ?? ""
    );
  },

  /**
   * Get a short-lived signed preview URL for inline display.
   * TODO [BACKEND REQUIRED]: GET /api/documents/{id}/preview/
   * — return { url: string } with a signed URL suitable for embedding in an iframe or object tag.
   */
  async getPreviewUrl(documentId: number | string): Promise<string> {
    const data = await get<{ url?: string; preview_url?: string }>(
      `${API_BASE_URL}${documentPreviewPath(documentId)}`,
      "Failed to get document preview URL"
    );
    return resolveApiMediaUrl(data.preview_url ?? data.url ?? "");
  },

  async resolveInlineDocumentUrl(documentId: number | string): Promise<string> {
    try {
      const preview = await this.getPreviewUrl(documentId);
      if (preview) return preview;
    } catch {}
    return this.getDownloadUrl(documentId);
  },

  /**
   * Permanently delete a document.
   * TODO [BACKEND REQUIRED]: DELETE /api/documents/{id}/
   * — hard-delete the record and associated file from storage.
   */
  async delete(documentId: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}${DOCUMENTS_API_BASE_PATH}${documentId}/`,
      "Failed to delete document"
    );
  },

  /**
   * Soft-delete (archive) a document so it is hidden from the default list
   * but still retrievable via the Archive view.
   * TODO [BACKEND REQUIRED]: POST /api/documents/{id}/archive/
   * — set archived=true, return updated document record.
   */
  async archive(documentId: number | string): Promise<EmployeeDocument> {
    const data = await post<ApiDocumentRecord>(
      `${API_BASE_URL}${documentArchivePath(documentId)}`,
      {},
      "Failed to archive document"
    );
    return mapDocumentRecord(data);
  },

  async unarchive(documentId: number | string): Promise<EmployeeDocument> {
    const data = await post<ApiDocumentRecord>(
      `${API_BASE_URL}${documentUnarchivePath(documentId)}`,
      {},
      "Failed to restore document"
    );
    return mapDocumentRecord(data);
  },

  /**
   * Bulk hard-delete multiple documents.
   * TODO [BACKEND REQUIRED]: POST /api/documents/bulk-delete/
   * Body: { ids: number[] }
   * — permanently delete all listed documents and their files.
   */
  async bulkDelete(documentIds: number[]): Promise<void> {
    await post<void>(
      `${API_BASE_URL}${DOCUMENTS_BULK_DELETE_PATH}`,
      { ids: documentIds },
      "Failed to bulk delete documents"
    );
  },

  /**
   * Bulk archive (soft-delete) multiple documents.
   * TODO [BACKEND REQUIRED]: POST /api/documents/bulk-archive/
   * Body: { ids: number[] }
   * — set archived=true on all listed documents.
   */
  async bulkArchive(documentIds: number[]): Promise<void> {
    await post<void>(
      `${API_BASE_URL}${DOCUMENTS_BULK_ARCHIVE_PATH}`,
      { ids: documentIds },
      "Failed to bulk archive documents"
    );
  },

  /**
   * Bulk download — returns a signed URL to a ZIP containing all selected documents.
   * TODO [BACKEND REQUIRED]: POST /api/documents/bulk-download/
   * Body: { ids: number[] }
   * — package requested files into a ZIP, return { url: string } signed download link.
   */
  async bulkDownload(documentIds: number[]): Promise<string> {
    const data = await post<{ url?: string; download_url?: string }>(
      `${API_BASE_URL}${DOCUMENTS_BULK_DOWNLOAD_PATH}`,
      { ids: documentIds },
      "Failed to prepare bulk download"
    );
    return data.download_url ?? data.url ?? "";
  },

  /**
   * Request e-signatures from a list of signers.
   * TODO [BACKEND REQUIRED]: POST /api/documents/{id}/request-signature/
   * Body: { signers: { name: string; email: string }[] }
   * — create Signer records, send signature-request emails, update
   *   signature_status to "pending".
   */
  async requestSignature(
    documentId: number | string,
    signers: { name: string; email: string }[]
  ): Promise<EmployeeDocument> {
    const data = await post<ApiDocumentRecord>(
      `${API_BASE_URL}${documentSignaturePath(documentId)}`,
      { signers },
      "Failed to request signatures"
    );
    return mapDocumentRecord(data);
  },

  /**
   * Re-send signature-request emails to all pending signers.
   * TODO [BACKEND REQUIRED]: POST /api/documents/{id}/send-reminder/
   * — no body required; triggers email reminders to all signers with status="pending".
   */
  async sendReminder(documentId: number | string): Promise<void> {
    await post<void>(
      `${API_BASE_URL}${documentReminderPath(documentId)}`,
      {},
      "Failed to send signature reminder"
    );
  },

  /**
   * Fetch the full version history for a document.
   * TODO [BACKEND REQUIRED]: GET /api/documents/{id}/versions/
   * — return paginated list of { id, version, uploaded_at, uploaded_by_name, file_size, notes }
   */
  async getVersionHistory(
    documentId: number | string
  ): Promise<DocumentVersion[]> {
    const data = await get<
      ApiDocumentVersion[] | { results?: ApiDocumentVersion[] }
    >(
      `${API_BASE_URL}${documentVersionsPath(documentId)}`,
      "Failed to fetch version history"
    );
    const rows = Array.isArray(data) ? data : (data.results ?? []);
    return rows.map(mapDocumentVersion);
  },

  /**
   * Export the document list as CSV or XLSX.
   * TODO [BACKEND REQUIRED]: GET /api/documents/export/?format=csv|xlsx
   * — return a signed download URL for the generated file.
   */
  async exportDocuments(query?: {
    category?: DocumentCategory;
    format?: "csv" | "xlsx";
  }): Promise<string> {
    const params = new URLSearchParams();
    if (query?.category) params.set("category", query.category);
    if (query?.format) params.set("format", query.format);
    const qs = params.toString();
    const url = `${API_BASE_URL}${DOCUMENTS_EXPORT_PATH}${qs ? `?${qs}` : ""}`;
    const data = await get<{ url?: string; export_url?: string }>(
      url,
      "Failed to export documents"
    );
    return data.export_url ?? data.url ?? "";
  },
};
