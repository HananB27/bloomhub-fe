import type { ProfileViewerRole } from "./atoms/RoleSwitch";

/**
 * Visibility states for a profile field/section given a viewer role.
 *  - `visible`   : render value + allow edit (per `canEdit` flag)
 *  - `partial`   : render redacted value (e.g. birthday w/o year)
 *  - `restricted`: render restricted cue (D-10) and refuse edits
 */
export type FieldVisibility = "visible" | "partial" | "restricted";

export interface ProfileFieldAccess {
  visibility: FieldVisibility;
  editable: boolean;
}

export interface ProfileViewerAccess {
  address: ProfileFieldAccess;
  birth_date: ProfileFieldAccess;
  emergency: ProfileFieldAccess;
  salary: ProfileFieldAccess;
  cpf_level: ProfileFieldAccess;
}

const HR_FULL_ACCESS: ProfileViewerAccess = {
  address: { visibility: "visible", editable: true },
  birth_date: { visibility: "visible", editable: true },
  emergency: { visibility: "visible", editable: true },
  salary: { visibility: "visible", editable: true },
  cpf_level: { visibility: "visible", editable: true },
};

const MANAGER_ACCESS: ProfileViewerAccess = {
  address: { visibility: "restricted", editable: false },
  birth_date: { visibility: "partial", editable: false },
  emergency: { visibility: "restricted", editable: false },
  salary: { visibility: "restricted", editable: false },
  cpf_level: { visibility: "visible", editable: false },
};

const EMPLOYEE_ACCESS: ProfileViewerAccess = {
  address: { visibility: "visible", editable: true },
  birth_date: { visibility: "visible", editable: true },
  emergency: { visibility: "visible", editable: true },
  salary: { visibility: "restricted", editable: false },
  cpf_level: { visibility: "visible", editable: false },
};

const ACCESS_MAP: Record<ProfileViewerRole, ProfileViewerAccess> = {
  hr: HR_FULL_ACCESS,
  manager: MANAGER_ACCESS,
  employee: EMPLOYEE_ACCESS,
};

/** Lookup the visibility profile for a given viewer role. */
export function getViewerAccess(role: ProfileViewerRole): ProfileViewerAccess {
  return ACCESS_MAP[role];
}
