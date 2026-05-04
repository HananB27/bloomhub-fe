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

export interface TaskTemplate {
  id?: number;
  title: string;
  order: number;
  role_responsible: "HR" | "IT" | "Manager";
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  type: "onboarding" | "offboarding";
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

export interface ChecklistInstanceSummary {
  id: number;
  employee: UserProfileSummary;
  template: ChecklistTemplate;
}

export interface ChecklistTask {
  id: number;
  checklist_instance: ChecklistInstanceSummary;
  task_template: TaskTemplate;
  title: string;
  status: "todo" | "in_progress" | "done";
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
