"use client";

import { CheckCircle2, PenTool } from "lucide-react";
import { Button } from "../ui/button";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import { SignatureStatus } from "@/lib/documents/documentsHelpers";

interface SignatureActionButtonProps {
  document: EmployeeDocument;
  currentUserEmail?: string;
  canSign: boolean;
  canRequestSignature: boolean;
  onSign: () => void;
  onRequestSignature: () => void;
  loading?: boolean;
}

export function SignatureActionButton({
  document,
  currentUserEmail,
  canSign,
  canRequestSignature,
  onSign,
  onRequestSignature,
  loading = false,
}: SignatureActionButtonProps) {
  if (canSign) {
    return (
      <Button size="sm" variant="primary" onClick={onSign} disabled={loading}>
        <PenTool className="size-3.5" />
        {loading ? "Signing..." : "Sign"}
      </Button>
    );
  }

  if (canRequestSignature) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onRequestSignature}
        disabled={loading}
      >
        <PenTool className="size-3.5" />
        {loading ? "Requesting..." : "Request signature"}
      </Button>
    );
  }

  if (document.signatureStatus === SignatureStatus.Signed) {
    return (
      <Button size="sm" variant="secondary" disabled>
        <CheckCircle2 className="size-3.5" />
        Signed
      </Button>
    );
  }

  const title = currentUserEmail
    ? "You do not have permission to sign or request signatures for this document."
    : "Sign in with an email address to sign this document.";

  return (
    <Button size="sm" variant="secondary" disabled title={title}>
      <PenTool className="size-3.5" />
      Signature unavailable
    </Button>
  );
}
