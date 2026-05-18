"use client";

import { AlertTriangle, Edit3, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import type { TrainingBudget } from "@/types/trainingBudget";
import { formatCurrency } from "@/utils/format";
import {
  BUDGET_STATE_BAR_COLORS,
  BUDGET_STATE_LABELS,
  BUDGET_STATE_TEXT_COLORS,
  classifyBudget,
  clampPercent,
} from "./trainingBudgetHelpers";

interface TrainingBudgetListProps {
  budgets: TrainingBudget[];
  isLoading: boolean;
  onEdit: (budget: TrainingBudget) => void;
  onDelete: (budget: TrainingBudget) => void;
  isDeleting: Record<number, boolean>;
}

export function TrainingBudgetList({
  budgets,
  isLoading,
  onEdit,
  onDelete,
  isDeleting,
}: TrainingBudgetListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        No training budgets allocated yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-medium uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-2.5 text-left">Employee</th>
            <th className="px-4 py-2.5 text-left">FY</th>
            <th className="px-4 py-2.5 text-right">Allocated</th>
            <th className="px-4 py-2.5 text-right">Used</th>
            <th className="px-4 py-2.5 text-right">Remaining</th>
            <th className="px-4 py-2.5 text-left">Usage</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {budgets.map((budget) => {
            const state = classifyBudget(budget);
            const percent = clampPercent(budget.budgetPercentageUsed);
            return (
              <tr key={budget.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {budget.employeeName}
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {budget.fiscalYear}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-900">
                  {formatCurrency(budget.allocatedBudget)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-900">
                  {formatCurrency(budget.usedBudget)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-900">
                  {formatCurrency(budget.remainingBudget)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full transition-all ${BUDGET_STATE_BAR_COLORS[state]}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span
                      className={`shrink-0 font-mono text-xs ${BUDGET_STATE_TEXT_COLORS[state]}`}
                    >
                      {percent.toFixed(0)}%
                    </span>
                    {state !== "ok" && (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${BUDGET_STATE_TEXT_COLORS[state]}`}
                        title={BUDGET_STATE_LABELS[state]}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {state === "exceeded" ? "Over" : "≥80%"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(budget)}
                      aria-label="Edit budget"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(budget)}
                      disabled={Boolean(isDeleting[budget.id])}
                      aria-label="Delete budget"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {isDeleting[budget.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
