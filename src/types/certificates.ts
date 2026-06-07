/**
 * Certificate record uploaded by an employee or HR.
 */
export interface Certificate {
  id: number;
  employeeId: number;
  employeeName: string;
  title: string;
  issuer?: string;
  issuedDate: string;
  expirationDate?: string;
  isExpired: boolean;
  fileUrl?: string;
  createdAt: string;
  updatedAt?: string;
}


export interface CreateCertificatePayload {
  title: string;
  file: File;
  issuedDate: string;
  expirationDate?: string;
  issuer?: string;
  employeeId?: number;
}

export const CERTIFICATE_MAX_FILE_MB = 10;

export const CERTIFICATE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
] as const;

export const CERTIFICATE_ACCEPT_ATTR =
  ".pdf,image/png,image/jpeg,image/gif,image/webp";
