"use client";

import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Shield,
  Sliders,
} from "lucide-react";
import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
  type LeaveType,
} from "@/types/vacations";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  ANCHOR_TODAY,
  DIRECTORY,
  DepartmentBreakdown,
  EmployeeHistoryTable,
  KpiRow,
  LEAVES,
  MonthlyTrendChart,
  TeamAvailabilityHeatmap,
  TypeBreakdownDonut,
  YearOverYearStrip,
} from "./leave-analytics";

const ALL_TYPE_IDS = new Set<LeaveType>(ALL_LEAVE_TYPES);

const TAB_TRIGGER_CLASSES =
  "gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3.5 py-2.5 text-[13px] font-medium text-gray-500 shadow-none -mb-px data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-gray-900 data-[state=active]:shadow-none hover:text-gray-900";

export function AnalyticsModule() {
  const [year, setYear] = useState(ANCHOR_TODAY.getFullYear());
  const [activeTypes, setActiveTypes] = useState<Set<LeaveType>>(new Set(ALL_TYPE_IDS));
  const [tab, setTab] = useState<"overview" | "availability" | "history">("overview");
  const [selectedDept, setSelectedDept] = useState<string>("All");

  const toggleType = (id: LeaveType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) return new Set(ALL_TYPE_IDS);
      return next;
    });
  };

  const approvedCount = LEAVES.filter((l) => l.status === "approved").length;

  const exportItems: { id: string; icon: ReactNode; title: string; subtitle: string }[] = [
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
              {LEAVES.length.toLocaleString()}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-gray-500">
            Aggregate insights for workforce planning · {approvedCount} approved
            leave events across {DIRECTORY.length} employees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-gray-300 bg-white p-[3px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= 2024}
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
              disabled={year >= ANCHOR_TODAY.getFullYear()}
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
                    <span className="text-[11px] text-gray-500">{i.subtitle}</span>
                  </span>
                  <Download className="h-3 w-3 text-gray-400" />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] text-gray-500">
                <Shield className="h-3 w-3" />
                <span>
                  HR-only exports include salary-linked leave (parental, unpaid).
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="h-9 rounded-lg bg-gray-900 text-[13px] hover:bg-black">
            <Sliders className="h-3.5 w-3.5" />
            Configure report
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <KpiRow year={year} />
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
              Per-employee history
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
              <MonthlyTrendChart year={year} activeTypes={activeTypes} />
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
                year={year}
                activeTypes={activeTypes}
                onToggleType={toggleType}
              />
              <div className="mt-3.5 border-t border-dashed border-gray-200 pt-3.5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  3-year trend
                </div>
                <YearOverYearStrip />
              </div>
            </section>
          </div>

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
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                <Download className="h-3 w-3" />
                CSV
              </Button>
            </div>
            <DepartmentBreakdown year={year} activeTypes={activeTypes} />
          </section>
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
              </div>
            </div>
            <TeamAvailabilityHeatmap
              selectedDept={selectedDept}
              onSelectDept={setSelectedDept}
            />
          </section>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  Per-employee leave history
                </div>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">
                  All employees — {year}
                </h2>
              </div>
            </div>
            <EmployeeHistoryTable year={year} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
