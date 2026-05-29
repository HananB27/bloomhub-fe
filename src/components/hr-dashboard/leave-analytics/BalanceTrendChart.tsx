import { useMemo, useState } from "react";

import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
  type LeaveType,
} from "@/types/vacations";
import type { LeaveBalanceSnapshot } from "@/types/leaveAnalytics";

interface Props {
  snapshots: LeaveBalanceSnapshot[];
  activeTypes?: Set<LeaveType>;
}

interface SeriesPoint {
  date: string;
  remaining: number;
}

interface Series {
  leaveType: LeaveType;
  color: string;
  label: string;
  points: SeriesPoint[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 240;
const CHART_PADDING = { top: 16, right: 16, bottom: 32, left: 36 };

export function BalanceTrendChart({ snapshots, activeTypes }: Props) {
  const series = useMemo(
    () => buildSeries(snapshots, activeTypes),
    [snapshots, activeTypes]
  );
  const dateRange = useMemo(() => collectDates(series), [series]);
  const maxValue = useMemo(() => computeMax(series), [series]);

  const [hover, setHover] = useState<{ index: number; x: number } | null>(null);

  if (snapshots.length === 0 || series.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-gray-500">
        No balance snapshots recorded for this employee yet.
      </div>
    );
  }

  const innerW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const niceMax = Math.max(Math.ceil(maxValue / 5) * 5, 5);

  const xFor = (index: number) => {
    if (dateRange.length <= 1) return CHART_PADDING.left + innerW / 2;
    return CHART_PADDING.left + (index / (dateRange.length - 1)) * innerW;
  };
  const yFor = (value: number) =>
    CHART_PADDING.top + innerH * (1 - value / niceMax);

  return (
    <div className="relative py-1">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        className="block"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = CHART_PADDING.top + innerH * (1 - t);
          const val = Math.round(niceMax * t);
          return (
            <g key={i}>
              <line
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_PADDING.left + innerW}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              <text
                x={CHART_PADDING.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#6b7280"
                fontFamily="ui-monospace, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {dateRange.map((d, i) => {
          if (dateRange.length > 6 && i % Math.ceil(dateRange.length / 6) !== 0)
            return null;
          return (
            <text
              key={d}
              x={xFor(i)}
              y={CHART_HEIGHT - 12}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
              fontFamily="ui-monospace, monospace"
            >
              {formatShortDate(d)}
            </text>
          );
        })}

        {series.map((s) => {
          const path = s.points
            .map((p) => {
              const idx = dateRange.indexOf(p.date);
              if (idx === -1) return "";
              return `${xFor(idx)},${yFor(p.remaining)}`;
            })
            .filter(Boolean)
            .join(" L ");
          if (!path) return null;
          return (
            <g key={s.leaveType}>
              <path
                d={`M ${path}`}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.points.map((p) => {
                const idx = dateRange.indexOf(p.date);
                if (idx === -1) return null;
                return (
                  <circle
                    key={`${s.leaveType}-${p.date}`}
                    cx={xFor(idx)}
                    cy={yFor(p.remaining)}
                    r={hover && hover.index === idx ? 4 : 2.5}
                    fill={s.color}
                  />
                );
              })}
            </g>
          );
        })}

        {dateRange.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - innerW / Math.max(dateRange.length, 1) / 2}
            y={CHART_PADDING.top}
            width={innerW / Math.max(dateRange.length, 1)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover({ index: i, x: xFor(i) })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 px-2 text-[11.5px] text-gray-700">
        {series.map((s) => (
          <span key={s.leaveType} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute top-2.5 z-[5] w-[176px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.18)]"
          style={{
            left: `calc(${(hover.x / CHART_WIDTH) * 100}% - 88px)`,
          }}
        >
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {formatLongDate(dateRange[hover.index])}
          </div>
          <div className="flex flex-col gap-[3px]">
            {series.map((s) => {
              const point = s.points.find(
                (p) => p.date === dateRange[hover.index]
              );
              if (!point) return null;
              return (
                <div
                  key={s.leaveType}
                  className="flex items-center gap-1.5 text-[11.5px] text-gray-900"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1">{s.label}</span>
                  <span className="font-mono">{point.remaining}d</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function buildSeries(
  snapshots: LeaveBalanceSnapshot[],
  activeTypes?: Set<LeaveType>
): Series[] {
  const grouped = new Map<LeaveType, SeriesPoint[]>();
  for (const snap of snapshots) {
    if (activeTypes && !activeTypes.has(snap.leaveType)) continue;
    const points = grouped.get(snap.leaveType) ?? [];
    points.push({ date: snap.snapshotDate, remaining: snap.remaining });
    grouped.set(snap.leaveType, points);
  }
  return ALL_LEAVE_TYPES.filter((id) => grouped.has(id)).map((id) => ({
    leaveType: id,
    color: LEAVE_TYPE_CHART_COLORS[id],
    label: LEAVE_TYPE_LABELS[id],
    points: (grouped.get(id) ?? []).sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  }));
}

function collectDates(series: Series[]): string[] {
  const set = new Set<string>();
  for (const s of series) for (const p of s.points) set.add(p.date);
  return Array.from(set).sort();
}

function computeMax(series: Series[]): number {
  let max = 0;
  for (const s of series)
    for (const p of s.points) if (p.remaining > max) max = p.remaining;
  return max;
}

function formatShortDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}

function formatLongDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
