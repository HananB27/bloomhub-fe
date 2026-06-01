import { Fragment, useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_SHORT_LABELS,
  type LeaveType,
} from "@/types/vacations";
import type {
  LeaveAvailabilityEmployee,
  LeaveAvailabilityEntry,
  LeaveAvailabilityResponse,
} from "@/types/leaveAnalytics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const LEGEND_TYPES: LeaveType[] = [
  "vacation",
  "sick",
  "personal",
  "maternity",
  "paternity",
  "bereavement",
  "unpaid",
];

interface Props {
  data: LeaveAvailabilityResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface DayCell {
  date: string;
  dom: number;
  weekday: string;
  monthLabel: string;
  isWeekend: boolean;
  isToday: boolean;
  isMonthStart: boolean;
}

const MONTH_DIVIDER_CLASS = "border-l-2 border-l-gray-500";

function _toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function _enumerateDays(startISO: string, endISO: string): DayCell[] {
  if (!startISO || !endISO) return [];
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const todayISO = _toLocalISO(new Date());
  const out: DayCell[] = [];
  const cursor = new Date(start);
  // Treat the very first column as a month boundary only if it actually IS the
  // 1st of the month — otherwise the divider would draw on column 0 by mistake.
  while (cursor <= end) {
    const iso = _toLocalISO(cursor);
    const weekday = cursor.toLocaleDateString("en-US", { weekday: "short" });
    out.push({
      date: iso,
      dom: cursor.getDate(),
      weekday: weekday.charAt(0),
      monthLabel: cursor.toLocaleDateString("en-US", { month: "short" }),
      isWeekend: cursor.getDay() === 0 || cursor.getDay() === 6,
      isToday: iso === todayISO,
      isMonthStart: cursor.getDate() === 1,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function _entryCoveringDay(
  employee: LeaveAvailabilityEmployee,
  iso: string
): LeaveAvailabilityEntry | undefined {
  return employee.entries.find(
    (entry) => entry.windowStart <= iso && entry.windowEnd >= iso
  );
}

function _firstInitial(value: string): string {
  return (value || "?").charAt(0).toUpperCase();
}

export function TeamAvailabilityHeatmap({ data, isLoading, error }: Props) {
  const days = useMemo(
    () =>
      _enumerateDays(data?.range.startDate ?? "", data?.range.endDate ?? ""),
    [data?.range.startDate, data?.range.endDate]
  );
  const dailyByDate = useMemo(() => {
    const map = new Map<string, LeaveAvailabilityResponse["daily"][number]>();
    (data?.daily ?? []).forEach((d) => map.set(d.date, d));
    return map;
  }, [data?.daily]);
  const maxDaily = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.daily.map((d) => d.onLeaveCount));
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading team availability…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data || data.employees.length === 0 || days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No team members in scope for the selected window.
      </div>
    );
  }

  const criticalDayCount = data.daily.filter((d) => d.isCritical).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          <span>
            {data.range.headcount}{" "}
            {data.range.headcount === 1 ? "member" : "members"}
            {data.range.projectName
              ? ` in ${data.range.projectName}`
              : ""} · {data.range.workingDaysCount} working{" "}
            {data.range.workingDaysCount === 1 ? "day" : "days"}
          </span>
          {criticalDayCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {criticalDayCount} critical{" "}
              {criticalDayCount === 1 ? "day" : "days"} ·{" "}
              {Math.round(data.range.criticalRatio * 100)}% threshold
            </span>
          )}
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
            <span className="h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-100" />
            Critical day
          </span>
        </div>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <div
            className="grid min-w-max"
            style={{
              gridTemplateColumns: `220px repeat(${days.length}, minmax(28px, 1fr))`,
            }}
          >
            {/* Row 1 — daily out count bar */}
            <div className="sticky left-0 z-[2] flex h-9 flex-col justify-center border-b border-r border-gray-200 bg-gray-50 px-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Out per day
              </div>
              <div className="text-[10px] text-gray-500">
                {data.employees.length} people
              </div>
            </div>
            {days.map((day) => {
              const rollup = dailyByDate.get(day.date);
              const onLeave = rollup?.onLeaveCount ?? 0;
              const intensity = onLeave / maxDaily;
              const critical = (rollup?.isCritical ?? false) && !day.isWeekend;
              return (
                <Tooltip key={`bar-${day.date}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex h-9 items-end justify-center border-b border-gray-200 pb-1 ${
                        day.isWeekend ? "bg-gray-200" : "bg-gray-50"
                      } ${critical ? "bg-amber-100" : ""} ${
                        day.isToday ? "ring-1 ring-inset ring-orange-300" : ""
                      }`}
                    >
                      <div
                        className="w-3.5 rounded-t-sm"
                        style={{
                          height: `${Math.max(intensity * 28, onLeave ? 4 : 0)}px`,
                          background: day.isWeekend
                            ? "#e5e7eb"
                            : critical
                              ? "#b45309"
                              : `rgba(67, 56, 202, ${0.25 + intensity * 0.7})`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{day.date}</span>
                      <span>
                        {onLeave} on leave
                        {critical ? " · critical" : ""}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Row 2 — day number + weekday */}
            <div className="sticky left-0 z-[2] flex h-10 items-center border-b border-r border-gray-200 bg-white px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Day
              </span>
            </div>
            {days.map((day) => (
              <div
                key={`day-${day.date}`}
                className={`relative flex h-10 flex-col items-center justify-center border-b border-gray-200 bg-white px-0 text-center ${
                  day.isWeekend ? "bg-gray-200 text-gray-500" : ""
                } ${day.isToday ? "bg-orange-50" : ""} ${
                  day.isMonthStart ? MONTH_DIVIDER_CLASS : ""
                }`}
              >
                {day.isToday && (
                  <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500" />
                )}
                <div className="font-mono text-[11px] font-semibold leading-none text-gray-900">
                  {day.dom}
                </div>
                <div className="mt-0.5 text-[9px] uppercase leading-none tracking-wider text-gray-500">
                  {day.weekday}
                </div>
              </div>
            ))}

            {/* Row 4..N — employee rows */}
            {data.employees.map((emp) => {
              const [first, ...rest] = emp.employeeName.split(" ");
              const last = rest.join(" ");
              return (
                <Fragment key={emp.employeeId}>
                  <div className="sticky left-0 z-[1] flex min-w-0 items-center gap-2 border-b border-r border-gray-200 bg-white px-3 py-2">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700"
                      aria-hidden="true"
                    >
                      {_firstInitial(first)}
                      {_firstInitial(last)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-gray-900">
                        {emp.employeeName}
                      </div>
                      <div className="truncate text-[10.5px] text-gray-500">
                        {emp.role || emp.department || ""}
                      </div>
                    </div>
                  </div>
                  {days.map((day) => {
                    const entry = _entryCoveringDay(emp, day.date);
                    const critical =
                      dailyByDate.get(day.date)?.isCritical ?? false;
                    const cellClass = `flex border-b border-gray-200 p-1 ${
                      day.isWeekend ? "bg-gray-200" : "bg-white"
                    } ${critical && !day.isWeekend ? "bg-amber-50" : ""} ${
                      day.isToday ? "ring-1 ring-inset ring-orange-200" : ""
                    }`;
                    return (
                      <Tooltip key={`cell-${emp.employeeId}-${day.date}`}>
                        <TooltipTrigger asChild>
                          <div className={cellClass}>
                            {entry && !day.isWeekend && (
                              <div
                                className="grid flex-1 place-items-center rounded-[3px] text-white"
                                style={{
                                  background:
                                    LEAVE_TYPE_CHART_COLORS[entry.leaveType],
                                  opacity:
                                    entry.status === "approved" ? 1 : 0.55,
                                }}
                              >
                                <span className="font-mono text-[10px] font-bold">
                                  {LEAVE_TYPE_SHORT_LABELS[entry.leaveType]}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold">
                              {emp.employeeName} · {day.date}
                            </span>
                            {day.isWeekend ? (
                              <span className="opacity-80">Weekend</span>
                            ) : entry ? (
                              <>
                                <span>
                                  {LEAVE_TYPE_LABELS[entry.leaveType]} ·{" "}
                                  {LEAVE_STATUS_LABELS[entry.status]}
                                </span>
                                <span className="text-[10px] opacity-80">
                                  {entry.startDate} → {entry.endDate}
                                </span>
                              </>
                            ) : (
                              <span className="opacity-80">Working</span>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
