export enum DocumentCategory {
  Contracts = "contracts",
  Policies = "policies",
  Agreements = "agreements",
  Compliance = "compliance",
  Onboarding = "onboarding",
  Training = "training",
  Benefits = "benefits",
  Other = "other",
}

export enum SignatureStatus {
  Pending = "pending",
  Signed = "signed",
  Rejected = "rejected",
  Expired = "expired",
  NotRequired = "not_required",
}

export enum DocumentType {
  Pdf = "pdf",
  Doc = "doc",
  Docx = "docx",
  Txt = "txt",
  Image = "image",
  Other = "other",
}

export enum DocumentAccessRole {
  Employee = "employee",
  Hr = "hr",
  Admin = "admin",
}

export interface DocumentCategoryOption {
  value: DocumentCategory;
  label: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategoryOption[] = [
  { value: DocumentCategory.Contracts, label: "Contracts" },
  { value: DocumentCategory.Policies, label: "Policies" },
  { value: DocumentCategory.Agreements, label: "Agreements" },
  { value: DocumentCategory.Compliance, label: "Compliance" },
  { value: DocumentCategory.Onboarding, label: "Onboarding" },
  { value: DocumentCategory.Training, label: "Training" },
  { value: DocumentCategory.Benefits, label: "Benefits" },
  { value: DocumentCategory.Other, label: "Other" },
];

export const ALL_CATEGORIES_FILTER = "all";
export const EXPIRY_FILTER_EXPIRING_SOON = "expiring_soon";
export const EXPIRY_FILTER_EXPIRED = "expired";

export enum DocumentsListSource {
  Upload = "upload",
  Template = "template",
}

export type DocumentExpiryBucket = "ok" | "soon" | "expired" | "none";

export function documentDaysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / 86_400_000);
}

export function documentExpiryBucket(
  iso?: string | null
): DocumentExpiryBucket {
  const d = documentDaysUntil(iso);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= 30) return "soon";
  return "ok";
}

export interface SessionUserRoleFlags {
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface FilterableDocument {
  name: string;
  description: string;
  tags: string[];
  category: DocumentCategory;
  signatureStatus: SignatureStatus;
  expiryDate?: string;
}

export function inferDocumentType(fileName: string): DocumentType {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return DocumentType.Pdf;
  if (extension === "doc") return DocumentType.Doc;
  if (extension === "docx") return DocumentType.Docx;
  if (extension === "txt") return DocumentType.Txt;
  if (["png", "jpg", "jpeg", "webp"].includes(extension ?? "")) {
    return DocumentType.Image;
  }
  return DocumentType.Other;
}

export function formatFileSizeMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function parseDocumentTags(rawTags: string): string[] {
  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizeCategoryFilter(
  category: string
): DocumentCategory | undefined {
  if (category === ALL_CATEGORIES_FILTER || !category) {
    return undefined;
  }
  if ((Object.values(DocumentCategory) as string[]).includes(category)) {
    return category as DocumentCategory;
  }
  return undefined;
}

export function hasDocumentAccess(
  allowedRoles: DocumentAccessRole[],
  userRole: DocumentAccessRole
): boolean {
  if (allowedRoles.length === 0) return true;
  if (allowedRoles.includes(DocumentAccessRole.Employee)) return true;
  if (userRole === DocumentAccessRole.Admin) return true;
  return allowedRoles.includes(userRole);
}

export function getDocumentUserRole(
  user?: SessionUserRoleFlags
): DocumentAccessRole {
  if (user?.is_superuser) return DocumentAccessRole.Admin;
  if (user?.is_staff) return DocumentAccessRole.Hr;
  return DocumentAccessRole.Employee;
}

export function isHrDocumentUser(user?: SessionUserRoleFlags): boolean {
  return getDocumentUserRole(user) !== DocumentAccessRole.Employee;
}

export function normalizeAllowedRoles(
  allowedRoles: DocumentAccessRole[]
): DocumentAccessRole[] {
  if (allowedRoles.length === 0) return [DocumentAccessRole.Employee];
  return allowedRoles;
}

export function filterDocumentsByAccess<
  T extends { allowedRoles: DocumentAccessRole[] },
>(documents: T[], userRole: DocumentAccessRole): T[] {
  return documents.filter((document) =>
    hasDocumentAccess(normalizeAllowedRoles(document.allowedRoles), userRole)
  );
}

// ─── File display type ───────────────────────────────────────────────────────

/**
 * Visual file-type category used by FileTile and document list UI.
 * Derived from MIME type or file extension — not stored on the backend.
 */
export type DocumentFileDisplayType = "pdf" | "doc" | "img" | "file";

/**
 * Derive the UI display category from a MIME type and/or filename extension.
 * Used in mapDocumentRecord to populate EmployeeDocument.fileType.
 */
export function getFileDisplayType(
  mimeType: string,
  fileName: string
): DocumentFileDisplayType {
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf"))
    return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType === "text/plain" ||
    fileName.toLowerCase().endsWith(".doc") ||
    fileName.toLowerCase().endsWith(".docx") ||
    fileName.toLowerCase().endsWith(".txt")
  )
    return "doc";
  if (mimeType.startsWith("image/")) return "img";
  return "file";
}

export enum DocumentInlinePreviewPresentation {
  BrowserIframe = "browserIframe",
  OfficeOnlineEmbed = "officeOnlineEmbed",
  PdfObject = "pdfObject",
  Image = "image",
}

export const OFFICE_ONLINE_PREVIEW_EMBED_BASE =
  "https://view.officeapps.live.com/op/embed.aspx?src=" as const;

export function documentInlinePreviewPresentation(
  mimeType: string,
  fileName: string,
  signedUrl: string
): { presentation: DocumentInlinePreviewPresentation; embedSrc: string } {
  const nameLower = fileName.toLowerCase();
  const mimeLower = mimeType.toLowerCase();
  const officeByMime =
    mimeLower.includes("wordprocessingml") ||
    mimeLower.includes("msword") ||
    mimeLower.includes("spreadsheetml") ||
    mimeLower.includes("ms-excel") ||
    mimeLower.includes("excel") ||
    mimeLower.includes("presentationml") ||
    mimeLower.includes("powerpoint") ||
    mimeLower.includes("officedocument");
  const officeByName = /\.(docx?|xlsx?|pptx?)$/.test(nameLower);
  if (officeByMime || officeByName) {
    return {
      presentation: DocumentInlinePreviewPresentation.OfficeOnlineEmbed,
      embedSrc: `${OFFICE_ONLINE_PREVIEW_EMBED_BASE}${encodeURIComponent(signedUrl)}`,
    };
  }
  if (
    mimeLower.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(nameLower)
  ) {
    return {
      presentation: DocumentInlinePreviewPresentation.Image,
      embedSrc: signedUrl,
    };
  }
  if (mimeLower === "application/pdf" || nameLower.endsWith(".pdf")) {
    return {
      presentation: DocumentInlinePreviewPresentation.PdfObject,
      embedSrc: signedUrl,
    };
  }
  return {
    presentation: DocumentInlinePreviewPresentation.BrowserIframe,
    embedSrc: signedUrl,
  };
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

/**
 * Derive allowed_roles from isConfidential toggle.
 * Confidential documents are restricted to HR + Admin;
 * non-confidential documents are visible to all employees.
 */
export function buildDocumentAllowedRoles(
  isConfidential: boolean
): DocumentAccessRole[] {
  if (isConfidential) return [DocumentAccessRole.Hr, DocumentAccessRole.Admin];
  return [DocumentAccessRole.Employee];
}

export function filterDocumentsByUiFilters<T extends FilterableDocument>(
  documents: T[],
  filters: {
    searchTerm: string;
    categoryFilter: string;
    statusFilter: string;
    expiryFilter: string;
  }
): T[] {
  const normalizedSearchTerm = filters.searchTerm.toLowerCase();

  return documents.filter((document) => {
    const matchesSearch =
      document.name.toLowerCase().includes(normalizedSearchTerm) ||
      document.description.toLowerCase().includes(normalizedSearchTerm) ||
      document.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedSearchTerm)
      );
    const matchesCategory =
      filters.categoryFilter === ALL_CATEGORIES_FILTER ||
      document.category === filters.categoryFilter;
    const matchesStatus =
      filters.statusFilter === ALL_CATEGORIES_FILTER ||
      document.signatureStatus === filters.statusFilter;

    let matchesExpiry = true;
    if (
      filters.expiryFilter === EXPIRY_FILTER_EXPIRING_SOON &&
      document.expiryDate
    ) {
      const expiryDate = new Date(document.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      matchesExpiry = expiryDate <= thirtyDaysFromNow;
    } else if (
      filters.expiryFilter === EXPIRY_FILTER_EXPIRED &&
      document.expiryDate
    ) {
      const expiryDate = new Date(document.expiryDate);
      matchesExpiry = expiryDate < new Date();
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesExpiry;
  });
}
