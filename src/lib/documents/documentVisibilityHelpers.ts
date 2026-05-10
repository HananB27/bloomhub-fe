import {
  DocumentAccessRole,
  DOCUMENT_ACCESS_ROLE_LABELS,
} from "./documentsHelpers";
import {
  DOCUMENT_VISIBILITY_PRESETS,
  DocumentVisibilityScope,
  presetFromVisibility,
} from "./documentVisibilityPresets";

export const DOCUMENT_VISIBILITY_DIALOG_TITLE = "Edit visibility" as const;
export const DOCUMENT_VISIBILITY_DIALOG_DESCRIPTION_PREFIX =
  "Choose who can see" as const;
export const DOCUMENT_VISIBILITY_DIALOG_DESCRIPTION_FALLBACK =
  "this document" as const;

export const VISIBILITY_BADGE_TOOLTIP_PREFIX = "Visible to" as const;
export const VISIBILITY_BADGE_ADMIN_NOTE = "(Admins always)" as const;
export const VISIBILITY_BADGE_ONLY_ME_LABEL = "Only you" as const;
export const VISIBILITY_BADGE_PROJECT_GROUP_LABEL =
  "Your project group" as const;

export const CUSTOM_PRESET_HELPER_TEXT =
  "Admins always have access. Pick any combination below." as const;

export function documentVisibilityLabel(
  scope: DocumentVisibilityScope,
  allowedRoles: DocumentAccessRole[]
): string {
  const preset = presetFromVisibility(scope, allowedRoles);
  if (preset === "custom") {
    if (allowedRoles.length === 0) return "Custom";
    return allowedRoles
      .map((role) => DOCUMENT_ACCESS_ROLE_LABELS[role])
      .join(", ");
  }
  return DOCUMENT_VISIBILITY_PRESETS[preset].label;
}

export function documentVisibilityTooltip(
  scope: DocumentVisibilityScope,
  allowedRoles: DocumentAccessRole[]
): string {
  if (scope === "only_me") {
    return `${VISIBILITY_BADGE_TOOLTIP_PREFIX}: ${VISIBILITY_BADGE_ONLY_ME_LABEL}`;
  }
  if (scope === "project_group") {
    return `${VISIBILITY_BADGE_TOOLTIP_PREFIX}: ${VISIBILITY_BADGE_PROJECT_GROUP_LABEL}`;
  }
  if (allowedRoles.length === 0) {
    return `${VISIBILITY_BADGE_TOOLTIP_PREFIX}: Admins only`;
  }
  const roleList = allowedRoles
    .map((role) => DOCUMENT_ACCESS_ROLE_LABELS[role])
    .join(", ");
  return `${VISIBILITY_BADGE_TOOLTIP_PREFIX}: ${roleList} ${VISIBILITY_BADGE_ADMIN_NOTE}`;
}

/**
 * A document/template is "restricted" when not visible to all employees.
 * Drives the lock badge in list/detail views.
 */
export function isRestrictedVisibility(
  scope: DocumentVisibilityScope,
  allowedRoles: DocumentAccessRole[]
): boolean {
  if (scope !== "roles") return true;
  return !allowedRoles.includes(DocumentAccessRole.Employee);
}
