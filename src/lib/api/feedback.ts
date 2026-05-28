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
      "Authentication token is required for feedback API requests",
      401
    );
  }
  return {
    Authorization: `Bearer ${normalizedToken}`,
    "Content-Type": "application/json",
  };
}

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
      ? (payload as { detail?: string; error?: string; message?: string })
      : undefined;
  const errorMessage =
    errorPayload?.detail ||
    errorPayload?.error ||
    errorPayload?.message ||
    (typeof payload === "string" && payload.trim()) ||
    `Error ${response.status}`;
  throw new ApiError(errorMessage, response.status, payload);
}

// ── Types ─────────────────────────────────────────────────────────────────

export type SurveyQuestionType = "text" | "choice" | "scale";
export type SurveyStatus = "draft" | "active" | "closed";

export interface SurveyQuestion {
  id?: number;
  text: string;
  type: SurveyQuestionType;
  order?: number;
  options?: string[];
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  status: SurveyStatus;
  questions: SurveyQuestion[];
  created_at: string;
  created_by: number | null;
  created_by_name: string;
  response_count: number;
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  is_anonymous: boolean;
  status?: SurveyStatus;
  questions: SurveyQuestion[];
}

export type UpdateSurveyPayload = Partial<CreateSurveyPayload>;

// ── API functions ─────────────────────────────────────────────────────────

export async function fetchSurveys(token?: string): Promise<Survey[]> {
  const response = await fetch(buildApiUrl("/api/surveys/"), {
    headers: getAuthHeaders(token),
  });
  return parseResponse<Survey[]>(response);
}

export async function fetchSurvey(id: number, token?: string): Promise<Survey> {
  const response = await fetch(buildApiUrl(`/api/surveys/${id}/`), {
    headers: getAuthHeaders(token),
  });
  return parseResponse<Survey>(response);
}

export async function createSurvey(
  payload: CreateSurveyPayload,
  token?: string
): Promise<Survey> {
  const response = await fetch(buildApiUrl("/api/surveys/"), {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseResponse<Survey>(response);
}

export async function updateSurvey(
  id: number,
  payload: UpdateSurveyPayload,
  token?: string
): Promise<Survey> {
  const response = await fetch(buildApiUrl(`/api/surveys/${id}/`), {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseResponse<Survey>(response);
}

export async function deleteSurvey(id: number, token?: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/surveys/${id}/`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) await parseResponse<void>(response);
}

export async function closeSurvey(id: number, token?: string): Promise<Survey> {
  const response = await fetch(buildApiUrl(`/api/surveys/${id}/close/`), {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  return parseResponse<Survey>(response);
}

export async function addSurveyQuestion(
  surveyId: number,
  question: SurveyQuestion,
  token?: string
): Promise<SurveyQuestion> {
  const response = await fetch(
    buildApiUrl(`/api/surveys/${surveyId}/questions/`),
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(question),
    }
  );
  return parseResponse<SurveyQuestion>(response);
}
