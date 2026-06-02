import { LEAVE_TYPE_BADGE_COLORS, LEAVE_TYPE_LABELS } from "@/types/vacations";
import type { LeaveType } from "@/types/vacations";

interface Props {
  type: LeaveType;
}

export function LeaveTypeTag({ type }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-[2px] text-[11px] font-semibold ${LEAVE_TYPE_BADGE_COLORS[type]}`}
    >
      {LEAVE_TYPE_LABELS[type]}
    </span>
  );
}
