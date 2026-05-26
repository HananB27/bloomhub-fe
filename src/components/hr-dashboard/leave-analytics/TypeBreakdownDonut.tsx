import type { LeaveType } from "@/types/vacations";
import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
} from "@/types/vacations";
import type { LeaveAnalyticsYearTotals } from "@/types/leaveAnalytics";

interface Props {
  yearlyTotals: LeaveAnalyticsYearTotals | null;
  activeTypes: Set<LeaveType>;
  onToggleType: (id: LeaveType) => void;
}

const ZERO_TOTALS: Record<LeaveType, number> = Object.fromEntries(
  ALL_LEAVE_TYPES.map((t) => [t, 0])
) as Record<LeaveType, number>;

export function TypeBreakdownDonut({
  yearlyTotals,
  activeTypes,
  onToggleType,
}: Props) {
  const byType = yearlyTotals?.byType ?? ZERO_TOTALS;
  const grandTotal = Object.values(byType).reduce((s, n) => s + n, 0);
  const filteredTotal = ALL_LEAVE_TYPES.filter((id) => activeTypes.has(id)).reduce(
    (s, id) => s + byType[id],
    0
  );

  const R = 70;
  const r = 44;
  const cx = 100;
  const cy = 100;
  let cumulative = 0;
  const arcs = ALL_LEAVE_TYPES.map((id) => {
    const v = byType[id];
    const portion = grandTotal ? v / grandTotal : 0;
    const startA = cumulative * Math.PI * 2 - Math.PI / 2;
    cumulative += portion;
    const endA = cumulative * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + R * Math.cos(startA);
    const y1 = cy + R * Math.sin(startA);
    const x2 = cx + R * Math.cos(endA);
    const y2 = cy + R * Math.sin(endA);
    const x3 = cx + r * Math.cos(endA);
    const y3 = cy + r * Math.sin(endA);
    const x4 = cx + r * Math.cos(startA);
    const y4 = cy + r * Math.sin(startA);
    const large = portion > 0.5 ? 1 : 0;
    const path =
      portion > 0
        ? `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`
        : "";
    return {
      id,
      color: LEAVE_TYPE_CHART_COLORS[id],
      label: LEAVE_TYPE_LABELS[id],
      value: v,
      portion,
      path,
    };
  });

  return (
    <div className="grid grid-cols-[200px_1fr] items-center gap-4">
      <div className="grid place-items-center">
        <svg viewBox="0 0 200 200" width="180" height="180">
          <circle cx={cx} cy={cy} r={R} fill="#fafaf9" />
          <circle cx={cx} cy={cy} r={r} fill="#ffffff" />
          {arcs.map((a) => (
            <path
              key={a.id}
              d={a.path}
              fill={a.color}
              opacity={activeTypes.has(a.id) ? 1 : 0.18}
              style={{ transition: "opacity 0.12s" }}
            />
          ))}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize={22}
            fontWeight={700}
            fill="#171717"
            fontFamily="ui-monospace, monospace"
          >
            {filteredTotal}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#6b7280">
            working days
          </text>
        </svg>
      </div>
      <div className="flex flex-col gap-0.5">
        {arcs.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onToggleType(a.id)}
            className={`grid grid-cols-[14px_1fr_auto_auto] items-center gap-2 rounded px-2 py-1 text-left transition-[opacity,background] hover:bg-gray-100 ${
              activeTypes.has(a.id) ? "" : "opacity-40"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: a.color }}
            />
            <span className="text-[12.5px] font-medium text-gray-900">{a.label}</span>
            <span className="font-mono text-xs text-gray-600">{a.value}d</span>
            <span className="min-w-[30px] text-right font-mono text-[11px] text-gray-500">
              {(a.portion * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
