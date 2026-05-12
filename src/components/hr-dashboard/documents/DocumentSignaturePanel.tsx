"use client";

import { RotateCcw, Send } from "lucide-react";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import { SignatureStatus } from "@/lib/documents/documentsHelpers";
import { Button } from "../ui/button";
import { SignatureActionButton } from "./SignatureActionButton";
import { SignatureStatusBadge } from "./SignatureStatusBadge";

interface DocumentSignaturePanelProps {
  document: EmployeeDocument;
  currentUserEmail?: string;
  canSign: boolean;
  canRequestSignature: boolean;
  canSendReminder: boolean;
  canResetSignatures?: boolean;
  reminderLoading?: boolean;
  resetLoading?: boolean;
  actionLoading?: boolean;
  onSign: () => void;
  onRequestSignature: () => void;
  onSendReminder: () => void;
  onResetSignatures?: () => void;
}

function formatSignatureDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function signerStatusLabel(status: string): string {
  if (status === "signed") return "Signed";
  if (status === "pending") return "Pending";
  return "Not sent";
}

export function DocumentSignaturePanel({
  document,
  currentUserEmail,
  canSign,
  canRequestSignature,
  canSendReminder,
  canResetSignatures = false,
  reminderLoading = false,
  resetLoading = false,
  actionLoading = false,
  onSign,
  onRequestSignature,
  onSendReminder,
  onResetSignatures,
}: DocumentSignaturePanelProps) {
  const showResetButton =
    canResetSignatures && !!onResetSignatures && document.signers.length > 0;
  const signedCount = document.signers.filter(
    (signer) => signer.status === "signed"
  ).length;
  const totalCount = document.signers.length;
  const signedAt =
    document.signers.find(
      (signer) => signer.status === "signed" && signer.signedAt
    )?.signedAt ?? "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <SignatureStatusBadge
            status={document.signatureStatus}
            signedCount={signedCount}
            totalCount={totalCount}
          />
          <div className="text-[12px] text-gray-500">
            {totalCount > 0
              ? `${signedCount} of ${totalCount} signer${totalCount === 1 ? "" : "s"} complete`
              : document.signatureStatus === SignatureStatus.Pending
                ? "Pending signature workflow has no signer details yet."
                : "No signature requested for this document."}
          </div>
          {document.signatureStatus === SignatureStatus.Signed && signedAt && (
            <div className="text-[12px] text-gray-500">
              Signed {formatSignatureDate(signedAt)}
            </div>
          )}
        </div>

        <SignatureActionButton
          document={document}
          currentUserEmail={currentUserEmail}
          canSign={canSign}
          canRequestSignature={canRequestSignature}
          onSign={onSign}
          onRequestSignature={onRequestSignature}
          loading={actionLoading}
        />
      </div>

      <div className="space-y-2">
        {document.signers.map((signer, index) => {
          const when =
            signer.status === "signed"
              ? signer.signedAt
              : (signer.lastRemindedAt ?? signer.requestedAt);
          const whenLabel =
            signer.status === "signed"
              ? "Signed"
              : signer.lastRemindedAt
                ? "Last reminded"
                : "Requested";

          return (
            <div
              key={`${signer.email}-${index}`}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 px-3 py-2.5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-gray-900">
                  {signer.name || "Unnamed signer"}
                </div>
                <div className="truncate text-[11.5px] text-gray-500">
                  {signer.email || "No email"}
                </div>
                {when && (
                  <div className="text-[11px] text-gray-400">
                    {whenLabel} {formatSignatureDate(when)}
                  </div>
                )}
              </div>
              <span
                className={`w-fit rounded px-2 py-1 text-[11px] font-medium ${
                  signer.status === "signed"
                    ? "bg-emerald-50 text-emerald-700"
                    : signer.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {signerStatusLabel(signer.status)}
              </span>
            </div>
          );
        })}
      </div>

      {canSendReminder && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSendReminder}
          disabled={reminderLoading}
        >
          <Send className="size-3.5" />
          {reminderLoading ? "Sending..." : "Send reminder to pending signers"}
        </Button>
      )}

      {showResetButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetSignatures}
          disabled={resetLoading}
          className="text-red-600 hover:text-red-700"
        >
          <RotateCcw className="size-3.5" />
          {resetLoading
            ? "Resetting..."
            : "Unsign (clear signatures — testing)"}
        </Button>
      )}
    </div>
  );
}
