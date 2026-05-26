"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { DatePicker } from "../DatePicker";
import { bonusApi, type BonusTypeId } from "@/lib/api/compensation";
import type { CompensationEmployee } from "@/lib/api/compensation";

const BONUS_TYPES: { value: BonusTypeId; label: string }[] = [
  { value: "performance", label: "Performance" },
  { value: "retention", label: "Retention" },
  { value: "referral", label: "Referral" },
  { value: "project", label: "Project" },
  { value: "education", label: "Education" },
  { value: "spot", label: "Spot" },
];

interface LogBonusFormValues {
  employeeId: string;
  type: BonusTypeId;
  amount: number;
  effectiveDate: string;
  reason: string;
}

interface LogBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: CompensationEmployee[];
  onLogged?: () => void;
}

export function LogBonusDialog({
  open,
  onOpenChange,
  employees,
  onLogged,
}: LogBonusDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LogBonusFormValues>({
    defaultValues: {
      employeeId: "",
      type: "performance",
      amount: 0,
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: "",
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = async (values: LogBonusFormValues) => {
    try {
      await bonusApi.create({
        user_profile: Number(values.employeeId),
        bonus_type: values.type,
        amount: values.amount,
        effective_date: values.effectiveDate,
        reason: values.reason,
        currency: "BAM",
      });
      const empName =
        employees.find((e) => String(e.id) === values.employeeId)?.name ??
        "employee";
      toast.success(
        `Bonus logged: BAM ${values.amount.toLocaleString("en-US")} for ${empName}`
      );
      onLogged?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to log bonus";
      toast.error(message);
    }
  };

  const employeeId = watch("employeeId");
  const bonusType = watch("type");
  const effectiveDate = watch("effectiveDate");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Log bonus</DialogTitle>
          <DialogDescription>
            Record a bonus payment for an employee. Visible in compensation
            history once backend integration ships.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bonus-employee">Employee</Label>
            <Select
              value={employeeId}
              onValueChange={(value) =>
                setValue("employeeId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="bonus-employee"
                aria-invalid={Boolean(errors.employeeId)}
              >
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name} — {e.dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              {...register("employeeId", {
                required: "Employee is required",
              })}
            />
            {errors.employeeId ? (
              <p className="text-xs text-red-600">
                {errors.employeeId.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bonus-type">Type</Label>
              <Select
                value={bonusType}
                onValueChange={(value) =>
                  setValue("type", value as BonusTypeId, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="bonus-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BONUS_TYPES.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value}>
                      {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("type", { required: true })} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bonus-amount">Amount (BAM)</Label>
              <Input
                id="bonus-amount"
                type="number"
                min={1}
                step="1"
                aria-invalid={Boolean(errors.amount)}
                {...register("amount", {
                  required: "Amount is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Must be at least 1" },
                  max: {
                    value: 1_000_000,
                    message: "Must be at most 1,000,000",
                  },
                })}
              />
              {errors.amount ? (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bonus-date">Effective date</Label>
            <DatePicker
              mode="single"
              value={effectiveDate}
              onChange={(date) =>
                setValue("effectiveDate", date, { shouldValidate: true })
              }
              placeholder="Pick a date"
            />
            <input
              type="hidden"
              {...register("effectiveDate", {
                required: "Effective date is required",
                pattern: {
                  value: /^\d{4}-\d{2}-\d{2}$/,
                  message: "Use YYYY-MM-DD",
                },
              })}
            />
            {errors.effectiveDate ? (
              <p className="text-xs text-red-600">
                {errors.effectiveDate.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bonus-reason">Reason</Label>
            <Textarea
              id="bonus-reason"
              rows={3}
              placeholder="Why is this bonus being awarded?"
              aria-invalid={Boolean(errors.reason)}
              {...register("reason", {
                required: "Reason is required",
                minLength: {
                  value: 3,
                  message: "At least 3 characters",
                },
              })}
            />
            {errors.reason ? (
              <p className="text-xs text-red-600">{errors.reason.message}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging…" : "Log bonus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
