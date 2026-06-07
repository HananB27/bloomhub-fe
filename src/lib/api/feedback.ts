import { ApiError } from "@/utils/api";

import { API_BASE_URL } from "@/lib/config";

function buildApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; token?: string }
): Promise<T> {
  const token = options?.token?.trim();
  if (!token) {
    throw new ApiError(
      "Authentication token is required for feedback API requests",
      401
    );
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const init: RequestInit = { method, headers };
  if (options?.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(buildApiUrl(path), init);
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
  required?: boolean;
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  status: SurveyStatus;
  end_date: string | null;
  questions: SurveyQuestion[];
  forbidden_user_ids: number[];
  created_at: string;
  created_by: number | null;
  created_by_name: string;
  response_count: number;
  viewer_has_responded: boolean;
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  is_anonymous: boolean;
  status?: SurveyStatus;
  end_date?: string | null;
  forbidden_user_ids?: number[];
  questions: SurveyQuestion[];
}

export type UpdateSurveyPayload = Partial<CreateSurveyPayload>;

// ── API functions ─────────────────────────────────────────────────────────

export async function fetchSurveys(
  token?: string,
  options: { mine?: boolean } = {}
): Promise<Survey[]> {
  const qs = options.mine ? "?mine=true" : "";
  return request<Survey[]>("GET", `/api/surveys/${qs}`, { token });
}

export async function fetchSurvey(id: number, token?: string): Promise<Survey> {
  return request<Survey>("GET", `/api/surveys/${id}/`, { token });
}

export async function createSurvey(
  payload: CreateSurveyPayload,
  token?: string
): Promise<Survey> {
  return request<Survey>("POST", "/api/surveys/", { body: payload, token });
}

export async function updateSurvey(
  id: number,
  payload: UpdateSurveyPayload,
  token?: string
): Promise<Survey> {
  return request<Survey>("PATCH", `/api/surveys/${id}/`, { body: payload, token });
}

export async function deleteSurvey(id: number, token?: string): Promise<void> {
  await request<void>("DELETE", `/api/surveys/${id}/`, { token });
}

export async function closeSurvey(id: number, token?: string): Promise<Survey> {
  return request<Survey>("POST", `/api/surveys/${id}/close/`, { token });
}

export async function recallSurvey(
  id: number,
  token?: string
): Promise<Survey> {
  return request<Survey>("POST", `/api/surveys/${id}/recall/`, { token });
}

export async function addSurveyQuestion(
  surveyId: number,
  question: SurveyQuestion,
  token?: string
): Promise<SurveyQuestion> {
  return request<SurveyQuestion>("POST", `/api/surveys/${surveyId}/questions/`, {
    body: question,
    token,
  });
}

// ── Response submission ────────────────────────────────────────────────────

export interface SubmitAnswerPayload {
  question_id: number;
  value: string;
}

export interface SubmitResponseResult {
  id: number;
  survey: number;
  submitted_at: string;
}

export async function submitSurveyResponse(
  surveyId: number,
  answers: SubmitAnswerPayload[],
  token?: string
): Promise<SubmitResponseResult> {
  return request<SubmitResponseResult>("POST", `/api/surveys/${surveyId}/responses/`, {
    body: { answers },
    token,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface AnalyticsDistributionItem {
  value: string;
  count: number;
}

export interface AnalyticsQuestion {
  question_id: number;
  text: string;
  type: SurveyQuestionType;
  response_count: number;
  // Only present for `scale`:
  average?: number;
  // Present for `choice` and `scale`:
  distribution?: AnalyticsDistributionItem[];
  // Only present for `text`:
  samples?: string[];
}

export interface AnalyticsTrendPoint {
  date: string;
  count: number;
}

export interface SurveyAnalytics {
  survey_id: number;
  survey_title: string;
  is_anonymous: boolean;
  total_responses: number;
  filters_applied: {
    department: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  questions: AnalyticsQuestion[];
  responses_over_time: AnalyticsTrendPoint[];
}

export interface AnalyticsFilters {
  department?: string;
  startDate?: string;
  endDate?: string;
}

// ── Pulse check (BHB-452) ─────────────────────────────────────────────────

export type PulseCategory = "overall" | "workload" | "management" | "culture";

export interface PulseCheck {
  id: number;
  employee: number | null;
  category: PulseCategory;
  value: number;
  created_at: string;
}

export interface PulseSummary {
  days: number;
  count: number;
  average: number;
  by_day: { date: string; count: number; average: number }[];
  distribution: { value: number; count: number }[];
  by_category: { category: PulseCategory; count: number; average: number }[];
}

export async function submitPulseCheck(
  value: number,
  category: PulseCategory = "overall",
  token?: string
): Promise<PulseCheck> {
  return request<PulseCheck>("POST", "/api/pulse-checks/", {
    body: { value, category },
    token,
  });
}

export interface SurveyIndividualAnswer {
  question_id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  value: string;
}

export interface SurveyIndividualResponse {
  response_id: number;
  respondent_id: number | null;
  respondent_name: string;
  submitted_at: string;
  answers: SurveyIndividualAnswer[];
}

export interface SurveyIndividualResponsesPayload {
  survey_id: number;
  survey_title: string;
  is_anonymous: boolean;
  responses: SurveyIndividualResponse[];
}

export async function fetchSurveyIndividualResponses(
  surveyId: number,
  token?: string
): Promise<SurveyIndividualResponsesPayload> {
  return request<SurveyIndividualResponsesPayload>(
    "GET",
    `/api/surveys/${surveyId}/individual-responses/`,
    { token }
  );
}

// ── Suggestion Box (BHB-454) ──────────────────────────────────────────────

export type SuggestionStatus =
  | "new"
  | "under_review"
  | "planned"
  | "implemented"
  | "declined";

export interface Suggestion {
  id: number;
  employee: number | null;
  employee_name: string;
  category: string;
  text: string;
  status: SuggestionStatus;
  created_at: string;
}

export interface CreateSuggestionPayload {
  category?: string;
  text: string;
  is_anonymous?: boolean;
}

export async function submitSuggestion(
  payload: CreateSuggestionPayload,
  token?: string
): Promise<Suggestion> {
  return request<Suggestion>("POST", "/api/suggestions/", {
    body: payload,
    token,
  });
}

export async function fetchSuggestions(token?: string): Promise<Suggestion[]> {
  return request<Suggestion[]>("GET", "/api/suggestions/", { token });
}

export async function updateSuggestionStatus(
  id: number,
  status: SuggestionStatus,
  token?: string
): Promise<Suggestion> {
  return request<Suggestion>("PATCH", `/api/suggestions/${id}/`, {
    body: { status },
    token,
  });
}

export async function fetchPulseSummary(
  days = 7,
  token?: string
): Promise<PulseSummary> {
  return request<PulseSummary>(
    "GET",
    `/api/pulse-checks/summary/?days=${days}`,
    { token }
  );
}

export async function fetchSurveyAnalytics(
  surveyId: number,
  filters: AnalyticsFilters = {},
  token?: string
): Promise<SurveyAnalytics> {
  const params = new URLSearchParams();
  if (filters.department) params.set("department", filters.department);
  if (filters.startDate) params.set("start_date", filters.startDate);
  if (filters.endDate) params.set("end_date", filters.endDate);
  const qs = params.toString();
  const path = `/api/surveys/${surveyId}/analytics/${qs ? `?${qs}` : ""}`;
  return request<SurveyAnalytics>("GET", path, { token });
}
