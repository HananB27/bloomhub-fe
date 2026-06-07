export const DOCUMENTS_API_BASE_PATH = "/api/documents/";

// ─── Single-document paths ────────────────────────────────────────────────────

function documentPath(documentId: number | string, suffix: string): string {
  return `${DOCUMENTS_API_BASE_PATH}${documentId}/${suffix}`;
}

export function documentDownloadPath(documentId: number | string): string {
  return documentPath(documentId, "download/");
}

export function documentPreviewPath(documentId: number | string): string {
  // TODO [BACKEND REQUIRED]: GET /api/documents/{id}/preview/ — return a short-lived signed preview URL
  return documentPath(documentId, "preview/");
}

export function documentArchivePath(documentId: number | string): string {
  // TODO [BACKEND REQUIRED]: POST /api/documents/{id}/archive/ — soft-delete (archive) a document
  return documentPath(documentId, "archive/");
}

export function documentUnarchivePath(documentId: number | string): string {
  return documentPath(documentId, "unarchive/");
}

export function documentVersionsPath(documentId: number | string): string {
  // TODO [BACKEND REQUIRED]: GET /api/documents/{id}/versions/ — return full version history array
  return documentPath(documentId, "versions/");
}

export function documentSignaturePath(documentId: number | string): string {
  // TODO [BACKEND REQUIRED]: POST /api/documents/{id}/request-signature/ — initiate signature workflow
  return documentPath(documentId, "request-signature/");
}

export function documentSignPath(documentId: number | string): string {
  return documentPath(documentId, "sign/");
}

export function documentSignaturesPath(documentId: number | string): string {
  return documentPath(documentId, "signatures/");
}

export function documentResetSignaturesPath(
  documentId: number | string
): string {
  // POST /api/documents/{id}/reset-signatures/ — clears all signers (testing helper)
  return documentPath(documentId, "reset-signatures/");
}

export function documentReminderPath(documentId: number | string): string {
  // TODO [BACKEND REQUIRED]: POST /api/documents/{id}/send-reminder/ — re-send signature requests to pending signers
  return documentPath(documentId, "send-reminder/");
}

export function documentVisibilityPath(documentId: number | string): string {
  // TODO [BACKEND REQUIRED]: PATCH /api/documents/{id}/visibility/ — update allowed_roles + visibility_scope (HR/Admin only)
  return documentPath(documentId, "visibility/");
}

// ─── Bulk operation paths ─────────────────────────────────────────────────────

// TODO [BACKEND REQUIRED]: POST /api/documents/bulk-delete/ — permanently delete multiple documents by id[]
export const DOCUMENTS_BULK_DELETE_PATH = `${DOCUMENTS_API_BASE_PATH}bulk-delete/`;

// TODO [BACKEND REQUIRED]: POST /api/documents/bulk-archive/ — soft-delete multiple documents by id[]
export const DOCUMENTS_BULK_ARCHIVE_PATH = `${DOCUMENTS_API_BASE_PATH}bulk-archive/`;

// TODO [BACKEND REQUIRED]: POST /api/documents/bulk-download/ — return a signed ZIP download URL for multiple documents
export const DOCUMENTS_BULK_DOWNLOAD_PATH = `${DOCUMENTS_API_BASE_PATH}bulk-download/`;

// ─── Collection paths ─────────────────────────────────────────────────────────

// TODO [BACKEND REQUIRED]: GET /api/documents/export/?format=csv|xlsx — export filtered document list
export const DOCUMENTS_EXPORT_PATH = `${DOCUMENTS_API_BASE_PATH}export/`;
