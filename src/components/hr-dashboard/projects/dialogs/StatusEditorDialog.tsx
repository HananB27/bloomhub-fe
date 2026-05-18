"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { PROJECT_STATUSES, STAGES } from "../projectsData";
import type { Project, ProjectStageId, ProjectStatus } from "../types";

export interface StatusEditResult {
  status: ProjectStatus;
  stage: ProjectStageId;
  note: string;
}

interface StatusEditorDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (next: StatusEditResult) => void;
  initialStage?: ProjectStageId;
}

export function StatusEditorDialog({
  project,
  open,
  onOpenChange,
  onSave,
  initialStage,
}: StatusEditorDialogProps) {
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [stage, setStage] = useState<ProjectStageId>(
    initialStage ?? project.stage
  );
  const [note, setNote] = useState("");
  const handleSave = () => {
    onSave({ status, stage, note });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            Update status — {project.name}
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            Move this project to a new status or stage. A note explains the
            change in the activity log.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6 space-y-1.5">
            <Label htmlFor="st-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProjectStatus)}
            >
              <SelectTrigger id="st-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-6 space-y-1.5">
            <Label htmlFor="st-stage">Stage</Label>
            <Select
              value={stage}
              onValueChange={(v) => setStage(v as ProjectStageId)}
            >
              <SelectTrigger id="st-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 space-y-1.5">
            <Label htmlFor="st-note">Note (optional)</Label>
            <Textarea
              id="st-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What changed and why?"
            />
            <p className="text-[11px] text-gray-700">
              Visible in the project activity log.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Save status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
