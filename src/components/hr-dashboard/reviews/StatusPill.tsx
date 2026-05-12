import type { ReviewStatus } from "@/types/reviews";
import { REVIEW_STATUS_LABELS } from "@/types/reviews";

const STATUS_PILL_STYLES: Record<
  ReviewStatus,
  { background: string; color: string; dot: string }
> = {
  scheduled: { background: "#eff6ff", color: "#1d4ed8", dot: "#2563eb" },
  in_progress: { background: "#fffbeb", color: "#b45309", dot: "#d97706" },
  completed: { background: "#f0fdf4", color: "#15803d", dot: "#16a34a" },
  cancelled: { background: "#fef2f2", color: "#b91c1c", dot: "#dc2626" },
};

interface StatusPillProps {
  status: ReviewStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const style = STATUS_PILL_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: style.background, color: style.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: style.dot }}
      />
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}
