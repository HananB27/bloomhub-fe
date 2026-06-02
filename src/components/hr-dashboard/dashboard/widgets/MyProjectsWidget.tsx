import { ChevronRight, Folder } from "lucide-react";

import type { MyProjectRow } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { ProgressBar } from "./ProgressBar";

interface Props {
  projects: MyProjectRow[];
  onViewAll?: () => void;
}

export function MyProjectsWidget({ projects, onViewAll }: Props) {
  return (
    <DashboardCard
      title="My projects"
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {projects.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">
          You&apos;re not assigned to any projects.
        </div>
      ) : (
        <div>
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 border-b border-gray-200 py-2.5 last:border-b-0 last:pb-0"
            >
              <span className="inline-grid h-[34px] w-[34px] place-items-center rounded-lg bg-indigo-50 text-indigo-700">
                <Folder className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {p.name}
                </div>
                <div className="text-[11.5px] text-gray-600">{p.role}</div>
              </div>
              <div className="flex w-[110px] shrink-0 items-center gap-2">
                <div className="flex-1">
                  <ProgressBar value={p.allocation} max={100} />
                </div>
                <span className="w-8 text-right font-mono text-[11.5px] font-semibold text-gray-700">
                  {p.allocation}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
