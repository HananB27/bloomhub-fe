import { formatDateShort } from "@/utils";
import type { OutTodayItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { InitialsAvatar } from "./InitialsAvatar";
import { LeaveTypeTag } from "./LeaveTypeTag";

interface Props {
  items: OutTodayItem[];
}

export function OutTodayWidget({ items }: Props) {
  return (
    <DashboardCard title="Out today" count={items.length}>
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">
          Everyone&apos;s in today.
        </div>
      ) : (
        <div>
          {items.map((o) => (
            <div
              key={`${o.employeeId}-${o.until}`}
              className="flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0"
            >
              <InitialsAvatar name={o.employeeName} size={30} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {o.employeeName}
                </div>
                <div className="text-[11.5px] text-gray-600">
                  Back {formatDateShort(o.until)}
                </div>
              </div>
              <LeaveTypeTag type={o.leaveType} />
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
