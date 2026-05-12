import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import type { ReviewStats } from "./reviewsModuleHelpers";

interface ReviewsHeaderProps {
  stats: ReviewStats;
  onSchedule: () => void;
  isAdmin: boolean;
}

interface StatCellProps {
  label: string;
  value: number;
  hint: string;
  emphasis?: "warning" | "danger";
}

function StatCell({ label, value, hint, emphasis }: StatCellProps) {
  const valueColor =
    emphasis === "danger" && value > 0
      ? "#b91c1c"
      : emphasis === "warning" && value > 0
        ? "#b45309"
        : undefined;
  return (
    <div className="px-5 py-3.5 border-r border-gray-200 last:border-r-0">
      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div
        className="text-[22px] font-semibold tracking-tight mt-1.5 tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div>
    </div>
  );
}

export function ReviewsHeader({
  stats,
  onSchedule,
  isAdmin,
}: ReviewsHeaderProps) {
  const title = isAdmin ? "Reviews" : "Your reviews";
  const subtitle = isAdmin
    ? "Schedule check-ins, capture notes and action items, and track performance outcomes across the team. Notes can be private to the reviewer or shared with the report."
    : "Track your upcoming check-ins, past reviews, and any action items captured during a conversation.";

  return (
    <header className="mb-4 text-gray-900">
      <div className="flex items-start justify-between gap-6 mb-4">
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.08em]">
            Performance Reviews
          </div>
          <h1 className="mt-1 mb-1.5 text-[24px] font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="m-0 text-gray-500 text-[13px] max-w-[640px] leading-[1.55]">
            {subtitle}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="h-[34px] gap-1.5 px-3 text-[13px]"
              onClick={onSchedule}
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule review
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 bg-white border border-gray-200 rounded-lg text-gray-900">
        <StatCell
          label={isAdmin ? "Scheduled" : "Upcoming"}
          value={stats.scheduled}
          hint={isAdmin ? "awaiting kickoff" : "on your calendar"}
        />
        <StatCell
          label="In progress"
          value={stats.inProgress}
          hint={isAdmin ? "self-review or notes" : "needs your input"}
          emphasis="warning"
        />
        <StatCell
          label="Overdue"
          value={stats.overdue}
          hint={stats.overdue > 0 ? "needs attention" : "all on track"}
          emphasis="danger"
        />
        <StatCell
          label="Completed · YTD"
          value={stats.completedYtd}
          hint="this year so far"
        />
      </div>
    </header>
  );
}
