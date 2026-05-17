import { Eye, Edit2, MoreHorizontal } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { Button } from "../ui/button";
import { EmployeeAvatar } from "./atoms/EmployeeAvatar";
import { StatusPill } from "./atoms/StatusPill";
import { deriveEmployeeStatus } from "./employeesListHelpers";
import { formatDate } from "@/utils";

interface EmployeesListTableProps {
  employees: EmployeeProfileData[];
  onOpen: (employee: EmployeeProfileData, mode: "view" | "edit") => void;
  canEditAll?: boolean;
}

const COLUMNS: { label: string; widthClass?: string; key: string }[] = [
  { label: "Name", widthClass: "w-[28%]", key: "name" },
  { label: "Job title", key: "role" },
  { label: "Department", key: "department" },
  { label: "Status", key: "status" },
  { label: "Start date", key: "start" },
  { label: "", widthClass: "w-[100px]", key: "actions" },
];

/** Table view — sortable, click row to open profile. */
export function EmployeesListTable({
  employees,
  onOpen,
  canEditAll,
}: EmployeesListTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-zinc-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`border-b border-zinc-200 px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase text-zinc-500 ${col.widthClass ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              onOpen={onOpen}
              canEditAll={canEditAll}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface EmployeeRowProps {
  employee: EmployeeProfileData;
  onOpen: EmployeesListTableProps["onOpen"];
  canEditAll?: boolean;
}

function EmployeeRow({ employee, onOpen, canEditAll }: EmployeeRowProps) {
  const handleOpen = (mode: "view" | "edit") => () => onOpen(employee, mode);
  const handleKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(employee, "view");
    }
  };
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={handleOpen("view")}
      onKeyDown={handleKey}
      aria-label={`Open profile for ${employee.first_name} ${employee.last_name}`}
      className="group cursor-pointer transition-colors hover:bg-[#fafaf9] focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-zinc-900"
    >
      <td className="border-b border-zinc-200 px-3.5 py-3 align-middle">
        <div className="flex items-center gap-3">
          <EmployeeAvatar
            firstName={employee.first_name}
            lastName={employee.last_name}
            src={employee.avatar}
            size={32}
          />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-zinc-900">
              {employee.first_name} {employee.last_name}
            </div>
            <div className="mt-px truncate text-[11px] text-zinc-500">
              {employee.email}
            </div>
          </div>
        </div>
      </td>
      <td className="border-b border-zinc-200 px-3.5 py-3 align-middle">
        {employee.role?.name ?? "—"}
      </td>
      <td className="border-b border-zinc-200 px-3.5 py-3 align-middle">
        {employee.department || "—"}
      </td>
      <td className="border-b border-zinc-200 px-3.5 py-3 align-middle">
        <StatusPill status={deriveEmployeeStatus(employee)} />
      </td>
      <td className="ep-mono border-b border-zinc-200 px-3.5 py-3 align-middle text-xs text-zinc-500">
        {employee.start_date ? formatDate(employee.start_date) : "—"}
      </td>
      <td className="border-b border-zinc-200 px-3.5 py-3 align-middle">
        <div className="flex justify-end gap-1 opacity-40 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            aria-label="View"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(employee, "view");
            }}
          >
            <Eye size={13} />
          </Button>
          {canEditAll ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(employee, "edit");
              }}
            >
              <Edit2 size={13} />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label="More"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={13} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
