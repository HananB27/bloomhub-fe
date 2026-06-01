import { ALL_LEAVE_TYPES, LEAVE_TYPE_LABELS } from "@/types/vacations";
import type {
  LeaveAnalyticsEmployeeHistory,
  LeaveAnalyticsEmployeeSummary,
} from "@/types/leaveAnalytics";

const AVATAR_COLORS = ["green", "indigo", "rose", "orange", "gray"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

// ----- CSV builders --------------------------------------------------------

function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\n");
}

export function buildAllEmployeesCsv(
  year: number,
  rows: LeaveAnalyticsEmployeeSummary[]
): string {
  const headers = [
    "Employee",
    "Role",
    "Department",
    "Year",
    ...ALL_LEAVE_TYPES.map((id) => LEAVE_TYPE_LABELS[id]),
    "Total",
    "Vacation used",
    "Vacation remaining",
  ];
  const body = rows.map((r) => [
    r.employeeName,
    r.role ?? "",
    r.department ?? "",
    year,
    ...ALL_LEAVE_TYPES.map((id) => r.byType[id] ?? 0),
    r.total,
    r.vacationUsed,
    r.vacationRemaining,
  ]);
  return rowsToCsv(headers, body);
}

export function buildEmployeeHistoryCsv(
  history: LeaveAnalyticsEmployeeHistory
): string {
  const sections: string[] = [];

  sections.push(`Employee,${escapeCsvCell(history.employeeName)}`);
  sections.push("");

  sections.push("Monthly aggregates");
  sections.push(
    rowsToCsv(
      [
        "Leave type",
        "Year",
        "Month",
        "Approved days",
        "Pending days",
        "Rejected days",
        "Cancelled days",
        "Requests",
      ],
      history.monthlyAggregates.map((b) => [
        LEAVE_TYPE_LABELS[b.leaveType] ?? b.leaveType,
        b.year,
        String(b.month).padStart(2, "0"),
        b.approvedDays,
        b.pendingDays,
        b.rejectedDays,
        b.cancelledDays,
        b.requestsCount,
      ])
    )
  );
  sections.push("");

  sections.push("Balance snapshots");
  sections.push(
    rowsToCsv(
      [
        "Snapshot date",
        "Leave type",
        "Year",
        "Allocated",
        "Used",
        "Carryover",
        "Remaining",
      ],
      history.balanceSnapshots.map((s) => [
        s.snapshotDate,
        LEAVE_TYPE_LABELS[s.leaveType] ?? s.leaveType,
        s.year,
        s.allocated,
        s.used,
        s.carryover,
        s.remaining,
      ])
    )
  );
  sections.push("");

  sections.push("Leave requests");
  sections.push(
    rowsToCsv(
      ["Submitted", "Leave type", "Start", "End", "Days", "Status", "Reason"],
      history.leaveRequests.map((r) => [
        r.submittedDate,
        LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType,
        r.startDate,
        r.endDate,
        r.days,
        r.statusDisplay || r.status,
        r.reason,
      ])
    )
  );

  return sections.join("\n");
}
