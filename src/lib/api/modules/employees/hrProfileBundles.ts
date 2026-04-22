import { API_BASE_URL } from "../../../config";
import { getStoredUser } from "../../tokens";
import {
  getAllow404,
  getJsonWithRevalidation,
  handleListResponse,
} from "../../helpers/httpClient";
import {
  transformEmployeeData,
  transformEmployeeList,
  type EmployeeProfileData,
} from "../../helpers/transformers";
import {
  HR_PROFILES_PAGE_BUNDLE_PATH,
  hrEmployeeProfileModalBundlePath,
  type ProfileModalBundleSection,
} from "../../constants/hrEmployeeProfilesEndpoints";
import type { EmployeeCVVersion } from "../employee-cvs";
import { mapCvVersionRecord } from "../employee-cvs";
import type { Manager } from "../managers";

export interface EmployeeProfileModalBundleApplied {
  employee: EmployeeProfileData;
  cvVersions: EmployeeCVVersion[];
  departments: string[];
  roles: { id: number; name: string }[];
  projects: {
    id: number;
    name: string;
    leaders?: { id: number; name: string }[];
  }[];
  managers: Manager[];
  cpfLevelsForRole: string[];
}

export interface HrProfilesPageBundleApplied {
  /** Safe `number`, or `bigint` when the bitmap exceeds MAX_SAFE_INTEGER (JSON). */
  permissionBits: number | bigint | null;
  employees: EmployeeProfileData[];
  employeeCount: number;
  departments: string[];
  roles: { id: number; name: string }[];
  projects: {
    id: number;
    name: string;
    leaders?: { id: number; name: string }[];
  }[];
  managers: Manager[];
  cpfLevels: string[];
}

/** LSB = last character (standard bit 0 = 2^0). */
function binaryPermissionsBitmapToBigInt(bin: string): bigint | null {
  if (!/^[01]+$/.test(bin)) return null;
  let v = BigInt(0);
  for (let i = 0; i < bin.length; i++) {
    const ch = bin[bin.length - 1 - i];
    if (ch === "1") v |= BigInt(1) << BigInt(i);
  }
  return v;
}

/**
 * Root-level permission integers from JSON often exceed Number.MAX_SAFE_INTEGER; those are not
 * usable for bitwise checks. Prefer decimal strings, safe numbers, or a binary `permissions_bitmap` string.
 */
function pickRootPermissionBits(
  raw: Record<string, unknown>
): number | bigint | null {
  const decKeys = ["permissions", "permission_bits"] as const;
  for (const key of decKeys) {
    const v = raw[key];
    if (typeof v === "string" && /^\d+$/.test(v)) {
      try {
        return BigInt(v);
      } catch {
        /* continue */
      }
    }
    if (
      typeof v === "number" &&
      Number.isFinite(v) &&
      Number.isSafeInteger(v)
    ) {
      return v;
    }
  }

  const bm = raw.permissions_bitmap;
  if (typeof bm === "string" && /^[01]+$/.test(bm) && bm.length >= 8) {
    return binaryPermissionsBitmapToBigInt(bm);
  }
  if (
    typeof bm === "number" &&
    Number.isFinite(bm) &&
    Number.isSafeInteger(bm)
  ) {
    return bm;
  }
  return null;
}

function rawEmployeeRowsFromBundle(raw: Record<string, unknown>): unknown[] {
  const empPayload = raw.employees ?? raw.results;
  if (Array.isArray(empPayload)) return empPayload;
  if (empPayload && typeof empPayload === "object") {
    const r = (empPayload as Record<string, unknown>).results;
    if (Array.isArray(r)) return r;
  }
  return [];
}

/** When root metadata is an oversized float, use the logged-in row's binary `permissions_bitmap`. */
function extractPermissionBitsFromCurrentEmployeeRow(
  raw: Record<string, unknown>
): bigint | null {
  const user = getStoredUser();
  const uid =
    user && typeof user.id === "number" && Number.isFinite(user.id)
      ? user.id
      : null;
  if (uid === null) return null;

  for (const row of rawEmployeeRowsFromBundle(raw)) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (Number(o.id) !== uid) continue;
    const bin = o.permissions_bitmap;
    if (typeof bin === "string") {
      return binaryPermissionsBitmapToBigInt(bin);
    }
    break;
  }
  return null;
}

function pickPermissionBitsForPageBundle(
  raw: Record<string, unknown>
): number | bigint | null {
  const root = pickRootPermissionBits(raw);
  if (root !== null) return root;
  return extractPermissionBitsFromCurrentEmployeeRow(raw);
}

function parseDepartmentList(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((x): x is string => typeof x === "string");
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const inner = o.departments ?? o.results ?? [];
    if (Array.isArray(inner))
      return inner.filter((x): x is string => typeof x === "string");
  }
  return [];
}

function parseRoles(raw: unknown): { id: number; name: string }[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).roles ??
        (raw as Record<string, unknown>).results ??
        [])
      : [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const o = r as Record<string, unknown>;
      const id = Number(o.id);
      const name = typeof o.name === "string" ? o.name : "";
      if (!Number.isFinite(id)) return null;
      return { id, name };
    })
    .filter((x): x is { id: number; name: string } => x !== null);
}

function parseProjects(raw: unknown): {
  id: number;
  name: string;
  leaders?: { id: number; name: string }[];
}[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).projects ??
        (raw as Record<string, unknown>).results ??
        [])
      : [];
  if (!Array.isArray(arr)) return [];
  return arr as {
    id: number;
    name: string;
    leaders?: { id: number; name: string }[];
  }[];
}

function parseManagers(raw: unknown): Manager[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).managers ??
        (raw as Record<string, unknown>).results ??
        [])
      : [];
  if (!Array.isArray(arr)) return [];
  return arr as Manager[];
}

function parseCvList(raw: unknown): EmployeeCVVersion[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).cv_versions ??
        (raw as Record<string, unknown>).cvs ??
        (raw as Record<string, unknown>).results ??
        [])
      : [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) =>
      item && typeof item === "object"
        ? mapCvVersionRecord(item as Record<string, unknown>)
        : null
    )
    .filter((x): x is EmployeeCVVersion => x !== null);
}

export function normalizeEmployeeProfileModalBundle(
  raw: Record<string, unknown>
): EmployeeProfileModalBundleApplied | null {
  const empRaw = raw.employee ?? raw.profile;
  if (!empRaw || typeof empRaw !== "object") return null;

  const employee = transformEmployeeData(empRaw as Record<string, unknown>);
  const cvVersions = parseCvList(raw.cv_versions ?? raw.cvs ?? []);

  const lookups =
    raw.lookups && typeof raw.lookups === "object"
      ? (raw.lookups as Record<string, unknown>)
      : raw;

  const departments = parseDepartmentList(
    lookups.departments ?? raw.departments
  );
  const roles = parseRoles(lookups.roles ?? raw.roles);
  const projects = parseProjects(lookups.projects ?? raw.projects);
  const managers = parseManagers(lookups.managers ?? raw.managers);

  const cpfRaw =
    raw.cpf_levels_for_role ??
    raw.cpf_levels ??
    lookups.cpf_levels_for_role ??
    lookups.cpf_levels;
  const cpfLevelsForRole = Array.isArray(cpfRaw)
    ? (cpfRaw as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  return {
    employee,
    cvVersions,
    departments,
    roles,
    projects,
    managers,
    cpfLevelsForRole,
  };
}

export function normalizeHrProfilesPageBundle(
  raw: Record<string, unknown>
): HrProfilesPageBundleApplied | null {
  const empPayload = raw.employees ?? raw.results;
  if (empPayload === undefined && !Array.isArray(raw)) return null;

  const listSource =
    empPayload !== undefined ? empPayload : Array.isArray(raw) ? raw : null;
  if (listSource === null) return null;

  const { results, count } = handleListResponse<EmployeeProfileData>(
    listSource as
      | EmployeeProfileData[]
      | { results?: EmployeeProfileData[]; count?: number }
  );
  const employees = transformEmployeeList(results);

  const lookups =
    raw.lookups && typeof raw.lookups === "object"
      ? (raw.lookups as Record<string, unknown>)
      : raw;

  const departments = parseDepartmentList(
    lookups.departments ?? raw.departments
  );
  const roles = parseRoles(lookups.roles ?? raw.roles);
  const projects = parseProjects(lookups.projects ?? raw.projects);
  const managers = parseManagers(lookups.managers ?? raw.managers);

  const cpfRaw = raw.cpf_levels ?? lookups.cpf_levels;
  const cpfLevels = Array.isArray(cpfRaw)
    ? (cpfRaw as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  return {
    permissionBits: pickPermissionBitsForPageBundle(raw),
    employees,
    employeeCount: count,
    departments,
    roles,
    projects,
    managers,
    cpfLevels,
  };
}

export type EmployeeProfileModalBundleFetchMeta =
  | {
      kind: "ok";
      bundle: EmployeeProfileModalBundleApplied;
      etag: string | null;
    }
  | { kind: "not_modified" }
  | { kind: "missing" };

/** Full bundle fetch (omit `sections` = all sections per BE). */
export async function fetchEmployeeProfileModalBundle(
  employeeId: number | string,
  options?: {
    signal?: AbortSignal;
    sections?: readonly ProfileModalBundleSection[];
  }
): Promise<EmployeeProfileModalBundleApplied | null> {
  const url = `${API_BASE_URL}${hrEmployeeProfileModalBundlePath(
    employeeId,
    options?.sections?.length ? { sections: options.sections } : undefined
  )}`;
  const raw = await getAllow404<Record<string, unknown>>(url, options?.signal);
  if (!raw) return null;
  return normalizeEmployeeProfileModalBundle(raw);
}

/**
 * Same route with If-None-Match — use when caching ETag from a prior response.
 * On `not_modified`, reuse the previous normalized bundle client-side.
 */
export async function fetchEmployeeProfileModalBundleWithRevalidation(
  employeeId: number | string,
  options: {
    ifNoneMatch: string;
    signal?: AbortSignal;
    sections?: readonly ProfileModalBundleSection[];
  }
): Promise<EmployeeProfileModalBundleFetchMeta> {
  const url = `${API_BASE_URL}${hrEmployeeProfileModalBundlePath(
    employeeId,
    options.sections?.length ? { sections: options.sections } : undefined
  )}`;
  const r = await getJsonWithRevalidation<Record<string, unknown>>(url, {
    signal: options.signal,
    ifNoneMatch: options.ifNoneMatch,
  });
  if (r.status === "not_found") return { kind: "missing" };
  if (r.status === "not_modified") return { kind: "not_modified" };

  const bundle = normalizeEmployeeProfileModalBundle(r.data);
  if (!bundle) return { kind: "missing" };
  return { kind: "ok", bundle, etag: r.etag };
}

/** Coalesce concurrent calls (e.g. React Strict Mode double mount) into one HTTP request. */
let hrProfilesPageBundleInflight: Promise<HrProfilesPageBundleApplied | null> | null =
  null;

export async function fetchHrProfilesPageBundle(
  signal?: AbortSignal
): Promise<HrProfilesPageBundleApplied | null> {
  if (!hrProfilesPageBundleInflight) {
    hrProfilesPageBundleInflight = (async () => {
      const url = `${API_BASE_URL}${HR_PROFILES_PAGE_BUNDLE_PATH}`;
      const raw = await getAllow404<Record<string, unknown>>(url, signal);
      if (!raw) return null;
      return normalizeHrProfilesPageBundle(raw);
    })().finally(() => {
      hrProfilesPageBundleInflight = null;
    });
  }
  return hrProfilesPageBundleInflight;
}
