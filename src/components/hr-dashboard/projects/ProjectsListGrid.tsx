"use client";

import { ProjectCard } from "./ProjectCard";
import type { Project, ProjectActionKind } from "./types";

interface ProjectsListGridProps {
  projects: Project[];
  onOpen: (id: string) => void;
  onAction: (action: ProjectActionKind, project: Project) => void;
}

export function ProjectsListGrid({
  projects,
  onOpen,
  onAction,
}: ProjectsListGridProps) {
  return (
    <div
      className="grid gap-3.5"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
    >
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          onOpen={onOpen}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
