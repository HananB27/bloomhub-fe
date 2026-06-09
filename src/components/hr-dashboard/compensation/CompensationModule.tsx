"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Download, UserPlus, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import {
  compensationApi,
  type CompensationOverview,
} from "@/lib/api/compensation";
import { CompensationFilterBar } from "./CompensationFilterBar";
import type { CompensationFilters } from "./CompensationFilterBar";
import { CompensationMixPanel } from "./CompensationMixPanel";
import { CompensationReportsTab } from "./CompensationReportsTab";
import { CompensationSkeleton } from "./CompensationSkeleton";
import { CompensationTable } from "./CompensationTable";
import type { SortState } from "./CompensationTable";
import { SalaryDistributionPanel } from "./SalaryDistributionPanel";
import { StatBadge, StatCard } from "./StatCard";
import { LogBonusDialog } from "./LogBonusDialog";
import { BonusIncentivesTab } from "./BonusIncentivesTab";
import { SalaryBandsTab } from "./SalaryBandsTab";
import { computeSalaryBands, toLegacyBands } from "./salaryBands";
import { exportCompensationCsv } from "./exportCompensationCsv";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";
import "./compensation.css";

type TabId = "overview" | "bands" | "bonuses" | "reports";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "bands", label: "Salary Bands" },
  { id: "bonuses", label: "Bonus & Incentives" },
  { id: "reports", label: "Reports" },
];

const DEFAULT_FILTERS: CompensationFilters = {
  department: "All",
  status: "All",
  search: "",
};

function bam(n: number): string {
  return `BAM ${n.toLocaleString("en-US")}`;
}

function pctLabel(value: number, suffix: string): string {
  if (value > 0) return `▲ ${value.toFixed(2)}%`;
  if (value < 0) return `▼ ${Math.abs(value).toFixed(2)}%`;
  return `— 0.00%${suffix ? "" : ""}`;
}

function roleFrom(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const candidate = value as { name?: unknown; role?: unknown };
    if (typeof candidate.name === "string") return candidate.name;
    if (typeof candidate.role === "string") return candidate.role;
  }
  return null;
}

interface CompensationModuleProps {
  onNavigate?: (moduleId: string) => void;
}

export function CompensationModule({
  onNavigate,
}: CompensationModuleProps = {}) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const sessionUser = (
    session as {
      user?: {
        role?: unknown;
        career_level?: unknown;
        is_staff?: boolean | null;
        is_superuser?: boolean | null;
      };
    } | null
  )?.user;
  const role =
    roleFrom(sessionUser?.role) ?? roleFrom(sessionUser?.career_level);
  const canAccessCompensation = Boolean(
    sessionUser?.is_staff || sessionUser?.is_superuser || isHrLikeRole(role)
  );
  const [overview, setOverview] = useState<CompensationOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [filters, setFilters] = useState<CompensationFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: "salary", dir: "desc" });
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openEmployee = useCallback(
    (employeeId: number) => {
      router.push(`/employee/${employeeId}`);
    },
    [router]
  );

  useEffect(() => {
    if (!updatedAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [updatedAt]);

  const loadOverview = useCallback(async (signal?: { cancelled: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await compensationApi.getOverview();
      if (signal?.cancelled) return;
      setOverview(data);
      setUpdatedAt(new Date());
    } catch (err) {
      if (signal?.cancelled) return;
      const message =
        err instanceof Error ? err.message : "Failed to load compensation";
      setError(message);
      toast.error(message);
    } finally {
      if (!signal?.cancelled) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!canAccessCompensation) {
      setOverview(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const signal = { cancelled: false };
    loadOverview(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [canAccessCompensation, loadOverview, sessionStatus]);

  const filteredRows = useMemo(() => {
    if (!overview) return [];
    const normalizedStatus =
      filters.status === "On Leave" ? "OnLeave" : filters.status;
    const query = filters.search.trim().toLowerCase();
    return overview.employees.filter((e) => {
      if (filters.department !== "All" && e.dept !== filters.department) {
        return false;
      }
      if (normalizedStatus !== "All" && e.status !== normalizedStatus) {
        return false;
      }
      if (query) {
        const haystack = `${e.name} ${e.title} ${e.dept}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [overview, filters]);

  const sortedRows = useMemo(() => {
    const accessors: Record<
      SortState["key"],
      (e: (typeof filteredRows)[number]) => string | number
    > = {
      name: (e) => e.name.toLowerCase(),
      dept: (e) => e.dept.toLowerCase(),
      salary: (e) => e.salary,
      bonus: (e) => e.bonus,
      last: (e) => e.last,
      next: (e) => e.next,
      status: (e) => e.status,
    };
    const get = accessors[sort.key];
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  }, [filteredRows, sort]);

  const updatedAtLabel = useMemo(() => {
    if (!updatedAt || now === null) return "";
    const diffMs = now - updatedAt.getTime();
    const mins = Math.max(1, Math.round(diffMs / 60_000));
    return mins === 1 ? "Updated 1 min ago" : `Updated ${mins} min ago`;
  }, [updatedAt, now]);

  if (sessionStatus === "loading" || (isLoading && !overview)) {
    return <CompensationSkeleton />;
  }

  if (!canAccessCompensation) {
    return (
      <div className="mx-auto max-w-[1480px] px-7 pb-12 pt-6">
        <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-6 text-sm text-[#52525b]">
          <div className="mb-1 text-base font-semibold text-[#171717]">
            HR-only view
          </div>
          Compensation data is available to HR and administrators only.
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="mx-auto max-w-[1480px] px-7 pb-12 pt-6">
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-5 py-6 text-sm text-[#b91c1c]">
          {error}
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const { stats, mix } = overview;

  const departmentOptions = (() => {
    const set = new Set<string>();
    for (const e of overview.employees) {
      const d = (e.dept ?? "").trim();
      if (d) set.add(d);
    }
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  })();

  // Dynamic bands derived from actual employee comp data. 6 equal-width
  // buckets between the min and max effective salary, recomputed whenever
  // overview refreshes so distribution responds to data changes.
  const bands = toLegacyBands(computeSalaryBands(overview.employees));

  return (
    <div className="mx-auto w-full max-w-[1480px] px-7 pb-12 pt-6 text-[#171717]">
      {/* Page header */}
      <header className="mb-[18px]">
        <div className="mb-[18px] flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-bold leading-[1.1] tracking-[-0.025em]">
              Compensation
            </h1>
            <p className="mt-1.5 text-[13px] text-[#6b7280]">
              Salaries, bonuses, and review cycles across Bloomteq · Q2 2026
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#d1d5db] bg-white px-3 text-[13px] font-medium text-[#171717] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                if (!sortedRows.length) {
                  toast.error("Nothing to export — adjust filters");
                  return;
                }
                exportCompensationCsv(sortedRows);
                toast.success(`Exported ${sortedRows.length} employees to CSV`);
              }}
              disabled={!sortedRows.length}
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button
              type="button"
              className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#d1d5db] bg-white px-3 text-[13px] font-medium text-[#171717] transition-colors hover:bg-[#f3f4f6]"
              onClick={() => setBonusDialogOpen(true)}
            >
              <PlusCircle className="h-3.5 w-3.5" /> Log bonus
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#171717] bg-[#171717] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("profiles");
                } else {
                  toast.error("Navigation unavailable");
                }
              }}
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Employee
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="mb-3.5 flex items-center gap-0.5 rounded-xl border border-[#e5e7eb] bg-white p-[5px]"
        role="tablist"
      >
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#171717] text-white"
                  : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#171717]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <div className="flex-1" />
        {updatedAtLabel ? (
          <span className="comp-mono px-3 text-[11px] text-[#6b7280]">
            {updatedAtLabel}
          </span>
        ) : null}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="mb-[18px] grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              delayMs={40}
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                  <path d="M6 10v4M18 10v4" />
                </svg>
              }
              label="Total monthly payroll"
              value={bam(stats.totalMonthly)}
              badge={
                <StatBadge tone={stats.monthlyDeltaPct >= 0 ? "up" : "down"}>
                  {pctLabel(stats.monthlyDeltaPct, "")}
                </StatBadge>
              }
              caption="vs. last month"
            />
            <StatCard
              delayMs={100}
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
              }
              label="Average gross salary"
              value={bam(stats.avgSalary)}
              badge={
                <StatBadge tone={stats.avgYoyPct >= 0 ? "up" : "down"}>
                  {pctLabel(stats.avgYoyPct, "")}
                </StatBadge>
              }
              caption="YoY"
            />
            <StatCard
              delayMs={160}
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h18M7 6v12M17 6v12" />
                </svg>
              }
              label="Median gross salary"
              value={bam(stats.medianSalary)}
              badge={
                <StatBadge
                  tone={
                    stats.medianQoqPct === 0
                      ? "neutral"
                      : stats.medianQoqPct > 0
                        ? "up"
                        : "down"
                  }
                >
                  {pctLabel(stats.medianQoqPct, "")}
                </StatBadge>
              }
              caption="stable QoQ"
            />
            <StatCard
              delayMs={220}
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              }
              label="Pending salary reviews"
              value={String(stats.pendingReviews)}
              badge={
                <StatBadge tone="down">
                  ▲ {stats.overdueReviews} overdue
                </StatBadge>
              }
              caption="action needed"
            />
          </div>

          <div className="mb-[18px] grid grid-cols-1 gap-3 lg:grid-cols-[6fr_4fr]">
            <SalaryDistributionPanel
              bands={bands}
              totalEmployees={stats.totalEmployees}
            />
            <CompensationMixPanel mix={mix} />
          </div>

          <CompensationFilterBar
            filters={filters}
            onChange={setFilters}
            visibleCount={sortedRows.length}
            totalCount={overview.employees.length}
            departmentOptions={departmentOptions}
          />
          <CompensationTable
            rows={sortedRows}
            sort={sort}
            onSort={setSort}
            onOpenEmployee={openEmployee}
          />
        </>
      ) : activeTab === "bonuses" ? (
        <BonusIncentivesTab
          refreshKey={refreshKey}
          onOpenEmployee={openEmployee}
        />
      ) : activeTab === "bands" ? (
        <SalaryBandsTab
          employees={overview.employees}
          onOpenEmployee={openEmployee}
        />
      ) : (
        <CompensationReportsTab
          overview={overview}
          bands={bands}
          generatedAt={updatedAt}
        />
      )}

      <LogBonusDialog
        open={bonusDialogOpen}
        onOpenChange={setBonusDialogOpen}
        employees={overview.employees}
        onLogged={() => {
          setRefreshKey((k) => k + 1);
          loadOverview();
        }}
      />
    </div>
  );
}
