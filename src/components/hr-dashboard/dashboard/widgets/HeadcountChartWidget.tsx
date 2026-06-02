import { ChevronRight } from "lucide-react";

import type { HeadcountRow } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { ProgressBar } from "./ProgressBar";

interface Props {
  total: number;
  rows: HeadcountRow[];
  onViewAnalytics?: () => void;
}

export function HeadcountChartWidget({ total, rows, onViewAnalytics }: Props) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <DashboardCard
      title="Headcount by department"
      kicker={`${total} active employees`}
      action={
        <button
          type="button"
          onClick={onViewAnalytics}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          Analytics
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">
          No headcount data available.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div
              key={r.department}
              className="grid grid-cols-[120px_1fr_34px] items-center gap-3"
            >
              <span className="truncate text-[12.5px] text-gray-600">
                {r.department}
              </span>
              <ProgressBar value={r.count} max={max} height={8} />
              <span className="text-right font-mono text-[12.5px] font-semibold text-gray-900">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
