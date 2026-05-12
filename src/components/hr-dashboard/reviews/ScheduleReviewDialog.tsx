import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { DatePicker } from "../DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { ReviewType } from "@/types/reviews";
import { ALL_REVIEW_TYPES, REVIEW_TYPE_LABELS } from "@/types/reviews";
import type { UserProfile } from "@/lib/api/reviews";

export interface ScheduleReviewFormValues {
  employeeId: string;
  reviewerId: string;
  reviewType: ReviewType;
  scheduledDate: string;
}

interface ScheduleReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: UserProfile[];
  onSubmit: (values: ScheduleReviewFormValues) => Promise<void> | void;
  errorMessage?: string | null;
}

function defaultScheduledDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

export function ScheduleReviewDialog({
  open,
  onOpenChange,
  employees,
  onSubmit,
  errorMessage,
}: ScheduleReviewDialogProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [reviewType, setReviewType] = useState<ReviewType>("quarterly");
  const [scheduledDate, setScheduledDate] = useState(defaultScheduledDate());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!employeeId || !reviewerId) return;
    setSubmitting(true);
    try {
      await onSubmit({ employeeId, reviewerId, reviewType, scheduledDate });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Schedule a review</DialogTitle>
          <DialogDescription>
            Pick the person, reviewer, type, and date. The review will be
            created in “Scheduled” state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Reviewer</Label>
            <Select value={reviewerId} onValueChange={setReviewerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select reviewer" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={reviewType}
                onValueChange={(v) => setReviewType(v as ReviewType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_REVIEW_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {REVIEW_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <DatePicker
                mode="single"
                value={scheduledDate}
                onChange={setScheduledDate}
                placeholder="Pick date"
                size="compact"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !employeeId || !reviewerId}
            className="gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Schedule & notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
