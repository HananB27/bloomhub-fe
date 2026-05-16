"use client";

import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { StatusPill } from "./atoms";
import { fmtDate } from "./projectsHelpers";
import type { Project, ProjectActionKind } from "./types";

interface ProjectDetailHeaderProps {
  project: Project;
  onBack: () => void;
  onAction: (action: ProjectActionKind, project: Project) => void;
}

export function ProjectDetailHeader({
  project,
  onBack,
  onAction,
}: ProjectDetailHeaderProps) {
  return (
    <header className="mb-2 -mx-4 rounded-xl border-b border-gray-200 px-4 pb-[18px]">
      <div className="mt-2 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-3 w-3" /> Projects
        </Button>
        <nav
          className="flex items-center gap-1.5 text-[12px] text-gray-500"
          aria-label="Breadcrumb"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
            className="hover:text-gray-900"
          >
            Projects
          </a>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-gray-900">{project.name}</span>
        </nav>
      </div>
      <div className="mt-[18px] flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight text-gray-900">
              {project.name}
            </h1>
            <StatusPill status={project.status} />
          </div>
          <p className="mt-2 text-[14px] text-gray-700">
            {project.code} · {project.client} · Started{" "}
            {fmtDate(project.start_date)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onAction("archive", project)}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Delete project"
            onClick={() => onAction("delete", project)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={() => onAction("edit", project)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit project
          </Button>
        </div>
      </div>
    </header>
  );
}
