"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CircleStop } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { DatePicker } from "../../DatePicker";
import type { ProjectMember } from "../types";

interface EndAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: ProjectMember;
  onConfirm: (endDate: string) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EndAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  onConfirm,
}: EndAssignmentDialogProps) {
  const [endDate, setEndDate] = useState<string>(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEndDate(todayIso());
    setError(null);
  }, [open]);

  const handleConfirm = () => {
    if (!endDate) {
      setError("End date is required.");
      return;
    }
    if (endDate <= assignment.start_date) {
      setError("End date must be after the start date.");
      return;
    }
    onConfirm(endDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>End assignment · {assignment.name}</DialogTitle>
          <DialogDescription className="text-gray-700">
            Sets the end date. The record stays in history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-gray-700">
            End date <span className="text-red-600">*</span>
          </Label>
          <DatePicker
            mode="single"
            size="compact"
            value={endDate}
            onChange={(d) => {
              setEndDate(d);
              setError(null);
            }}
            placeholder="Pick end date"
            disabledDates={(date) => date <= new Date(assignment.start_date)}
          />
          {error ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-red-600">
              <AlertCircle className="h-3 w-3" /> {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <CircleStop className="mr-1.5 h-3.5 w-3.5" /> End assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
