"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Label } from "@/components/hr-dashboard/ui/label";
import { DatePicker } from "../DatePicker";
import {
  CERTIFICATE_ACCEPT_ATTR,
  CERTIFICATE_ALLOWED_MIME_TYPES,
  CERTIFICATE_MAX_FILE_MB,
  type Certificate,
  type CreateCertificatePayload,
} from "@/types/certificates";
import { certificatesApi } from "@/lib/api/modules/certificates";

interface CertificateUploadFormProps {
  onSuccess?: (certificate: Certificate) => void;
  onCancel?: () => void;
  employeeId?: number;
}

const ALLOWED_MIME_SET = new Set<string>(CERTIFICATE_ALLOWED_MIME_TYPES);
const MAX_BYTES = CERTIFICATE_MAX_FILE_MB * 1024 * 1024;

const INITIAL_FORM = {
  title: "",
  issuer: "",
  issuedDate: "",
  expirationDate: "",
};

function validateCertificateFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `File size must not exceed ${CERTIFICATE_MAX_FILE_MB} MB.`;
  }
  if (file.type && !ALLOWED_MIME_SET.has(file.type.toLowerCase())) {
    return "Unsupported file type. Allowed: pdf, png, jpg, gif, webp.";
  }
  return null;
}

export function CertificateUploadForm({
  onSuccess,
  onCancel,
  employeeId,
}: CertificateUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.issuedDate) {
      setError("Issued date is required");
      return false;
    }
    if (!file) {
      setError("Please select a certificate file to upload");
      return false;
    }
    const fileError = validateCertificateFile(file);
    if (fileError) {
      setError(fileError);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      const fileError = validateCertificateFile(selected);
      if (fileError) {
        setError(fileError);
        setFile(null);
        e.target.value = "";
        return;
      }
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm() || !file) return;

    const payload: CreateCertificatePayload = {
      title: formData.title.trim(),
      file,
      issuedDate: formData.issuedDate,
      expirationDate: formData.expirationDate || undefined,
      issuer: formData.issuer.trim() || undefined,
      employeeId,
    };

    setIsLoading(true);
    try {
      const result = await certificatesApi.upload(payload);
      setFormData(INITIAL_FORM);
      setFile(null);
      onSuccess?.(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload certificate"
      );
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

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs font-medium text-gray-700">
          Title <span className="text-gray-400">*</span>
        </Label>
        <input
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="e.g. AWS Certified Solutions Architect"
          disabled={isLoading}
          className={inputCls}
        />
      </div>

      {/* Issuer */}
      <div className="space-y-1.5">
        <Label htmlFor="issuer" className="text-xs font-medium text-gray-700">
          Issuer
        </Label>
        <input
          id="issuer"
          name="issuer"
          value={formData.issuer}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, issuer: e.target.value }))
          }
          placeholder="e.g. Amazon Web Services"
          disabled={isLoading}
          className={inputCls}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Issued date <span className="text-gray-400">*</span>
          </Label>
          <DatePicker
            mode="single"
            value={formData.issuedDate}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, issuedDate: date ?? "" }))
            }
            disabled={isLoading}
            size="compact"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Expiration date
          </Label>
          <DatePicker
            mode="single"
            value={formData.expirationDate}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, expirationDate: date ?? "" }))
            }
            disabled={isLoading}
            size="compact"
          />
        </div>
      </div>

      {/* File */}
      <div className="space-y-1.5">
        <Label
          htmlFor="certificate-file"
          className="text-xs font-medium text-gray-700"
        >
          Certificate file <span className="text-gray-400">*</span>
        </Label>
        <input
          id="certificate-file"
          name="file"
          type="file"
          accept={CERTIFICATE_ACCEPT_ATTR}
          onChange={handleFileChange}
          disabled={isLoading}
          className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-300`}
        />
        <p className="text-[11px] text-gray-500">
          PDF or image (PNG, JPG, GIF, WebP). Max {CERTIFICATE_MAX_FILE_MB} MB.
        </p>
        {file && (
          <p className="text-[11px] text-gray-600">
            Selected: <span className="font-medium">{file.name}</span> ·{" "}
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
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
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload Certificate
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
