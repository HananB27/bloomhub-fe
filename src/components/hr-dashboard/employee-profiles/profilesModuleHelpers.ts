import {
  employeeApi,
  type EmployeeProfileChangeHistoryItem,
  type EmployeeProfileData,
} from "@/lib/api/employees";
import {
  EMPLOYEE_PERMISSIONS,
  hasPermission,
  PERMISSION_REQUIREMENTS,
} from "@/lib/api/permissions";
import { filterTrackedProfileHistoryEntries } from "@/lib/profileHistory/helpers";

export const CV_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_CV_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateCVFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension =
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx");

  if (!ALLOWED_CV_MIME_TYPES.has(file.type) && !hasValidExtension) {
    return "Only PDF, DOC, and DOCX files are supported";
  }

  if (file.size > CV_UPLOAD_MAX_BYTES) {
    return "File size must be 10MB or less";
  }

  return null;
}

export function getEmbeddedPreviewUrl(url: string, cvTitle: string): string {
  const lowerTitle = cvTitle.toLowerCase();
  const isPdfLike =
    lowerTitle.endsWith(".pdf") || url.toLowerCase().includes(".pdf");

  if (!isPdfLike) return url;

  const viewerParams =
    "navpanes=0&toolbar=1&scrollbar=1&view=FitH&pagemode=none";
  if (url.includes("#")) {
    return `${url}&${viewerParams}`;
  }
  return `${url}#${viewerParams}`;
}

export function sortCvVersionsDesc<T extends { uploaded_at: string }>(
  versions: T[]
): T[] {
  return [...versions].sort(
    (a, b) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
}

export function employeeDisplayInitials(
  firstName?: string,
  lastName?: string
): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function buildEmployeeUpdatePayload(
  selectedEmployee: EmployeeProfileData
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    first_name: selectedEmployee.first_name,
    last_name: selectedEmployee.last_name,
    email_address: selectedEmployee.email,
    phone_number: selectedEmployee.phone_number,
    address: selectedEmployee.address,
    birthday: selectedEmployee.birth_date,
    start_date: selectedEmployee.start_date,
    employment_status: selectedEmployee.employment_status,
    department: selectedEmployee.department,
    role: selectedEmployee.role?.id,
    manager_ids: selectedEmployee.manager_ids,
    managers: selectedEmployee.manager_ids,
    assigned_projects:
      selectedEmployee.assigned_projects?.map((p) => ({
        project_id: p.project_id || p.id,
        role: p.role || "",
        start_date: p.start_date || new Date().toISOString().split("T")[0],
        end_date: p.end_date || null,
        status: p.status || "active",
      })) || [],
  };

  if (selectedEmployee.career_level)
    updateData.career_level = selectedEmployee.career_level;
  if (selectedEmployee.cpf_level)
    updateData.cpf_level = selectedEmployee.cpf_level;
  if (selectedEmployee.emergency_contact_name)
    updateData.emergency_contact_name = selectedEmployee.emergency_contact_name;
  if (selectedEmployee.emergency_contact_phone)
    updateData.emergency_contact_phone =
      selectedEmployee.emergency_contact_phone;

  if (selectedEmployee.technology_tags) {
    updateData.tech_tags = selectedEmployee.technology_tags.map((t) => t.id);
  }

  return updateData;
}

export function canUploadCvForEmployee(
  permissionBits: number | bigint,
  selectedEmployeeId: number,
  currentUserId: number | null
): boolean {
  return (
    PERMISSION_REQUIREMENTS.canUploadAnyCV(permissionBits) ||
    (selectedEmployeeId === currentUserId &&
      PERMISSION_REQUIREMENTS.canUploadOwnCV(permissionBits))
  );
}

export function canViewProfileHistoryForEmployee(
  permissionBits: number | bigint,
  selectedEmployeeId: number,
  currentUserId: number | null
): boolean {
  return (
    selectedEmployeeId === currentUserId ||
    hasPermission(permissionBits, EMPLOYEE_PERMISSIONS.VIEW_AUDIT_LOG) ||
    PERMISSION_REQUIREMENTS.canViewAllProfiles(permissionBits)
  );
}

export async function fetchTrackedProfileHistory(
  employeeId: number
): Promise<EmployeeProfileChangeHistoryItem[]> {
  const history = await employeeApi.getProfileChangeHistory(employeeId);
  return filterTrackedProfileHistoryEntries(history);
}

/** Normalize user input into an absolute https URL, or null if invalid. */
export function normalizeExternalCvUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(t)
      ? t
      : `https://${t.replace(/^\/+/, "")}`;
    const u = new URL(withProtocol);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

export function validateExternalCvUrlInput(raw: string): string | null {
  const href = normalizeExternalCvUrl(raw);
  if (!href) return "Enter a valid URL (https recommended)";
  return null;
}


/** Inline PDF/file preview works; external pages (e.g. Canva) open best in a new tab. */
export function cvVersionSupportsEmbeddedPreview(cv: {
  source_type?: "file" | "external_link";
}): boolean {
  return cv.source_type !== "external_link";
}
