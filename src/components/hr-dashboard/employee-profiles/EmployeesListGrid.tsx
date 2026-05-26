import { Eye, Briefcase, MoreHorizontal, Mail, Send } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { EmployeeAvatar } from "./atoms/EmployeeAvatar";
import { StatusPill } from "./atoms/StatusPill";
import { deriveEmployeeStatus } from "./employeesListHelpers";

interface EmployeesListGridProps {
  employees: EmployeeProfileData[];
  onOpen: (employee: EmployeeProfileData, mode: "view" | "edit") => void;
}

/** Grid view — clickable card per employee. Card click opens read-only profile. */
export function EmployeesListGrid({
  employees,
  onOpen,
}: EmployeesListGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onOpen={onOpen} />
      ))}
    </div>
  );
}

interface EmployeeCardProps {
  employee: EmployeeProfileData;
  onOpen: EmployeesListGridProps["onOpen"];
}

function EmployeeCard({ employee, onOpen }: EmployeeCardProps) {
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const status = deriveEmployeeStatus(employee);
  return (
    <button
      type="button"
      onClick={() => onOpen(employee, "view")}
      aria-label={`Open profile for ${fullName}`}
      className="group relative rounded-2xl border border-zinc-200 bg-white p-[18px] text-left transition-[border-color,box-shadow,transform] hover:border-zinc-300 hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 active:translate-y-px"
    >
      <div className="mb-3 flex items-start justify-between">
        <EmployeeAvatar
          firstName={employee.first_name}
          lastName={employee.last_name}
          src={employee.avatar}
          size={56}
        />
        <StatusPill status={status} />
      </div>
      <div className="text-[15px] font-semibold tracking-tight text-zinc-900">
        {fullName}
      </div>
      <div className="mt-0.5 text-[13px] text-zinc-500">
        {employee.role?.name ?? "—"}
      </div>
      <div className="mt-3 flex flex-wrap gap-3.5 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500">
        {employee.department ? (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={12} aria-hidden />
            {employee.department}
          </span>
        ) : null}
        {employee.email ? (
          <span className="inline-flex items-center gap-1.5">
            <Mail size={12} aria-hidden />
            <span className="max-w-[140px] truncate">{employee.email}</span>
          </span>
        ) : null}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute top-3.5 right-3.5 flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white/95 px-1.5 py-1 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-600">
          <Eye size={14} />
        </span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-600">
          <Send size={14} />
        </span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-600">
          <MoreHorizontal size={14} />
        </span>
      </div>
    </button>
  );
}
