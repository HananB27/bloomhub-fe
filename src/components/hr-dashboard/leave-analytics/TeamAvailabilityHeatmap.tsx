import { Fragment, useMemo } from "react";
import { Calendar, Download } from "lucide-react";
import {
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_SHORT_LABELS,
} from "@/types/vacations";
import { Button } from "../ui/button";
import {
  ANCHOR_TODAY,
  DIRECTORY,
  addDays,
  leaveOnDay,
  teamAvailability,
} from "./analyticsModuleHelpers";
import { EmployeeAvatar } from "./Atoms";

interface Props {
  selectedDept: string;
  onSelectDept: (d: string) => void;
  rangeDays?: number;
}

const LEGEND_TYPES = ["vacation", "sick", "wfh", "personal"] as const;

export function TeamAvailabilityHeatmap({
  selectedDept,
  onSelectDept,
  rangeDays = 35,
}: Props) {
  const startDate = useMemo(() => addDays(ANCHOR_TODAY, -3), []);
  const days = useMemo(
    () => teamAvailability(startDate, rangeDays),
    [startDate, rangeDays]
  );

  const departments = useMemo(() => {
    const set = new Set(DIRECTORY.map((d) => d.department));
    return ["All", ...Array.from(set)];
  }, []);

  const employees = useMemo(() => {
    const list =
      selectedDept && selectedDept !== "All"
        ? DIRECTORY.filter((d) => d.department === selectedDept)
        : DIRECTORY;
    return list.slice(0, 14);
  }, [selectedDept]);

  const dailyCounts = useMemo(
    () =>
      days.map(
        (d) => DIRECTORY.filter((e) => leaveOnDay(e.id, d.date)).length
      ),
    [days]
  );
  const maxDaily = Math.max(...dailyCounts, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {departments.slice(0, 7).map((d) => {
            const active = (selectedDept || "All") === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDept(d)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Legend:
          </span>
          {LEGEND_TYPES.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: LEAVE_TYPE_CHART_COLORS[id] }}
              />
              {LEAVE_TYPE_LABELS[id]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="h-2.5 w-2.5 rounded-sm border border-gray-200 bg-gray-100" />
            Working
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `220px repeat(${days.length}, 28px)`,
          }}
        >
          <div className="sticky left-0 z-[2] border-b border-r border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Out per day
            </div>
            <div className="mt-0.5 text-[10px] text-gray-500">
              {DIRECTORY.length} people
            </div>
          </div>
          {days.map((d, di) => {
            const cnt = dailyCounts[di];
            const intensity = cnt / maxDaily;
            return (
              <div
                key={di}
                className={`flex h-9 items-end justify-center border-b border-gray-200 pb-1 ${
                  d.isWeekend ? "bg-[#fafaf9]" : "bg-gray-50"
                } ${d.isToday ? "bg-orange-50" : ""}`}
              >
                <div
                  className="w-3.5 rounded-t-sm"
                  style={{
                    height: `${Math.max(intensity * 28, cnt ? 4 : 0)}px`,
                    background: d.isWeekend
                      ? "#e5e7eb"
                      : `rgba(67, 56, 202, ${0.25 + intensity * 0.7})`,
                  }}
                />
              </div>
            );
          })}

          <div className="sticky left-0 z-[2] flex items-center border-b border-r border-gray-200 bg-white px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Day
            </span>
          </div>
          {days.map((d, di) => (
            <div
              key={di}
              className={`relative border-b border-gray-200 bg-white px-0 pb-1.5 pt-1 text-center ${
                d.isWeekend ? "bg-[#fafaf9] text-gray-500" : ""
              } ${d.isToday ? "bg-orange-50" : ""}`}
            >
              {d.monthStart && (
                <div className="absolute left-0 top-[-1px] rounded-br border-b border-r border-gray-200 bg-white px-1 font-mono text-[9px] font-semibold text-gray-500">
                  {d.monthLabel}
                </div>
              )}
              {d.isToday && (
                <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500" />
              )}
              <div className="mt-0.5 font-mono text-[11px] font-semibold text-gray-900">
                {d.dom}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500">
                {d.weekday}
              </div>
            </div>
          ))}

          {employees.map((emp) => (
            <Fragment key={emp.id}>
              <div className="sticky left-0 z-[1] flex min-w-0 items-center gap-2 border-b border-r border-gray-200 bg-white px-3 py-2">
                <EmployeeAvatar
                  first={emp.firstName}
                  last={emp.lastName}
                  color={emp.avatarColor}
                  size={24}
                />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-gray-900">
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div className="truncate text-[10.5px] text-gray-500">
                    {emp.role}
                  </div>
                </div>
              </div>
              {days.map((d, di) => {
                const lv = leaveOnDay(emp.id, d.date);
                return (
                  <div
                    key={di}
                    className={`flex border-b border-gray-200 p-1 ${
                      d.isWeekend ? "bg-[#fafaf9]" : "bg-white"
                    } ${d.isToday ? "bg-amber-50/50" : ""}`}
                    title={
                      lv
                        ? `${emp.firstName}: ${LEAVE_TYPE_LABELS[lv.type]} (${lv.startDate} → ${lv.endDate})`
                        : `${emp.firstName} working ${d.date}`
                    }
                  >
                    {lv && !d.isWeekend && (
                      <div
                        className="grid flex-1 place-items-center rounded-[3px] text-white"
                        style={{ background: LEAVE_TYPE_CHART_COLORS[lv.type] }}
                      >
                        <span className="font-mono text-[10px] font-bold">
                          {LEAVE_TYPE_SHORT_LABELS[lv.type]}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {employees.length < DIRECTORY.length && (
        <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
          <span>
            Showing {employees.length} of{" "}
            {selectedDept === "All" || !selectedDept
              ? DIRECTORY.length
              : employees.length}{" "}
            people
            {selectedDept && selectedDept !== "All" ? ` in ${selectedDept}` : ""}
          </span>
          <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Open in calendar
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export .ics
        </Button>
      </div>
    </div>
  );
}
