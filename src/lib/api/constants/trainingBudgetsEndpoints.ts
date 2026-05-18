export const TRAINING_BUDGETS_API_BASE_PATH = "/api/training-budgets/" as const;
export const TRAINING_BUDGETS_ME_PATH = "/api/training-budgets/me/" as const;

export function trainingBudgetDetailPath(id: number | string): string {
  return `${TRAINING_BUDGETS_API_BASE_PATH}${id}/`;
}
