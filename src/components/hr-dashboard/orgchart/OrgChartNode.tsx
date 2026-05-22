import { Crown, Network } from "lucide-react";
import type { CSSProperties, PointerEvent } from "react";
import {
  NODE_W_COMPACT,
  STATUS_META,
  deptOf,
  initialsOf,
} from "./orgChartUtils";
import type { OrgDepartment, OrgEmployee } from "./types";

interface AvatarProps {
  emp: OrgEmployee;
  departments: OrgDepartment[];
  size?: number;
}

export function OrgAvatar({ emp, departments, size = 40 }: AvatarProps) {
  const dept = deptOf(emp, departments);
  const status = STATUS_META[emp.status] ?? STATUS_META.active;
  return (
    <div
      className="relative grid place-items-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: dept.soft,
        color: dept.color,
        fontSize: size <= 32 ? 12 : 14,
      }}
    >
      {initialsOf(emp.name)}
      <span
        title={status.label}
        className="absolute rounded-full"
        style={{
          right: -1,
          bottom: -1,
          width: 10,
          height: 10,
          background: status.color,
          boxShadow: "0 0 0 2px #fff",
        }}
      />
    </div>
  );
}

interface NodeProps {
  emp: OrgEmployee;
  departments: OrgDepartment[];
  reportCount: number;
  isCompact: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSelected?: boolean;
  /** When false, hides the dept pill row (driven by Chart Settings). */
  showDeptPill?: boolean;
  /** When false, disables hover/selection transition on the card. */
  animations?: boolean;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
}

export function OrgChartNode({
  emp,
  departments,
  reportCount,
  isCompact,
  isHighlighted,
  isDimmed,
  isSelected,
  showDeptPill = true,
  animations = true,
  onPointerDown,
}: NodeProps) {
  const dept = deptOf(emp, departments);

  const style: CSSProperties = {
    borderColor: isSelected
      ? "#171717"
      : isHighlighted
        ? dept.color
        : undefined,
    boxShadow: isSelected
      ? "0 0 0 3px rgba(23,23,23,0.18), 0 8px 22px -8px rgba(0,0,0,0.18)"
      : isHighlighted
        ? `0 0 0 3px ${dept.color}33, 0 6px 18px -6px rgba(0,0,0,0.12)`
        : undefined,
    opacity: isDimmed ? 0.32 : 1,
  };

  return (
    <div
      data-emp-id={emp.id}
      onPointerDown={onPointerDown}
      style={style}
      className={`relative h-full w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
        animations ? "transition-all" : ""
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: dept.color }}
      />
      <div
        className={`flex h-full items-center gap-3 ${isCompact ? "px-3 py-2.5 pl-3.5" : "px-3.5 py-3 pl-4"}`}
      >
        <OrgAvatar
          emp={emp}
          departments={departments}
          size={isCompact ? 32 : 40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`truncate font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${
                isCompact ? "text-xs" : "text-[13px]"
              }`}
            >
              {emp.name}
            </span>
            {emp.isManager && (
              <Crown className="h-3 w-3 shrink-0 text-amber-600" />
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
            {emp.role}
          </div>
          {!isCompact && (showDeptPill || reportCount > 0) && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {showDeptPill && (
                <span
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: dept.soft, color: dept.color }}
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: dept.color }}
                  />
                  {dept.name}
                </span>
              )}
              {reportCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  <Network className="h-2.5 w-2.5" /> {reportCount} report
                  {reportCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const isCompactWidth = (w: number) => w === NODE_W_COMPACT;
