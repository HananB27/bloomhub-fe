"use client";

import { History } from "lucide-react";
import { formatDate } from "@/utils";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import {
  DocumentCategory,
  type DocumentFileDisplayType,
  documentDaysUntil,
  documentExpiryBucket,
} from "@/lib/documents/documentsHelpers";
import { SignatureStatusBadge } from "./SignatureStatusBadge";

export const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  [DocumentCategory.Contracts]: "bg-purple-100 text-purple-800",
  [DocumentCategory.Policies]: "bg-blue-100 text-blue-800",
  [DocumentCategory.Agreements]: "bg-green-100 text-green-800",
  [DocumentCategory.Compliance]: "bg-red-100 text-red-800",
  [DocumentCategory.Onboarding]: "bg-orange-100 text-orange-800",
  [DocumentCategory.Training]: "bg-indigo-100 text-indigo-800",
  [DocumentCategory.Benefits]: "bg-emerald-100 text-emerald-800",
  [DocumentCategory.Other]: "bg-gray-100 text-gray-700",
};

export function formatDocumentDate(iso?: string | null): string | null {
  if (!iso) return null;
  return formatDate(iso);
}

export function documentUploaderFirstName(uploadedBy: string): string {
  const first = uploadedBy.trim().split(/\s+/)[0];
  return first || "-";
}

export function DocumentFileTile({
  type,
  compact = false,
}: {
  type: DocumentFileDisplayType;
  compact?: boolean;
}) {
  const colorMap: Record<DocumentFileDisplayType, string> = {
    pdf: "border-red-200 text-red-700 bg-red-50",
    doc: "border-blue-200 text-blue-700 bg-blue-50",
    img: "border-emerald-200 text-emerald-700 bg-emerald-50",
    file: "border-gray-200 text-gray-500 bg-white",
  };
  const label = type.toUpperCase();
  const w = compact ? "w-7 h-9" : "w-9 h-11";
  return (
    <div
      className={`${w} flex-shrink-0 rounded border flex items-end justify-center pb-1 font-mono text-[8px] font-semibold relative ${colorMap[type]}`}
    >
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-b-[6px] border-l-transparent border-b-current opacity-20" />
      {label}
    </div>
  );
}

export function DocumentCategoryBadge({
  category,
  label,
}: {
  category: DocumentCategory;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:opacity-50 ${DOCUMENT_CATEGORY_COLORS[category]}`}
    >
      {label}
    </span>
  );
}

export function DocumentExpiryCell({
  expiryDate,
}: {
  expiryDate?: string | null;
}) {
  const bucket = documentExpiryBucket(expiryDate);
  const d = documentDaysUntil(expiryDate);
  if (bucket === "none") {
    return <span className="text-[12px] text-gray-400 italic">No expiry</span>;
  }
  const dotColor =
    bucket === "expired"
      ? "bg-red-500"
      : bucket === "soon"
        ? "bg-amber-500"
        : "bg-gray-300";
  const textColor =
    bucket === "expired"
      ? "text-red-600 font-medium"
      : bucket === "soon"
        ? "text-amber-600 font-medium"
        : "text-gray-900";
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[12.5px] ${textColor}`}>
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}
        />
        {formatDocumentDate(expiryDate)}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 pl-3">
        {bucket === "expired" ? `${Math.abs(d!)} days ago` : `in ${d} days`}
      </div>
    </div>
  );
}

export function DocumentSignatureCell({ doc }: { doc: EmployeeDocument }) {
  return (
    <SignatureStatusBadge
      status={doc.signatureStatus}
      signedCount={doc.signers.filter((s) => s.status === "signed").length}
      totalCount={doc.signers.length}
    />
  );
}

export function DocumentVersionBadge({ version }: { version: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      <History className="w-2.5 h-2.5" />v{version}
    </button>
  );
}
