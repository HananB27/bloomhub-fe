"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Input } from "@/components/hr-dashboard/ui/input";
import { Label } from "@/components/hr-dashboard/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/hr-dashboard/ui/select";
import { employeeApi } from "@/lib/api/modules/employees";
import {
  trainingBudgetsApi,
  type TrainingBudget,
} from "@/lib/api/modules/training-budgets";
import type {
  CreateTrainingBudgetPayload,
  UpdateTrainingBudgetPayload,
} from "@/types/trainingBudget";
import {
  NotificationMessages,
  notifyApiError,
  notifySuccess,
} from "@/utils/notificationHelpers";
import { currentFiscalYear } from "./trainingBudgetHelpers";

interface EmployeeOption {
  id: number;
  name: string;
}

interface TrainingBudgetFormProps {
  /** When provided, the form edits this budget (employee + year locked). */
  editing?: TrainingBudget;
  onSuccess: (budget: TrainingBudget) => void;
  onCancel: () => void;
}

const YEAR_CHOICES: number[] = (() => {
  const now = currentFiscalYear();
  return [now - 1, now, now + 1, now + 2];
})();

export function TrainingBudgetForm({
  editing,
  onSuccess,
  onCancel,
}: TrainingBudgetFormProps) {
  const isEditing = Boolean(editing);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(!isEditing);
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    editing?.employeeId
  );
  const [fiscalYear, setFiscalYear] = useState<number>(
    editing?.fiscalYear ?? currentFiscalYear()
  );
  const [allocatedBudget, setAllocatedBudget] = useState<string>(
    editing ? editing.allocatedBudget.toFixed(2) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) return;
    let cancelled = false;
    (async () => {
      try {
        const { results } = await employeeApi.listEmployees({
          is_active: true,
          page_size: 500,
        });
        if (cancelled) return;
        setEmployees(
          results
            .map((e) => ({
              id: e.id,
              name: `${e.first_name} ${e.last_name}`.trim() || `#${e.id}`,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        if (!cancelled) notifyApiError(err as Error);
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing]);

  const allocatedNumber = useMemo(() => {
    const parsed = Number(allocatedBudget);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [allocatedBudget]);

  const validate = (): string | null => {
    if (!isEditing && !employeeId) return "Please choose an employee.";
    if (!fiscalYear) return "Please choose a fiscal year.";
    if (!Number.isFinite(allocatedNumber) || allocatedNumber < 0) {
      return "Allocated budget must be a non-negative number.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    try {
      let result: TrainingBudget;
      if (isEditing && editing) {
        const payload: UpdateTrainingBudgetPayload = {
          allocatedBudget: allocatedNumber,
        };
        result = await trainingBudgetsApi.update(editing.id, payload);
        notifySuccess(NotificationMessages.UPDATED_SUCCESS);
      } else {
        const payload: CreateTrainingBudgetPayload = {
          employeeId: employeeId as number,
          fiscalYear,
          allocatedBudget: allocatedNumber,
        };
        result = await trainingBudgetsApi.create(payload);
        notifySuccess(NotificationMessages.CREATED_SUCCESS);
      }
      onSuccess(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save training budget";
      setError(message);
      notifyApiError(err as Error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:bg-white disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Employee</Label>
        {isEditing ? (
          <Input value={editing?.employeeName ?? ""} disabled />
        ) : (
          <Select
            value={employeeId ? String(employeeId) : ""}
            onValueChange={(value) => setEmployeeId(Number(value))}
            disabled={employeesLoading || isSaving}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  employeesLoading ? "Loading employees…" : "Choose an employee"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Fiscal Year
          </Label>
          {isEditing ? (
            <Input value={String(editing?.fiscalYear ?? "")} disabled />
          ) : (
            <Select
              value={String(fiscalYear)}
              onValueChange={(value) => setFiscalYear(Number(value))}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_CHOICES.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Allocated Budget ($)
          </Label>
          <input
            name="allocatedBudget"
            type="number"
            step="0.01"
            min="0"
            value={allocatedBudget}
            onChange={(event) => setAllocatedBudget(event.target.value)}
            placeholder="0.00"
            disabled={isSaving}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="gap-1.5">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isEditing ? "Updating…" : "Saving…"}
            </>
          ) : isEditing ? (
            "Update Budget"
          ) : (
            "Save Budget"
          )}
        </Button>
      </div>
    </form>
  );
}
