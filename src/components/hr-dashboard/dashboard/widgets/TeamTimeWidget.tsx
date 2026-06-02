import { ChevronRight } from "lucide-react";

import type { TeamTimeRow } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { InitialsAvatar } from "./InitialsAvatar";
import { ProgressBar } from "./ProgressBar";

interface Props {
  items: TeamTimeRow[];
  onViewTimeTracking?: () => void;
}

export function TeamTimeWidget({ items, onViewTimeTracking }: Props) {
  const totalLogged = items.reduce((s, t) => s + t.logged, 0);
  const totalExpected = items.reduce((s, t) => s + t.expected, 0);
  return (
    <DashboardCard
      title="Team hours this week"
      kicker={`${totalLogged} of ${totalExpected}h logged`}
      action={
        <button
          type="button"
          onClick={onViewTimeTracking}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          Time tracking
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">
          No time entries logged yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((t) => (
            <div
              key={t.employeeId}
              className="grid grid-cols-[28px_1fr_90px_34px] items-center gap-2.5"
            >
              <InitialsAvatar name={t.employeeName} size={28} />
              <span className="truncate text-[12.5px] font-medium text-gray-900">
                {t.employeeName}
              </span>
              <ProgressBar
                value={t.logged}
                max={t.expected}
                fillClassName={
                  t.logged >= t.expected ? "bg-emerald-500" : "bg-indigo-500"
                }
              />
              <span className="text-right font-mono text-xs font-semibold">
                {t.logged}h
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
