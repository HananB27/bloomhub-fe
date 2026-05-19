"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/hr-dashboard/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/hr-dashboard/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/hr-dashboard/ui/select";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  trainingBudgetsApi,
  type TrainingBudget,
} from "@/lib/api/modules/training-budgets";
import {
  NotificationMessages,
  notifyApiError,
  notifySuccess,
} from "@/utils/notificationHelpers";
import { EmployeeBudgetCard } from "./EmployeeBudgetCard";
import { TrainingBudgetForm } from "./TrainingBudgetForm";
import { TrainingBudgetList } from "./TrainingBudgetList";
import { currentFiscalYear } from "./trainingBudgetHelpers";

const YEAR_FILTER_CHOICES: number[] = (() => {
  const now = currentFiscalYear();
  return [now + 1, now, now - 1, now - 2];
})();

export function TrainingBudgetSection() {
  const { isAdmin, isLoading: isCheckingAccess } = useAdminAccess();

  const [budgets, setBudgets] = useState<TrainingBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(currentFiscalYear());
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<TrainingBudget | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<TrainingBudget | null>(null);

  const loadBudgets = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const data = await trainingBudgetsApi.list({ fiscalYear: yearFilter });
      setBudgets(data);
    } catch (err) {
      notifyApiError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, yearFilter]);

  useEffect(() => {
    if (!isCheckingAccess && isAdmin) {
      void loadBudgets();
    }
  }, [isAdmin, isCheckingAccess, loadBudgets]);

  const stats = useMemo(() => {
    const totalAllocated = budgets.reduce(
      (sum, b) => sum + b.allocatedBudget,
      0
    );
    const totalUsed = budgets.reduce((sum, b) => sum + b.usedBudget, 0);
    const overThreshold = budgets.filter(
      (b) => b.allocatedBudget > 0 && b.thresholdReached
    ).length;
    return { totalAllocated, totalUsed, overThreshold };
  }, [budgets]);

  const handleAdd = () => {
    setEditingBudget(null);
    setShowFormDialog(true);
  };

  const handleEdit = (budget: TrainingBudget) => {
    setEditingBudget(budget);
    setShowFormDialog(true);
  };

  const handleFormSuccess = (saved: TrainingBudget) => {
    setShowFormDialog(false);
    setEditingBudget(null);
    if (saved.fiscalYear !== yearFilter) {
      setYearFilter(saved.fiscalYear);
    } else {
      void loadBudgets();
    }
  };

  const handleDeleteRequest = (budget: TrainingBudget) => {
    setDeleteTarget(budget);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setIsDeleting((prev) => ({ ...prev, [target.id]: true }));
    try {
      await trainingBudgetsApi.remove(target.id);
      setBudgets((prev) => prev.filter((b) => b.id !== target.id));
      notifySuccess(NotificationMessages.DELETED_SUCCESS);
    } catch (err) {
      notifyApiError(err as Error);
    } finally {
      setIsDeleting((prev) => ({ ...prev, [target.id]: false }));
    }
  };

  // Non-HR users see their own budget card only.
  if (!isCheckingAccess && !isAdmin) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Training Budget
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Track your annual training allocation and spending.
          </p>
        </div>
        <EmployeeBudgetCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Training Budgets
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Allocate annual training budgets per employee. Usage is calculated
            automatically from completed training entries.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Allocate Budget
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">
              Fiscal Year
            </label>
            <Select
              value={String(yearFilter)}
              onValueChange={(value) => setYearFilter(Number(value))}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_FILTER_CHOICES.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isLoading && (
            <div className="ml-auto flex items-center gap-4 font-mono text-[11px] text-gray-500">
              <span>
                Allocated:{" "}
                <span className="text-gray-900">
                  ${stats.totalAllocated.toFixed(2)}
                </span>
              </span>
              <span>
                Used:{" "}
                <span className="text-gray-900">
                  ${stats.totalUsed.toFixed(2)}
                </span>
              </span>
              {stats.overThreshold > 0 && (
                <span className="text-amber-600">
                  {stats.overThreshold} over 80%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <TrainingBudgetList
        budgets={budgets}
        isLoading={isLoading || isCheckingAccess}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        isDeleting={isDeleting}
      />

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>
              {editingBudget
                ? "Edit Training Budget"
                : "Allocate Training Budget"}
            </DialogTitle>
            <DialogDescription>
              {editingBudget
                ? "Adjust the annual allocation for this employee."
                : "Set an annual training budget for an employee."}
            </DialogDescription>
          </DialogHeader>
          <TrainingBudgetForm
            editing={editingBudget ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowFormDialog(false);
              setEditingBudget(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Budget</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the FY {deleteTarget?.fiscalYear} allocation for{" "}
              {deleteTarget?.employeeName}. Training entries are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
