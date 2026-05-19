import { getStoredUser } from "@/lib/api/tokens";
import type {
  Project as ApiProject,
  ProjectAssignment as ApiAssignment,
  ProjectStatus as ApiProjectStatus,
  CreateProjectPayload,
} from "@/lib/api/modules/projects";
import type {
  AssignmentStatus,
  AvatarColor,
  MemberRole,
  Project,
  ProjectMember,
  ProjectsListFilters,
  ProjectStatus as UiProjectStatus,
} from "./types";

export function fmtDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtRelative(
  iso: string | undefined | null,
  now: Date = new Date()
): string {
  if (!iso) return "";
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)}w ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}mo ago`;
  return `${Math.floor(diff / 86400 / 365)}y ago`;
}

export function filterAndSortProjects(
  projects: Project[],
  search: string,
  filters: ProjectsListFilters
): Project[] {
  let list = projects;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }
  if (filters.status !== "All")
    list = list.filter((p) => p.status === filters.status);
  if (filters.client !== "All")
    list = list.filter((p) => p.client === filters.client);
  const sorted = [...list];
  switch (filters.sort) {
    case "Oldest":
      sorted.sort((a, b) => a.start_date.localeCompare(b.start_date));
      break;
    case "Name (A-Z)":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "Progress":
      sorted.sort((a, b) => b.progress - a.progress);
      break;
    default:
      sorted.sort((a, b) => b.last_activity.localeCompare(a.last_activity));
  }
  return sorted;
}

export function uniqueClients(projects: Project[]): string[] {
  return Array.from(
    new Set(projects.map((p) => p.client).filter((c): c is string => !!c))
  );
}

export function activeFilterCount(
  search: string,
  filters: ProjectsListFilters
): number {
  let n = 0;
  if (search) n++;
  if (filters.status !== "All") n++;
  if (filters.client !== "All") n++;
  return n;
}

const API_TO_UI_STATUS: Record<ApiProjectStatus, UiProjectStatus> = {
  planned: "Active",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Archived",
  archived: "Archived",
};

const UI_TO_API_STATUS: Record<UiProjectStatus, ApiProjectStatus> = {
  Active: "active",
  "On hold": "on_hold",
  Completed: "completed",
  Archived: "archived",
};

const PALETTE: AvatarColor[] = ["gray", "green", "indigo", "rose", "orange"];

function colorForId(id: number): AvatarColor {
  return PALETTE[Math.abs(id) % PALETTE.length];
}

function deriveCode(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PRJ";
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts
    .slice(0, 4)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function apiAssignmentToMember(
  a: ApiAssignment & { name?: string; assignment_id?: number }
): ProjectMember {
  const role: MemberRole =
    a.role && a.role.toLowerCase().includes("lead") ? "Lead" : "Contributor";
  const resolvedName =
    a.employee_name || a.name || `Employee #${a.user_profile_id}`;
  // TODO [TIME TRACKING]: Switch this even-split (100 / active_projects_count)
  // to a calculation derived from logged hours in the Time Tracking module:
  //   allocation = hours_on_this_project / employee_total_active_hours * 100
  // Until time entries are linked to ProjectAssignment, an even split across
  // currently-active projects is the best signal we have.
  const activeCount = Math.max(1, a.active_projects_count ?? 1);
  const derivedAllocation = Math.max(1, Math.floor(100 / activeCount));
  return {
    id: a.user_profile_id,
    assignment_id: a.assignment_id ?? a.id,
    name: resolvedName,
    role,
    color: colorForId(a.user_profile_id),
    allocation: derivedAllocation,
    start_date: a.start_date,
    end_date: a.end_date,
    notes: a.notes ?? undefined,
    created_by: "",
    created_at: a.created_at ?? "",
    updated_at: a.updated_at ?? "",
  };
}

export function apiProjectToUi(p: ApiProject): Project {
  const technologies = (p.app_stack ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const members = (p.active_members ?? []).map(apiAssignmentToMember);
  return {
    id: String(p.id),
    api_id: p.id,
    name: p.name,
    code: deriveCode(p.name),
    client: p.client ?? "",
    status: API_TO_UI_STATUS[p.status] ?? "Active",
    stage: (p.stage ?? "intake") as Project["stage"],
    stage_note: p.stage_note ?? "",
    // TODO [PROGRESS]: Project completion percentage. Currently hardcoded 0
    // because backend has no progress column and there's no signal to derive
    // it from. Options to implement (pick one):
    //   1. Stage-based: progress = (stageIndex + 1) / STAGES.length * 100
    //      — cheap, deterministic, no BE change required.
    //   2. Hours-based (preferred): progress = logged_hours / estimated_hours
    //      * 100. Requires (a) Project.estimated_hours field + migration on
    //      backend, (b) Time Tracking module persisting TimeEntry rows linked
    //      to ProjectAssignment. Wire this once TimeTrackingModule is real.
    //   3. Task-based: completed_tasks / total_tasks. Requires a Task model
    //      which doesn't exist yet.
    // Until one of those lands, leave Completion/ProgressBar hidden in the
    // overview + card to avoid showing a fake 0%.
    progress: 0,
    start_date: p.start_date ?? "",
    end_date: p.end_date ?? "",
    last_activity: p.updated_at,
    technologies,
    members,
    hours_logged: 0,
    document_count: 0,
    description: p.description ?? "",
    project_type: p.project_type,
    owner_id: p.owner_id,
  };
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  client?: string;
  app_stack?: string;
  project_type?: "client" | "internal";
  status?: UiProjectStatus;
  stage?: Project["stage"];
  stage_note?: string;
  start_date?: string;
  end_date?: string;
  owner_id?: number | null;
}

export function uiToCreateProjectPayload(
  input: ProjectCreateInput
): CreateProjectPayload {
  return {
    name: input.name,
    description: input.description || undefined,
    client: input.client || undefined,
    app_stack: input.app_stack || undefined,
    project_type: input.project_type ?? "client",
    status: input.status ? UI_TO_API_STATUS[input.status] : "active",
    stage: input.stage,
    stage_note: input.stage_note,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    owner_id: input.owner_id ?? null,
  };
}

export function uiStatusToApi(status: UiProjectStatus): ApiProjectStatus {
  return UI_TO_API_STATUS[status];
}

export function getCurrentActorName(): string {
  const u = getStoredUser();
  if (!u) return "Unknown";
  const first = typeof u.first_name === "string" ? u.first_name : "";
  const last = typeof u.last_name === "string" ? u.last_name : "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (typeof u.username === "string" && u.username) return u.username;
  if (typeof u.email === "string" && u.email) return u.email;
  return "Unknown";
}

function toDayStart(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isAssignmentActive(
  m: Pick<ProjectMember, "end_date">,
  now: Date = new Date()
): boolean {
  if (!m.end_date) return true;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return toDayStart(m.end_date) >= today.getTime();
}

export function assignmentStatus(
  m: Pick<ProjectMember, "end_date">,
  now: Date = new Date()
): AssignmentStatus {
  return isAssignmentActive(m, now) ? "Active" : "Ended";
}

export interface AssignmentFormInput {
  allocation: number;
  start_date: string;
  end_date: string | null;
}

export type AssignmentErrors = Partial<
  Record<"allocation" | "start_date" | "end_date" | "overlap", string>
>;

export function validateAssignment(
  input: AssignmentFormInput,
  ctx: {
    employeeId: number;
    project: Project;
    ignoreAssignmentId?: number;
  }
): AssignmentErrors {
  const errors: AssignmentErrors = {};

  if (
    !Number.isFinite(input.allocation) ||
    input.allocation < 1 ||
    input.allocation > 100
  ) {
    errors.allocation = "Allocation must be between 1 and 100.";
  }

  if (!input.start_date) {
    errors.start_date = "Start date is required.";
  } else if (Number.isNaN(new Date(input.start_date).getTime())) {
    errors.start_date = "Start date is invalid.";
  }

  if (input.end_date) {
    if (Number.isNaN(new Date(input.end_date).getTime())) {
      errors.end_date = "End date is invalid.";
    } else if (input.start_date && input.end_date <= input.start_date) {
      errors.end_date = "End date must be after start date.";
    }
  }

  const overlap = ctx.project.members.find(
    (m) =>
      m.id === ctx.employeeId &&
      m.id !== ctx.ignoreAssignmentId &&
      isAssignmentActive(m)
  );
  if (overlap) {
    errors.overlap =
      "Employee already has an active assignment on this project.";
  }

  return errors;
}
