import {
  TRAINING_BUDGET_WARNING_THRESHOLD_PERCENT,
  type TrainingBudget,
} from "@/types/trainingBudget";

export type BudgetState = "ok" | "approaching" | "exceeded";

export function classifyBudget(budget: TrainingBudget): BudgetState {
  if (!budget.allocatedBudget) return "ok";
  if (budget.usedBudget > budget.allocatedBudget) return "exceeded";
  if (
    budget.budgetPercentageUsed >= TRAINING_BUDGET_WARNING_THRESHOLD_PERCENT
  ) {
    return "approaching";
  }
  return "ok";
}

export const BUDGET_STATE_BAR_COLORS: Record<BudgetState, string> = {
  ok: "bg-emerald-500",
  approaching: "bg-amber-500",
  exceeded: "bg-red-500",
};

export const BUDGET_STATE_TEXT_COLORS: Record<BudgetState, string> = {
  ok: "text-emerald-700",
  approaching: "text-amber-700",
  exceeded: "text-red-700",
};

export const BUDGET_STATE_BG_COLORS: Record<BudgetState, string> = {
  ok: "bg-emerald-50 border-emerald-200",
  approaching: "bg-amber-50 border-amber-200",
  exceeded: "bg-red-50 border-red-200",
};

export const BUDGET_STATE_LABELS: Record<BudgetState, string> = {
  ok: "On track",
  approaching: "Approaching limit",
  exceeded: "Budget exceeded",
};

export function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function currentFiscalYear(): number {
  return new Date().getFullYear();
}
