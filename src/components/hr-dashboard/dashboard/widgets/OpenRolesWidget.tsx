import { ChevronRight } from "lucide-react";

import { OPEN_ROLE_MATCH_LABELS, type OpenRoleItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";

interface Props {
  items: OpenRoleItem[];
  onViewBoard?: () => void;
}

const MATCH_TONE: Record<OpenRoleItem["matchStrength"], string> = {
  strong: "bg-indigo-50 text-indigo-700",
  stretch: "bg-gray-100 text-gray-600",
  match: "bg-emerald-50 text-emerald-700",
};

export function OpenRolesWidget({ items, onViewBoard }: Props) {
  return (
    <DashboardCard
      title="Open internal roles"
      kicker="Mobility"
      action={
        <button
          type="button"
          onClick={onViewBoard}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          Board
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">No open roles.</div>
      ) : (
        <div>
          {items.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2.5 border-b border-gray-200 py-2 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {r.title}
                </div>
                <div className="text-[11.5px] text-gray-600">
                  {r.department} · {r.level}
                </div>
              </div>
              <span
                className={`whitespace-nowrap rounded px-2 py-[3px] text-[11px] font-semibold ${MATCH_TONE[r.matchStrength]}`}
              >
                {OPEN_ROLE_MATCH_LABELS[r.matchStrength]}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
