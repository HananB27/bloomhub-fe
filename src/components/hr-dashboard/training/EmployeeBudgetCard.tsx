"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, TrendingUp, Wallet } from "lucide-react";
import { trainingBudgetsApi } from "@/lib/api/modules/training-budgets";
import type { TrainingBudget } from "@/types/trainingBudget";
import { formatCurrency } from "@/utils/format";
import { notifyApiError } from "@/utils/notificationHelpers";
import {
  BUDGET_STATE_BAR_COLORS,
  BUDGET_STATE_BG_COLORS,
  BUDGET_STATE_LABELS,
  BUDGET_STATE_TEXT_COLORS,
  classifyBudget,
  clampPercent,
  currentFiscalYear,
} from "./trainingBudgetHelpers";

interface EmployeeBudgetCardProps {
  /** Optional fiscal year override; defaults to the current calendar year. */
  fiscalYear?: number;
  /** External trigger to refresh after a related write elsewhere on the page. */
  refreshSignal?: number;
}

export function EmployeeBudgetCard({
  fiscalYear,
  refreshSignal,
}: EmployeeBudgetCardProps) {
  const year = fiscalYear ?? currentFiscalYear();
  const [budget, setBudget] = useState<TrainingBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trainingBudgetsApi.me(year);
      setBudget(result);
    } catch (err) {
      notifyApiError(err as Error);
      setBudget(null);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Unable to load training budget.
      </div>
    );
  }

  const state = classifyBudget(budget);
  const percent = clampPercent(budget.budgetPercentageUsed);
  const hasAllocation = budget.allocatedBudget > 0;

  return (
    <div
      className={`rounded-lg border bg-white ${BUDGET_STATE_BG_COLORS[state]}`}
    >
      <div className="flex items-start justify-between gap-4 p-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">
            <Wallet className="h-3 w-3" />
            Training Budget · FY {budget.fiscalYear}
          </div>
          <div className="mt-1.5 font-mono text-[22px] font-semibold tracking-tight text-gray-900">
            {formatCurrency(budget.remainingBudget)}{" "}
            <span className="text-sm font-normal text-gray-500">remaining</span>
          </div>
        </div>
        <div className={`text-right ${BUDGET_STATE_TEXT_COLORS[state]}`}>
          <div className="text-[11px] font-medium uppercase tracking-wider">
            {BUDGET_STATE_LABELS[state]}
          </div>
          <div className="mt-1 font-mono text-base font-semibold">
            {percent.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full transition-all ${BUDGET_STATE_BAR_COLORS[state]}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200 text-xs text-gray-600">
        <div className="px-4 py-2.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">
            Allocated
          </div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-gray-900">
            {formatCurrency(budget.allocatedBudget)}
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">
            Used so far
          </div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-sm font-semibold text-gray-900">
            <TrendingUp className="h-3 w-3 text-gray-400" />
            {formatCurrency(budget.usedBudget)}
          </div>
        </div>
      </div>

      {!hasAllocation && (
        <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
          Your HR team has not set a training budget for FY {budget.fiscalYear}{" "}
          yet.
        </div>
      )}

      {state !== "ok" && (
        <div
          className={`flex items-start gap-2 border-t border-gray-200 px-4 py-2.5 text-xs ${BUDGET_STATE_TEXT_COLORS[state]}`}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {state === "exceeded"
              ? "You have spent more than your annual training allocation. Please coordinate with HR before booking further training."
              : "You have used 80% or more of your annual training budget. Plan upcoming training carefully."}
          </span>
        </div>
      )}
    </div>
  );
}
