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
