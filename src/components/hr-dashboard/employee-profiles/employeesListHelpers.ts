import type { EmployeeProfileData } from "@/lib/api/employees";
import type { EmployeeStatusKey } from "./atoms/StatusPill";

export type EmployeesListSort =
  | "name_asc"
  | "name_desc"
  | "newest"
  | "oldest"
  | "department";

export const EMPLOYEES_LIST_SORT_LABELS: Record<EmployeesListSort, string> = {
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  newest: "Newest",
  oldest: "Oldest",
  department: "Department",
};

export const EMPLOYEES_LIST_SORT_OPTIONS: readonly EmployeesListSort[] = [
  "name_asc",
  "name_desc",
  "newest",
  "oldest",
  "department",
];

export const ALL_FILTER_SENTINEL = "all";

export interface EmployeesListFilters {
  department: string;
  status: EmployeeStatusKey | typeof ALL_FILTER_SENTINEL;
  sort: EmployeesListSort;
}

export const DEFAULT_EMPLOYEES_LIST_FILTERS: EmployeesListFilters = {
  department: ALL_FILTER_SENTINEL,
  status: ALL_FILTER_SENTINEL,
  sort: "name_asc",
};

/** Derive presentation status key from BE flags. */
export function deriveEmployeeStatus(
  employee: Pick<EmployeeProfileData, "is_active" | "employment_status">
): EmployeeStatusKey {
  if (!employee.is_active) return "inactive";
  if ((employee.employment_status ?? "").toLowerCase() === "inactive") {
    return "inactive";
  }
  return "active";
}

/** Case-insensitive substring search across name + email + role + department. */
export function matchesEmployeeSearch(
  employee: EmployeeProfileData,
  query: string
): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    employee.first_name,
    employee.last_name,
    `${employee.first_name} ${employee.last_name}`,
    employee.email,
    employee.department,
    employee.role?.name ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** Pure filter+sort pipeline; pagination handled separately by caller. */
export function applyEmployeesListPipeline(
  employees: EmployeeProfileData[],
  search: string,
  filters: EmployeesListFilters
): EmployeeProfileData[] {
  let out = employees.filter((e) => matchesEmployeeSearch(e, search));
  if (filters.department !== ALL_FILTER_SENTINEL) {
    out = out.filter((e) => e.department === filters.department);
  }
  if (filters.status !== ALL_FILTER_SENTINEL) {
    out = out.filter((e) => deriveEmployeeStatus(e) === filters.status);
  }
  return sortEmployees(out, filters.sort);
}

function lastFirstKey(e: EmployeeProfileData): string {
  return `${e.last_name ?? ""}${e.first_name ?? ""}`.toLowerCase();
}

function sortEmployees(
  list: EmployeeProfileData[],
  sort: EmployeesListSort
): EmployeeProfileData[] {
  const out = [...list];
  switch (sort) {
    case "name_desc":
      return out.sort((a, b) => lastFirstKey(b).localeCompare(lastFirstKey(a)));
    case "newest":
      return out.sort((a, b) =>
        (b.start_date ?? "").localeCompare(a.start_date ?? "")
      );
    case "oldest":
      return out.sort((a, b) =>
        (a.start_date ?? "").localeCompare(b.start_date ?? "")
      );
    case "department":
      return out.sort((a, b) =>
        (a.department ?? "").localeCompare(b.department ?? "")
      );
    case "name_asc":
    default:
      return out.sort((a, b) => lastFirstKey(a).localeCompare(lastFirstKey(b)));
  }
}

export function uniqueDepartments(employees: EmployeeProfileData[]): string[] {
  const set = new Set<string>();
  employees.forEach((e) => {
    if (e.department) set.add(e.department);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Slice for current page. 1-indexed. */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  return items.slice((page - 1) * perPage, page * perPage);
}
