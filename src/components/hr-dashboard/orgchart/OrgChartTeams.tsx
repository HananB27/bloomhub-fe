"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FolderKanban, Users } from "lucide-react";
import { OrgAvatar } from "./OrgChartNode";
import { deptOf } from "./orgChartUtils";
import type { OrgDepartment, OrgEmployee, OrgProject } from "./types";

interface Props {
  employees: OrgEmployee[];
  departments: OrgDepartment[];
  projects: OrgProject[];
  onOpen: (id: number) => void;
}

/**
 * Project-grouped roster. Each project card lists active members with quick
 * deep-link to the employee sheet. Replaces the previous "Teams" stub —
 * "team" is implicit per project here.
 */
export function OrgChartTeams({
  employees,
  departments,
  projects,
  onOpen,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(projects.slice(0, 3).map((p) => p.id))
  );

  const empById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees]
  );

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
        <FolderKanban className="h-7 w-7 text-gray-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          No projects yet
        </p>
        <p className="max-w-sm text-xs text-gray-500">
          Create a project in the Projects module to populate teams here.
        </p>
      </div>
    );
  }

  // CSS columns instead of a CSS grid so cards in the same visual "row" can
  // have different heights. Grid stretches the shorter card to match the
  // expanded sibling's height, leaving an ugly empty block.
  return (
    <div className="gap-3 [column-fill:balance] md:columns-2">
      {projects.map((p) => {
        const members = p.memberIds
          .map((id) => empById[id])
          .filter(Boolean) as OrgEmployee[];
        const isOpen = expanded.has(p.id);
        return (
          <div
            key={p.id}
            className="mb-3 break-inside-avoid overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <button
              type="button"
              onClick={() => toggle(p.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <FolderKanban className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {p.name}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-gray-500">
                  <span>{p.status}</span>
                  <span className="opacity-50">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {members.length}{" "}
                    {members.length === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {isOpen && (
              <div className="border-t border-gray-200 px-2 py-2 dark:border-gray-700">
                {members.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-gray-500">
                    No active assignments.
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {members.map((m) => {
                      const dept = deptOf(m, departments);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpen(m.id)}
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <OrgAvatar
                            emp={m}
                            departments={departments}
                            size={28}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium text-gray-900 dark:text-gray-100">
                              {m.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                              <span>{m.role}</span>
                              <span className="opacity-50">·</span>
                              <span style={{ color: dept.color }}>
                                {dept.name}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
