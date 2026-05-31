"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  RefreshCcw,
  Shield,
  X,
} from "lucide-react";
import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
  type LeaveType,
} from "@/types/vacations";
import type { LeaveAnalyticsYearTotals } from "@/types/leaveAnalytics";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useLeaveAnalyticsData } from "@/hooks/useLeaveAnalyticsData";
import { useTeamAvailability } from "@/hooks/useTeamAvailability";
import { leaveAnalyticsApi } from "@/lib/api/modules/leave-analytics";
import { projectApi, type Project } from "@/lib/api/modules/projects";
import {
  NotificationMessages,
  notifyApiError,
  withNotification,
} from "@/utils/notificationHelpers";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  DepartmentBreakdown,
  EmployeeHistoryTable,
  KpiRow,
  MonthlyTrendChart,
  TeamAvailabilityHeatmap,
  TypeBreakdownDonut,
  YearOverYearStrip,
} from "./leave-analytics";
import { triggerAnalyticsRefresh } from "./leave-analytics/analyticsModuleLoaders";

const ALL_DEPARTMENTS_SENTINEL = "all";
const ALL_MONTHS_SENTINEL = "all";
const ALL_PROJECTS_SENTINEL = "all";
const AVAILABILITY_WINDOW_DAYS = 35;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
}));

function _toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function _availabilityWindow(): { startDate: string; endDate: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 3);
  const end = new Date(start);
  end.setDate(end.getDate() + AVAILABILITY_WINDOW_DAYS - 1);
  return { startDate: _toISODate(start), endDate: _toISODate(end) };
}

const ALL_TYPE_IDS = new Set<LeaveType>(ALL_LEAVE_TYPES);

const TAB_TRIGGER_CLASSES =
  "gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3.5 py-2.5 text-[13px] font-medium text-gray-500 shadow-none -mb-px data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-gray-900 data-[state=active]:shadow-none hover:text-gray-900";

interface AnalyticsModuleProps {
  onNavigate?: (moduleId: string) => void;
}

export function AnalyticsModule({ onNavigate }: AnalyticsModuleProps = {}) {
  const currentYearAnchor = new Date().getFullYear();
  const [year, setYear] = useState(currentYearAnchor);
  const [activeTypes, setActiveTypes] = useState<Set<LeaveType>>(
    new Set(ALL_TYPE_IDS)
  );
  const [tab, setTab] = useState<"overview" | "availability" | "history">(
    "overview"
  );
  const [deptFilter, setDeptFilter] = useState<string>(
    ALL_DEPARTMENTS_SENTINEL
  );
  const [availabilityProject, setAvailabilityProject] = useState<string>(
    ALL_PROJECTS_SENTINEL
  );
  const [projectOptions, setProjectOptions] = useState<Project[]>([]);
  const availabilityWindow = useMemo(() => _availabilityWindow(), []);
  const [monthFilter, setMonthFilter] = useState<string>(ALL_MONTHS_SENTINEL);
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scope = useMemo(
    () => ({
      department:
        deptFilter === ALL_DEPARTMENTS_SENTINEL ? undefined : deptFilter,
      month:
        monthFilter === ALL_MONTHS_SENTINEL ? undefined : Number(monthFilter),
    }),
    [deptFilter, monthFilter]
  );

  const { isAdmin } = useAdminAccess();

  const data = useLeaveAnalyticsData(year, scope);
  const prevData = useLeaveAnalyticsData(year - 1, scope);

  useEffect(() => {
    if (!isAdmin) {
      setDeptOptions([]);
      return;
    }
    let cancelled = false;
    leaveAnalyticsApi
      .departments({ year })
      .then((rows) => {
        if (cancelled) return;
        const names = rows
          .map((r) => r.department)
          .filter((d): d is string => Boolean(d));
        setDeptOptions(Array.from(new Set(names)).sort());
      })
      .catch(() => {
        if (!cancelled) setDeptOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [year, isAdmin]);

  useEffect(() => {
    if (!isAdmin && deptFilter !== ALL_DEPARTMENTS_SENTINEL) {
      setDeptFilter(ALL_DEPARTMENTS_SENTINEL);
    }
  }, [isAdmin, deptFilter]);

  useEffect(() => {
    const controller = new AbortController();
    projectApi
      .list({ page_size: 100 }, { signal: controller.signal })
      .then((response) => setProjectOptions(response.results))
      .catch(() => setProjectOptions([]));
    return () => controller.abort();
  }, []);

  const availability = useTeamAvailability({
    startDate: availabilityWindow.startDate,
    endDate: availabilityWindow.endDate,
    project:
      availabilityProject === ALL_PROJECTS_SENTINEL
        ? undefined
        : Number(availabilityProject),
  });

  const hasActiveFilter =
    deptFilter !== ALL_DEPARTMENTS_SENTINEL ||
    monthFilter !== ALL_MONTHS_SENTINEL;

  const clearFilters = () => {
    setDeptFilter(ALL_DEPARTMENTS_SENTINEL);
    setMonthFilter(ALL_MONTHS_SENTINEL);
  };

  useEffect(() => {
    if (data.error) notifyApiError(new Error(data.error));
  }, [data.error]);

  const toggleType = (id: LeaveType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) return new Set(ALL_TYPE_IDS);
      return next;
    });
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await withNotification(
        triggerAnalyticsRefresh({ yearFrom: year, yearTo: year }),
        NotificationMessages.PROCESSING,
        NotificationMessages.UPDATED_SUCCESS,
        "Failed to refresh leave analytics"
      );
      data.refresh();
      prevData.refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportItems: {
    id: string;
    icon: ReactNode;
    title: string;
    subtitle: string;
  }[] = [
    {
      id: "csv",
      icon: <FileText className="h-3.5 w-3.5" />,
      title: `Leave_Analytics_${year}.csv`,
      subtitle: "All leave entries, raw rows",
    },
    {
      id: "pdf",
      icon: <FileText className="h-3.5 w-3.5" />,
      title: `Workforce_Report_${year}.pdf`,
      subtitle: "Formatted report with charts",
    },
    {
      id: "xlsx",
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
      title: `By_Employee_${year}.xlsx`,
      subtitle: "Per-employee breakdown",
    },
    {
      id: "ical",
      icon: <CalendarIcon className="h-3.5 w-3.5" />,
      title: "Team_availability.ics",
      subtitle: "Approved leave as calendar feed",
    },
  ];

  const yoy: LeaveAnalyticsYearTotals[] = data.yearOverYear.length
    ? data.yearOverYear
    : [];

  const minYear = Math.min(currentYearAnchor - 2, 2024);
  const headerCount = data.employees.length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-1">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Analytics</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-gray-900">Leave Analytics</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">
              Leave Analytics &amp; History
            </h1>
            <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded bg-gray-100 px-2 font-mono text-xs font-semibold text-gray-600">
              {(data.yearlyTotals?.total ?? 0).toLocaleString()}
            </span>
            {data.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <p className="mt-2 text-[13px] text-gray-500">
            {isAdmin
              ? `Aggregate insights for workforce planning · ${
                  data.yearlyTotals?.total ?? 0
                } working days across ${headerCount} employees`
              : `Your personal leave history · ${
                  data.yearlyTotals?.total ?? 0
                } working days taken this year`}
          </p>
          {!isAdmin && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              <Shield className="h-3 w-3" />
              Showing only your own leave records
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-gray-300 bg-white p-[3px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= minYear}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[56px] px-2 text-center font-mono text-sm font-semibold text-gray-900">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= currentYearAnchor}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 rounded-lg text-[13px]">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-1.5">
              <DropdownMenuLabel className="flex items-center gap-2 px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <Download className="h-3.5 w-3.5" />
                Export
              </DropdownMenuLabel>
              {exportItems.map((i) => (
                <DropdownMenuItem
                  key={i.id}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 focus:bg-gray-100"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-gray-100 text-gray-600">
                    {i.icon}
                  </span>
                  <span className="flex flex-1 flex-col gap-px">
                    <span className="font-mono text-xs font-semibold text-gray-900">
                      {i.title}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {i.subtitle}
                    </span>
                  </span>
                  <Download className="h-3 w-3 text-gray-400" />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] text-gray-500">
                <Shield className="h-3 w-3" />
                <span>
                  HR-only exports include salary-linked leave (parental,
                  unpaid).
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="h-9 rounded-lg text-[13px]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Report filters
        </span>
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <label className="text-[12px] font-medium text-gray-700">
              Department
            </label>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-8 w-44 text-[12px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS_SENTINEL}>
                  All departments
                </SelectItem>
                {deptOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <label className="text-[12px] font-medium text-gray-700">Month</label>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-8 w-36 text-[12px]">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MONTHS_SENTINEL}>All months</SelectItem>
              {MONTH_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-[12px] text-gray-600"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
        <span className="ml-auto font-mono text-[11px] text-gray-500">
          {hasActiveFilter
            ? `Scoped: ${
                isAdmin
                  ? `${
                      deptFilter !== ALL_DEPARTMENTS_SENTINEL
                        ? deptFilter
                        : "all depts"
                    } · `
                  : ""
              }${
                monthFilter !== ALL_MONTHS_SENTINEL
                  ? MONTH_OPTIONS[Number(monthFilter) - 1].label
                  : "all months"
              }`
            : "No filters applied"}
        </span>
      </div>

      <div className="mb-4">
        <KpiRow
          year={year}
          current={data.yearlyTotals}
          previous={prevData.yearlyTotals}
          isAdmin={isAdmin}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="mb-3 flex items-center border-b border-gray-200">
          <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className={TAB_TRIGGER_CLASSES}>
              <BarChart3 className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="availability" className={TAB_TRIGGER_CLASSES}>
              <CalendarIcon className="h-3.5 w-3.5" />
              Team availability
            </TabsTrigger>
            <TabsTrigger value="history" className={TAB_TRIGGER_CLASSES}>
              <History className="h-3.5 w-3.5" />
              {isAdmin ? "Per-employee history" : "My leave history"}
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto pr-1 font-mono text-[11px] text-gray-500">
            Working days only · Mon–Fri
          </div>
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Monthly trend
                  </div>
                  <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                    Leave days per month — {year}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ALL_LEAVE_TYPES.map((id) => {
                    const active = activeTypes.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleType(id)}
                        className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          active
                            ? "border-gray-200 bg-white font-semibold text-gray-900"
                            : "border-transparent bg-gray-100 text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-sm"
                          style={{ background: LEAVE_TYPE_CHART_COLORS[id] }}
                        />
                        {LEAVE_TYPE_LABELS[id]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <MonthlyTrendChart
                year={year}
                rows={data.monthlyTrend}
                activeTypes={activeTypes}
              />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Breakdown by type
                  </div>
                  <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                    {year} composition
                  </h2>
                </div>
              </div>
              <TypeBreakdownDonut
                yearlyTotals={data.yearlyTotals}
                activeTypes={activeTypes}
                onToggleType={toggleType}
              />
              <div className="mt-3.5 border-t border-dashed border-gray-200 pt-3.5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  3-year trend
                </div>
                <YearOverYearStrip data={yoy} />
              </div>
            </section>
          </div>

          {isAdmin && (
            <section className="mt-3.5 rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Department breakdown
                  </div>
                  <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                    Leave by department — {year}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs font-semibold text-gray-900 hover:text-gray-900"
                >
                  <Download className="h-3 w-3 text-gray-900" />
                  CSV
                </Button>
              </div>
              <DepartmentBreakdown
                rows={data.departments}
                activeTypes={activeTypes}
              />
            </section>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-0">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  Team availability
                </div>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                  Who&apos;s out — next 5 weeks
                </h2>
                <p className="mt-1 text-[12px] text-gray-500">
                  {availabilityWindow.startDate} → {availabilityWindow.endDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] font-medium text-gray-700">
                  Project
                </label>
                <Select
                  value={availabilityProject}
                  onValueChange={setAvailabilityProject}
                >
                  <SelectTrigger className="h-8 w-56 text-[12px]">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_PROJECTS_SENTINEL}>
                      All projects
                    </SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TeamAvailabilityHeatmap
              data={availability.data}
              isLoading={availability.isLoading}
              error={availability.error}
            />
          </section>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  {isAdmin ? "Per-employee leave history" : "My leave history"}
                </div>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                  {isAdmin ? `All employees — ${year}` : `${year}`}
                </h2>
              </div>
            </div>
            <EmployeeHistoryTable
              year={year}
              rows={data.employees}
              onNavigate={onNavigate}
            />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
