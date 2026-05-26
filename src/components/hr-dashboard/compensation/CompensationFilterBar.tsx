"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";

export const ALL_DEPARTMENTS = "All" as const;
export const STATUS_OPTIONS = ["All", "Active", "On Leave", "PTO"] as const;

export type DepartmentFilter = string; // "All" | any department name from data
export type StatusFilter = (typeof STATUS_OPTIONS)[number];

export interface CompensationFilters {
  department: DepartmentFilter;
  status: StatusFilter;
  search: string;
}

interface CompensationFilterBarProps {
  filters: CompensationFilters;
  onChange: (next: CompensationFilters) => void;
  visibleCount: number;
  totalCount: number;
  departmentOptions: string[]; // "All" prepended by parent
}

const FILTER_LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]";

export function CompensationFilterBar({
  filters,
  onChange,
  visibleCount,
  totalCount,
  departmentOptions,
}: CompensationFilterBarProps) {
  return (
    <div
      className="comp-rise flex flex-wrap items-center gap-3.5 rounded-t-xl border border-b-0 border-[#e5e7eb] bg-white px-3.5 py-3"
      style={{ animationDelay: "380ms" }}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="comp-fDept" className={FILTER_LABEL}>
          Department
        </label>
        <Select
          value={filters.department}
          onValueChange={(value) =>
            onChange({ ...filters, department: value as DepartmentFilter })
          }
        >
          <SelectTrigger
            id="comp-fDept"
            className="h-8 min-w-[150px] rounded-lg border-[#e5e7eb] bg-white px-2.5 text-xs text-[#171717]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentOptions.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="comp-fStatus" className={FILTER_LABEL}>
          Status
        </label>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ ...filters, status: value as StatusFilter })
          }
        >
          <SelectTrigger
            id="comp-fStatus"
            className="h-8 min-w-[150px] rounded-lg border-[#e5e7eb] bg-white px-2.5 text-xs text-[#171717]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-[260px] flex-1 flex-col gap-1">
        <label htmlFor="comp-fSearch" className={FILTER_LABEL}>
          Search employee
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
          <Input
            id="comp-fSearch"
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by name, title, or department"
            className="h-8 rounded-lg border-[#e5e7eb] bg-white !pl-10 text-xs"
            aria-label="Search employees"
          />
        </div>
      </div>

      <div className="text-xs font-medium text-[#4b5563]">
        Showing{" "}
        <strong className="comp-mono font-semibold text-[#171717]">
          {visibleCount}
        </strong>{" "}
        of{" "}
        <strong className="comp-mono font-semibold text-[#171717]">
          {totalCount}
        </strong>{" "}
        employees
      </div>
    </div>
  );
}
