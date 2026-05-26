import { useMemo, useState } from "react";
import type { LeaveType } from "@/types/vacations";
import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
} from "@/types/vacations";
import { monthlyByType } from "./analyticsModuleHelpers";

interface Props {
  year: number;
  activeTypes: Set<LeaveType>;
}

export function MonthlyTrendChart({ year, activeTypes }: Props) {
  const data = useMemo(() => monthlyByType(year), [year]);
  const max = Math.max(...data.map((r) => r.total), 10);
  const niceMax = Math.ceil(max / 10) * 10;

  const width = 720;
  const height = 280;
  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = innerW / 12 - 12;

  const [hover, setHover] = useState<{ mi: number; x: number } | null>(null);
  const activeTypeIds = ALL_LEAVE_TYPES.filter((id) => activeTypes.has(id));

  return (
    <div className="relative py-1">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="block">
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding.top + innerH * (1 - t);
          const val = Math.round(niceMax * t);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerW}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#9ca3af"
                fontFamily="ui-monospace, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {data.map((row, mi) => {
          const x = padding.left + mi * (innerW / 12) + 6;
          let yCursor = padding.top + innerH;
          return (
            <g
              key={mi}
              onMouseEnter={() => setHover({ mi, x: x + barW / 2 })}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default" }}
            >
              <rect
                x={x - 4}
                y={padding.top}
                width={barW + 8}
                height={innerH}
                fill="transparent"
              />
              {activeTypeIds.map((id) => {
                const v = row.byType[id];
                if (!v) return null;
                const h = (v / niceMax) * innerH;
                yCursor -= h;
                return (
                  <rect
                    key={id}
                    x={x}
                    y={yCursor}
                    width={barW}
                    height={h}
                    fill={LEAVE_TYPE_CHART_COLORS[id]}
                    opacity={hover && hover.mi !== mi ? 0.35 : 1}
                    style={{ transition: "opacity 0.12s" }}
                  />
                );
              })}
              <text
                x={x + barW / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7280"
                fontWeight={500}
              >
                {row.monthLabel}
              </text>
              {hover && hover.mi === mi && row.total > 0 && (
                <text
                  x={x + barW / 2}
                  y={yCursor - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#171717"
                  fontFamily="ui-monospace, monospace"
                  fontWeight={600}
                >
                  {row.total}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute top-2.5 z-[5] w-[168px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.18)]"
          style={{ left: `calc(${(hover.x / width) * 100}% - 84px)` }}
        >
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {data[hover.mi].monthLabel} {year}
          </div>
          <div className="flex flex-col gap-[3px]">
            {activeTypeIds
              .filter((id) => data[hover.mi].byType[id] > 0)
              .map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-1.5 text-[11.5px] text-gray-900"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: LEAVE_TYPE_CHART_COLORS[id] }}
                  />
                  <span className="flex-1">{LEAVE_TYPE_LABELS[id]}</span>
                  <span className="font-mono">{data[hover.mi].byType[id]}d</span>
                </div>
              ))}
            <div className="mt-1 flex items-center gap-1.5 border-t border-gray-200 pt-1 text-[11.5px] font-semibold text-gray-900">
              <span className="flex-1">Total</span>
              <span className="font-mono">{data[hover.mi].total}d</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
