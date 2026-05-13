"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Label } from "@/components/hr-dashboard/ui/label";
import { DatePicker } from "../DatePicker";
import type {
  CreatePeerSessionPayload,
  PeerSession,
  UpdatePeerSessionPayload,
} from "@/types/peerSession";
import { createPeerSession, updatePeerSession } from "@/lib/api/peerSessions";

interface PeerSessionFormProps {
  accessToken: string;
  onSuccess?: (session: PeerSession) => void;
  onCancel?: () => void;
  editingSession?: PeerSession;
  employeeId?: number;
}

const INITIAL_FORM: CreatePeerSessionPayload = {
  topic: "",
  sessionDate: "",
  durationMinutes: null,
  description: "",
};

export function PeerSessionForm({
  accessToken,
  onSuccess,
  onCancel,
  editingSession,
  employeeId,
}: PeerSessionFormProps) {
  const isEditing = !!editingSession;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePeerSessionPayload>({
    topic: editingSession?.topic ?? INITIAL_FORM.topic,
    sessionDate: editingSession?.sessionDate ?? INITIAL_FORM.sessionDate,
    durationMinutes:
      editingSession?.durationMinutes ?? INITIAL_FORM.durationMinutes,
    description: editingSession?.description ?? INITIAL_FORM.description,
    employeeId,
  });

  const validateForm = (): boolean => {
    if (!formData.topic.trim()) {
      setError("Topic is required");
      return false;
    }
    if (!formData.sessionDate) {
      setError("Session date is required");
      return false;
    }
    if (
      formData.durationMinutes !== null &&
      formData.durationMinutes !== undefined &&
      formData.durationMinutes <= 0
    ) {
      setError("Duration must be a positive number");
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
      let result: PeerSession;
      if (isEditing && editingSession) {
        const updatePayload: UpdatePeerSessionPayload = {
          topic: formData.topic,
          sessionDate: formData.sessionDate,
          durationMinutes: formData.durationMinutes,
          description: formData.description,
        };
        result = await updatePeerSession(
          editingSession.id,
          updatePayload,
          accessToken
        );
      } else {
        result = await createPeerSession(formData, accessToken);
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

      {/* Topic */}
      <div className="space-y-1.5">
        <Label htmlFor="topic" className="text-xs font-medium text-gray-700">
          Topic <span className="text-gray-400">*</span>
        </Label>
        <input
          id="topic"
          name="topic"
          value={formData.topic}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, topic: e.target.value }))
          }
          placeholder="e.g. Pair-programming React hooks"
          disabled={isLoading}
          className={inputCls}
        />
      </div>

      {/* Date + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Session Date <span className="text-gray-400">*</span>
          </Label>
          <DatePicker
            mode="single"
            value={formData.sessionDate}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, sessionDate: date ?? "" }))
            }
            disabled={isLoading}
            size="compact"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="duration_minutes"
            className="text-xs font-medium text-gray-700"
          >
            Duration (minutes)
          </Label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            value={
              formData.durationMinutes === null ||
              formData.durationMinutes === undefined
                ? ""
                : formData.durationMinutes
            }
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                durationMinutes:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="e.g. 45"
            disabled={isLoading}
            className={inputCls}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label
          htmlFor="description"
          className="text-xs font-medium text-gray-700"
        >
          Notes
        </Label>
        <textarea
          id="description"
          name="description"
          value={formData.description ?? ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Details about the session, participants, takeaways…"
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
              {isEditing ? "Updating…" : "Logging…"}
            </>
          ) : isEditing ? (
            "Update Session"
          ) : (
            "Log Session"
          )}
        </Button>
      </div>
    </form>
  );
}
