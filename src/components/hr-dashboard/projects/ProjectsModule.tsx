"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectDetailView } from "./ProjectDetailView";
import { ProjectsListPage } from "./ProjectsListPage";
import {
  AddMemberDialog,
  ConfirmActionDialog,
  CreateProjectDrawer,
  EditAssignmentDialog,
  EditProjectDialog,
  EndAssignmentDialog,
  ExportProjectsDialog,
  StatusEditorDialog,
  type CreateProjectFormValues,
  type ExportProjectsValues,
  type StatusEditResult,
} from "./dialogs";
import {
  apiProjectToUi,
  uiToCreateProjectPayload,
  uiStatusToApi,
} from "./projectsHelpers";
import { projectApi } from "@/lib/api/modules/projects";
import { consumeOpenProjectRequest } from "../orgchart/crossModuleNav";
import { getProjectDefaults } from "@/lib/projects/adminSettings";
import type {
  Project,
  ProjectActionKind,
  ProjectMember,
  ProjectStageId,
} from "./types";

interface ProjectsModuleProps {
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
  initialProjectId = null,
  onNavigate,
}: ProjectsModuleProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  // Hydrate from cross-module nav request first (e.g. clicked from an
  // employee profile chip), fall back to explicit prop.
  const [activeId, setActiveId] = useState<string | null>(() => {
    const pending = consumeOpenProjectRequest();
    return pending ?? initialProjectId;
  });
  const [showCreate, setShowCreate] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [addMemberFor, setAddMemberFor] = useState<Project | null>(null);
  const [editAssignment, setEditAssignment] = useState<{
    project: Project;
    assignment: ProjectMember;
  } | null>(null);
  const [endAssignment, setEndAssignment] = useState<{
    project: Project;
    assignment: ProjectMember;
  } | null>(null);
  const [target, setTarget] = useState<ActionTarget | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    projectApi
      .list(undefined, { signal: controller.signal })
      .then((res) => {
        setProjects(res.results.map(apiProjectToUi));
        setLoadState("populated");

        // The list endpoint omits `active_members` (only the detail endpoint
        // returns them), so cards render with 0 avatars until the user opens
        // a project. Hydrate member rosters in parallel via detail fetches
        // so cards fill in shortly after the list paints.
        // TODO[BHB-projects]: drop this once `GET /api/projects/` includes
        // `active_members` (or at least a slim member list) in the list
        // response.
        for (const apiProject of res.results) {
          if (controller.signal.aborted) break;
          if (apiProject.active_members && apiProject.active_members.length > 0)
            continue;
          projectApi
            .get(apiProject.id, { signal: controller.signal })
            .then((fresh) => {
              const ui = apiProjectToUi(fresh);
              setProjects((arr) =>
                arr.map((p) => (p.api_id === ui.api_id ? ui : p))
              );
            })
            .catch((err: unknown) => {
              if ((err as { name?: string })?.name === "AbortError") return;
              // Swallow: card just stays without members until next refresh.
            });
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setLoadState("error");
        toast.error("Failed to load projects", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [reloadKey]);

  const reloadProject = useCallback(async (apiId: number) => {
    try {
      const fresh = await projectApi.get(apiId);
      const ui = apiProjectToUi(fresh);
      setProjects((arr) => arr.map((p) => (p.api_id === apiId ? ui : p)));
      return ui;
    } catch (err) {
      toast.error("Failed to refresh project", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      return null;
    }
  }, []);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (initialProjectId) setActiveId(initialProjectId);
  }, [initialProjectId]);

  const activeProject = useMemo(
    () => (activeId ? (projects.find((p) => p.id === activeId) ?? null) : null),
    [activeId, projects]
  );

  useEffect(() => {
    if (!activeProject) return;
    let cancelled = false;
    projectApi
      .get(activeProject.api_id)
      .then((fresh) => {
        if (cancelled) return;
        const ui = apiProjectToUi(fresh);
        setProjects((arr) => arr.map((p) => (p.api_id === ui.api_id ? ui : p)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeProject?.api_id]);

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
        case "duplicate":
          toast.info("Duplicate not supported", {
            description: "Project duplication is not available yet.",
          });
          return;
        case "share": {
          const url =
            typeof window !== "undefined"
              ? `${window.location.origin}/projects?id=${encodeURIComponent(project.id)}`
              : `/projects?id=${encodeURIComponent(project.id)}`;
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

  const onCreate = async (form: CreateProjectFormValues) => {
    try {
      const adminDefaults = getProjectDefaults();
      const primaryLead = form.lead_ids[0] ?? null;
      const payload = uiToCreateProjectPayload({
        name: form.name.trim(),
        description: form.description,
        client: form.client,
        app_stack: form.technologies.join(", "),
        project_type: adminDefaults.default_project_type,
        status: form.status,
        stage: form.stage,
        start_date: form.start_date,
        end_date: form.end_date,
        owner_id: primaryLead,
      });
      const created = await projectApi.create(payload);
      const startDate =
        form.start_date || new Date().toISOString().slice(0, 10);
      for (const leadId of form.lead_ids) {
        try {
          await projectApi.createAssignment(created.id, {
            user_profile_id: leadId,
            role: "Lead",
            allocation_percentage: 100,
            start_date: startDate,
            status: "active",
          });
        } catch (err) {
          toast.warning("Lead assignment failed", {
            description: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
      const fresh = await projectApi.get(created.id);
      setProjects((arr) => [apiProjectToUi(fresh), ...arr]);
      toast.success("Project created", {
        description: `${fresh.name} is ready.`,
      });
      setShowCreate(false);
    } catch (err) {
      toast.error("Create failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onSaveEdit = async (next: Project) => {
    try {
      await projectApi.update(next.api_id, {
        name: next.name,
        description: next.description,
        client: next.client,
        app_stack: next.technologies.join(", "),
        status: uiStatusToApi(next.status),
        start_date: next.start_date || null,
        end_date: next.end_date || null,
      });
      await reloadProject(next.api_id);
      toast.success("Project updated", {
        description: `Saved changes to ${next.name}`,
      });
    } catch (err) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onSaveStatus = async (project: Project, next: StatusEditResult) => {
    try {
      await projectApi.update(project.api_id, {
        status: uiStatusToApi(next.status),
        stage: next.stage,
        stage_note: next.note || "",
      });
      await reloadProject(project.api_id);
      toast.success("Status updated", {
        description: `${project.name} is now ${next.status}`,
      });
    } catch (err) {
      toast.error("Status update failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onConfirmArchive = async (project: Project) => {
    try {
      await projectApi.archive(project.api_id);
      await reloadProject(project.api_id);
      toast.warning("Project archived", {
        description: `${project.name} moved to the Archived filter.`,
      });
    } catch (err) {
      toast.error("Archive failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
    closeTarget();
  };

  const onConfirmDelete = async (project: Project) => {
    try {
      await projectApi.delete(project.api_id);
      setProjects((arr) => arr.filter((p) => p.id !== project.id));
      toast.error("Project deleted", {
        description: `${project.name} permanently removed.`,
      });
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
    closeTarget();
    if (activeId === project.id) handleBack();
  };

  const onExport = () => setShowExport(true);

  const handleAddMember = useCallback(
    async (
      project: Project,
      input: Omit<ProjectMember, "created_by" | "created_at" | "assignment_id">
    ) => {
      try {
        await projectApi.createAssignment(project.api_id, {
          user_profile_id: input.id,
          role: input.role,
          allocation_percentage: input.allocation,
          start_date: input.start_date,
          end_date: input.end_date,
          notes: input.notes,
          status: "active",
        });
        await reloadProject(project.api_id);
        toast.success("Assignment created", {
          description: `${input.name} assigned to ${project.name} at ${input.allocation}%.`,
        });
      } catch (err) {
        toast.error("Assign failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [reloadProject]
  );

  const handleUpdateAssignment = useCallback(
    async (project: Project, next: ProjectMember) => {
      try {
        await projectApi.updateAssignment(next.assignment_id, {
          role: next.role,
          allocation_percentage: next.allocation,
          start_date: next.start_date,
          end_date: next.end_date,
          notes: next.notes ?? null,
        });
        await reloadProject(project.api_id);
        toast.success("Assignment updated", {
          description: `Saved changes for ${next.name}.`,
        });
      } catch (err) {
        toast.error("Update failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [reloadProject]
  );

  const handleDeleteAssignment = useCallback(
    async (project: Project, assignment: ProjectMember) => {
      try {
        await projectApi.deleteAssignment(assignment.assignment_id);
        await reloadProject(project.api_id);
        toast.success("Assignment deleted", {
          description: `Removed historical record for ${assignment.name}.`,
        });
      } catch (err) {
        toast.error("Delete failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [reloadProject]
  );

  const handleEndAssignment = useCallback(
    async (project: Project, assignment: ProjectMember, endDate: string) => {
      try {
        await projectApi.endAssignment(assignment.assignment_id, endDate);
        await reloadProject(project.api_id);
        toast.warning("Assignment ended", {
          description: `${assignment.name} ended on ${endDate}.`,
        });
      } catch (err) {
        toast.error("End failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [reloadProject]
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
          onEditAssignment={(p, a) =>
            setEditAssignment({ project: p, assignment: a })
          }
          onEndAssignment={(p, a) =>
            setEndAssignment({ project: p, assignment: a })
          }
          onDeleteAssignment={(p, a) => handleDeleteAssignment(p, a)}
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

      {editAssignment ? (
        <EditAssignmentDialog
          open
          onOpenChange={(o) => (o ? null : setEditAssignment(null))}
          project={editAssignment.project}
          assignment={editAssignment.assignment}
          onSave={(next) =>
            handleUpdateAssignment(editAssignment.project, next)
          }
        />
      ) : null}

      {endAssignment ? (
        <EndAssignmentDialog
          open
          onOpenChange={(o) => (o ? null : setEndAssignment(null))}
          assignment={endAssignment.assignment}
          onConfirm={(date) =>
            handleEndAssignment(
              endAssignment.project,
              endAssignment.assignment,
              date
            )
          }
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
