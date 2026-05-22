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
  CreatePromotionPayload,
  PromotionFilters,
  PromotionRecord,
  UpdatePromotionPayload,
} from "@/types/promotion";

const BASE = `${API_BASE_URL}/api/promotion-history`;

interface ApiPromotionRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  previous_role_id: number | null;
  previous_role_name: string;
  new_role_id: number | null;
  new_role_name: string;
  date: string;
  notes: string;
  previous_cpf_level: string;
  new_cpf_level: string;
  related_listing_id: number | null;
  related_listing_title: string;
  created_at: string;
  updated_at: string;
}

function transformPromotion(raw: ApiPromotionRecord): PromotionRecord {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeName: raw.employee_name || "",
    previousRoleId: raw.previous_role_id,
    previousRoleName: raw.previous_role_name || "",
    newRoleId: raw.new_role_id,
    newRoleName: raw.new_role_name || "",
    date: raw.date,
    notes: raw.notes ?? "",
    previousCpfLevel: raw.previous_cpf_level ?? "",
    newCpfLevel: raw.new_cpf_level ?? "",
    relatedListingId: raw.related_listing_id,
    relatedListingTitle: raw.related_listing_title || "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toBody(payload: CreatePromotionPayload | UpdatePromotionPayload) {
  const body: Record<string, unknown> = {};
  if (payload.employeeId !== undefined) body.employee_id = payload.employeeId;
  if (payload.previousRoleId !== undefined)
    body.previous_role_id = payload.previousRoleId;
  if (payload.newRoleId !== undefined) body.new_role_id = payload.newRoleId;
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.previousCpfLevel !== undefined)
    body.previous_cpf_level = payload.previousCpfLevel;
  if (payload.newCpfLevel !== undefined)
    body.new_cpf_level = payload.newCpfLevel;
  if (payload.relatedListingId !== undefined)
    body.related_listing_id = payload.relatedListingId;
  return body;
}

export const promotionsApi = {
  async listPromotions(filters?: PromotionFilters): Promise<PromotionRecord[]> {
    const qs = buildQueryString({
      employee: filters?.employee,
      search: filters?.search,
      ordering: filters?.ordering,
    });
    const data = await get<
      ApiPromotionRecord[] | { results?: ApiPromotionRecord[]; count?: number }
    >(`${BASE}/${qs}`, "Failed to fetch promotion history");
    return handleListResponse(data).results.map(transformPromotion);
  },

  async createPromotion(
    payload: CreatePromotionPayload
  ): Promise<PromotionRecord> {
    const data = await post<ApiPromotionRecord>(
      `${BASE}/`,
      toBody(payload),
      "Failed to add promotion record"
    );
    return transformPromotion(data);
  },

  async updatePromotion(
    id: number,
    payload: UpdatePromotionPayload
  ): Promise<PromotionRecord> {
    const data = await patch<ApiPromotionRecord>(
      `${BASE}/${id}/`,
      toBody(payload),
      "Failed to update promotion record"
    );
    return transformPromotion(data);
  },

  async deletePromotion(id: number): Promise<void> {
    return del(`${BASE}/${id}/`, "Failed to delete promotion record");
  },
};
