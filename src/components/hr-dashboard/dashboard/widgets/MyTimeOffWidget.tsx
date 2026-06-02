import { ChevronRight } from "lucide-react";

import { formatDateRange } from "@/utils";
import {
  LEAVE_STATUS_BADGE_COLORS,
  LEAVE_STATUS_LABELS,
} from "@/types/vacations";
import type { MyLeaveBalance, MyLeaveRequest } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { LeaveTypeTag } from "./LeaveTypeTag";
import { ProgressBar } from "./ProgressBar";

interface Props {
  balance: MyLeaveBalance;
  requests: MyLeaveRequest[];
  onRequest?: () => void;
}

export function MyTimeOffWidget({ balance, requests, onRequest }: Props) {
  const remaining = Math.max(balance.vacationTotal - balance.vacationUsed, 0);
  return (
    <DashboardCard
      title="My time off"
      kicker="Balance & requests"
      action={
        <button
          type="button"
          onClick={onRequest}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          Vacations
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-stretch">
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5 font-mono text-[34px] font-semibold leading-none tracking-tight text-gray-900">
            {remaining}
            <span className="text-sm font-medium text-gray-600">days</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            vacation left · {balance.vacationUsed} of {balance.vacationTotal}{" "}
            used
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={balance.vacationUsed}
              max={balance.vacationTotal}
              height={8}
            />
          </div>
        </div>
        <div className="flex flex-row gap-2 sm:flex-col">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-center">
            <span className="block font-mono text-base font-semibold text-gray-900">
              {balance.sickUsed}
            </span>
            <span className="text-[11px] text-gray-600">Sick used</span>
          </div>
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-center">
            <span className="block font-mono text-base font-semibold text-gray-900">
              {balance.wfhUsed}
            </span>
            <span className="text-[11px] text-gray-600">WFH days</span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
          Upcoming requests
        </div>
        {requests.length === 0 ? (
          <div className="text-sm text-gray-600">No upcoming requests.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 py-1">
                <LeaveTypeTag type={r.leaveType} />
                <span className="flex-1 text-[12.5px] font-medium text-gray-900">
                  {formatDateRange(r.startDate, r.endDate)}
                </span>
                <span className="font-mono text-xs text-gray-600">
                  {r.days}d
                </span>
                <span
                  className={`rounded border px-2 py-[3px] text-[11px] font-semibold ${LEAVE_STATUS_BADGE_COLORS[r.status]}`}
                >
                  {LEAVE_STATUS_LABELS[r.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
