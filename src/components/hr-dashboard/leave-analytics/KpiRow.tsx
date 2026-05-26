import type { LeaveAnalyticsYearTotals } from "@/types/leaveAnalytics";

interface KpiCardSpec {
  kicker: string;
  value: string | number;
  unit?: string;
  delta?: number | null;
  deltaLabel?: string;
  urgent?: boolean;
  ratio?: number;
}

interface Props {
  year: number;
  current: LeaveAnalyticsYearTotals | null;
  previous: LeaveAnalyticsYearTotals | null;
}

const delta = (curr: number, prev: number) =>
  prev ? ((curr - prev) / prev) * 100 : null;

export function KpiRow({ year, current, previous }: Props) {
  const total = current?.total ?? 0;
  const headcount = current?.headcount ?? 0;
  const onLeaveToday = current?.onLeaveToday ?? 0;
  const pending = current?.pendingTotal ?? 0;
  const avg = headcount ? total / headcount : 0;
  const prevTotal = previous?.total ?? 0;
  const prevAvg = previous && previous.headcount
    ? previous.total / previous.headcount
    : 0;

  const cards: KpiCardSpec[] = [
    {
      kicker: "Total leave days",
      value: total.toLocaleString(),
      unit: "working days",
      delta: delta(total, prevTotal),
      deltaLabel: `vs. ${year - 1}`,
    },
    {
      kicker: "On leave today",
      value: onLeaveToday,
      unit: `of ${headcount} people`,
      ratio: headcount ? onLeaveToday / headcount : 0,
    },
    {
      kicker: "Avg per employee",
      value: avg.toFixed(1),
      unit: "days / year",
      delta: delta(avg, prevAvg),
      deltaLabel: `vs. ${year - 1}`,
    },
    {
      kicker: "Pending requests",
      value: pending,
      unit: "awaiting approval",
      urgent: pending > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            {c.kicker}
          </div>
          <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
            {c.value}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            {c.unit && <span className="text-xs text-gray-500">{c.unit}</span>}
            {c.delta != null && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-[2px] font-mono text-[11px] font-semibold ${
                  c.delta >= 0
                    ? "bg-green-100 text-green-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {c.delta >= 0 ? "▲" : "▼"} {Math.abs(c.delta).toFixed(1)}%
                <span className="ml-1 font-sans font-medium opacity-80">
                  {c.deltaLabel}
                </span>
              </span>
            )}
            {c.urgent && (
              <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-[2px] font-mono text-[11px] font-semibold text-amber-800">
                action needed
              </span>
            )}
            {c.ratio != null && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-900 transition-[width]"
                  style={{ width: `${Math.max(c.ratio * 100, 2)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
