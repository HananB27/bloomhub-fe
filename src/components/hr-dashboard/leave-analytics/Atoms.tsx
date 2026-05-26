import type { LeaveStatus, LeaveType } from "@/types/vacations";
import {
  LEAVE_STATUS_BADGE_COLORS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_CHART_COLORS,
  LEAVE_TYPE_CHIP_BG,
  LEAVE_TYPE_LABELS,
} from "@/types/vacations";
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { AvatarColor } from "./analyticsModuleHelpers";

const AVATAR_FALLBACK_CLASSES: Record<AvatarColor, string> = {
  green:  "bg-green-100 text-green-800",
  indigo: "bg-indigo-100 text-indigo-800",
  rose:   "bg-rose-100 text-rose-800",
  orange: "bg-orange-100 text-orange-900",
  gray:   "bg-gray-200 text-gray-700",
};

interface EmployeeAvatarProps {
  first: string;
  last: string;
  color?: AvatarColor;
  size?: number;
}

export function EmployeeAvatar({
  first,
  last,
  color = "gray",
  size = 28,
}: EmployeeAvatarProps) {
  const initials = `${(first || "?").charAt(0)}${(last || "").charAt(0)}`.toUpperCase();
  return (
    <Avatar
      className="shrink-0"
      style={{ width: size, height: size }}
    >
      <AvatarFallback
        className={`${AVATAR_FALLBACK_CLASSES[color]} font-semibold tracking-wide`}
        style={{ fontSize: size <= 24 ? 10 : 11 }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function StatusPill({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-[2px] text-[11px] font-semibold leading-tight ${LEAVE_STATUS_BADGE_COLORS[status]}`}
    >
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}

export function TypeChip({
  typeId,
  size = "sm",
}: {
  typeId: LeaveType;
  size?: "sm" | "md";
}) {
  const color = LEAVE_TYPE_CHART_COLORS[typeId];
  const bg = LEAVE_TYPE_CHIP_BG[typeId];
  const label = LEAVE_TYPE_LABELS[typeId];
  return (
    <span
      style={{ background: bg, color }}
      className={`inline-flex items-center gap-1.5 rounded font-semibold ${
        size === "sm" ? "px-2 py-[2px] text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span
        className={`rounded-full ${size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"}`}
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
