"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Save } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { DatePicker } from "../../DatePicker";
import { validateAssignment } from "../projectsHelpers";
import type { MemberRole, Project, ProjectMember } from "../types";

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  assignment: ProjectMember;
  onSave: (next: ProjectMember) => void;
}

export function EditAssignmentDialog({
  open,
  onOpenChange,
  project,
  assignment,
  onSave,
}: EditAssignmentDialogProps) {
  const [role, setRole] = useState<MemberRole>(assignment.role);
  const [allocationInput, setAllocationInput] = useState(
    String(assignment.allocation)
  );
  const [startDate, setStartDate] = useState<string>(assignment.start_date);
  const [endDate, setEndDate] = useState<string>(assignment.end_date ?? "");
  const [notes, setNotes] = useState<string>(assignment.notes ?? "");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRole(assignment.role);
    setAllocationInput(String(assignment.allocation));
    setStartDate(assignment.start_date);
    setEndDate(assignment.end_date ?? "");
    setNotes(assignment.notes ?? "");
    setSubmitted(false);
  }, [open, assignment]);

  const allocation = Number(allocationInput);
  const weeklyHours = Number.isFinite(allocation)
    ? ((allocation / 100) * 40).toFixed(2)
    : "0.00";

  const errors = useMemo(
    () =>
      validateAssignment(
        {
          allocation,
          start_date: startDate,
          end_date: endDate || null,
        },
        {
          employeeId: assignment.id,
          project,
          ignoreAssignmentId: assignment.id,
        }
      ),
    [allocation, startDate, endDate, project, assignment.id]
  );

  const hasErrors = Object.keys(errors).length > 0;
  const show = (key: keyof typeof errors) => submitted && errors[key];

  const handleSave = () => {
    setSubmitted(true);
    if (hasErrors) return;
    onSave({
      ...assignment,
      role,
      allocation,
      start_date: startDate,
      end_date: endDate || null,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit assignment · {assignment.name}</DialogTitle>
          <DialogDescription className="text-gray-700">
            Update role, timeline, or notes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 space-y-1.5">
            <Label className="text-[12px] font-medium text-gray-700">
              Role on project
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as MemberRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Contributor">Contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-12 space-y-1.5">
            <Label
              htmlFor="assignment-allocation"
              className="text-[12px] font-medium text-gray-700"
            >
              Time allocation <span className="text-red-600">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="assignment-allocation"
                type="number"
                min="1"
                max="100"
                step="1"
                value={allocationInput}
                onChange={(e) => setAllocationInput(e.target.value)}
                className="h-9"
              />
              <span className="whitespace-nowrap text-[12px] text-gray-600">
                % · {weeklyHours}h/week
              </span>
            </div>
            {show("allocation") ? (
              <p className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                <AlertCircle className="h-3 w-3" /> {errors.allocation}
              </p>
            ) : null}
          </div>

          <div className="col-span-6 space-y-1.5">
            <Label className="text-[12px] font-medium text-gray-700">
              Start date <span className="text-red-600">*</span>
            </Label>
            <DatePicker
              mode="single"
              size="compact"
              value={startDate}
              onChange={(d) => setStartDate(d)}
              placeholder="Pick start date"
            />
            {show("start_date") ? (
              <p className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                <AlertCircle className="h-3 w-3" /> {errors.start_date}
              </p>
            ) : null}
          </div>

          <div className="col-span-6 space-y-1.5">
            <Label className="text-[12px] font-medium text-gray-700">
              End date
            </Label>
            <DatePicker
              mode="single"
              size="compact"
              value={endDate}
              onChange={(d) => setEndDate(d)}
              placeholder="Leave empty if ongoing"
              disabledDates={
                startDate ? (date) => date <= new Date(startDate) : undefined
              }
            />
            {show("end_date") ? (
              <p className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                <AlertCircle className="h-3 w-3" /> {errors.end_date}
              </p>
            ) : null}
          </div>

          <div className="col-span-12 space-y-1.5">
            <Label className="text-[12px] font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
