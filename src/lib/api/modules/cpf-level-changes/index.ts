import { API_BASE_URL } from "@/lib/config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
  patch,
  post,
} from "../../helpers/httpClient";
import type {
  CPFLevelChange,
  CPFLevelChangeFilters,
  CPFProgression,
  CPFProgressionEvent,
  CreateCPFLevelChangePayload,
  UpdateCPFLevelChangePayload,
} from "@/types/cpf";

const BASE = `${API_BASE_URL}/api/cpf-level-changes`;

interface ApiCPFLevelChange {
  id: number;
  employee_id: number;
  employee_name: string;
  previous_level: string;
  new_level: string;
  effective_date: string;
  source: CPFLevelChange["source"];
  source_display: string;
  cpf_score: number | null;
  performance_review_id: number | null;
  promotion_id: number | null;
  notes: string;
  recorded_by_name: string;
  created_at: string;
  updated_at: string;
}

interface ApiCPFProgressionEvent {
  date: string;
  event_type: CPFProgressionEvent["eventType"];
  previous_level: string;
  new_level: string;
  source: string;
  cpf_score: number | null;
  notes: string;
  reference_id: number | null;
  reference_label: string;
}

interface ApiCPFProgression {
  employee_id: number;
  employee_name: string;
  current_level: string;
  timeline: ApiCPFProgressionEvent[];
}

function transformChange(raw: ApiCPFLevelChange): CPFLevelChange {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeName: raw.employee_name || "",
    previousLevel: raw.previous_level ?? "",
    newLevel: raw.new_level ?? "",
    effectiveDate: raw.effective_date,
    source: raw.source,
    sourceDisplay: raw.source_display || "",
    cpfScore: raw.cpf_score,
    performanceReviewId: raw.performance_review_id,
    promotionId: raw.promotion_id,
    notes: raw.notes ?? "",
    recordedByName: raw.recorded_by_name || "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function transformProgressionEvent(
  raw: ApiCPFProgressionEvent
): CPFProgressionEvent {
  return {
    date: raw.date,
    eventType: raw.event_type,
    previousLevel: raw.previous_level ?? "",
    newLevel: raw.new_level ?? "",
    source: raw.source ?? "",
    cpfScore: raw.cpf_score,
    notes: raw.notes ?? "",
    referenceId: raw.reference_id,
    referenceLabel: raw.reference_label || "",
  };
}

function transformProgression(raw: ApiCPFProgression): CPFProgression {
  return {
    employeeId: raw.employee_id,
    employeeName: raw.employee_name || "",
    currentLevel: raw.current_level ?? "",
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline.map(transformProgressionEvent)
      : [],
  };
}

function toBody(
  payload: CreateCPFLevelChangePayload | UpdateCPFLevelChangePayload
) {
  const body: Record<string, unknown> = {};
  if (payload.employeeId !== undefined) body.employee_id = payload.employeeId;
  if (payload.previousLevel !== undefined)
    body.previous_level = payload.previousLevel;
  if (payload.newLevel !== undefined) body.new_level = payload.newLevel;
  if (payload.effectiveDate !== undefined)
    body.effective_date = payload.effectiveDate;
  if (payload.source !== undefined) body.source = payload.source;
  if (payload.cpfScore !== undefined) body.cpf_score = payload.cpfScore;
  if (payload.performanceReviewId !== undefined)
    body.performance_review_id = payload.performanceReviewId;
  if (payload.promotionId !== undefined)
    body.promotion_id = payload.promotionId;
  if (payload.notes !== undefined) body.notes = payload.notes;
  return body;
}

export const cpfLevelChangesApi = {
  async listChanges(
    filters?: CPFLevelChangeFilters
  ): Promise<CPFLevelChange[]> {
    const qs = buildQueryString({
      employee: filters?.employee,
      source: filters?.source,
      search: filters?.search,
      ordering: filters?.ordering,
    });
    const data = await get<
      ApiCPFLevelChange[] | { results?: ApiCPFLevelChange[]; count?: number }
    >(`${BASE}/${qs}`, "Failed to fetch CPF level changes");
    return handleListResponse(data).results.map(transformChange);
  },

  async getProgression(employeeId?: number): Promise<CPFProgression> {
    const qs = buildQueryString({ employee: employeeId });
    const data = await get<ApiCPFProgression>(
      `${BASE}/progression/${qs}`,
      "Failed to fetch CPF progression"
    );
    return transformProgression(data);
  },

  async createChange(
    payload: CreateCPFLevelChangePayload
  ): Promise<CPFLevelChange> {
    const data = await post<ApiCPFLevelChange>(
      `${BASE}/`,
      toBody(payload),
      "Failed to record CPF level change"
    );
    return transformChange(data);
  },

  async updateChange(
    id: number,
    payload: UpdateCPFLevelChangePayload
  ): Promise<CPFLevelChange> {
    const data = await patch<ApiCPFLevelChange>(
      `${BASE}/${id}/`,
      toBody(payload),
      "Failed to update CPF level change"
    );
    return transformChange(data);
  },

  async deleteChange(id: number): Promise<void> {
    return del(`${BASE}/${id}/`, "Failed to delete CPF level change");
  },
};
