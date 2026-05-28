import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
} from "@/types/vacations";
import type { LeaveAnalyticsYearTotals } from "@/types/leaveAnalytics";

interface Props {
  data: LeaveAnalyticsYearTotals[];
}

export function YearOverYearStrip({ data }: Props) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex flex-col gap-1.5">
      {data.map((y) => (
        <div
          key={y.year}
          className="grid grid-cols-[50px_1fr_56px] items-center gap-2.5"
        >
          <div className="font-mono text-xs font-semibold text-gray-600">
            {y.year}
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
            {ALL_LEAVE_TYPES.map((id) => {
              const v = y.byType[id];
              if (!v) return null;
              return (
                <div
                  key={id}
                  className="h-full"
                  style={{
                    background: LEAVE_TYPE_CHART_COLORS[id],
                    width: `${(v / max) * 100}%`,
                  }}
                  title={`${LEAVE_TYPE_LABELS[id]}: ${v}d`}
                />
              );
            })}
          </div>
          <div className="text-right font-mono text-xs font-semibold text-gray-900">
            {y.total}d
          </div>
        </div>
      ))}
    </div>
  );
}
