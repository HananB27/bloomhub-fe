import { ApiError } from "@/utils/api";

import { API_BASE_URL } from "@/lib/config";

function buildApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function getAuthHeaders(token?: string): Record<string, string> {
  const normalizedToken = token?.trim();

  if (!normalizedToken) {
    throw new ApiError(
      "Authentication token is required for onboarding API requests",
      401
    );
  }

  return {
    Authorization: `Bearer ${normalizedToken}`,
    "Content-Type": "application/json",
  };
}

export type TemplateRole = "HR" | "IT" | "Manager";

export interface TaskTemplate {
  id?: number;
  title: string;
  order: number;
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  type: "onboarding" | "offboarding";
  role_responsible: TemplateRole;
  task_templates: TaskTemplate[];
}

export interface UserProfileSummary {
  id: number;
  employee_id?: string;
  department?: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username?: string;
  };
}

export interface ChecklistInstance {
  id: number;
  employee: UserProfileSummary;
  template: ChecklistTemplate;
  status: string;
  due_date: string | null;
  created_at: string;
}

export type ChecklistInstanceSummary = ChecklistInstance;

export type ChecklistTaskStatus = "todo" | "in_progress" | "done";

export const TASK_STATUS_LABELS: Record<ChecklistTaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const TASK_STATUS_BADGE_COLORS: Record<ChecklistTaskStatus, string> = {
  todo: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
};

export interface ChecklistTask {
  id: number;
  checklist_instance: ChecklistInstanceSummary;
  task_template: TaskTemplate;
  title: string;
  status: ChecklistTaskStatus;
  assigned_to: UserProfileSummary | null;
  due_date: string | null;
  completed_at: string | null;
}

export type ChecklistTemplateInput = Omit<ChecklistTemplate, "id">;

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  let payload: unknown;

  if (rawBody) {
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = rawBody;
      }
    } else {
      payload = rawBody;
    }
  }

  if (response.ok) return payload as T;

  const errorPayload =
    payload && typeof payload === "object"
      ? (payload as { error?: string; message?: string })
      : undefined;
  const errorMessage =
    errorPayload?.error ||
    errorPayload?.message ||
    (typeof payload === "string" && payload.trim()) ||
    `Error ${response.status}`;

  throw new ApiError(errorMessage, response.status, payload);
}

export async function fetchTemplates(
  token?: string
): Promise<ChecklistTemplate[]> {
  const response = await fetch(buildApiUrl("/api/onboarding/templates/"), {
    headers: getAuthHeaders(token),
  });
  return parseResponse<ChecklistTemplate[]>(response);
}

export async function createTemplate(
  data: ChecklistTemplateInput,
  token?: string
): Promise<ChecklistTemplate> {
  const response = await fetch(buildApiUrl("/api/onboarding/templates/"), {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return parseResponse<ChecklistTemplate>(response);
}

export async function updateTemplate(
  id: number,
  data: Partial<ChecklistTemplateInput>,
  token?: string
): Promise<ChecklistTemplate> {
  const response = await fetch(
    buildApiUrl(`/api/onboarding/templates/${id}/`),
    {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    }
  );
  return parseResponse<ChecklistTemplate>(response);
}

export async function deleteTemplate(
  id: number,
  token?: string
): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/onboarding/templates/${id}/`),
    {
      method: "DELETE",
      headers: getAuthHeaders(token),
    }
  );
  if (!response.ok) {
    throw new ApiError(`Failed to delete template`, response.status);
  }
}

export async function cloneTemplate(
  id: number,
  token?: string
): Promise<ChecklistTemplate> {
  const response = await fetch(
    buildApiUrl(`/api/onboarding/templates/${id}/clone/`),
    {
      method: "POST",
      headers: getAuthHeaders(token),
    }
  );
  return parseResponse<ChecklistTemplate>(response);
}

export async function fetchMyTasks(token?: string): Promise<ChecklistTask[]> {
  const response = await fetch(buildApiUrl("/api/onboarding/tasks/my-tasks/"), {
    headers: getAuthHeaders(token),
  });
  return parseResponse<ChecklistTask[]>(response);
}

export async function fetchEmployeeTasks(
  employeeId: number | string,
  token?: string
): Promise<ChecklistTask[]> {
  const response = await fetch(
    buildApiUrl(`/api/onboarding/tasks/employee/${employeeId}/`),
    {
      headers: getAuthHeaders(token),
    }
  );
  return parseResponse<ChecklistTask[]>(response);
}

export async function updateTaskStatus(
  taskId: number,
  status: ChecklistTaskStatus,
  token?: string
): Promise<ChecklistTask> {
  const response = await fetch(
    buildApiUrl(`/api/onboarding/tasks/${taskId}/`),
    {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status }),
    }
  );
  return parseResponse<ChecklistTask>(response);
}

export async function fetchInstances(
  token?: string
): Promise<ChecklistInstance[]> {
  const response = await fetch(buildApiUrl("/api/onboarding/instances/"), {
    headers: getAuthHeaders(token),
  });
  return parseResponse<ChecklistInstance[]>(response);
}

export async function createChecklistInstance(
  employeeId: number,
  templateId: number,
  dueDate: string | null,
  token?: string
): Promise<ChecklistInstance> {
  const response = await fetch(buildApiUrl("/api/onboarding/instances/"), {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      employee: employeeId,
      template: templateId,
      due_date: dueDate ?? undefined,
    }),
  });
  return parseResponse<ChecklistInstance>(response);
}

export async function deleteInstance(
  instanceId: number,
  token?: string
): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/onboarding/instances/${instanceId}/`),
    {
      method: "DELETE",
      headers: getAuthHeaders(token),
    }
  );
  if (!response.ok) {
    throw new ApiError(`Failed to delete instance`, response.status);
  }
}
