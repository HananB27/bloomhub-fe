// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TemplateCategory {
  Contract = "contract",
  Policy = "policy",
  Agreement = "agreement",
  Onboarding = "onboarding",
  Compliance = "compliance",
  Training = "training",
  Benefits = "benefits",
  Other = "other",
}

export enum TemplateFieldType {
  Text = "text",
  Date = "date",
  Number = "number",
  Dropdown = "dropdown",
  Checkbox = "checkbox",
  UserSelect = "user_select",
}

export enum TemplateStatus {
  Draft = "draft",
  Published = "published",
  Inactive = "inactive",
}

export enum TemplateVisibility {
  Private = "private",
  Shared = "shared",
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TemplateField {
  id: string;
  key: string;
  label: string;
  type: TemplateFieldType;
  placeholder: string;
  required: boolean;
  defaultValue: string;
  /** Newline-separated list of options (only used when type === Dropdown) */
  options: string;
}

export interface DocumentTemplate {
  id: number | string;
  name: string;
  description: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  /**
   * Role-based access list mirroring documents. Admin always has access.
   * TODO [BACKEND REQUIRED]: GET/POST/PATCH /api/documents/templates/ — include allowed_roles
   * (DocumentAccessRole[]) on the template payload; default ["employee"] for new templates.
   */
  allowedRoles: import("@/lib/documents/documentsHelpers").DocumentAccessRole[];
  /**
   * Scope of visibility — same model as documents.
   * TODO [BACKEND REQUIRED]: GET/POST/PATCH /api/documents/templates/ — include visibility_scope
   * ("roles" | "only_me" | "project_group"); defaults to "roles" for legacy rows.
   */
  visibilityScope: import("@/lib/documents/documentVisibilityPresets").DocumentVisibilityScope;
  status: TemplateStatus;
  content: string;
  fields: TemplateField[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSystem: boolean;
}

export interface TemplatePayload {
  name: string;
  description: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  allowedRoles: import("@/lib/documents/documentsHelpers").DocumentAccessRole[];
  visibilityScope: import("@/lib/documents/documentVisibilityPresets").DocumentVisibilityScope;
  status: TemplateStatus;
  content: string;
  fields: TemplateField[];
}

export type TemplateOutputFormat = "pdf" | "docx";

export interface UseTemplatePayload {
  fieldValues: Record<string, string | boolean | number>;
  /** Output format for the generated document. Defaults to "pdf". */
  format?: TemplateOutputFormat;
}

export interface TemplateCategoryOption {
  value: TemplateCategory;
  label: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategoryOption[] = [
  {
    value: TemplateCategory.Contract,
    label: "Contract",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: TemplateCategory.Policy,
    label: "Policy",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: TemplateCategory.Agreement,
    label: "Agreement",
    color: "bg-green-100 text-green-800",
  },
  {
    value: TemplateCategory.Onboarding,
    label: "Onboarding",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: TemplateCategory.Compliance,
    label: "Compliance",
    color: "bg-red-100 text-red-800",
  },
  {
    value: TemplateCategory.Training,
    label: "Training",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    value: TemplateCategory.Benefits,
    label: "Benefits",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    value: TemplateCategory.Other,
    label: "Other",
    color: "bg-gray-100 text-gray-700",
  },
];

export const TEMPLATE_FIELD_TYPE_LABELS: Record<TemplateFieldType, string> = {
  [TemplateFieldType.Text]: "Text",
  [TemplateFieldType.Date]: "Date",
  [TemplateFieldType.Number]: "Number",
  [TemplateFieldType.Dropdown]: "Dropdown",
  [TemplateFieldType.Checkbox]: "Checkbox",
  [TemplateFieldType.UserSelect]: "User Select",
};

export const FIELD_TYPE_OPTIONS: { value: TemplateFieldType; label: string }[] =
  Object.values(TemplateFieldType).map((v) => ({
    value: v,
    label: TEMPLATE_FIELD_TYPE_LABELS[v],
  }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse placeholder patterns from HTML content.
 * Recognises:
 *   1. <span data-field-key="k">{{Label}}</span>
 *   2. Plain {{Label}} anywhere in the string
 */
export function extractPlaceholders(
  html: string
): Array<{ key: string; label: string }> {
  const results: Array<{ key: string; label: string }> = [];
  const seen = new Set<string>();

  // Pattern 1: <span data-field-key="k">{{Label}}</span>
  const spanRe =
    /data-field-key="([^"]+)"[^>]*>\s*\{\{([^}]+)\}\}\s*<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = spanRe.exec(html)) !== null) {
    const key = m[1];
    const label = m[2].trim();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ key, label });
    }
  }

  // Pattern 2: plain {{Label}} not inside a span with data-field-key
  const plainRe = /\{\{([^}]+)\}\}/g;
  while ((m = plainRe.exec(html)) !== null) {
    const label = m[1].trim();
    const key = labelToKey(label);
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ key, label });
    }
  }

  return results;
}

/** Convert "Employee Name" → "employee_name" */
export function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function getTemplateCategoryColor(cat: TemplateCategory): string {
  return (
    TEMPLATE_CATEGORIES.find((c) => c.value === cat)?.color ??
    "bg-gray-100 text-gray-700"
  );
}

export function getTemplateCategoryLabel(cat: TemplateCategory): string {
  return TEMPLATE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function generateFieldId(): string {
  return String(Date.now() + Math.random());
}

export function humanizePlaceholderInnerToLabel(innerTrimmed: string): string {
  const parts = innerTrimmed.split("_").filter(Boolean);
  if (parts.length <= 1) {
    const w = innerTrimmed;
    if (!w) return "";
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function displayLabelForPlaceholder(p: {
  key: string;
  label: string;
}): string {
  const raw = p.label.trim();
  if (!raw) return p.key;
  if (raw.includes(" ") || raw.includes("-")) return raw;
  if (raw.includes("_")) return humanizePlaceholderInnerToLabel(raw);
  return raw;
}

export function mergeTemplateFieldsFromPlaceholders(
  existing: TemplateField[],
  html: string
): TemplateField[] {
  const placeholders = extractPlaceholders(html);
  const existingKeys = new Set(existing.map((f) => f.key));
  const additions: TemplateField[] = [];
  for (const p of placeholders) {
    if (!existingKeys.has(p.key)) {
      existingKeys.add(p.key);
      additions.push({
        id: generateFieldId(),
        key: p.key,
        label: displayLabelForPlaceholder(p),
        type: TemplateFieldType.Text,
        placeholder: "",
        required: false,
        defaultValue: "",
        options: "",
      });
    }
  }
  return additions.length > 0 ? [...existing, ...additions] : existing;
}
