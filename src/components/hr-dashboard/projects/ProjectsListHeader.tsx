"use client";

import { ChevronRight, Download, Plus } from "lucide-react";
import { Button } from "../ui/button";

interface ProjectsListHeaderProps {
  totalCount: number;
  onCreate: () => void;
  onExport: () => void;
}

export function ProjectsListHeader({
  totalCount,
  onCreate,
  onExport,
}: ProjectsListHeaderProps) {
  return (
    <header className="mb-[22px] flex flex-wrap items-end justify-between gap-6">
      <div>
        <nav
          className="flex items-center gap-1.5 text-[12px] text-gray-500"
          aria-label="Breadcrumb"
        >
          <a
            href="#"
            className="hover:text-gray-900"
            onClick={(e) => e.preventDefault()}
          >
            HR
          </a>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-gray-900">Projects</span>
        </nav>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight text-gray-900">
            Projects
          </h1>
          <span
            className="inline-flex h-6 min-w-[28px] items-center justify-center rounded bg-gray-100 px-2.5 text-[13px] font-semibold text-gray-700 tabular-nums"
            aria-label="Total projects"
          >
            {totalCount}
          </span>
        </div>
        <p className="mt-2 text-[14px] text-gray-500">
          Track work, members, time, and documents per engagement.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
        <Button onClick={onCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New project
        </Button>
      </div>
    </header>
  );
}
