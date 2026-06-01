import { Fragment, useMemo, useState } from "react";
import {
  ChevronRight,
  Download,
  Eye,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { ANNUAL_LEAVE_ALLOWANCE_DAYS } from "@/types/vacations";
import { filterItems, type FilterConfig } from "@/utils/filters";
import { notifyApiError, notifySuccess } from "@/utils/notificationHelpers";
import type { LeaveAnalyticsEmployeeSummary } from "@/types/leaveAnalytics";
import { useEmployeeLeaveHistory } from "@/hooks/useEmployeeLeaveHistory";

import { Button } from "../ui/button";
import { requestOpenEmployee } from "../orgchart/crossModuleNav";
import { EmployeeAvatar, TypeChip } from "./Atoms";
import { getAvatarColorForEmployee } from "./avatarPalette";
import { BalanceTrendChart } from "./BalanceTrendChart";
import { EmployeeLeavePeekDialog } from "./EmployeeLeavePeekDialog";
import {
  buildEmployeeHistoryCsv,
  buildAllEmployeesCsv,
} from "./analyticsModuleHelpers";

interface Props {
  year: number;
  rows: LeaveAnalyticsEmployeeSummary[];
  isAdmin?: boolean;
  onNavigate?: (moduleId: string) => void;
}

interface SearchableRow
  extends LeaveAnalyticsEmployeeSummary, Record<string, unknown> {
  searchName: string;
}

const FILTER_CONFIG: FilterConfig<SearchableRow> = {
  searchFields: ["searchName", "role", "department"],
  filters: {},
  filterFields: {},
};

const GRID_COLUMNS =
  "28px minmax(200px,1.6fr) minmax(120px,1fr) minmax(140px,1.1fr) " +
  "minmax(60px,0.7fr) minmax(60px,0.7fr) minmax(60px,0.7fr) " +
  "minmax(60px,0.7fr) minmax(80px,0.9fr) 100px";

export function EmployeeHistoryTable({
  year,
  rows,
  isAdmin = true,
  onNavigate,
}: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [peekId, setPeekId] = useState<number | null>(null);

  const openEmployeeProfile = (employeeId: number) => {
    requestOpenEmployee(employeeId);
    onNavigate?.("profiles");
    setPeekId(null);
  };

  const peekEmployee = useMemo(
    () =>
      peekId === null
        ? null
        : (rows.find((r) => r.employeeId === peekId) ?? null),
    [peekId, rows]
  );

  const indexedRows = useMemo<SearchableRow[]>(
    () => rows.map((r) => ({ ...r, searchName: r.employeeName })),
    [rows]
  );
  const filtered = useMemo(
    () => filterItems(indexedRows, search, FILTER_CONFIG),
    [indexedRows, search]
  );

  const { history, isLoading, error } = useEmployeeLeaveHistory({
    employeeId: expanded,
    yearFrom: year,
    yearTo: year,
  });

  if (error) {
    notifyApiError(new Error(error));
  }

  const handleExportAll = () => {
    const csv = buildAllEmployeesCsv(year, rows);
    triggerCsvDownload(csv, `leave-history-${year}.csv`);
    notifySuccess("CSV downloaded");
  };

  const handleExportEmployee = (row: LeaveAnalyticsEmployeeSummary) => {
    if (!history || history.employeeId !== row.employeeId) return;
    const csv = buildEmployeeHistoryCsv(history);
    const slug = row.employeeName.toLowerCase().replace(/\s+/g, "-");
    triggerCsvDownload(csv, `leave-history-${slug}-${year}.csv`);
    notifySuccess("CSV downloaded");
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="group flex h-10 min-w-[280px] flex-1 max-w-md items-center rounded-lg border border-zinc-200 bg-[#F9F9F9] px-3 text-zinc-700 transition focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-200/70 hover:border-zinc-300">
          <Search size={16} aria-hidden className="text-zinc-500" />
          <input
            type="search"
            placeholder="Search by name, role, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
            aria-label="Search employee leave history"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X size={15} aria-hidden />
            </button>
          ) : null}
        </label>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs font-medium text-gray-800"
          onClick={handleExportAll}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div
          className="grid border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
          style={{ gridTemplateColumns: GRID_COLUMNS }}
        >
          <div />
          <div className="text-left">Employee</div>
          <div className="text-left">Department</div>
          <div className="text-center">Vacation used</div>
          <div className="text-center">Sick</div>
          <div className="text-center">WFH</div>
          <div className="text-center">Other</div>
          <div className="text-center">Total</div>
          <div className="text-center">Remaining</div>
          <div />
        </div>
        <div className="text-sm">
          {filtered.map((r) => {
            const other =
              r.byType.personal +
              r.byType.maternity +
              r.byType.paternity +
              r.byType.unpaid +
              r.byType.bereavement;
            const isOpen = expanded === r.employeeId;
            const used = r.vacationUsed;
            const usedPct = Math.min(used / ANNUAL_LEAVE_ALLOWANCE_DAYS, 1);
            const [firstName, ...rest] = r.employeeName.split(" ");
            const lastName = rest.join(" ");
            return (
              <Fragment key={r.employeeId}>
                <div
                  onClick={() => setExpanded(isOpen ? null : r.employeeId)}
                  className={`grid cursor-pointer items-center border-b border-gray-200 px-3 py-3 transition-colors hover:bg-[#fafaf9] ${
                    isOpen ? "bg-[#fafaf9]" : ""
                  }`}
                  style={{ gridTemplateColumns: GRID_COLUMNS }}
                >
                  <div>
                    <span
                      className={`inline-flex h-[18px] w-[18px] items-center justify-center text-gray-500 transition-transform ${
                        isOpen ? "rotate-90 text-gray-900" : ""
                      }`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <EmployeeAvatar
                      first={firstName || "?"}
                      last={lastName}
                      color={getAvatarColorForEmployee(r.employeeId)}
                      size={28}
                    />
                    <div>
                      <div className="text-[13px] font-semibold text-gray-900">
                        {r.employeeName}
                      </div>
                      <div className="mt-px text-[11px] text-gray-500">
                        {r.role || "—"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {r.department || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-xs font-semibold text-gray-900">
                      {used} / {ANNUAL_LEAVE_ALLOWANCE_DAYS}
                    </span>
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${usedPct * 100}%`,
                          background: usedPct > 0.85 ? "#b45309" : "#4338ca",
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center font-mono text-gray-900">
                    {r.byType.sick}
                  </div>
                  <div className="text-center font-mono text-gray-900">
                    {r.byType.wfh}
                  </div>
                  <div className="text-center font-mono text-gray-900">
                    {other}
                  </div>
                  <div className="text-center font-mono font-bold text-gray-900">
                    {r.total}
                  </div>
                  <div className="text-center font-mono text-gray-900">
                    {r.vacationRemaining}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Quick view"
                      title="Quick view"
                      className="h-8 w-8 text-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeekId(r.employeeId);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="px-4 pb-4 pt-3">
                      <div className="mb-2.5 flex items-end justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            Monthly leave by type — {year}
                          </div>
                          <div className="mt-0.5 text-sm font-semibold text-gray-900">
                            {r.employeeName}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-gray-800"
                            onClick={() => handleExportEmployee(r)}
                            disabled={!history || isLoading}
                          >
                            <Download className="h-3 w-3" />
                            Export {firstName || r.employeeName}&apos;s history
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-gray-800"
                            onClick={() => openEmployeeProfile(r.employeeId)}
                          >
                            <UserRound className="h-3 w-3" />
                            Open full profile
                          </Button>
                        </div>
                      </div>
                      {isLoading && (
                        <div className="px-3 py-4 text-xs text-gray-500">
                          Loading history…
                        </div>
                      )}
                      {!isLoading && history && (
                        <>
                          {history.monthlyAggregates.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-gray-500">
                              No leave recorded for {r.employeeName} in {year}.
                            </div>
                          ) : (
                            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white text-[12.5px]">
                              <div
                                className="grid border-b border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500"
                                style={{
                                  gridTemplateColumns:
                                    "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                                }}
                              >
                                <div className="text-left">Type</div>
                                <div className="text-center">Month</div>
                                <div className="text-center">Approved</div>
                                <div className="text-center">Pending</div>
                                <div className="text-center">Requests</div>
                              </div>
                              {history.monthlyAggregates.map((bucket) => (
                                <div
                                  key={bucket.id}
                                  className="grid items-center border-b border-gray-200 px-3 py-2 last:border-b-0"
                                  style={{
                                    gridTemplateColumns:
                                      "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                                  }}
                                >
                                  <div>
                                    <TypeChip typeId={bucket.leaveType} />
                                  </div>
                                  <div className="text-center font-mono text-xs text-gray-900">
                                    {`${bucket.year}-${String(bucket.month).padStart(2, "0")}`}
                                  </div>
                                  <div className="text-center font-mono text-gray-900">
                                    {bucket.approvedDays}
                                  </div>
                                  <div className="text-center font-mono text-gray-900">
                                    {bucket.pendingDays}
                                  </div>
                                  <div className="text-center font-mono text-gray-900">
                                    {bucket.requestsCount}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
                            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                              Balance over time
                            </div>
                            <BalanceTrendChart
                              snapshots={history.balanceSnapshots}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-10 text-center text-sm text-gray-500">
              {search
                ? `No employees match "${search}"`
                : isAdmin
                  ? "No employees have leave records for this year yet."
                  : `No leave records on file for ${year}.`}
            </div>
          )}
        </div>
      </div>

      <EmployeeLeavePeekDialog
        open={peekEmployee !== null}
        year={year}
        employee={peekEmployee}
        onClose={() => setPeekId(null)}
        onOpenFullProfile={openEmployeeProfile}
      />
    </div>
  );
}

function triggerCsvDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
