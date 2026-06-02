"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

import { formatDateRange, formatRelativeTimestamp } from "@/utils";
import { Button } from "@/components/hr-dashboard/ui/button";
import type { PendingLeaveItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { InitialsAvatar } from "./InitialsAvatar";
import { LeaveTypeTag } from "./LeaveTypeTag";

interface Props {
  items: PendingLeaveItem[];
  total: number;
  /** Promise-returning so the row shows a spinner until persistence resolves. */
  onApprove?: (item: PendingLeaveItem) => Promise<void> | void;
  onDecline?: (item: PendingLeaveItem) => Promise<void> | void;
  onViewAll?: () => void;
}

type RowState =
  | "approved"
  | "declined"
  | "pending-approve"
  | "pending-decline"
  | null;

function ApprovalRow({
  request,
  state,
  onApprove,
  onDecline,
}: {
  request: PendingLeaveItem;
  state: RowState;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const isWorking = state === "pending-approve" || state === "pending-decline";
  return (
    <div
      className={`flex items-start gap-3 border-b border-gray-200 py-3 last:border-b-0 ${
        state ? "opacity-60" : ""
      }`}
      data-testid={`approval-row-${request.id}`}
    >
      <InitialsAvatar name={request.employeeName} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-gray-900">
            {request.employeeName}
          </span>
          <LeaveTypeTag type={request.leaveType} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
          <span>{formatDateRange(request.startDate, request.endDate)}</span>
          <span className="text-gray-300">·</span>
          <span>
            {request.days} {request.days === 1 ? "day" : "days"}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">
            {formatRelativeTimestamp(request.submittedDate)}
          </span>
        </div>
        {request.reason && (
          <div className="mt-1.5 text-xs text-gray-600">{request.reason}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {state === "approved" || state === "declined" ? (
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              state === "approved" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {state === "approved" ? "Approved" : "Declined"}
          </span>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Decline"
              onClick={onDecline}
              disabled={isWorking}
              className="h-8 w-8 text-gray-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
            >
              {state === "pending-decline" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Approve"
              onClick={onApprove}
              disabled={isWorking}
              className="h-8 w-8 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
            >
              {state === "pending-approve" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function ApprovalQueueWidget({
  items,
  total,
  onApprove,
  onDecline,
  onViewAll,
}: Props) {
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const extra = Math.max(total - items.length, 0);

  const setState = (id: string, next: RowState) =>
    setRowStates((prev) => ({ ...prev, [id]: next }));

  const handleApprove = async (item: PendingLeaveItem) => {
    setState(item.id, "pending-approve");
    try {
      await onApprove?.(item);
      setState(item.id, "approved");
    } catch {
      setState(item.id, null);
    }
  };

  const handleDecline = async (item: PendingLeaveItem) => {
    setState(item.id, "pending-decline");
    try {
      await onDecline?.(item);
      setState(item.id, "declined");
    } catch {
      setState(item.id, null);
    }
  };

  return (
    <DashboardCard
      title="Needs your approval"
      kicker="Time-off requests"
      count={total}
    >
      {items.length === 0 ? (
        <div className="py-4 text-sm text-gray-600">
          No requests waiting on you.
        </div>
      ) : (
        <div>
          {items.map((r) => (
            <ApprovalRow
              key={r.id}
              request={r}
              state={rowStates[r.id] ?? null}
              onApprove={() => void handleApprove(r)}
              onDecline={() => void handleDecline(r)}
            />
          ))}
        </div>
      )}
      {extra > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-gray-50 p-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          {extra} more pending in Vacations
        </button>
      )}
    </DashboardCard>
  );
}
