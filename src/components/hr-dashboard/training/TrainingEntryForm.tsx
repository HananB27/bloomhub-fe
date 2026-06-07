"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Input } from "@/components/hr-dashboard/ui/input";
import { Label } from "@/components/hr-dashboard/ui/label";
import { DatePicker } from "../DatePicker";
import type {
  CreateTrainingEntryPayload,
  UpdateTrainingEntryPayload,
  TrainingEntry,
} from "@/types/training";
import type { TrainingBudgetWarning } from "@/types/trainingBudget";

interface TrainingEntryFormProps {
  accessToken: string;
  onSuccess?: (entry: TrainingEntry, warning?: TrainingBudgetWarning) => void;
  onCancel?: () => void;
  editingEntry?: TrainingEntry;
  employeeId?: number;
  onCreateEntry?: (
    payload: CreateTrainingEntryPayload,
    accessToken: string
  ) => Promise<{ entry: TrainingEntry; budgetWarning?: TrainingBudgetWarning }>;
  onUpdateEntry?: (
    id: number,
    payload: UpdateTrainingEntryPayload,
    accessToken: string
  ) => Promise<TrainingEntry>;
  onNotifyBudgetWarning?: (warning: TrainingBudgetWarning) => void;
}

const TRAINING_TYPES = [
  {
    value: "course",
    label: "Course",
    activeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    value: "workshop",
    label: "Workshop",
    activeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "conference",
    label: "Conference",
    activeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    value: "certification",
    label: "Certification",
    activeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "seminar",
    label: "Seminar",
    activeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    value: "other",
    label: "Other",
    activeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
];

export function TrainingEntryForm({
  accessToken,
  onSuccess,
  onCancel,
  editingEntry,
  employeeId,
  onCreateEntry,
  onUpdateEntry,
  onNotifyBudgetWarning,
}: TrainingEntryFormProps) {
  const isEditing = !!editingEntry;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTrainingEntryPayload>({
    courseTitle: editingEntry?.courseTitle || "",
    provider: editingEntry?.provider || "",
    trainingDate: editingEntry?.trainingDate || "",
    trainingType: editingEntry?.trainingType || "course",
    cost: editingEntry?.cost,
    description: editingEntry?.description || "",
    completedAt: editingEntry?.completedAt,
    certificateLink: editingEntry?.certificateLink || "",
    employeeId,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" && value !== ""
          ? parseFloat(value)
          : value || undefined,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.courseTitle.trim()) {
      setError("Course title is required");
      return false;
    }
    if (!formData.provider.trim()) {
      setError("Provider is required");
      return false;
    }
    if (!formData.trainingDate) {
      setError("Training date is required");
      return false;
    }
    if (formData.cost !== undefined && formData.cost < 0) {
      setError("Cost cannot be negative");
      return false;
    }
    if (formData.completedAt && new Date(formData.completedAt) > new Date()) {
      setError("Completion date cannot be in the future");
      return false;
    }
    if (formData.completedAt && formData.trainingDate) {
      const cd = new Date(formData.completedAt);
      const td = new Date(formData.trainingDate);
      const cdOnly = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
      const tdOnly = new Date(td.getFullYear(), td.getMonth(), td.getDate());
      if (cdOnly < tdOnly) {
        setError("Completion date cannot be before training date");
        return false;
      }
    }
    if (formData.certificateLink && formData.certificateLink.trim()) {
      try {
        const url = new URL(formData.certificateLink);
        if (!url.protocol.startsWith("https")) {
          setError("Certificate link must be an HTTPS URL");
          return false;
        }
      } catch {
        setError("Certificate link must be a valid HTTPS URL");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("Authentication error: Please refresh and try again");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let result: TrainingEntry;
      let warning: TrainingBudgetWarning | undefined;
      if (isEditing && editingEntry && onUpdateEntry) {
        result = await onUpdateEntry(
          editingEntry.id,
          formData as UpdateTrainingEntryPayload,
          accessToken
        );
      } else if (!isEditing && onCreateEntry) {
        const created = await onCreateEntry(formData, accessToken);
        result = created.entry;
        warning = created.budgetWarning;
        setFormData({
          courseTitle: "",
          provider: "",
          trainingDate: "",
          trainingType: "course",
          cost: undefined,
          description: "",
          completedAt: undefined,
          certificateLink: "",
          employeeId,
        });
      } else {
        throw new Error("Entry creation/update function not provided");
      }
      if (warning && onNotifyBudgetWarning) {
        onNotifyBudgetWarning(warning);
      }
      if (onSuccess) onSuccess(result, warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
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
      {success && (
        <div className="flex gap-2 rounded-lg bg-green-50 p-3 text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Type chips */}
      <div className="space-y-2">
        <Label
          htmlFor="trainingType"
          className="text-xs font-medium text-gray-700"
        >
          Training Type
        </Label>
        {/* Hidden select keeps label association for accessibility / tests */}
        <select
          id="trainingType"
          name="trainingType"
          value={formData.trainingType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              trainingType: e.target
                .value as CreateTrainingEntryPayload["trainingType"],
            }))
          }
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          disabled={isLoading}
        >
          {TRAINING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {TRAINING_TYPES.map((type) => {
            const isActive = formData.trainingType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    trainingType:
                      type.value as CreateTrainingEntryPayload["trainingType"],
                  }))
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  isActive
                    ? type.activeClass
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label
          htmlFor="courseTitle"
          className="text-xs font-medium text-gray-700"
        >
          Course Title <span className="text-gray-400">*</span>
        </Label>
        <input
          id="courseTitle"
          name="courseTitle"
          value={formData.courseTitle}
          onChange={handleInputChange}
          placeholder="e.g. AWS Solutions Architect"
          disabled={isLoading}
          className={inputCls}
        />
      </div>

      {/* Provider + Cost */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="provider"
            className="text-xs font-medium text-gray-700"
          >
            Provider <span className="text-gray-400">*</span>
          </Label>
          <input
            id="provider"
            name="provider"
            value={formData.provider}
            onChange={handleInputChange}
            placeholder="e.g. Coursera"
            disabled={isLoading}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cost" className="text-xs font-medium text-gray-700">
            Cost ($)
          </Label>
          <input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost ?? ""}
            onChange={handleInputChange}
            placeholder="0.00"
            disabled={isLoading}
            className={inputCls}
          />
        </div>
      </div>

      {/* Training Date + Completion Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="trainingDate"
            className="text-xs font-medium text-gray-700"
          >
            Training Date <span className="text-gray-400">*</span>
          </Label>
          <DatePicker
            mode="single"
            value={formData.trainingDate}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, trainingDate: date }))
            }
            disabled={isLoading}
            disabledDates={(date) => date > new Date()}
            size="compact"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Completion Date
          </Label>
          <DatePicker
            mode="single"
            value={
              formData.completedAt
                ? formData.completedAt.split("T")[0]
                : undefined
            }
            onChange={(date) =>
              setFormData((prev) => ({
                ...prev,
                completedAt: date || undefined,
              }))
            }
            disabled={isLoading}
            disabledDates={(date) => date > new Date()}
            size="compact"
          />
        </div>
      </div>

      {/* Certificate link */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">
          Certificate Link (HTTPS)
        </Label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            name="certificateLink"
            value={formData.certificateLink || ""}
            onChange={handleInputChange}
            placeholder="https://example.com/certificate"
            disabled={isLoading}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Notes / description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Notes</Label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Why this training, manager notes, links…"
          disabled={isLoading}
          rows={2}
          className={`${inputCls} resize-none font-inherit`}
        />
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="gap-1.5">
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isEditing ? "Updating…" : "Adding…"}
            </>
          ) : isEditing ? (
            "Update Entry"
          ) : (
            "Add Entry"
          )}
        </Button>
      </div>
    </form>
  );
}
