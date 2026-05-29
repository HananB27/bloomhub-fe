import { API_BASE_URL } from "../../../config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
  patch,
  post,
} from "../../helpers/httpClient";

export type ProjectStatus =
  | "planned"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "archived";

export type ProjectType = "client" | "internal";

export type ProjectStage =
  | "intake"
  | "scoping"
  | "triage"
  | "estimation"
  | "review_approval"
  | "proposal_sent"
  | "kickoff"
  | "delivery";

export type AssignmentStatus = "active" | "completed" | "on_hold";

export interface ProjectAssignment {
  id: number;
  project_id: number;
  project_name?: string;
  user_profile_id: number;
  employee_name: string;
  role: string | null;
  allocation_percentage: number;
  weekly_allocation_hours?: string;
  active_projects_count?: number;
  start_date: string;
  end_date: string | null;
  status: AssignmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectActivityEvent {
  id: string;
  at: string;
  actor: string;
  message: string;
}

export interface ProjectAssignmentSummary {
  total_assignments: number;
  active_assignments: number;
  active_members: number;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  client: string | null;
  app_stack: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  stage: ProjectStage;
  stage_note: string;
  start_date: string | null;
  end_date: string | null;
  owner_id: number | null;
  created_at: string;
  updated_at: string;
  assignment_summary?: ProjectAssignmentSummary;
  active_members_count?: number;
  active_members?: ProjectAssignment[];
}

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus;
  owner?: number;
  active_from?: string;
  active_to?: string;
  page?: number;
  page_size?: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  client?: string;
  app_stack?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  stage?: ProjectStage;
  stage_note?: string;
  start_date?: string | null;
  end_date?: string | null;
  owner_id?: number | null;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export interface CreateAssignmentPayload {
  user_profile_id: number;
  role?: string | null;
  allocation_percentage?: number;
  weekly_allocation_hours?: string;
  start_date: string;
  end_date?: string | null;
  status?: AssignmentStatus;
  notes?: string | null;
}

export type UpdateAssignmentPayload = Partial<CreateAssignmentPayload>;

const base = `${API_BASE_URL}/api`;

export const projectApi = {
  async list(
    params?: ProjectListParams,
    opts?: { signal?: AbortSignal }
  ): Promise<{ results: Project[]; count: number }> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    const data = await get<unknown>(
      `${base}/projects/${qs}`,
      "Failed to load projects",
      { signal: opts?.signal }
    );
    return handleListResponse<Project>(
      data as { results?: Project[]; count?: number } | Project[]
    );
  },

  async get(id: number, opts?: { signal?: AbortSignal }): Promise<Project> {
    return get<Project>(`${base}/projects/${id}/`, "Failed to load project", {
      signal: opts?.signal,
    });
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    return post<Project>(
      `${base}/projects/`,
      payload,
      "Failed to create project"
    );
  },

  async update(id: number, payload: UpdateProjectPayload): Promise<Project> {
    return patch<Project>(
      `${base}/projects/${id}/`,
      payload,
      "Failed to update project"
    );
  },

  async delete(id: number): Promise<void> {
    return del(`${base}/projects/${id}/`, "Failed to delete project");
  },

  async archive(id: number): Promise<Project> {
    return post<Project>(
      `${base}/projects/${id}/archive/`,
      {},
      "Failed to archive project"
    );
  },

  async reactivate(id: number): Promise<Project> {
    return post<Project>(
      `${base}/projects/${id}/reactivate/`,
      {},
      "Failed to reactivate project"
    );
  },

  async getActivity(
    projectId: number,
    opts?: { signal?: AbortSignal }
  ): Promise<ProjectActivityEvent[]> {
    const data = await get<{ events?: ProjectActivityEvent[] }>(
      `${base}/projects/${projectId}/activity/`,
      "Failed to load activity",
      { signal: opts?.signal }
    );
    return Array.isArray(data?.events) ? data.events : [];
  },

  async listAssignments(
    projectId: number,
    opts?: { signal?: AbortSignal }
  ): Promise<ProjectAssignment[]> {
    const data = await get<unknown>(
      `${base}/projects/${projectId}/assignments/`,
      "Failed to load assignments",
      { signal: opts?.signal }
    );
    return Array.isArray(data) ? (data as ProjectAssignment[]) : [];
  },

  async createAssignment(
    projectId: number,
    payload: CreateAssignmentPayload
  ): Promise<ProjectAssignment> {
    return post<ProjectAssignment>(
      `${base}/projects/${projectId}/assignments/`,
      payload,
      "Failed to create assignment"
    );
  },

  async updateAssignment(
    assignmentId: number,
    payload: UpdateAssignmentPayload
  ): Promise<ProjectAssignment> {
    return patch<ProjectAssignment>(
      `${base}/project-assignments/${assignmentId}/`,
      payload,
      "Failed to update assignment"
    );
  },

  async endAssignment(
    assignmentId: number,
    endDate: string
  ): Promise<ProjectAssignment> {
    return post<ProjectAssignment>(
      `${base}/project-assignments/${assignmentId}/end/`,
      { end_date: endDate },
      "Failed to end assignment"
    );
  },

  async deleteAssignment(assignmentId: number): Promise<void> {
    return del(
      `${base}/project-assignments/${assignmentId}/`,
      "Failed to delete assignment"
    );
  },
};
