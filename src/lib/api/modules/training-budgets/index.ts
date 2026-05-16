import { API_BASE_URL } from "@/lib/config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
  patch,
  post,
} from "../../helpers/httpClient";
import {
  TRAINING_BUDGETS_API_BASE_PATH,
  TRAINING_BUDGETS_ME_PATH,
  trainingBudgetDetailPath,
} from "../../constants/trainingBudgetsEndpoints";
import type {
  CreateTrainingBudgetPayload,
  TrainingBudget,
  TrainingBudgetFilters,
  UpdateTrainingBudgetPayload,
} from "@/types/trainingBudget";

interface ApiTrainingBudget {
  id: number;
  employee_id: number;
  employee_name: string;
  fiscal_year: number;
  allocated_budget: string | number;
  used_budget: string | number;
  remaining_budget: string | number;
  budget_percentage_used: string | number;
  threshold_reached: boolean;
  threshold_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function transformTrainingBudget(raw: ApiTrainingBudget): TrainingBudget {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeName: raw.employee_name || "Unknown",
    fiscalYear: raw.fiscal_year,
    allocatedBudget: toNumber(raw.allocated_budget),
    usedBudget: toNumber(raw.used_budget),
    remainingBudget: toNumber(raw.remaining_budget),
    budgetPercentageUsed: toNumber(raw.budget_percentage_used),
    thresholdReached: Boolean(raw.threshold_reached),
    thresholdNotifiedAt: raw.threshold_notified_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const trainingBudgetsApi = {
  async list(filters?: TrainingBudgetFilters): Promise<TrainingBudget[]> {
    const qs = buildQueryString({
      employee: filters?.employeeId,
      fiscal_year: filters?.fiscalYear,
      ordering: filters?.ordering,
    });
    const data = await get<
      ApiTrainingBudget[] | { results?: ApiTrainingBudget[]; count?: number }
    >(
      `${API_BASE_URL}${TRAINING_BUDGETS_API_BASE_PATH}${qs}`,
      "Failed to fetch training budgets"
    );
    const { results } = handleListResponse(data);
    return results.map(transformTrainingBudget);
  },

  /**
   * Current user's budget for a given fiscal year (defaults to current year on
   * the backend). Returns a synthesized zero-budget object when no allocation
   * exists yet — caller can detect this via `id === 0` if needed, or just show
   * the zero state.
   */
  async me(year?: number): Promise<TrainingBudget> {
    const qs = buildQueryString({ year });
    const data = await get<ApiTrainingBudget>(
      `${API_BASE_URL}${TRAINING_BUDGETS_ME_PATH}${qs}`,
      "Failed to fetch your training budget"
    );
    // The placeholder response may omit id/created_at/updated_at.
    return transformTrainingBudget({
      ...data,
      id: data.id ?? 0,
      created_at: data.created_at ?? "",
      updated_at: data.updated_at ?? "",
    } as ApiTrainingBudget);
  },

  async getById(id: number | string): Promise<TrainingBudget> {
    const data = await get<ApiTrainingBudget>(
      `${API_BASE_URL}${trainingBudgetDetailPath(id)}`,
      "Failed to fetch training budget"
    );
    return transformTrainingBudget(data);
  },

  async create(payload: CreateTrainingBudgetPayload): Promise<TrainingBudget> {
    const data = await post<ApiTrainingBudget>(
      `${API_BASE_URL}${TRAINING_BUDGETS_API_BASE_PATH}`,
      {
        employee_id: payload.employeeId,
        fiscal_year: payload.fiscalYear,
        allocated_budget: payload.allocatedBudget,
      },
      "Failed to create training budget"
    );
    return transformTrainingBudget(data);
  },

  async update(
    id: number | string,
    payload: UpdateTrainingBudgetPayload
  ): Promise<TrainingBudget> {
    const body: Record<string, string | number> = {};
    if (payload.fiscalYear !== undefined) body.fiscal_year = payload.fiscalYear;
    if (payload.allocatedBudget !== undefined) {
      body.allocated_budget = payload.allocatedBudget;
    }
    const data = await patch<ApiTrainingBudget>(
      `${API_BASE_URL}${trainingBudgetDetailPath(id)}`,
      body,
      "Failed to update training budget"
    );
    return transformTrainingBudget(data);
  },

  async remove(id: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}${trainingBudgetDetailPath(id)}`,
      "Failed to delete training budget"
    );
  },
};

export type {
  CreateTrainingBudgetPayload,
  TrainingBudget,
  TrainingBudgetFilters,
  UpdateTrainingBudgetPayload,
};
