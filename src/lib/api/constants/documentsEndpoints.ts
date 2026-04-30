export const DOCUMENTS_API_BASE_PATH = "/api/documents/";

export function documentDownloadPath(documentId: number | string): string {
  return `${DOCUMENTS_API_BASE_PATH}${documentId}/download/`;
}
