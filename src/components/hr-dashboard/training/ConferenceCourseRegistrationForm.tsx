"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Label } from "@/components/hr-dashboard/ui/label";
import { DatePicker } from "../DatePicker";
import type {
  ConferenceCourseRegistration,
  ConferenceCourseRegistrationStatus,
  CreateConferenceCourseRegistrationPayload,
  UpdateConferenceCourseRegistrationPayload,
} from "@/types/conferenceCourseRegistration";
import {
  ALL_CONFERENCE_COURSE_REGISTRATION_STATUSES,
  CONFERENCE_COURSE_REGISTRATION_STATUS_LABELS,
} from "@/types/conferenceCourseRegistration";
import {
  createConferenceCourseRegistration,
  updateConferenceCourseRegistration,
} from "@/lib/api/conferenceCourseRegistrations";

interface ConferenceCourseRegistrationFormProps {
  accessToken: string;
  onSuccess?: (registration: ConferenceCourseRegistration) => void;
  onCancel?: () => void;
  editingRegistration?: ConferenceCourseRegistration;
  employeeId?: number;
}

const INITIAL_FORM: CreateConferenceCourseRegistrationPayload = {
  name: "",
  date: "",
  status: "registered",
  notes: "",
};

export function ConferenceCourseRegistrationForm({
  accessToken,
  onSuccess,
  onCancel,
  editingRegistration,
  employeeId,
}: ConferenceCourseRegistrationFormProps) {
  const isEditing = !!editingRegistration;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<CreateConferenceCourseRegistrationPayload>({
      name: editingRegistration?.name ?? INITIAL_FORM.name,
      date: editingRegistration?.date ?? INITIAL_FORM.date,
      status: editingRegistration?.status ?? INITIAL_FORM.status,
      notes: editingRegistration?.notes ?? INITIAL_FORM.notes,
      employeeId,
    });

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.date) {
      setError("Date is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessToken) {
      setError("Authentication error: Please refresh and try again");
      return;
    }
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let result: ConferenceCourseRegistration;
      if (isEditing && editingRegistration) {
        const updatePayload: UpdateConferenceCourseRegistrationPayload = {
          name: formData.name,
          date: formData.date,
          status: formData.status,
          notes: formData.notes,
        };
        result = await updateConferenceCourseRegistration(
          editingRegistration.id,
          updatePayload,
          accessToken
        );
      } else {
        result = await createConferenceCourseRegistration(
          formData,
          accessToken
        );
        setFormData({ ...INITIAL_FORM, employeeId });
      }
      if (onSuccess) onSuccess(result);
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

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium text-gray-700">
          Name <span className="text-gray-400">*</span>
        </Label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g. ReactConf 2026"
          disabled={isLoading}
          className={inputCls}
        />
      </div>

      {/* Date + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Date <span className="text-gray-400">*</span>
          </Label>
          <DatePicker
            mode="single"
            value={formData.date}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, date: date ?? "" }))
            }
            disabled={isLoading}
            size="compact"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs font-medium text-gray-700">
            Status <span className="text-gray-400">*</span>
          </Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                status: e.target.value as ConferenceCourseRegistrationStatus,
              }))
            }
            disabled={isLoading}
            className={inputCls}
          >
            {ALL_CONFERENCE_COURSE_REGISTRATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONFERENCE_COURSE_REGISTRATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
          Notes
        </Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes ?? ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Session notes, takeaways, agenda links…"
          disabled={isLoading}
          rows={3}
          className={`${inputCls} resize-none font-inherit`}
        />
      </div>

      {/* Footer */}
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
            "Update Registration"
          ) : (
            "Add Registration"
          )}
        </Button>
      </div>
    </form>
  );
}
