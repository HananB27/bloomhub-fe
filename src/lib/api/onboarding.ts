import { ApiError } from "@/utils/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function buildApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function getAuthHeaders(token?: string): Record<string, string> {
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
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

export type ChecklistTemplateInput = Omit<ChecklistTemplate, "id">;

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (response.ok) return payload as T;
  throw new ApiError(
    payload?.error || payload?.message || `Error ${response.status}`,
    response.status,
    payload
  );
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
