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
import { PROJECT_STATUSES, STAGES } from "../projectsData";
import type { Project, ProjectStageId, ProjectStatus } from "../types";

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (next: Project) => void;
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSave,
}: EditProjectDialogProps) {
  const [form, setForm] = useState<Project>(project);
  const set = <K extends keyof Project>(k: K, v: Project[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const handleSave = () => {
    onSave({ ...form, progress: Number(form.progress) });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            Edit {project.name}
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            Update project metadata, status, and progress.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-1.5">
            <Label htmlFor="ed-name">Project name</Label>
            <Input
              id="ed-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="col-span-4 space-y-1.5">
            <Label htmlFor="ed-code">Code</Label>
            <Input
              id="ed-code"
              maxLength={4}
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
          <div className="col-span-6 space-y-1.5">
            <Label htmlFor="ed-client">Client</Label>
            <Input
              id="ed-client"
              value={form.client}
              onChange={(e) => set("client", e.target.value)}
            />
          </div>
          <div className="col-span-6 space-y-1.5">
            <Label htmlFor="ed-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as ProjectStatus)}
            >
              <SelectTrigger id="ed-status">
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
            <Label htmlFor="ed-stage">Stage</Label>
            <Select
              value={form.stage}
              onValueChange={(v) => set("stage", v as ProjectStageId)}
            >
              <SelectTrigger id="ed-stage">
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
          <div className="col-span-6 space-y-1.5">
            <Label htmlFor="ed-progress">Progress (%)</Label>
            <Input
              id="ed-progress"
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => set("progress", Number(e.target.value))}
              className="font-mono"
            />
          </div>
          <div className="col-span-12 space-y-1.5">
            <Label htmlFor="ed-desc">Description</Label>
            <Textarea
              id="ed-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
