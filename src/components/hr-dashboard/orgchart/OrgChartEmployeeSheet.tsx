"use client";

import {
  Calendar,
  ChevronRight,
  Crosshair,
  Crown,
  Eye,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import {
  deptOf,
  fmtDate,
  managerOf,
  reportsOf,
  tenure,
  STATUS_META,
} from "./orgChartUtils";
import { OrgAvatar } from "./OrgChartNode";
import type { OrgDepartment, OrgEmployee } from "./types";

interface Props {
  employee: OrgEmployee;
  employees: OrgEmployee[];
  departments: OrgDepartment[];
  onClose: () => void;
  onSelect: (id: number) => void;
  onCenterOn: (id: number) => void;
  onNavigateProfile?: (id: number) => void;
  onNavigateProjects?: (id: number) => void;
}

function PersonRow({
  emp,
  departments,
  onClick,
  kicker,
}: {
  emp: OrgEmployee;
  departments: OrgDepartment[];
  onClick: (id: number) => void;
  kicker?: string;
}) {
  const dept = deptOf(emp, departments);
  return (
    <button
      type="button"
      onClick={() => onClick(emp.id)}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <OrgAvatar emp={emp} departments={departments} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900 dark:text-gray-100">
          {emp.name}
          {emp.isManager && <Crown className="h-2.5 w-2.5 text-amber-600" />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-gray-500 dark:text-gray-400">
          <span>{emp.role}</span>
          <span className="opacity-50">·</span>
          <span style={{ color: dept.color }}>{dept.name}</span>
          {kicker && (
            <>
              <span className="opacity-50">·</span>
              <span>{kicker}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
    </button>
  );
}

export function OrgChartEmployeeSheet({
  employee,
  employees,
  departments,
  onClose,
  onSelect,
  onCenterOn,
  onNavigateProfile,
  onNavigateProjects,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portal so backdrop + sheet anchor to the viewport, not to a transformed
  // ancestor (DashboardView / sidebar layout has transforms that would make
  // `position: fixed` resolve to a parent instead of the viewport, leaving
  // a thin uncovered strip).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const dept = deptOf(employee, departments);
  const manager = managerOf(employee, employees);
  const reports = reportsOf(employee.id, employees);
  const status = STATUS_META[employee.status] ?? STATUS_META.active;

  if (!mounted) return null;

  const content = (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/20"
        onClick={onClose}
        style={{ animation: "fadeIn 0.18s ease", height: "100dvh" }}
      />
      <aside
        role="dialog"
        aria-label={`${employee.name} details`}
        style={{ height: "100dvh" }}
        className="fixed right-0 top-0 z-[61] flex w-[420px] max-w-full flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium"
              style={{ background: dept.soft, color: dept.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: dept.color }}
              />
              {dept.name}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: status.color }}
              />
              {status.label}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <OrgAvatar emp={employee} departments={departments} size={56} />
            <div>
              <div className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {employee.name}
                {employee.isManager && (
                  <Crown
                    className="h-3.5 w-3.5 text-amber-600"
                    aria-label="Manager"
                  />
                )}
              </div>
              <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {employee.role}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={() => onCenterOn(employee.id)}
            >
              <Crosshair className="h-3 w-3" />
              Center on chart
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={() => onNavigateProfile?.(employee.id)}
            >
              <Eye className="h-3 w-3" />
              View employee
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={() => onNavigateProjects?.(employee.id)}
            >
              <FolderKanban className="h-3 w-3" />
              View projects
            </Button>
          </div>
        </div>

        <div className="flex-1 p-5">
          <section className="mb-6">
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Contact
            </h3>
            <div className="flex flex-col gap-0.5">
              <a
                href={`mailto:${employee.email}`}
                className="flex items-center gap-2.5 rounded-md p-2 text-sm text-gray-900 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="font-mono text-[12.5px] text-gray-900 dark:text-gray-100">
                  {employee.email}
                </span>
              </a>
              <a
                href={`tel:${employee.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2.5 rounded-md p-2 text-sm text-gray-900 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="font-mono text-[12.5px] text-gray-900 dark:text-gray-100">
                  {employee.phone}
                </span>
              </a>
              <div className="flex items-center gap-2.5 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="text-[12.5px] text-gray-900 dark:text-gray-100">
                  {employee.location}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="text-[12.5px] text-gray-900 dark:text-gray-100">
                  Started {fmtDate(employee.startDate)}
                  <span className="ml-1.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                    · {tenure(employee.startDate)} at Bloomteq
                  </span>
                </span>
              </div>
            </div>
          </section>

          {employee.skills.length > 0 && (
            <section className="mb-6">
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {employee.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[11.5px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Reporting structure
            </h3>

            <div className="mb-1.5 text-xs font-medium text-gray-500">
              Reports to
            </div>
            {manager ? (
              <PersonRow
                emp={manager}
                departments={departments}
                onClick={onSelect}
              />
            ) : (
              <div className="rounded-md bg-gray-100 px-2.5 py-2 text-xs text-gray-500 dark:bg-gray-800">
                No manager — top of hierarchy
              </div>
            )}

            <div className="mb-1.5 mt-4 flex items-center text-xs font-medium text-gray-500">
              Direct reports
              <span className="ml-auto rounded bg-gray-100 px-1.5 py-px font-mono text-[11px] dark:bg-gray-800">
                {reports.length}
              </span>
            </div>
            {reports.length === 0 ? (
              <div className="rounded-md bg-gray-100 px-2.5 py-2 text-xs text-gray-500 dark:bg-gray-800">
                No direct reports
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {reports.map((r) => (
                  <PersonRow
                    key={r.id}
                    emp={r}
                    departments={departments}
                    onClick={onSelect}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    </>
  );

  return createPortal(content, document.body);
}
