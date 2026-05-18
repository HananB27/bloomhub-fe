"use client";

import { AlertCircle, Folder, Plus, Search } from "lucide-react";
import { Button } from "../ui/button";
import { EmptyState, SkeletonProjectGrid } from "./atoms";
import { ProjectsListGrid } from "./ProjectsListGrid";
import { ProjectsListHeader } from "./ProjectsListHeader";
import { ProjectsListTable } from "./ProjectsListTable";
import { ProjectsListToolbar } from "./ProjectsListToolbar";
import { useProjectsListView } from "./useProjectsListView";
import type { Project, ProjectActionKind } from "./types";

export type ProjectsListState = "populated" | "loading" | "empty" | "error";

interface ProjectsListPageProps {
  projects: Project[];
  state?: ProjectsListState;
  onRetry?: () => void;
  onOpen: (id: string) => void;
  onAction: (action: ProjectActionKind, project: Project) => void;
  onCreate: () => void;
  onExport: () => void;
}

export function ProjectsListPage({
  projects,
  state = "populated",
  onRetry,
  onOpen,
  onAction,
  onCreate,
  onExport,
}: ProjectsListPageProps) {
  const {
    view,
    setView,
    search,
    setSearch,
    filters,
    setFilter,
    clearAll,
    clients,
    filtered,
  } = useProjectsListView(projects);

  const effectiveState: ProjectsListState =
    state === "error" || state === "loading"
      ? state
      : projects.length === 0
        ? "empty"
        : "populated";

  return (
    <div className="mx-auto max-w-[1320px] px-8 py-7">
      <ProjectsListHeader
        totalCount={effectiveState === "empty" ? 0 : projects.length}
        onCreate={onCreate}
        onExport={onExport}
      />

      {effectiveState === "populated" || effectiveState === "loading" ? (
        <ProjectsListToolbar
          search={search}
          onSearch={setSearch}
          view={view}
          onView={setView}
          filters={filters}
          onFilter={setFilter}
          onClearAll={clearAll}
          clients={clients}
          resultCount={filtered.length}
          totalCount={projects.length}
        />
      ) : null}

      <div className="min-h-[300px]">
        {effectiveState === "empty" ? (
          <EmptyState
            icon={<Folder className="h-9 w-9" strokeWidth={1.4} />}
            title="No projects yet"
            description="Projects let you group people, time, and documents around a deliverable. Create your first project to start tracking work."
            actions={
              <Button onClick={onCreate}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New project
              </Button>
            }
          />
        ) : effectiveState === "error" ? (
          <EmptyState
            tone="danger"
            icon={<AlertCircle className="h-9 w-9" />}
            title="Couldn't load projects"
            description="Something went wrong fetching the project list. Check your connection and try again."
            actions={
              onRetry ? (
                <Button variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        ) : effectiveState === "loading" ? (
          <SkeletonProjectGrid />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-9 w-9" strokeWidth={1.4} />}
            title="No matching projects"
            description="Nothing matched your search and filters. Try broadening or clearing them."
            actions={
              <Button variant="outline" onClick={clearAll}>
                Clear search & filters
              </Button>
            }
          />
        ) : view === "grid" ? (
          <ProjectsListGrid
            projects={filtered}
            onOpen={onOpen}
            onAction={onAction}
          />
        ) : (
          <ProjectsListTable
            projects={filtered}
            onOpen={onOpen}
            onAction={onAction}
          />
        )}
      </div>
    </div>
  );
}
