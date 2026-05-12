"use client";

import { AlertTriangle, FileText, PenTool, Shield } from "lucide-react";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import {
  DOCUMENT_CATEGORIES,
  SignatureStatus,
  documentExpiryBucket,
  isRestrictedDocument,
} from "@/lib/documents/documentsHelpers";

export function DocumentStats({
  uploadDocs,
  generatedDocsCount,
  isHR,
}: {
  uploadDocs: EmployeeDocument[];
  generatedDocsCount: number;
  isHR: boolean;
}) {
  const total = uploadDocs.length + generatedDocsCount;
  const pending = uploadDocs.filter(
    (d) => d.signatureStatus === SignatureStatus.Pending
  ).length;
  const expSoon = uploadDocs.filter((d) => {
    const b = documentExpiryBucket(d.expiryDate);
    return b === "soon" || b === "expired";
  }).length;
  const expired = uploadDocs.filter(
    (d) => documentExpiryBucket(d.expiryDate) === "expired"
  ).length;
  const restricted = uploadDocs.filter((d) => isRestrictedDocument(d)).length;

  return (
    <div className="grid grid-cols-4 divide-x divide-gray-200 bg-white border border-gray-200 rounded-lg mb-4">
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <FileText className="w-3 h-3" />
          Total documents
        </div>
        <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
          {total}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          across {DOCUMENT_CATEGORIES.length} categories
        </div>
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <PenTool className="w-3 h-3" />
          Pending signatures
        </div>
        <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
          {pending}
        </div>
        <div
          className={`text-[11px] mt-0.5 ${pending > 0 ? "text-amber-600 font-medium" : "text-gray-400"}`}
        >
          {pending > 0 ? "awaiting action" : "all clear"}
        </div>
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <AlertTriangle className="w-3 h-3" />
          Expiring &lt; 30d
        </div>
        <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
          {expSoon}
        </div>
        <div
          className={`text-[11px] mt-0.5 ${expSoon > 0 ? "text-amber-600 font-medium" : "text-gray-400"}`}
        >
          {expired > 0
            ? `${expired} already expired`
            : expSoon > 0
              ? `${expSoon} approaching`
              : "none"}
        </div>
      </div>
      {isHR && (
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            <Shield className="w-3 h-3" />
            Restricted
          </div>
          <div className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1.5 tabular-nums">
            {restricted}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            limited visibility
          </div>
        </div>
      )}
      {!isHR && <div className="px-4 py-3.5" />}
    </div>
  );
}
