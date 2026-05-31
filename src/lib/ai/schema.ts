import type { JsonValue } from "@/lib/api/aiChat";

export function humanizeKey(key: string): string {
  return key
    .replace(/_ids?$/i, (m) => (m.toLowerCase() === "_ids" ? "" : ""))
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function diffArguments(
  proposed: Record<string, JsonValue> | undefined,
  edited: Record<string, JsonValue> | undefined
): Record<string, JsonValue> {
  if (!edited) return {};
  const base = proposed ?? {};
  const out: Record<string, JsonValue> = {};
  for (const [k, v] of Object.entries(edited)) {
    if (!shallowEqual(base[k], v)) out[k] = v;
  }
  return out;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => shallowEqual(x, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => shallowEqual(a[k], b[k]));
  }
  return false;
}

function isDateField(
  key: string,
  schemaProp: Record<string, JsonValue> | undefined
): boolean {
  return (
    schemaProp?.format === "date" ||
    /(_date|_at|date_from|date_to|start_date|end_date)$/i.test(key)
  );
}

function normalizeDateValue(value: JsonValue): JsonValue {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const localDate = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/.exec(trimmed);
  if (!localDate) return value;

  const [, day, month, year] = localDate;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function normalizeFormDataForSchema(
  data: Record<string, JsonValue>,
  schema: Record<string, JsonValue> | undefined
): Record<string, JsonValue> {
  const props =
    schema &&
    typeof schema.properties === "object" &&
    schema.properties !== null
      ? (schema.properties as Record<string, Record<string, JsonValue>>)
      : {};

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      isDateField(key, props[key]) ? normalizeDateValue(value) : value,
    ])
  );
}

export type RelationKind =
  | "permission_ids"
  | "employee_id"
  | "employee_ids"
  | "project_id"
  | "template_id"
  | "role_id"
  | "asset_id"
  | "leave_type"
  | null;

// Heuristic: identify relational field by key + schema hints.
export function detectRelationKind(
  key: string,
  schemaProp: Record<string, JsonValue> | undefined
): RelationKind {
  const k = key.toLowerCase();
  if (k === "permission_ids") return "permission_ids";
  if (k === "covering_employee_id" || k === "employee_id" || k === "manager_id")
    return "employee_id";
  if (k === "employee_ids") return "employee_ids";
  if (k === "project_id") return "project_id";
  if (k === "template_id") return "template_id";
  if (k === "role_id") return "role_id";
  if (k === "asset_id") return "asset_id";
  if (
    k === "leave_type" &&
    schemaProp &&
    !(schemaProp as { enum?: unknown }).enum
  )
    return "leave_type";
  return null;
}
