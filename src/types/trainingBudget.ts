/**
 * Annual training budget per employee.
 *
 * Mirrors backend `TrainingBudgetSerializer`. All monetary fields are kept as
 * strings on the wire (Decimal) and parsed to numbers here for display.
 */

export interface TrainingBudget {
  id: number;
  employeeId: number;
  employeeName: string;
  fiscalYear: number;
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  /** 0–100, may include decimals. */
  budgetPercentageUsed: number;
  thresholdReached: boolean;
  thresholdNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingBudgetPayload {
  employeeId: number;
  fiscalYear: number;
  allocatedBudget: number;
}

export interface UpdateTrainingBudgetPayload {
  fiscalYear?: number;
  allocatedBudget?: number;
}

export interface TrainingBudgetFilters {
  employeeId?: number;
  fiscalYear?: number;
  ordering?: string;
}

/**
 * Shape of `budget_warning` that the backend may attach to a successful
 * `POST /api/training-entries/` response when the new entry pushes usage past
 * the 80% threshold or above the allocation.
 */
export type TrainingBudgetWarningLevel = "approaching_limit" | "exceeded";

export interface TrainingBudgetWarning {
  level: TrainingBudgetWarningLevel;
  fiscalYear: number;
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  percentUsed: number;
}

/** UI threshold mirror of the backend constant. Keep in sync. */
export const TRAINING_BUDGET_WARNING_THRESHOLD_PERCENT = 80;
