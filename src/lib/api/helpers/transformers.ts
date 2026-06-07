export interface EmployeeProfileData {
  id: number;
  employee_id: string;
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  birth_date?: string;
  start_date: string;
  employment_status: string;
  role_id?: number;
  role?: {
    id: number;
    name: string;
  };
  department?: string;
  manager_ids?: number[];
  manager_names?: string;
  salary?: number;
  current_salary?: number | null;
  current_net_salary?: number | null;
  current_total_monthly?: number | null;
  currency?: string;
  is_active: boolean;
  avatar?: string;
  career_level?: string;
  cpf_level?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  technology_tags?: { id: number; name: string }[];
  created_at: string;
  updated_at: string;
  assigned_projects?:
    | {
        id: number;
        project_id: number;
        project_name: string;
        role?: string;
        start_date: string;
        end_date?: string | null;
        status: string;
        allocation_percentage?: number;
      }[]
    | null;
}

const TECHNOLOGY_TAG_NAME_BY_ID: Record<number, string> = {
  1: "React",
  2: "Angular",
  3: "Vue.js",
  4: "TypeScript",
  5: "JavaScript",
  6: "Python",
  7: "Django",
  8: "Node.js",
  9: "Next.js",
  10: "PostgreSQL",
  11: "Docker",
  12: "AWS",
  13: "Tailwind CSS",
  14: "GraphQL",
  15: "Redis",
  16: "Git",
  17: "Java",
  18: "C#",
  19: ".NET",
  20: "Go",
  21: "Rust",
  22: "Kubernetes",
  23: "Flutter",
  24: "Swift",
  25: "Kotlin",
  26: "MongoDB",
  27: "MySQL",
};

// ── Internal helpers ──────────────────────────────────────────
function asNum(raw: Record<string, unknown>, key: string): number {
  return raw[key] as number;
}

function num(raw: Record<string, unknown>, key: string, fallback: number = 0): number {
  return (raw[key] as number) ?? fallback;
}

function str(raw: Record<string, unknown>, key: string, fallback: string = ""): string {
  return (raw[key] as string) || fallback;
}

function strOrNull(raw: Record<string, unknown>, key: string): string | null {
  return (raw[key] as string) || null;
}

function bool(raw: Record<string, unknown>, key: string, fallback: boolean = true): boolean {
  return raw[key] !== undefined ? (raw[key] as boolean) : fallback;
}

function normalizeTechnologyTags(
  input: unknown
): { id: number; name: string }[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((rawTag) => {
      if (typeof rawTag === "number") {
        return {
          id: rawTag,
          name: TECHNOLOGY_TAG_NAME_BY_ID[rawTag] ?? `Tag ${rawTag}`,
        };
      }

      if (rawTag && typeof rawTag === "object") {
        const tagObj = rawTag as { id?: unknown; name?: unknown };
        const tagId = Number(tagObj.id);
        if (!Number.isFinite(tagId)) return null;
        const tagName =
          typeof tagObj.name === "string" && tagObj.name.trim().length > 0
            ? tagObj.name
            : (TECHNOLOGY_TAG_NAME_BY_ID[tagId] ?? `Tag ${tagId}`);
        return { id: tagId, name: tagName };
      }

      return null;
    })
    .filter((tag): tag is { id: number; name: string } => tag !== null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformEmployeeData(data: any): EmployeeProfileData {
  return {
    id: data.id as number,
    employee_id: (data.employee_id as string) || "",
    username: (data.username as string) || undefined,
    first_name: (data.first_name as string) || "",
    last_name: (data.last_name as string) || "",
    email: (data.email as string) || (data.email_address as string) || "",
    phone_number: data.phone_number as string | undefined,
    address: data.address as string | undefined,
    birth_date: (data.birth_date as string) || (data.birthday as string),
    start_date: data.start_date as string,
    employment_status: (data.employment_status as string) || "active",
    role_id:
      typeof data.role === "number"
        ? (data.role as number)
        : (data.role as { id: number } | undefined)?.id,
    role:
      typeof data.role === "object" && data.role !== null
        ? (data.role as { id: number; name: string })
        : data.role_name
          ? { id: data.role as number, name: data.role_name as string }
          : undefined,
    department: data.department as string | undefined,
    manager_ids: Array.isArray(data.managers)
      ? (data.managers as number[])
      : [],
    manager_names: data.manager_names as string | undefined,
    salary:
      data.salary != null
        ? Number(data.salary)
        : data.current_net_salary != null
          ? Number(data.current_net_salary)
          : undefined,
    current_salary:
      data.current_salary != null ? Number(data.current_salary) : null,
    current_net_salary:
      data.current_net_salary != null ? Number(data.current_net_salary) : null,
    current_total_monthly:
      data.current_total_monthly != null
        ? Number(data.current_total_monthly)
        : null,
    currency: data.currency as string | undefined,
    is_active:
      data.is_active !== undefined ? (data.is_active as boolean) : true,
    avatar: data.avatar as string | undefined,
    career_level: data.career_level as string | undefined,
    cpf_level: data.cpf_level as string | undefined,
    emergency_contact_name: data.emergency_contact_name as string | undefined,
    emergency_contact_phone: data.emergency_contact_phone as string | undefined,
    technology_tags: normalizeTechnologyTags(
      data.tech_tags ?? data.technology_tags
    ),
    created_at: (data.created_at as string) || new Date().toISOString(),
    updated_at: (data.updated_at as string) || new Date().toISOString(),
    assigned_projects: Array.isArray(data.assigned_projects)
      ? (data.assigned_projects as Record<string, unknown>[]).map((p) => ({
          id: p.id as number,
          project_id: p.project_id as number,
          project_name: p.project_name as string,
          role: p.role as string | undefined,
          start_date: p.start_date as string,
          end_date: p.end_date as string | null | undefined,
          status: p.status as string,
          allocation_percentage:
            typeof p.allocation_percentage === "number"
              ? p.allocation_percentage
              : p.allocation_percentage != null
                ? Number(p.allocation_percentage)
                : undefined,
        }))
      : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformEmployeeList(data: any[]): EmployeeProfileData[] {
  return data.map((emp) => transformEmployeeData(emp));
}

// ──────────────────────────────────────────
// Leave Analytics
// ──────────────────────────────────────────

import type { LeaveType } from "@/types/vacations";
import { ALL_LEAVE_TYPES } from "@/types/vacations";
import type {
  LeaveAnalyticsDepartmentRow,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsRefreshResponse,
  LeaveAnalyticsYearTotals,
  LeaveBalanceSnapshot,
  LeaveMonthlyAggregate,
} from "@/types/leaveAnalytics";

function _normalizeByType(
  raw: Record<string, unknown> | undefined
): Record<LeaveType, number> {
  const out = Object.fromEntries(ALL_LEAVE_TYPES.map((t) => [t, 0])) as Record<
    LeaveType,
    number
  >;
  if (raw && typeof raw === "object") {
    for (const id of ALL_LEAVE_TYPES) {
      const value = (raw as Record<string, unknown>)[id];
      if (typeof value === "number") out[id] = value;
      else if (typeof value === "string") out[id] = Number(value) || 0;
    }
  }
  return out;
}

export function transformLeaveMonthlyAggregate(
  raw: Record<string, unknown>
): LeaveMonthlyAggregate {
  return {
    id: asNum(raw, "id"),
    employeeId: asNum(raw, "employee_id"),
    employeeName: str(raw, "employee_name"),
    department: strOrNull(raw, "department"),
    leaveType: raw.leave_type as LeaveType,
    leaveTypeDisplay: str(raw, "leave_type_display"),
    year: asNum(raw, "year"),
    month: asNum(raw, "month"),
    approvedDays: num(raw, "approved_days"),
    pendingDays: num(raw, "pending_days"),
    rejectedDays: num(raw, "rejected_days"),
    cancelledDays: num(raw, "cancelled_days"),
    totalDays: num(raw, "total_days"),
    requestsCount: num(raw, "requests_count"),
    createdAt: str(raw, "created_at"),
    updatedAt: str(raw, "updated_at"),
  };
}

export function transformLeaveMonthlyAggregateList(
  list: Record<string, unknown>[]
): LeaveMonthlyAggregate[] {
  return list.map(transformLeaveMonthlyAggregate);
}

export function transformLeaveAnalyticsMonthRow(
  raw: Record<string, unknown>
): LeaveAnalyticsMonthRow {
  return {
    year: asNum(raw, "year"),
    month: asNum(raw, "month"),
    monthLabel: str(raw, "month_label"),
    total: num(raw, "total"),
    byType: _normalizeByType(raw.by_type as Record<string, unknown>),
  };
}

export function transformLeaveAnalyticsMonthRowList(
  list: Record<string, unknown>[]
): LeaveAnalyticsMonthRow[] {
  return list.map(transformLeaveAnalyticsMonthRow);
}

export function transformLeaveAnalyticsYearTotals(
  raw: Record<string, unknown>
): LeaveAnalyticsYearTotals {
  return {
    year: asNum(raw, "year"),
    total: num(raw, "total"),
    byType: _normalizeByType(raw.by_type as Record<string, unknown>),
    pendingTotal: num(raw, "pending_total"),
    headcount: num(raw, "headcount"),
    onLeaveToday: num(raw, "on_leave_today"),
  };
}

export function transformLeaveAnalyticsDepartmentRow(
  raw: Record<string, unknown>
): LeaveAnalyticsDepartmentRow {
  return {
    department: str(raw, "department", "Unassigned"),
    headcount: num(raw, "headcount"),
    total: num(raw, "total"),
    byType: _normalizeByType(raw.by_type as Record<string, unknown>),
  };
}

export function transformLeaveAnalyticsDepartmentRowList(
  list: Record<string, unknown>[]
): LeaveAnalyticsDepartmentRow[] {
  return list.map(transformLeaveAnalyticsDepartmentRow);
}

export function transformLeaveAnalyticsEmployeeSummary(
  raw: Record<string, unknown>
): LeaveAnalyticsEmployeeSummary {
  return {
    employeeId: asNum(raw, "employee_id"),
    employeeName: str(raw, "employee_name"),
    role: strOrNull(raw, "role"),
    department: strOrNull(raw, "department"),
    total: num(raw, "total"),
    vacationUsed: num(raw, "vacation_used"),
    vacationRemaining: num(raw, "vacation_remaining"),
    byType: _normalizeByType(raw.by_type as Record<string, unknown>),
  };
}

export function transformLeaveAnalyticsEmployeeSummaryList(
  list: Record<string, unknown>[]
): LeaveAnalyticsEmployeeSummary[] {
  return list.map(transformLeaveAnalyticsEmployeeSummary);
}

export function transformLeaveAnalyticsRefreshResponse(
  raw: Record<string, unknown>
): LeaveAnalyticsRefreshResponse {
  const snapshots =
    (raw.snapshots as Record<string, unknown> | undefined) ?? {};
  return {
    createdCount: num(raw, "created_count"),
    updatedCount: num(raw, "updated_count"),
    deletedCount: num(raw, "deleted_count"),
    snapshots: {
      createdCount: num(snapshots, "created_count"),
      updatedCount: num(snapshots, "updated_count"),
    },
  };
}

export function transformLeaveBalanceSnapshot(
  raw: Record<string, unknown>
): LeaveBalanceSnapshot {
  return {
    id: asNum(raw, "id"),
    employeeId: asNum(raw, "employee_id"),
    employeeName: str(raw, "employee_name"),
    leaveType: raw.leave_type as LeaveType,
    leaveTypeDisplay: str(raw, "leave_type_display"),
    year: asNum(raw, "year"),
    snapshotDate: str(raw, "snapshot_date"),
    allocated: num(raw, "allocated"),
    used: num(raw, "used"),
    carryover: num(raw, "carryover"),
    remaining: num(raw, "remaining"),
    createdAt: str(raw, "created_at"),
    updatedAt: str(raw, "updated_at"),
  };
}

export function transformLeaveBalanceSnapshotList(
  list: Record<string, unknown>[]
): LeaveBalanceSnapshot[] {
  return list.map(transformLeaveBalanceSnapshot);
}

export function transformLeaveRequestHistoryRow(
  raw: Record<string, unknown>
): import("@/types/leaveAnalytics").LeaveRequestHistoryRow {
  return {
    id: asNum(raw, "id"),
    employeeId: num(raw, "employee_id"),
    employeeName: str(raw, "employee_name"),
    leaveType: raw.leave_type as LeaveType,
    leaveTypeDisplay: str(raw, "leave_type_display"),
    startDate: str(raw, "start_date"),
    endDate: str(raw, "end_date"),
    days: num(raw, "days"),
    reason: str(raw, "reason"),
    status: raw.status as import("@/types/vacations").LeaveStatus,
    statusDisplay: str(raw, "status_display"),
    submittedDate: str(raw, "submitted_date"),
  };
}

export function transformLeaveRequestHistoryRowList(
  list: Record<string, unknown>[]
): import("@/types/leaveAnalytics").LeaveRequestHistoryRow[] {
  return list.map(transformLeaveRequestHistoryRow);
}

function _transformLeaveAvailabilityEntry(
  raw: Record<string, unknown>
): import("@/types/leaveAnalytics").LeaveAvailabilityEntry {
  return {
    leaveType: raw.leave_type as LeaveType,
    status: raw.status as import("@/types/vacations").LeaveStatus,
    startDate: str(raw, "start_date"),
    endDate: str(raw, "end_date"),
    windowStart: str(raw, "window_start"),
    windowEnd: str(raw, "window_end"),
  };
}

function _transformLeaveAvailabilityEmployee(
  raw: Record<string, unknown>
): import("@/types/leaveAnalytics").LeaveAvailabilityEmployee {
  const entries = (raw.entries as Record<string, unknown>[] | undefined) ?? [];
  return {
    employeeId: num(raw, "employee_id"),
    employeeName: str(raw, "employee_name"),
    role: strOrNull(raw, "role"),
    department: strOrNull(raw, "department"),
    entries: entries.map(_transformLeaveAvailabilityEntry),
  };
}

function _transformLeaveAvailabilityDay(
  raw: Record<string, unknown>
): import("@/types/leaveAnalytics").LeaveAvailabilityDayCount {
  return {
    date: str(raw, "date"),
    onLeaveCount: num(raw, "on_leave_count"),
    byType: _normalizeByType(raw.by_type as Record<string, unknown>),
    isCritical: Boolean(raw.is_critical),
  };
}

export function transformLeaveAvailabilityResponse(
  raw: Record<string, unknown>
): import("@/types/leaveAnalytics").LeaveAvailabilityResponse {
  const range = (raw.range as Record<string, unknown> | undefined) ?? {};
  const employees =
    (raw.employees as Record<string, unknown>[] | undefined) ?? [];
  const daily = (raw.daily as Record<string, unknown>[] | undefined) ?? [];
  return {
    range: {
      startDate: str(range, "start_date"),
      endDate: str(range, "end_date"),
      workingDaysCount: num(range, "working_days_count"),
      headcount: num(range, "headcount"),
      projectId: (range.project_id as number | null) ?? null,
      projectName: (range.project_name as string | null) ?? null,
      criticalRatio: num(range, "critical_ratio"),
    },
    employees: employees.map(_transformLeaveAvailabilityEmployee),
    daily: daily.map(_transformLeaveAvailabilityDay),
  };
}

export function transformLeaveAnalyticsEmployeeHistory(
  raw: Record<string, unknown>
): import("@/types/leaveAnalytics").LeaveAnalyticsEmployeeHistory {
  return {
    employeeId: num(raw, "employee_id"),
    employeeName: str(raw, "employee_name"),
    monthlyAggregates: transformLeaveMonthlyAggregateList(
      (raw.monthly_aggregates as Record<string, unknown>[]) ?? []
    ),
    balanceSnapshots: transformLeaveBalanceSnapshotList(
      (raw.balance_snapshots as Record<string, unknown>[]) ?? []
    ),
    leaveRequests: transformLeaveRequestHistoryRowList(
      (raw.leave_requests as Record<string, unknown>[]) ?? []
    ),
  };
}
