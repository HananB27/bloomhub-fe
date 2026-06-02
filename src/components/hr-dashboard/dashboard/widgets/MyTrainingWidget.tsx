import { Book, ChevronRight } from "lucide-react";

import { formatCurrency } from "@/utils";
import type { MyTrainingBudget, MyTrainingItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { ProgressBar } from "./ProgressBar";

interface Props {
  training: MyTrainingBudget;
  onViewAll?: () => void;
}

const STATUS_BADGE: Record<MyTrainingItem["status"], string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Requested: "bg-amber-50 text-amber-700",
  Pending: "bg-gray-100 text-gray-700",
};

export function MyTrainingWidget({ training, onViewAll }: Props) {
  const remaining = Math.max(training.budgetTotal - training.budgetUsed, 0);
  return (
    <DashboardCard
      title="Training & development"
      kicker={`${formatCurrency(remaining, training.currency)} budget left`}
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
      <div>
        <ProgressBar
          value={training.budgetUsed}
          max={training.budgetTotal}
          height={8}
        />
        <div className="mt-1.5 flex justify-between text-[11.5px] text-gray-700">
          <span>
            {formatCurrency(training.budgetUsed, training.currency)} used
          </span>
          <span className="text-gray-600">
            {formatCurrency(training.budgetTotal, training.currency)} / year
          </span>
        </div>
      </div>
      <div className="mt-3">
        {training.items.length === 0 ? (
          <div className="py-2 text-sm text-gray-600">No training entries.</div>
        ) : (
          training.items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0 last:pb-0"
            >
              <span className="inline-grid h-[30px] w-[30px] place-items-center rounded-lg bg-gray-100 text-gray-700">
                <Book className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {it.name}
                </div>
                <div className="text-[11.5px] text-gray-600">
                  {it.kind} · {formatCurrency(it.cost, training.currency)}
                </div>
              </div>
              <span
                className={`rounded px-2 py-[3px] text-[11px] font-semibold ${STATUS_BADGE[it.status]}`}
              >
                {it.status}
              </span>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}
