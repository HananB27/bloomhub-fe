import { useMemo } from "react";
import type { LeaveType } from "@/types/vacations";
import {
  ALL_LEAVE_TYPES,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_LABELS,
} from "@/types/vacations";
import { departmentBreakdown } from "./analyticsModuleHelpers";

interface Props {
  year: number;
  activeTypes: Set<LeaveType>;
}

export function DepartmentBreakdown({ year, activeTypes }: Props) {
  const rows = useMemo(() => departmentBreakdown(year), [year]);
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <div className="flex flex-col">
      <div className="mb-1.5 grid grid-cols-[1.2fr_0.6fr_0.6fr_0.9fr_2.2fr] items-center gap-3.5 border-b border-gray-200 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <div>Department</div>
        <div className="text-right">Headcount</div>
        <div className="text-right">Days</div>
        <div className="text-right">Avg / person</div>
        <div>Distribution</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.department}
          className="grid grid-cols-[1.2fr_0.6fr_0.6fr_0.9fr_2.2fr] items-center gap-3.5 border-b border-gray-200 px-1 py-2.5 text-sm last:border-b-0"
        >
          <div className="font-semibold text-gray-900">{r.department}</div>
          <div className="text-right font-mono">{r.headcount}</div>
          <div className="text-right font-mono">{r.total}</div>
          <div className="text-right font-mono">
            {(r.total / r.headcount).toFixed(1)}
          </div>
          <div className="flex h-2 overflow-hidden rounded bg-gray-100">
            {ALL_LEAVE_TYPES.filter((id) => activeTypes.has(id)).map((id) => {
              const v = r.byType[id];
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
        </div>
      ))}
    </div>
  );
}
