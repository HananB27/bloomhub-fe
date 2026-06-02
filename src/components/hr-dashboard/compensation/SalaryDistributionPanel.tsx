"use client";

import { useEffect, useState } from "react";
import type { SalaryBand } from "@/lib/api/compensation";

interface SalaryDistributionPanelProps {
  bands: SalaryBand[];
  totalEmployees: number;
}

export function SalaryDistributionPanel({
  bands,
  totalEmployees,
}: SalaryDistributionPanelProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setAnimated(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  const maxPct = Math.max(...bands.map((b) => b.pct), 1);

  return (
    <div
      className="comp-rise rounded-xl border border-[#e5e7eb] bg-white p-[18px_20px]"
      style={{ animationDelay: "260ms" }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight text-[#171717]">
            Salary distribution
          </div>
          <div className="mt-0.5 text-xs text-[#6b7280]">
            Headcount across effective monthly compensation (base + bonus, BAM)
          </div>
        </div>
        <span className="comp-mono inline-flex items-center rounded bg-[#f3f4f6] px-1.5 py-px text-[11px] font-medium text-[#4b5563]">
          {totalEmployees} employees
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {bands.map((band, i) => {
          const widthPct = animated
            ? Math.min(100, (band.pct / maxPct) * 100)
            : 0;
          return (
            <div
              key={`${band.label}-${i}`}
              className="grid items-center gap-3.5"
              style={{ gridTemplateColumns: "110px 1fr 100px" }}
            >
              <div className="text-xs font-medium text-[#4b5563]">
                {band.label}
              </div>
              <div className="h-2.5 overflow-hidden rounded bg-[#f3f4f6]">
                <div
                  className="h-full rounded bg-[#171717]"
                  style={{
                    width: `${widthPct}%`,
                    transition: `width 1.1s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms`,
                  }}
                />
              </div>
              <div className="comp-mono flex items-center justify-end gap-2 text-xs">
                <span className="font-semibold text-[#171717]">
                  {band.count}
                </span>
                <span className="text-[#6b7280]">{band.pct.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
