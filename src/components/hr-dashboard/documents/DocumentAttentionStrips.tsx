"use client";

import { AlertTriangle, ChevronRight, PenTool } from "lucide-react";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import {
  SignatureStatus,
  documentExpiryBucket,
} from "@/lib/documents/documentsHelpers";

export function DocumentAttentionStrips({
  docs,
  onJump,
}: {
  docs: EmployeeDocument[];
  onJump: (k: "pending" | "expiring") => void;
}) {
  const pending = docs.filter(
    (d) => d.signatureStatus === SignatureStatus.Pending
  );
  const expiring = docs.filter((d) => {
    const b = documentExpiryBucket(d.expiryDate);
    return b === "soon" || b === "expired";
  });
  if (pending.length === 0 && expiring.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {pending.length > 0 && (
        <button
          type="button"
          onClick={() => onJump("pending")}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 text-left hover:border-gray-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <PenTool className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-medium text-gray-900">
              Pending your action
              <span className="font-mono text-[11px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                {pending.length}
              </span>
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {pending
                .slice(0, 2)
                .map((p) => p.name)
                .join(" · ")}
              {pending.length > 2 ? ` +${pending.length - 2} more` : ""}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      )}
      {expiring.length > 0 && (
        <button
          type="button"
          onClick={() => onJump("expiring")}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 text-left hover:border-gray-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-medium text-gray-900">
              Expiring or expired
              <span className="font-mono text-[11px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                {expiring.length}
              </span>
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {expiring
                .slice(0, 2)
                .map((p) => p.name)
                .join(" · ")}
              {expiring.length > 2 ? ` +${expiring.length - 2} more` : ""}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      )}
    </div>
  );
}
