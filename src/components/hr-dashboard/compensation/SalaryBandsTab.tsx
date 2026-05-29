"use client";

import { useMemo } from "react";
import type { CompensationEmployee } from "@/lib/api/compensation";
import { AVATAR_PALETTE, getInitials } from "./avatarPalette";
import {
  computeSalaryBands,
  effectiveSalary,
  formatBamFull,
  type DynamicBand,
} from "./salaryBands";

interface SalaryBandsTabProps {
  employees: CompensationEmployee[];
  onOpenEmployee?: (employeeId: number) => void;
}

interface BandView extends DynamicBand {
  members: (CompensationEmployee & { _eff: number })[];
  minObserved: number;
  maxObserved: number;
  avg: number;
}

function bandMidpointLabel(band: DynamicBand): string {
  if (!Number.isFinite(band.max)) return `${formatBamFull(band.min)}+`;
  return formatBamFull(Math.round((band.min + band.max) / 2));
}

export function SalaryBandsTab({
  employees,
  onOpenEmployee,
}: SalaryBandsTabProps) {
  const bandRows = useMemo<BandView[]>(() => {
    const bands = computeSalaryBands(employees);
    if (bands.length === 0) return [];
    const enriched = employees.map((e) => ({ ...e, _eff: effectiveSalary(e) }));
    return bands.map((band) => {
      const members = enriched.filter(
        (e) => e._eff >= band.min && e._eff < band.max
      );
      const amounts = members.map((m) => m._eff);
      const minObserved = amounts.length ? Math.min(...amounts) : 0;
      const maxObserved = amounts.length ? Math.max(...amounts) : 0;
      const avg = amounts.length
        ? Math.round(amounts.reduce((sum, n) => sum + n, 0) / amounts.length)
        : 0;
      return { ...band, members, minObserved, maxObserved, avg };
    });
  }, [employees]);

  const totalHeadcount = employees.length;
  const maxBand = Math.max(...bandRows.map((b) => b.members.length), 1);

  if (bandRows.length === 0) {
    return (
      <div
        className="comp-rise rounded-xl border border-[#e5e7eb] bg-white p-12 text-center"
        style={{ animationDelay: "40ms" }}
      >
        <h2 className="text-sm font-semibold tracking-tight text-[#171717]">
          No salary data
        </h2>
        <p className="mt-1.5 text-xs text-[#6b7280]">
          Add salary records to employees to see dynamic salary bands.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="comp-rise rounded-xl border border-[#e5e7eb] bg-white"
        style={{ animationDelay: "40ms" }}
      >
        <div className="border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-[#171717]">
            Salary bands
          </h2>
          <p className="mt-0.5 text-xs text-[#6b7280]">
            Effective monthly compensation (base + monthly bonus average) split
            into {bandRows.length} dynamic bands across the current salary
            range. Click any employee to open their profile.
          </p>
        </div>

        <div className="divide-y divide-[#e5e7eb]">
          {bandRows.map((band) => {
            const widthPct = Math.min(
              100,
              (band.members.length / maxBand) * 100
            );
            return (
              <section key={band.label} className="px-5 py-4">
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr_auto]">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[13px] font-semibold text-[#171717]">
                      {band.label}
                    </div>
                    <div className="text-[11px] text-[#6b7280]">
                      Midpoint{" "}
                      <span className="comp-mono font-medium text-[#4b5563]">
                        {bandMidpointLabel(band)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-1">
                    <div className="h-2 overflow-hidden rounded bg-[#f3f4f6]">
                      <div
                        className="h-full rounded bg-[#171717]"
                        style={{
                          width: `${widthPct}%`,
                          transition:
                            "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      />
                    </div>
                    <div className="comp-mono flex gap-3 text-[11px] text-[#6b7280]">
                      <span>
                        Min{" "}
                        <strong className="font-semibold text-[#171717]">
                          {band.members.length
                            ? formatBamFull(band.minObserved)
                            : "—"}
                        </strong>
                      </span>
                      <span>
                        Avg{" "}
                        <strong className="font-semibold text-[#171717]">
                          {band.members.length ? formatBamFull(band.avg) : "—"}
                        </strong>
                      </span>
                      <span>
                        Max{" "}
                        <strong className="font-semibold text-[#171717]">
                          {band.members.length
                            ? formatBamFull(band.maxObserved)
                            : "—"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="comp-mono flex items-end justify-end gap-1 text-[12px] text-[#6b7280]">
                    <strong className="text-[18px] font-bold leading-none text-[#171717]">
                      {band.members.length}
                    </strong>
                    <span className="pb-px">
                      / {totalHeadcount}{" "}
                      {totalHeadcount === 1 ? "employee" : "employees"}
                    </span>
                  </div>
                </div>

                {band.members.length === 0 ? (
                  <p className="text-[11px] italic text-[#9ca3af]">
                    No employees currently in this band.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {band.members.map((m) => {
                      const avatar =
                        AVATAR_PALETTE[m.color] ?? AVATAR_PALETTE.gray;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpenEmployee?.(m.id)}
                          disabled={!onOpenEmployee}
                          className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white py-1 pl-1 pr-3 text-[12px] transition-colors enabled:hover:border-[#171717] disabled:cursor-default"
                          aria-label={`Open profile for ${m.name}`}
                        >
                          <span
                            className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold"
                            style={{
                              background: avatar.bg,
                              color: avatar.fg,
                            }}
                            aria-hidden
                          >
                            {getInitials(m.name)}
                          </span>
                          <span className="font-medium text-[#171717]">
                            {m.name}
                          </span>
                          <span className="comp-mono text-[11px] text-[#6b7280]">
                            {formatBamFull(m._eff)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
