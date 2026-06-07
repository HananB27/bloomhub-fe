export const CERTIFICATES_API_BASE_PATH = "/api/certificates/";

function certificatePath(id: number | string): string {
  return `${CERTIFICATES_API_BASE_PATH}${id}/`;
}

export function certificateDetailPath(id: number | string): string {
  return certificatePath(id);
}

export function certificateDownloadPath(id: number | string): string {
  return `${certificatePath(id)}download/`;
}
