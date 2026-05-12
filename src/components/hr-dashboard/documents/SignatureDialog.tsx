"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Info, PenTool } from "lucide-react";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import { documentsApi } from "@/lib/api/modules/documents";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface SignatureDialogProps {
  document: EmployeeDocument | null;
  open: boolean;
  currentUserEmail?: string;
  allowSignerOverride?: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (document: EmployeeDocument) => void;
}

export function validateSignatureForm(signatureValue: string): string | null {
  if (!signatureValue.trim()) return "Type your full name to sign.";
  return null;
}

export function SignatureDialog({
  document,
  open,
  currentUserEmail,
  allowSignerOverride = false,
  onOpenChange,
  onSuccess,
}: SignatureDialogProps) {
  const pendingSigners = useMemo(
    () =>
      document?.signers.filter((signer) => signer.status === "pending") ?? [],
    [document]
  );
  const [signerEmail, setSignerEmail] = useState("");
  const [signatureValue, setSignatureValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const current = currentUserEmail?.trim().toLowerCase();
    const matching = pendingSigners.find(
      (signer) => signer.email.trim().toLowerCase() === current
    );
    setSignerEmail(
      matching?.email ?? pendingSigners[0]?.email ?? current ?? ""
    );
    setSignatureValue("");
    setError(null);
  }, [currentUserEmail, open, pendingSigners]);

  const canChooseSigner = allowSignerOverride && pendingSigners.length > 1;

  const handleSubmit = async () => {
    if (!document) return;
    const validationError = validateSignatureForm(signatureValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!signerEmail) {
      setError("Choose the signer email for this signature.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await documentsApi.signDocument(document.id, {
        signer_email: signerEmail,
        signature: {
          type: "typed_name",
          value: signatureValue.trim(),
          accepted_terms: true,
        },
      });
      onSuccess(updated);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signing failed";
      const lower = message.toLowerCase();
      setError(
        lower.includes("403") ||
          lower.includes("permission") ||
          lower.includes("unauthorized")
          ? "You are not authorized to sign for this signer."
          : message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-6">
        <DialogHeader>
          <DialogTitle>Sign document</DialogTitle>
          <DialogDescription>
            {document
              ? `Apply your electronic signature to "${document.name}".`
              : "Apply your electronic signature."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="signature-signer-email">Signer email</Label>
            {canChooseSigner ? (
              <Select value={signerEmail} onValueChange={setSignerEmail}>
                <SelectTrigger id="signature-signer-email">
                  <SelectValue placeholder="Choose signer" />
                </SelectTrigger>
                <SelectContent>
                  {pendingSigners.map((signer) => (
                    <SelectItem key={signer.email} value={signer.email}>
                      {signer.name
                        ? `${signer.name} · ${signer.email}`
                        : signer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input id="signature-signer-email" value={signerEmail} readOnly />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signature-value">Typed full-name signature</Label>
            <Input
              id="signature-value"
              value={signatureValue}
              onChange={(e) => setSignatureValue(e.target.value)}
              placeholder="Type your full name"
            />
          </div>

          <div
            role="note"
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900"
          >
            <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>
              By signing, you confirm that this electronic signature is legally
              binding and represents your approval of the document.
            </span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <PenTool className="size-3.5" />
            {submitting ? "Signing..." : "Sign document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
