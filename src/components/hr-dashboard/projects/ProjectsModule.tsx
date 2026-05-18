"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectDetailView } from "./ProjectDetailView";
import { ProjectsListPage } from "./ProjectsListPage";
import {
  AddMemberDialog,
  ConfirmActionDialog,
  CreateProjectDrawer,
  EditProjectDialog,
  ExportProjectsDialog,
  StatusEditorDialog,
  type CreateProjectFormValues,
  type ExportProjectsValues,
  type StatusEditResult,
} from "./dialogs";
import { SEED_PROJECTS, STAGE_BY_ID } from "./projectsData";
import type {
  Project,
  ProjectActionKind,
  ProjectMember,
  ProjectStageId,
} from "./types";

interface ProjectsModuleProps {
  initialProjects?: Project[];
  initialProjectId?: string | null;
  onNavigate?: (moduleId: string) => void;
}

type ActionTarget =
  | { kind: "edit"; project: Project }
  | { kind: "status"; project: Project; stage?: ProjectStageId }
  | { kind: "archive"; project: Project }
  | { kind: "delete"; project: Project };

type LoadState = "loading" | "populated" | "error";

export function ProjectsModule({
  initialProjects = SEED_PROJECTS,
  initialProjectId = null,
  onNavigate,
}: ProjectsModuleProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeId, setActiveId] = useState<string | null>(initialProjectId);
  const [showCreate, setShowCreate] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [addMemberFor, setAddMemberFor] = useState<Project | null>(null);
  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    const timer = setTimeout(() => {
      if (cancelled) return;
      const override =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("projects_state")
          : null;
      if (override === "error") {
        setLoadState("error");
        return;
      }
      if (override === "empty") {
        setProjects([]);
        setLoadState("populated");
        return;
      }
      if (override === "loading") {
        return;
      }
      setLoadState("populated");
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  const activeProject = useMemo(
    () => (activeId ? (projects.find((p) => p.id === activeId) ?? null) : null),
    [activeId, projects]
  );

  const handleOpen = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const handleBack = useCallback(() => {
    setActiveId(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const handleAction = useCallback(
    (
      action: ProjectActionKind,
      project: Project,
      ctx?: { stage?: ProjectStageId }
    ) => {
      switch (action) {
        case "open":
          handleOpen(project.id);
          return;
        case "edit":
          setTarget({ kind: "edit", project });
          return;
        case "status":
          setTarget({ kind: "status", project, stage: ctx?.stage });
          return;
        case "archive":
          setTarget({ kind: "archive", project });
          return;
        case "delete":
          setTarget({ kind: "delete", project });
          return;
        case "duplicate": {
          const copy: Project = {
            ...project,
            id: `${project.id}-copy-${Math.random().toString(36).slice(2, 6)}`,
            name: `${project.name} (copy)`,
            code: `${project.code.slice(0, 3)}C`.slice(0, 4).toUpperCase(),
            status: "On hold",
            progress: 0,
            last_activity: new Date().toISOString(),
          };
          setProjects((arr) => [copy, ...arr]);
          toast.success(`${project.name} duplicated`, {
            description: `Created "${copy.name}" in draft state.`,
          });
          return;
        }
        case "share": {
          const url =
            typeof window !== "undefined"
              ? `${window.location.origin}${window.location.pathname}?id=${project.id}`
              : project.id;
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(url).catch(() => {});
          }
          toast.info("Link copied", { description: url });
          return;
        }
      }
    },
    [handleOpen]
  );

  const closeTarget = () => setTarget(null);

  const onCreate = (form: CreateProjectFormValues) => {
    const id = `${(form.code || "PRJ").toLowerCase()}-${Math.random().toString(36).slice(2, 5)}`;
    const newProject: Project = {
      id,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      client: form.client,
      status: form.status,
      stage: form.stage,
      stage_note: "",
      progress: 0,
      start_date: form.start_date,
      end_date: form.end_date,
      last_activity: new Date().toISOString(),
      technologies: form.technologies,
      members: [
        { id: 12, name: "Aida Salihović", role: "Lead", color: "rose" },
      ],
      hours_logged: 0,
      document_count: 0,
      description: form.description || "No description yet.",
    };
    setProjects((arr) => [newProject, ...arr]);
    toast.success("Project created", {
      description: `${newProject.name} is ready. Add members next.`,
    });
    setShowCreate(false);
  };

  const onSaveEdit = (next: Project) => {
    setProjects((arr) => arr.map((p) => (p.id === next.id ? next : p)));
    toast.success("Project updated", {
      description: `Saved changes to ${next.name}`,
    });
  };

  const onSaveStatus = (project: Project, next: StatusEditResult) => {
    setProjects((arr) =>
      arr.map((p) =>
        p.id === project.id
          ? {
              ...p,
              status: next.status,
              stage: next.stage,
              stage_note: next.note || p.stage_note,
              last_activity: new Date().toISOString(),
            }
          : p
      )
    );
    toast.success("Status updated", {
      description: `${project.name} is now ${next.status} · ${STAGE_BY_ID[next.stage].label}`,
    });
  };

  const onConfirmArchive = (project: Project) => {
    setProjects((arr) =>
      arr.map((p) => (p.id === project.id ? { ...p, status: "Archived" } : p))
    );
    toast.warning("Project archived", {
      description: `${project.name} moved to the Archived filter.`,
    });
    closeTarget();
  };

  const onConfirmDelete = (project: Project) => {
    setProjects((arr) => arr.filter((p) => p.id !== project.id));
    toast.error("Project deleted", {
      description: `${project.name} was permanently removed.`,
    });
    closeTarget();
    if (activeId === project.id) handleBack();
  };

  const onExport = () => setShowExport(true);

  const handleAddMember = useCallback(
    (project: Project, member: ProjectMember) => {
      setProjects((arr) =>
        arr.map((p) =>
          p.id === project.id ? { ...p, members: [...p.members, member] } : p
        )
      );
      toast.success("Member added", {
        description: `${member.name} added to ${project.name}.`,
      });
    },
    []
  );

  const handleExportConfirm = (values: ExportProjectsValues) => {
    const count = values.scope === "all" ? projects.length : projects.length;
    toast.success("Export started", {
      description: `Preparing ${values.format.toUpperCase()} for ${count} project(s) · ${values.columns.length} columns.`,
    });
  };

  return (
    <>
      {activeProject ? (
        <ProjectDetailView
          project={activeProject}
          onBack={handleBack}
          onAction={(action, p, ctx) => handleAction(action, p, ctx)}
          onAddMember={(p) => setAddMemberFor(p)}
          onOpenDocument={(documentId) => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("bh.openDocumentId", String(documentId));
            }
            onNavigate?.("documents");
          }}
        />
      ) : (
        <ProjectsListPage
          projects={projects}
          state={loadState}
          onRetry={handleRetry}
          onOpen={handleOpen}
          onAction={handleAction}
          onCreate={() => setShowCreate(true)}
          onExport={onExport}
        />
      )}

      <CreateProjectDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={onCreate}
      />

      {addMemberFor ? (
        <AddMemberDialog
          open
          onOpenChange={(o) => (o ? null : setAddMemberFor(null))}
          project={addMemberFor}
          onAdd={(m) => handleAddMember(addMemberFor, m)}
        />
      ) : null}

      <ExportProjectsDialog
        open={showExport}
        onOpenChange={setShowExport}
        totalCount={projects.length}
        filteredCount={projects.length}
        onConfirm={handleExportConfirm}
      />

      {target?.kind === "edit" ? (
        <EditProjectDialog
          project={target.project}
          open
          onOpenChange={(o) => (o ? null : closeTarget())}
          onSave={onSaveEdit}
        />
      ) : null}

      {target?.kind === "status" ? (
        <StatusEditorDialog
          project={target.project}
          initialStage={target.stage}
          open
          onOpenChange={(o) => (o ? null : closeTarget())}
          onSave={(next) => onSaveStatus(target.project, next)}
        />
      ) : null}

      {target?.kind === "archive" ? (
        <ConfirmActionDialog
          action="archive"
          project={target.project}
          open
          onOpenChange={(o) => (o ? null : closeTarget())}
          onConfirm={() => onConfirmArchive(target.project)}
        />
      ) : null}

      {target?.kind === "delete" ? (
        <ConfirmActionDialog
          action="delete"
          project={target.project}
          open
          onOpenChange={(o) => (o ? null : closeTarget())}
          onConfirm={() => onConfirmDelete(target.project)}
        />
      ) : null}
    </>
  );
}
