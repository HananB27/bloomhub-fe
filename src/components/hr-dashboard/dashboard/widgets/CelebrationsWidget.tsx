import { Cake, Sparkles } from "lucide-react";

import { daysUntil, formatDateShort } from "@/utils";
import type { CelebrationItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";

interface Props {
  items: CelebrationItem[];
}

const ICON_TONE = {
  birthday: "bg-rose-50 text-rose-600",
  anniversary: "bg-indigo-50 text-indigo-600",
} as const;

function labelFor(date: string): string {
  const d = daysUntil(date);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return formatDateShort(date);
}

export function CelebrationsWidget({ items }: Props) {
  return (
    <DashboardCard title="Celebrations" kicker="This month">
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">
          No upcoming celebrations.
        </div>
      ) : (
        <div>
          {items.map((c, idx) => {
            const Icon = c.kind === "birthday" ? Cake : Sparkles;
            const soon = daysUntil(c.date) <= 1;
            return (
              <div
                key={`${c.employeeId}-${idx}`}
                className="flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0"
              >
                <span
                  className={`inline-grid h-[30px] w-[30px] place-items-center rounded-full ${ICON_TONE[c.kind]}`}
                >
                  <Icon className="h-[15px] w-[15px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {c.employeeName}
                  </div>
                  <div className="text-[11.5px] text-gray-600">
                    {c.kind === "birthday"
                      ? "Birthday"
                      : `${c.years ?? "—"} years at Bloomteq`}
                  </div>
                </div>
                <span
                  className={`whitespace-nowrap text-xs font-semibold ${
                    soon ? "text-indigo-600" : "text-gray-600"
                  }`}
                >
                  {labelFor(c.date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
