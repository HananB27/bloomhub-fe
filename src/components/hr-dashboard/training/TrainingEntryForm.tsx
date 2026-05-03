"use client";

import React, { useState } from "react";
import { Calendar, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/hr-dashboard/ui/card";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Input } from "@/components/hr-dashboard/ui/input";
import { Label } from "@/components/hr-dashboard/ui/label";
import type {
  CreateTrainingEntryPayload,
  UpdateTrainingEntryPayload,
  TrainingEntry,
} from "@/types/training";
import { createTrainingEntry, updateTrainingEntry } from "@/lib/api/training";

interface TrainingEntryFormProps {
  accessToken: string;
  onSuccess?: (entry: TrainingEntry) => void;
  onCancel?: () => void;
  editingEntry?: TrainingEntry;
  employeeId?: number;
}

const TRAINING_TYPES = [
  { value: "course", label: "Course" },
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "certification", label: "Certification" },
  { value: "seminar", label: "Seminar" },
  { value: "other", label: "Other" },
];

export function TrainingEntryForm({
  accessToken,
  onSuccess,
  onCancel,
  editingEntry,
  employeeId,
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
    employeeId,
  });

  // Get max date (today)
  const today = new Date().toISOString().split("T")[0];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      const completedDate = new Date(formData.completedAt);
      const trainingDate = new Date(formData.trainingDate);
      // Compare dates only (not time), normalize to midnight for fair comparison
      const completedDateOnly = new Date(
        completedDate.getFullYear(),
        completedDate.getMonth(),
        completedDate.getDate()
      );
      const trainingDateOnly = new Date(
        trainingDate.getFullYear(),
        trainingDate.getMonth(),
        trainingDate.getDate()
      );
      if (completedDateOnly < trainingDateOnly) {
        setError("Completion date cannot be before training date");
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let result: TrainingEntry;
      if (isEditing && editingEntry) {
        result = await updateTrainingEntry(
          editingEntry.id,
          formData as UpdateTrainingEntryPayload,
          accessToken
        );
      } else {
        result = await createTrainingEntry(formData, accessToken);
        // Reset form after successful creation
        setFormData({
          courseTitle: "",
          provider: "",
          trainingDate: "",
          trainingType: "course",
          cost: undefined,
          description: "",
          completedAt: undefined,
          employeeId,
        });
      }

      // Call success callback immediately for instant UI update
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isEditing ? "Edit Training Entry" : "Add Training Entry"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex gap-2 rounded-md bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex gap-2 rounded-md bg-green-50 p-3 text-green-700">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="courseTitle">Course Title *</Label>
              <Input
                id="courseTitle"
                name="courseTitle"
                value={formData.courseTitle}
                onChange={handleInputChange}
                placeholder="e.g., Advanced Python Programming"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                placeholder="e.g., Coursera"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trainingType">Training Type *</Label>
              <select
                id="trainingType"
                name="trainingType"
                value={formData.trainingType}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {TRAINING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingDate">Training Date *</Label>
              <Input
                id="trainingDate"
                name="trainingDate"
                type="date"
                value={formData.trainingDate}
                onChange={handleInputChange}
                max={today}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="completedAt">Completion Date</Label>
              <Input
                id="completedAt"
                name="completedAt"
                type="date"
                value={
                  formData.completedAt ? formData.completedAt.split("T")[0] : ""
                }
                onChange={(e) => {
                  const dateOnly = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    completedAt: dateOnly || undefined,
                  }));
                }}
                max={today}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost ?? ""}
                onChange={handleInputChange}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Any additional details about the training..."
              disabled={isLoading}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Entry"
              ) : (
                "Add Entry"
              )}
            </Button>

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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
