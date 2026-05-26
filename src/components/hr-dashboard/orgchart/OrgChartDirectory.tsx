"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Search, Users, X } from "lucide-react";
import { Input } from "../ui/input";
import { OrgAvatar } from "./OrgChartNode";
import { deptOf, STATUS_META } from "./orgChartUtils";
import type { OrgDepartment, OrgEmployee } from "./types";

interface Props {
  employees: OrgEmployee[];
  departments: OrgDepartment[];
  onOpen: (id: number) => void;
}

/**
 * Searchable / sortable employee directory. Mirrors the chart's data source
 * (`useOrgChartData`) so anything visible on the chart shows here too. Click
 * a row to open the same employee sheet the chart uses.
 */
export function OrgChartDirectory({ employees, departments, onOpen }: Props) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees
      .filter((e) => {
        if (deptFilter !== "all" && e.deptId !== deptFilter) return false;
        if (!q) return true;
        return (
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, search, deptFilter]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, role, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-7 text-sm"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-9 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="all">All departments</option>
          {departments
            .filter((d) => d.id !== "exec")
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>

        <span className="ml-auto font-mono text-[11px] text-gray-500">
          {visible.length} of {employees.length} people
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Users className="h-7 w-7 text-gray-400" />
          <p className="text-sm text-gray-500">
            No employees match your filters.
          </p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-left">Department</th>
                <th className="px-4 py-2.5 text-left">Contact</th>
                <th className="px-4 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((emp) => {
                const dept = deptOf(emp, departments);
                const status = STATUS_META[emp.status] ?? STATUS_META.active;
                return (
                  <tr
                    key={emp.id}
                    onClick={() => onOpen(emp.id)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <OrgAvatar
                          emp={emp}
                          departments={departments}
                          size={28}
                        />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {emp.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                      {emp.role}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: dept.soft, color: dept.color }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: dept.color }}
                        />
                        {dept.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3 text-[11.5px] text-gray-600 dark:text-gray-400">
                        {emp.email && (
                          <a
                            href={`mailto:${emp.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="font-mono">{emp.email}</span>
                          </a>
                        )}
                        {emp.phone && (
                          <a
                            href={`tel:${emp.phone.replace(/\s+/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-gray-600 dark:text-gray-400">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: status.color }}
                        />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
