import { ChevronRight } from "lucide-react";

import { daysUntil, formatDateShort } from "@/utils";
import type { ReviewsDueItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { InitialsAvatar } from "./InitialsAvatar";

interface Props {
  items: ReviewsDueItem[];
  onViewAll?: () => void;
}

const SOON_THRESHOLD_DAYS = 5;

export function ReviewsDueWidget({ items, onViewAll }: Props) {
  return (
    <DashboardCard
      title="Reviews to conduct"
      kicker="Scheduled"
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">No reviews scheduled.</div>
      ) : (
        <div>
          {items.map((r) => {
            const d = daysUntil(r.dueDate);
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 border-b border-gray-200 py-2.5 last:border-b-0 last:pb-0"
              >
                <InitialsAvatar name={r.employeeName} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {r.employeeName}
                  </div>
                  <div className="text-[11.5px] text-gray-600">
                    {r.kind} · {r.role}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`block text-[12.5px] font-semibold ${
                      d <= SOON_THRESHOLD_DAYS
                        ? "text-amber-700"
                        : "text-gray-900"
                    }`}
                  >
                    {formatDateShort(r.dueDate)}
                  </span>
                  <span className="text-[11px] text-gray-600">
                    {d <= 0 ? "due" : `in ${d}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
