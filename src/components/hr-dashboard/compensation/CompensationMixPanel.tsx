"use client";

import { useEffect, useState } from "react";
import type { CompensationMixSegment } from "@/lib/api/compensation";

const CIRCUMFERENCE = 2 * Math.PI * 15.915;

interface CompensationMixPanelProps {
  mix: CompensationMixSegment[];
}

function formatPct(value: number): string {
  return Number(value).toFixed(2);
}

export function CompensationMixPanel({ mix }: CompensationMixPanelProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setAnimated(true), 50);
    return () => window.clearTimeout(id);
  }, []);

  let cumulative = 0;
  const segments = mix.map((segment) => {
    const offset = cumulative;
    cumulative += segment.pct;
    return { ...segment, offset };
  });

  return (
    <div
      className="comp-rise rounded-xl border border-[#e5e7eb] bg-white p-[18px_20px]"
      style={{ animationDelay: "320ms" }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight text-[#171717]">
            Compensation mix
          </div>
          <div className="mt-0.5 text-xs text-[#6b7280]">
            Breakdown by component type
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[22px]">
        <div className="relative h-[168px] w-[168px] shrink-0">
          <svg
            viewBox="0 0 42 42"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label="Compensation mix donut chart"
          >
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="6"
            />
            {segments.map((segment, i) => (
              <circle
                key={segment.name}
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke={segment.color}
                strokeWidth="6"
                strokeDasharray={
                  animated
                    ? `${(segment.pct * CIRCUMFERENCE) / 100} ${CIRCUMFERENCE}`
                    : `0 ${CIRCUMFERENCE}`
                }
                strokeDashoffset={(-segment.offset * CIRCUMFERENCE) / 100}
                style={{
                  transition:
                    "stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  transitionDelay: `${0.35 + i * 0.1}s`,
                }}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="comp-mono text-[22px] font-bold tracking-tight">
              100%
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#6b7280]">
              Total mix
            </div>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {mix.map((segment) => (
            <li
              key={segment.name}
              className="grid items-center gap-2.5 text-xs"
              style={{ gridTemplateColumns: "10px 1fr auto" }}
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: segment.color }}
                aria-hidden
              />
              <span className="text-[#4b5563]">{segment.name}</span>
              <span className="comp-mono font-semibold text-[#171717]">
                {formatPct(segment.pct)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
