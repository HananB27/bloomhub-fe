/**
 * HR Employee Profiles — bundled routes (align with BloomHub BE).
 *
 * **Page bundle** — `GET /api/employees/profile-page-bundle/` (no `{id}`).
 * Shape: `permissions` / `permission_bits`, `employees: { results, count }`, `lookups`:
 * departments, roles, projects, managers, `cpf_levels` (global list). Bitmask semantics match
 * `/api/auth/permissions/`. **Fallback:** 404 → legacy multi-request load.
 *
 * **Modal bundle** — `GET /api/employees/{profileId}/profile-modal-bundle/`
 * Optional query: `sections=employee,cvs,lookups,cpf_levels` (comma-separated; omit = all).
 * Response keys depend on `sections`. May include **ETag**; clients may send **If-None-Match** → 304.
 * **Fallback:** 404 → parallel calls (employee + CVs + lookups + cpf-by-role).
 *
 * **CVs** — `GET|POST /api/employees/{profileId}/cvs/`, file upload multipart `file`,
 * link POST JSON `{ source_type, provider, external_url, file_name? }`,
 * `GET .../cvs/{cvId}/download/` → file rows `{ signed_url | ... }`, external rows `{ url }`.
 */

export const HR_PROFILES_PAGE_BUNDLE_PATH =
  "/api/employees/profile-page-bundle/";

export const HR_EMPLOYEE_PROFILE_MODAL_BUNDLE_SEGMENT = "profile-modal-bundle";

/** Query `sections` values accepted by the modal bundle endpoint (comma-separated). */
export const PROFILE_MODAL_BUNDLE_SECTIONS = [
  "employee",
  "cvs",
  "lookups",
  "cpf_levels",
] as const;

export type ProfileModalBundleSection =
  (typeof PROFILE_MODAL_BUNDLE_SECTIONS)[number];

export function hrEmployeeProfileModalBundlePath(
  employeeId: number | string,
  query?: { sections?: readonly ProfileModalBundleSection[] }
): string {
  const base = `/api/employees/${employeeId}/${HR_EMPLOYEE_PROFILE_MODAL_BUNDLE_SEGMENT}/`;
  if (!query?.sections?.length) return base;
  const qs = new URLSearchParams({
    sections: query.sections.join(","),
  }).toString();
  return `${base}?${qs}`;
}
