"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import type { AiPendingConfirmation, JsonValue } from "@/lib/api/aiChat";
import { usePendingExpiry } from "@/hooks/usePendingExpiry";
import { diffArguments, normalizeFormDataForSchema } from "@/lib/ai/schema";
import { SchemaForm } from "./SchemaForm";
import type { RJSFSchema } from "@rjsf/utils";

export interface PendingConfirmationCardProps {
  pending: AiPendingConfirmation;
  superseded?: boolean;
  disabled?: boolean;
  requiresInput?: boolean;
  fieldErrors?: Record<string, string>;
  topLevelError?: string | null;
  submitFullArguments?: boolean;
  onApprove: (editedArguments: Record<string, JsonValue>) => void;
  onDeny: () => void;
  onReask?: () => void;
}

function formatCountdown(seconds: number | null): string {
  if (seconds == null) return "";
  if (seconds <= 0) return "expired";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `< 1m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function PendingConfirmationCard({
  pending,
  superseded,
  disabled,
  requiresInput,
  fieldErrors,
  topLevelError,
  submitFullArguments,
  onApprove,
  onDeny,
  onReask,
}: PendingConfirmationCardProps) {
  const proposed = (pending.proposed_arguments ??
    pending.arguments ??
    {}) as Record<string, JsonValue>;
  const { secondsLeft, isExpired } = usePendingExpiry(pending.expires_at);

  const schema = (pending.args_schema as unknown as RJSFSchema | undefined) ?? {
    type: "object",
    properties: {},
  };
  const normalizedProposed = normalizeFormDataForSchema(
    proposed,
    pending.args_schema as Record<string, JsonValue> | undefined
  );
  const getInitialFormData = () => {
    const current = pending.arguments
      ? normalizeFormDataForSchema(
          pending.arguments as Record<string, JsonValue>,
          pending.args_schema as Record<string, JsonValue> | undefined
        )
      : {};
    return { ...normalizedProposed, ...current };
  };
  const [formData, setFormData] = useState<Record<string, JsonValue>>(() =>
    getInitialFormData()
  );

  useEffect(() => {
    setFormData(getInitialFormData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.tool_name, pending.created_at]);

  const blocked = Boolean(superseded || disabled || isExpired);
  const formId = `pending-form-${pending.tool_name ?? "tool"}`;
  const missingFields = pending.missing_fields ?? [];

  const isFilled = (v: JsonValue | undefined): boolean => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  };

  const missingStillEmpty = missingFields.filter((k) => !isFilled(formData[k]));
  const canApprove = !blocked && missingStillEmpty.length === 0;

  const diff = diffArguments(normalizedProposed, formData);
  const modifiedKeys = Object.keys(diff);

  const handleSubmit = (data: Record<string, JsonValue>) => {
    onApprove(
      submitFullArguments ? data : diffArguments(normalizedProposed, data)
    );
  };

  const reset = () => setFormData({ ...normalizedProposed });

  const countdownIsCritical =
    secondsLeft != null && secondsLeft > 0 && secondsLeft < 60;

  return (
    <div
      className={`mt-3 rounded-xl border bg-white shadow-sm dark:bg-gray-900 ${
        superseded
          ? "border-gray-200 opacity-60"
          : isExpired
            ? "border-amber-300"
            : "border-amber-300"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3 border-b border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-gray-700 dark:bg-amber-900/10">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {pending.confirmation_label ?? "Confirmation required"}
            </span>
            {pending.tool_name && (
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.7rem] text-amber-900">
                {pending.tool_name}
              </code>
            )}
            {pending.module && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-700">
                {pending.module}
              </span>
            )}
            {pending.mutating && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-medium text-blue-800">
                write
              </span>
            )}
            {pending.sensitive && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-medium text-red-800">
                sensitive
              </span>
            )}
            {superseded && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[0.65rem] font-medium text-gray-700">
                superseded
              </span>
            )}
            {!superseded && pending.expires_at && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                  isExpired || countdownIsCritical
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                <Clock className="h-3 w-3" />
                expires in {formatCountdown(secondsLeft)}
              </span>
            )}
            {requiresInput && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.65rem] font-medium text-purple-800">
                needs input
              </span>
            )}
          </div>
          {pending.confirmation_help && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {pending.confirmation_help}
            </p>
          )}
          {pending.description && (
            <p className="mt-1 text-[0.7rem] text-gray-500">
              {pending.description}
            </p>
          )}
        </div>
      </div>

      <div className={`px-4 py-3 ${blocked ? "pointer-events-none" : ""}`}>
        {pending.question && (
          <p className="mb-3 rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-900">
            {pending.question}
          </p>
        )}
        {missingFields.length > 0 && (
          <p className="mb-2 text-[0.7rem] text-amber-800">
            Missing required: {missingFields.join(", ")}
          </p>
        )}
        <SchemaForm
          schema={schema}
          formData={formData}
          disabled={blocked}
          fieldErrors={fieldErrors}
          missingFields={missingFields}
          formId={formId}
          onChange={setFormData}
          onSubmit={handleSubmit}
        />
        {modifiedKeys.length > 0 && (
          <p className="mt-2 text-[0.7rem] text-gray-500">
            Modified fields:{" "}
            <span className="font-medium text-gray-700">
              {modifiedKeys.join(", ")}
            </span>
          </p>
        )}
        {topLevelError && (
          <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {topLevelError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
        {isExpired && onReask && !superseded && (
          <Button size="sm" variant="outline" onClick={onReask}>
            Re-ask assistant
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onDeny}
          disabled={disabled || superseded}
        >
          Deny
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={blocked}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to AI proposal
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!canApprove}
          onClick={() => {
            const form = document.getElementById(
              formId
            ) as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }}
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
        </Button>
      </div>
    </div>
  );
}
