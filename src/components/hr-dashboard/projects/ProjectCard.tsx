"use client";

import { type KeyboardEvent } from "react";
import { cn } from "../ui/utils";
import {
  MemberStack,
  ProjectActionMenu,
  ProjectIcon,
  StageChip,
  StatusPill,
  TechBadge,
} from "./atoms";
import { fmtRelative } from "./projectsHelpers";
import type { Project, ProjectActionKind } from "./types";

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onAction: (action: ProjectActionKind, project: Project) => void;
  className?: string;
}

export function ProjectCard({
  project,
  onOpen,
  onAction,
  className,
}: ProjectCardProps) {
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(project.id);
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.name}`}
      onClick={() => onOpen(project.id)}
      onKeyDown={handleKey}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-[18px] text-left transition-[border-color,box-shadow] duration-200 hover:border-gray-300 hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.08)] focus-visible:border-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProjectIcon size="md" />
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight text-gray-900">
              {project.name}
            </div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              {project.code} · {project.client}
            </div>
          </div>
        </div>
        <StatusPill status={project.status} />
      </div>

      <div className="mb-3 line-clamp-2 min-h-[34px] text-[12px] text-gray-600">
        {project.description}
      </div>

      <StageChip stage={project.stage} className="mb-2.5" />

      <div className="mt-3 flex flex-wrap gap-1">
        {project.technologies.slice(0, 3).map((t) => (
          <TechBadge key={t} name={t} size="sm" />
        ))}
        {project.technologies.length > 3 ? (
          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
            +{project.technologies.length - 3}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2.5 text-[11px] text-gray-500">
        <MemberStack members={project.members} />
        <span>Updated {fmtRelative(project.last_activity)}</span>
      </div>

      <div className="absolute right-3.5 top-3.5 rounded-lg border border-gray-200 bg-white/95 p-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <ProjectActionMenu
          project={project}
          onAction={onAction}
          variant="card"
        />
      </div>
    </div>
  );
}
