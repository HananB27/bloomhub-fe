import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Eye, Search, X } from "lucide-react";
import { ANNUAL_LEAVE_ALLOWANCE_DAYS } from "@/types/vacations";
import { filterItems, type FilterConfig } from "@/utils/filters";
import { leaveAnalyticsApi } from "@/lib/api/modules/leave-analytics";
import type {
  LeaveAnalyticsEmployeeSummary,
  LeaveMonthlyAggregate,
} from "@/types/leaveAnalytics";
import { Button } from "../ui/button";
import { EmployeeAvatar, TypeChip } from "./Atoms";
import { getAvatarColorForEmployee } from "./avatarPalette";

interface Props {
  year: number;
  rows: LeaveAnalyticsEmployeeSummary[];
}

interface SearchableRow extends LeaveAnalyticsEmployeeSummary,
  Record<string, unknown> {
  searchName: string;
}

const FILTER_CONFIG: FilterConfig<SearchableRow> = {
  searchFields: ["searchName", "role", "department"],
  filters: {},
  filterFields: {},
};

export function EmployeeHistoryTable({ year, rows }: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [drilldown, setDrilldown] = useState<LeaveMonthlyAggregate[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState<string | null>(null);

  const indexedRows = useMemo<SearchableRow[]>(
    () =>
      rows.map((r) => ({
        ...r,
        searchName: r.employeeName,
      })),
    [rows]
  );
  const filtered = useMemo(
    () => filterItems(indexedRows, search, FILTER_CONFIG),
    [indexedRows, search]
  );

  useEffect(() => {
    if (expanded === null) {
      setDrilldown([]);
      setDrilldownError(null);
      return;
    }
    let cancelled = false;
    setDrilldownLoading(true);
    setDrilldownError(null);
    leaveAnalyticsApi
      .list({ employee: expanded, year, ordering: "month" })
      .then(({ results }) => {
        if (!cancelled) setDrilldown(results);
      })
      .catch((err) => {
        if (!cancelled) {
          setDrilldownError(
            err instanceof Error ? err.message : "Failed to load drilldown"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDrilldownLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, year]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex h-8 items-center gap-2 rounded-lg bg-gray-100 px-2.5 text-gray-500 focus-within:bg-white focus-within:shadow-[0_0_0_1px_#d1d5db,0_0_0_4px_rgba(23,23,23,0.06)]">
          <Search className="h-3.5 w-3.5" />
          <input
            type="text"
            placeholder="Search name, role, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex items-center text-gray-500 hover:text-gray-900"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-8 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left" />
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Employee
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Department
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Vacation used
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Sick
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                WFH
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Other
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Remaining
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left" />
            </tr>
          </thead>
          <tbody>
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
                  <tr
                    onClick={() =>
                      setExpanded(isOpen ? null : r.employeeId)
                    }
                    className={`cursor-pointer border-b border-gray-200 transition-colors hover:bg-[#fafaf9] ${
                      isOpen ? "bg-[#fafaf9]" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex h-[18px] w-[18px] items-center justify-center text-gray-500 transition-transform ${
                          isOpen ? "rotate-90 text-gray-900" : ""
                        }`}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                    <td className="px-3 py-3">
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
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {r.department || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs text-gray-600">
                          {used} / {ANNUAL_LEAVE_ALLOWANCE_DAYS}
                        </span>
                        <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-[width]"
                            style={{
                              width: `${usedPct * 100}%`,
                              background:
                                usedPct > 0.85 ? "#b45309" : "#4338ca",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.byType.sick}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.byType.wfh}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{other}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                      {r.total}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.vacationRemaining}
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-gray-50">
                      <td colSpan={10} className="p-0">
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
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto px-2 py-1 text-xs"
                              >
                                <Download className="h-3 w-3" />
                                Export {firstName || r.employeeName}&apos;s history
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto px-2 py-1 text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                Open full profile
                              </Button>
                            </div>
                          </div>
                          {drilldownLoading && (
                            <div className="px-3 py-4 text-xs text-gray-500">
                              Loading buckets…
                            </div>
                          )}
                          {drilldownError && (
                            <div className="px-3 py-4 text-xs text-red-600">
                              {drilldownError}
                            </div>
                          )}
                          {!drilldownLoading &&
                            !drilldownError &&
                            drilldown.length === 0 && (
                              <div className="px-3 py-4 text-xs text-gray-500">
                                No leave recorded for {r.employeeName} in {year}.
                              </div>
                            )}
                          {!drilldownLoading &&
                            !drilldownError &&
                            drilldown.length > 0 && (
                              <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-[12.5px]">
                                <thead>
                                  <tr>
                                    <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                      Type
                                    </th>
                                    <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                      Month
                                    </th>
                                    <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                      Approved
                                    </th>
                                    <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                      Pending
                                    </th>
                                    <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                      Requests
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {drilldown.map((bucket) => (
                                    <tr
                                      key={bucket.id}
                                      className="border-b border-gray-200 last:border-b-0"
                                    >
                                      <td className="px-3 py-2">
                                        <TypeChip typeId={bucket.leaveType} />
                                      </td>
                                      <td className="px-3 py-2 font-mono text-xs">
                                        {bucket.year}-
                                        {String(bucket.month).padStart(2, "0")}
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono">
                                        {bucket.approvedDays}
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono">
                                        {bucket.pendingDays}
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono">
                                        {bucket.requestsCount}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-10 text-center text-sm text-gray-500"
                >
                  {search
                    ? `No employees match "${search}"`
                    : "No employees have leave records for this year yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
