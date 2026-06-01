import type { LeaveStatus, LeaveType } from "./vacations";

/** Raw `LeaveMonthlyAggregate` row as returned by `/api/leave-analytics/`. */
export interface LeaveMonthlyAggregate {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string | null;
  leaveType: LeaveType;
  leaveTypeDisplay: string;
  year: number;
  month: number;
  approvedDays: number;
  pendingDays: number;
  rejectedDays: number;
  cancelledDays: number;
  totalDays: number;
  requestsCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Row of `monthly` action: one bucket per calendar month with per-type counts. */
export interface LeaveAnalyticsMonthRow {
  year: number;
  month: number;
  monthLabel: string;
  total: number;
  byType: Record<LeaveType, number>;
}

/** Year totals broken down by leave type. Also carries KPI fields. */
export interface LeaveAnalyticsYearTotals {
  year: number;
  total: number;
  byType: Record<LeaveType, number>;
  pendingTotal: number;
  headcount: number;
  onLeaveToday: number;
}

/** Department-level breakdown row. */
export interface LeaveAnalyticsDepartmentRow {
  department: string;
  headcount: number;
  total: number;
  byType: Record<LeaveType, number>;
}

/** Per-employee yearly summary row. */
export interface LeaveAnalyticsEmployeeSummary {
  employeeId: number;
  employeeName: string;
  role: string | null;
  department: string | null;
  total: number;
  vacationUsed: number;
  vacationRemaining: number;
  byType: Record<LeaveType, number>;
}

/** Shape of the `refresh` action response. */
export interface LeaveAnalyticsRefreshResponse {
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  snapshots: {
    createdCount: number;
    updatedCount: number;
  };
}

/** Historical balance snapshot row. */
export interface LeaveBalanceSnapshot {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  leaveTypeDisplay: string;
  year: number;
  snapshotDate: string;
  allocated: number;
  used: number;
  carryover: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
}

/** Optional filters accepted by `leaveAnalyticsApi.list()`. */
export interface LeaveAnalyticsListParams {
  employee?: number;
  leaveType?: LeaveType;
  year?: number;
  month?: number;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

/** Optional filters used by leave-history drilldown via `LeaveRequest`. */
export interface LeaveHistoryParams {
  employeeId: number;
  yearFrom?: number;
  yearTo?: number;
  status?: LeaveStatus;
  limit?: number;
}

/** Single leave request row included in the per-employee composite history. */
export interface LeaveRequestHistoryRow {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  leaveTypeDisplay: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  statusDisplay: string;
  submittedDate: string;
}

/** Composite payload returned by `/api/leave-analytics/employee-history/`. */
export interface LeaveAnalyticsEmployeeHistory {
  employeeId: number;
  employeeName: string;
  monthlyAggregates: LeaveMonthlyAggregate[];
  balanceSnapshots: LeaveBalanceSnapshot[];
  leaveRequests: LeaveRequestHistoryRow[];
}

/** Query params for the per-employee composite history endpoint. */
export interface LeaveAnalyticsEmployeeHistoryParams {
  employee: number;
  yearFrom?: number;
  yearTo?: number;
  leaveType?: LeaveType;
}

// ─── Team availability (BHB-485) ─────────────────────────────────────────────

/** Query params accepted by `leaveAnalyticsApi.availability()`. */
export interface LeaveAvailabilityParams {
  /** Inclusive window start (ISO date). */
  startDate: string;
  /** Inclusive window end (ISO date). May not exceed the backend cap (35d). */
  endDate: string;
  /** Optional project scope — limits to active ProjectAssignment members. */
  project?: number;
  /** Optional whitelist; defaults to all leave types except WFH. */
  leaveTypes?: LeaveType[];
  /** Optional whitelist; defaults to pending+lead_approved+approved. */
  statuses?: LeaveStatus[];
}

/** Single intersecting leave window inside the availability response. */
export interface LeaveAvailabilityEntry {
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  /** Request start clamped to the requested window. */
  windowStart: string;
  /** Request end clamped to the requested window. */
  windowEnd: string;
}

/** Per-employee row inside the availability heatmap. */
export interface LeaveAvailabilityEmployee {
  employeeId: number;
  employeeName: string;
  role: string | null;
  department: string | null;
  entries: LeaveAvailabilityEntry[];
}

/** Per-working-day rollup powering the heatmap header strip. */
export interface LeaveAvailabilityDayCount {
  date: string;
  onLeaveCount: number;
  byType: Record<LeaveType, number>;
  isCritical: boolean;
}

/** Window metadata returned alongside the rows. */
export interface LeaveAvailabilityRange {
  startDate: string;
  endDate: string;
  workingDaysCount: number;
  headcount: number;
  projectId: number | null;
  projectName: string | null;
  criticalRatio: number;
}

/** Shape returned by `/api/leave-analytics/availability/`. */
export interface LeaveAvailabilityResponse {
  range: LeaveAvailabilityRange;
  employees: LeaveAvailabilityEmployee[];
  daily: LeaveAvailabilityDayCount[];
}

// ─── Export (BHB-486) ────────────────────────────────────────────────────────

export type LeaveAnalyticsExportFormat = "csv" | "pdf";

export const ALL_LEAVE_ANALYTICS_EXPORT_FORMATS: LeaveAnalyticsExportFormat[] =
  ["csv", "pdf"];

export const LEAVE_ANALYTICS_EXPORT_FORMAT_LABELS: Record<
  LeaveAnalyticsExportFormat,
  string
> = {
  csv: "CSV",
  pdf: "PDF",
};

/** Query params accepted by `leaveAnalyticsApi.export()`. */
export interface LeaveAnalyticsExportParams {
  format: LeaveAnalyticsExportFormat;
  year: number;
  month?: number;
  department?: string;
}

/** Result of `leaveAnalyticsApi.export()` — blob + server-provided filename. */
export interface LeaveAnalyticsExportResult {
  blob: Blob;
  filename: string;
}
