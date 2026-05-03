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
