import { UserRound } from "lucide-react";

import { ANNUAL_LEAVE_ALLOWANCE_DAYS, type LeaveType } from "@/types/vacations";
import type { LeaveAnalyticsEmployeeSummary } from "@/types/leaveAnalytics";
import { useEmployeeLeaveHistory } from "@/hooks/useEmployeeLeaveHistory";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { BalanceTrendChart } from "./BalanceTrendChart";
import { EmployeeAvatar, TypeChip } from "./Atoms";
import { getAvatarColorForEmployee } from "./avatarPalette";

interface Props {
  open: boolean;
  year: number;
  employee: LeaveAnalyticsEmployeeSummary | null;
  onClose: () => void;
  onOpenFullProfile: (employeeId: number) => void;
}

const QUICK_VIEW_TYPES: LeaveType[] = ["vacation", "sick", "wfh", "personal"];

export function EmployeeLeavePeekDialog({
  open,
  year,
  employee,
  onClose,
  onOpenFullProfile,
}: Props) {
  const { history, isLoading } = useEmployeeLeaveHistory({
    employeeId: open && employee ? employee.employeeId : null,
    yearFrom: year,
    yearTo: year,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {employee
              ? `${employee.employeeName} — leave summary`
              : "Leave summary"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Quick view of an employee&apos;s leave totals and balance trend.
          </DialogDescription>
        </DialogHeader>

        {employee ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <EmployeeAvatar
                first={splitName(employee.employeeName)[0]}
                last={splitName(employee.employeeName)[1]}
                color={getAvatarColorForEmployee(employee.employeeId)}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-gray-900">
                  {employee.employeeName}
                </div>
                <div className="mt-0.5 text-xs text-gray-600">
                  {employee.role || "—"}
                  {employee.department ? ` · ${employee.department}` : ""}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium text-gray-800"
                onClick={() => onOpenFullProfile(employee.employeeId)}
              >
                <UserRound className="h-3.5 w-3.5" />
                Open full profile
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile
                label="Total used"
                value={employee.total}
                accent="text-gray-900"
              />
              <KpiTile
                label="Vacation used"
                value={`${employee.vacationUsed} / ${ANNUAL_LEAVE_ALLOWANCE_DAYS}`}
                accent="text-indigo-700"
              />
              <KpiTile
                label="Vacation remaining"
                value={employee.vacationRemaining}
                accent="text-emerald-700"
              />
              <KpiTile
                label="Sick"
                value={employee.byType.sick}
                accent="text-gray-900"
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Breakdown by type — {year}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_VIEW_TYPES.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11.5px] text-gray-800"
                  >
                    <TypeChip typeId={id} />
                    <span className="font-mono">
                      {employee.byType[id] ?? 0}d
                    </span>
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11.5px] text-gray-800">
                  <span
                    style={{ background: "#f1f5f9", color: "#475569" }}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-[2px] text-[11px] font-semibold"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "#475569" }}
                    />
                    Other
                  </span>
                  <span className="font-mono">
                    {(employee.byType.maternity ?? 0) +
                      (employee.byType.paternity ?? 0) +
                      (employee.byType.unpaid ?? 0) +
                      (employee.byType.bereavement ?? 0)}
                    d
                  </span>
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Balance over time
              </div>
              {isLoading ? (
                <div className="px-3 py-6 text-center text-xs text-gray-500">
                  Loading…
                </div>
              ) : (
                <BalanceTrendChart
                  snapshots={history?.balanceSnapshots ?? []}
                />
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function KpiTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={`mt-1 font-mono text-base font-semibold ${accent}`}>
        {value}
      </div>
    </div>
  );
}

function splitName(full: string): [string, string] {
  const [first, ...rest] = full.split(" ");
  return [first || "?", rest.join(" ")];
}
