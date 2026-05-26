"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, TrendingUp, Wallet, Calendar, Users } from "lucide-react";
import {
  bonusApi,
  type BonusRecord,
  type BonusTypeId,
} from "@/lib/api/compensation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";

const BONUS_TYPE_FILTERS: { value: "all" | BonusTypeId; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "performance", label: "Performance" },
  { value: "retention", label: "Retention" },
  { value: "referral", label: "Referral" },
  { value: "project", label: "Project" },
  { value: "education", label: "Education" },
  { value: "spot", label: "Spot" },
];

const TYPE_PILL_STYLES: Record<BonusTypeId, string> = {
  performance: "bg-[#dcfce7] text-[#15803d]",
  retention: "bg-[#e0e7ff] text-[#4338ca]",
  referral: "bg-[#ffe4e6] text-[#be123c]",
  project: "bg-[#ffedd5] text-[#c2410c]",
  education: "bg-[#fef3c7] text-[#b45309]",
  spot: "bg-[#f3f4f6] text-[#4b5563]",
};

const AVATAR_PALETTE = [
  { bg: "#dcfce7", fg: "#15803d" },
  { bg: "#e0e7ff", fg: "#4338ca" },
  { bg: "#ffe4e6", fg: "#be123c" },
  { bg: "#ffedd5", fg: "#c2410c" },
  { bg: "#fef3c7", fg: "#b45309" },
];

const FILTER_LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]";

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtAmount(amount: string | number, currency: string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return `${currency} —`;
  return `${currency} ${n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarFor(name: string) {
  const hash = name
    .split("")
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export interface BonusIncentivesTabProps {
  refreshKey: number;
  onOpenEmployee?: (employeeId: number) => void;
}

export function BonusIncentivesTab({
  refreshKey,
  onOpenEmployee,
}: BonusIncentivesTabProps) {
  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | BonusTypeId>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bonusApi.list();
      setBonuses(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load bonuses";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bonuses.filter((b) => {
      if (typeFilter !== "all" && b.bonus_type !== typeFilter) return false;
      if (q) {
        const haystack =
          `${b.employee_name} ${b.reason} ${b.bonus_type_display}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [bonuses, typeFilter, search]);

  const [nowTs, setNowTs] = useState<number | null>(null);
  useEffect(() => {
    setNowTs(Date.now());
  }, [refreshKey, bonuses]);

  const summary = useMemo(() => {
    const totalAmount = filtered.reduce(
      (sum, b) => sum + (parseFloat(b.amount) || 0),
      0
    );
    const uniqueEmployees = new Set(filtered.map((b) => b.user_profile)).size;
    const last30Days = (() => {
      if (nowTs === null) return 0;
      const cutoff = nowTs - 30 * 24 * 60 * 60 * 1000;
      return filtered.filter(
        (b) => new Date(`${b.effective_date}T00:00:00`).getTime() >= cutoff
      ).length;
    })();
    return {
      count: filtered.length,
      totalAmount,
      uniqueEmployees,
      last30Days,
    };
  }, [filtered, nowTs]);

  const summaryCards: {
    label: string;
    value: string;
    icon: React.ReactNode;
  }[] = [
    {
      label: "Bonuses logged",
      value: summary.count.toLocaleString("en-US"),
      icon: <Wallet className="h-3.5 w-3.5" />,
    },
    {
      label: "Total paid",
      value: `BAM ${summary.totalAmount.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`,
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    },
    {
      label: "Employees rewarded",
      value: summary.uniqueEmployees.toLocaleString("en-US"),
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: "Last 30 days",
      value: summary.last30Days.toLocaleString("en-US"),
      icon: <Calendar className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="space-y-3">
      <div
        className="comp-rise grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
        style={{ animationDelay: "40ms" }}
      >
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-white p-4"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
              <span className="text-[#6b7280]">{card.icon}</span>
              {card.label}
            </div>
            <div className="comp-mono text-[22px] font-bold leading-[1.1] tracking-tight text-[#171717]">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="comp-rise rounded-xl border border-[#e5e7eb] bg-white"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[#171717]">
              All bonus payments
            </h2>
            <p className="mt-0.5 text-xs text-[#6b7280]">
              Click an employee to open their profile.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] px-3.5 py-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="bonus-type-filter" className={FILTER_LABEL}>
              Type
            </label>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as "all" | BonusTypeId)
              }
            >
              <SelectTrigger
                id="bonus-type-filter"
                className="h-8 min-w-[150px] rounded-lg border-[#e5e7eb] bg-white px-2.5 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BONUS_TYPE_FILTERS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-[260px] flex-1 flex-col gap-1">
            <label htmlFor="bonus-search" className={FILTER_LABEL}>
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7280]" />
              <Input
                id="bonus-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee, reason, or type"
                className="h-8 rounded-lg border-[#e5e7eb] bg-white pl-8 text-xs"
                aria-label="Search bonuses"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Employee",
                  "Type",
                  "Amount",
                  "Effective date",
                  "Reason",
                  "Logged by",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="sticky top-0 z-[2] whitespace-nowrap border-b border-[#e5e7eb] bg-[#fafaf9] px-3.5 py-[11px] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-9 py-9 text-center text-[13px] text-[#6b7280]"
                  >
                    Loading bonuses…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-9 py-9 text-center text-[13px] text-[#dc2626]"
                  >
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-9 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <p className="text-[13px] font-semibold text-[#171717]">
                        No bonuses yet
                      </p>
                      <p className="text-xs text-[#6b7280]">
                        Use the “Log bonus” button above to record the first
                        bonus payment. New entries appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const avatar = avatarFor(b.employee_name);
                  return (
                    <tr key={b.id} className="hover:bg-[#fafaf9]">
                      <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] text-[13px]">
                        <button
                          type="button"
                          onClick={() => onOpenEmployee?.(b.user_profile)}
                          disabled={!onOpenEmployee}
                          className="flex w-full items-center gap-2.5 text-left transition-colors enabled:hover:text-[#2563eb] disabled:cursor-default"
                        >
                          <div
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11.5px] font-semibold"
                            style={{
                              background: avatar.bg,
                              color: avatar.fg,
                            }}
                            aria-hidden
                          >
                            {initials(b.employee_name)}
                          </div>
                          <span className="truncate font-semibold text-[#171717]">
                            {b.employee_name}
                          </span>
                        </button>
                      </td>
                      <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] text-[13px]">
                        <span
                          className={`inline-block rounded px-1.5 py-px text-[11.5px] font-medium ${
                            TYPE_PILL_STYLES[b.bonus_type] ??
                            "bg-[#f3f4f6] text-[#171717]"
                          }`}
                        >
                          {b.bonus_type_display}
                        </span>
                      </td>
                      <td className="comp-mono border-b border-[#e5e7eb] px-3.5 py-[11px] text-[13px] font-medium text-[#171717]">
                        {fmtAmount(b.amount, b.currency)}
                      </td>
                      <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] text-[13px] text-[#6b7280]">
                        {fmtDate(b.effective_date)}
                      </td>
                      <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] text-[13px] text-[#4b5563]">
                        {b.reason || "—"}
                      </td>
                      <td className="border-b border-[#e5e7eb] px-3.5 py-[11px] text-[13px] text-[#6b7280]">
                        {b.created_by_name ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
