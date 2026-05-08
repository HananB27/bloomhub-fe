import { DocumentAccessRole, DocumentCategory } from "./documentsHelpers";

export type DocumentVisibilityScope = "roles" | "only_me" | "project_group";

export type DocumentVisibilityPreset =
  | "only_me"
  | "project_group"
  | "everyone"
  | "managers_and_above"
  | "hr_and_above"
  | "admin_only"
  | "custom";

export interface DocumentVisibilitySettings {
  preset: DocumentVisibilityPreset;
  scope: DocumentVisibilityScope;
  /**
   * Roles persisted in `allowed_roles`. Only consulted when `scope === "roles"`.
   * Admin has implicit access and is intentionally omitted from named presets.
   */
  allowedRoles: DocumentAccessRole[];
}

interface DocumentVisibilityPresetDefinition {
  label: string;
  description: string;
  scope: DocumentVisibilityScope;
  roles: DocumentAccessRole[];
}

export const DOCUMENT_VISIBILITY_PRESETS: Record<
  DocumentVisibilityPreset,
  DocumentVisibilityPresetDefinition
> = {
  only_me: {
    label: "Only me",
    description: "Visible only to you (and system admins).",
    scope: "only_me",
    roles: [],
  },
  project_group: {
    label: "My project group",
    description: "Visible to members of your project (and system admins).",
    scope: "project_group",
    roles: [],
  },
  everyone: {
    label: "Everyone",
    description: "Visible to all employees, managers, and HR.",
    scope: "roles",
    roles: [DocumentAccessRole.Employee],
  },
  managers_and_above: {
    label: "Managers & above",
    description:
      "Visible to managers and HR. Hidden from individual contributors.",
    scope: "roles",
    roles: [DocumentAccessRole.Manager],
  },
  hr_and_above: {
    label: "HR & above",
    description: "Visible to HR only.",
    scope: "roles",
    roles: [DocumentAccessRole.Hr],
  },
  admin_only: {
    label: "Admins only",
    description: "Visible to system administrators only.",
    scope: "roles",
    roles: [DocumentAccessRole.Admin],
  },
  custom: {
    label: "Custom…",
    description: "Pick any combination of roles.",
    scope: "roles",
    roles: [],
  },
};

export const ORDERED_DOCUMENT_VISIBILITY_PRESETS: DocumentVisibilityPreset[] = [
  "only_me",
  "project_group",
  "everyone",
  "managers_and_above",
  "hr_and_above",
  "admin_only",
  "custom",
];

const ROLE_NAMED_PRESETS: DocumentVisibilityPreset[] = [
  "everyone",
  "managers_and_above",
  "hr_and_above",
  "admin_only",
];

export const DEFAULT_VISIBILITY_SETTINGS: DocumentVisibilitySettings = {
  preset: "everyone",
  scope: "roles",
  allowedRoles: [DocumentAccessRole.Employee],
};

function rolesEqual(a: DocumentAccessRole[], b: DocumentAccessRole[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((role, index) => role === sortedB[index]);
}

/**
 * Reverse lookup: map a (scope, allowedRoles) pair to the matching named preset
 * or `"custom"` if it does not match any.
 */
export function presetFromVisibility(
  scope: DocumentVisibilityScope,
  allowedRoles: DocumentAccessRole[]
): DocumentVisibilityPreset {
  if (scope === "only_me") return "only_me";
  if (scope === "project_group") return "project_group";
  for (const preset of ROLE_NAMED_PRESETS) {
    if (rolesEqual(DOCUMENT_VISIBILITY_PRESETS[preset].roles, allowedRoles)) {
      return preset;
    }
  }
  return "custom";
}

export function visibilityFromPreset(
  preset: DocumentVisibilityPreset,
  customRoles?: DocumentAccessRole[]
): DocumentVisibilitySettings {
  if (preset === "custom") {
    const roles =
      customRoles && customRoles.length > 0
        ? customRoles
        : [DocumentAccessRole.Employee];
    return { preset: "custom", scope: "roles", allowedRoles: roles };
  }
  const definition = DOCUMENT_VISIBILITY_PRESETS[preset];
  return {
    preset,
    scope: definition.scope,
    allowedRoles: [...definition.roles],
  };
}

/**
 * Sensible per-category defaults. Frontend uses these to prefill the
 * visibility selector when a category is chosen.
 *
 * TODO [BACKEND REQUIRED]: GET /api/documents/category-defaults/ — replace
 * this static map with a server-fetched one once the endpoint exists.
 */
export const DOCUMENT_CATEGORY_DEFAULT_PRESET: Record<
  DocumentCategory,
  DocumentVisibilityPreset
> = {
  [DocumentCategory.Contracts]: "hr_and_above",
  [DocumentCategory.Compliance]: "hr_and_above",
  [DocumentCategory.Agreements]: "hr_and_above",
  [DocumentCategory.Policies]: "everyone",
  [DocumentCategory.Onboarding]: "everyone",
  [DocumentCategory.Training]: "everyone",
  [DocumentCategory.Benefits]: "everyone",
  [DocumentCategory.Other]: "everyone",
};
