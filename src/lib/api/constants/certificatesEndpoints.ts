export const CERTIFICATES_API_BASE_PATH = "/api/certificates/";

export function certificateDetailPath(id: number | string): string {
  return `${CERTIFICATES_API_BASE_PATH}${id}/`;
}

export function certificateDownloadPath(id: number | string): string {
  return `${CERTIFICATES_API_BASE_PATH}${id}/download/`;
}
