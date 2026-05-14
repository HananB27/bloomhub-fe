"use client";

import { Download, Eye, Lock, MoreVertical } from "lucide-react";
import {
  DOCUMENT_CATEGORIES,
  DocumentsListSource,
  documentExpiryBucket,
  isRestrictedDocument,
} from "@/lib/documents/documentsHelpers";
import type { DocumentsTableRowModel } from "../documentsModuleHelpers";
import { downloadGeneratedDocumentHtmlFile } from "../documentsModuleHelpers";
import { VisibilityBadge } from "./VisibilityBadge";
import {
  DocumentCategoryBadge,
  DocumentExpiryCell,
  DocumentFileTile,
  DocumentSignatureCell,
  DocumentVersionBadge,
  documentUploaderFirstName,
  formatDocumentDate,
} from "./documentDisplay";

export function DocumentsTableRow({
  row,
  selected,
  onSelect,
  onOpenDrawer,
}: {
  row: DocumentsTableRowModel;
  selected: boolean;
  onSelect: () => void;
  onOpenDrawer: (r: DocumentsTableRowModel) => void;
}) {
  const doc = row.doc;
  const cat = DOCUMENT_CATEGORIES.find((c) => c.value === doc.category);
  const isTemplate = row.listSource === DocumentsListSource.Template;
  const gen = row.generated;
  const expiryBucket = documentExpiryBucket(doc.expiryDate);
  const expiryAccent =
    expiryBucket === "expired"
      ? "shadow-[inset_3px_0_0_#dc2626] bg-red-50/40"
      : expiryBucket === "soon"
        ? "shadow-[inset_3px_0_0_#d97706] bg-amber-50/40"
        : isRestrictedDocument(doc)
          ? "shadow-[inset_3px_0_0_#d97706]"
          : "";

  return (
    <div
      className={`grid items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0 transition-colors relative ${
        selected ? "bg-gray-50/80" : "hover:bg-gray-50/60"
      } ${expiryAccent}`}
      style={{
        gridTemplateColumns: "28px 1fr 140px 130px 130px 150px 80px 100px",
      }}
    >
      <div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-gray-300 accent-gray-800 cursor-pointer"
        />
      </div>

      <div
        className="flex items-start gap-3 min-w-0 cursor-pointer"
        onClick={() => onOpenDrawer(row)}
      >
        {isTemplate ? (
          <div className="w-9 h-11 shrink-0 rounded border border-cyan-200 bg-cyan-50 flex items-end justify-center pb-1 font-mono text-[8px] font-semibold text-cyan-700">
            TPL
          </div>
        ) : (
          <DocumentFileTile type={doc.fileType} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-gray-900 leading-snug">
            <span className="truncate">{doc.name}</span>
            {isRestrictedDocument(doc) && (
              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
            )}
          </div>
          <div className="text-[12px] text-gray-500 mt-0.5 truncate leading-snug">
            {doc.description || (isTemplate ? "\u00a0" : "")}
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {!isTemplate && (
              <>
                <span className="text-[11px] text-gray-400">
                  {doc.fileSizeDisplay}
                </span>
                <span className="text-[11px] text-gray-300">·</span>
              </>
            )}
            <span className="text-[11px] text-gray-400">
              {doc.uploadedBy || "-"}
            </span>
            {!isTemplate &&
              doc.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-[10.5px] font-medium px-1.5 py-px rounded bg-gray-100 text-gray-500"
                >
                  {t}
                </span>
              ))}
            {!isTemplate && doc.tags.length > 2 && (
              <span className="text-[10.5px] font-medium px-1.5 py-px rounded bg-gray-100 text-gray-500">
                +{doc.tags.length - 2}
              </span>
            )}
            {!isTemplate && (
              <VisibilityBadge
                scope={doc.visibilityScope}
                allowedRoles={doc.allowedRoles}
              />
            )}
            {isTemplate && gen?.sourceTemplateName && (
              <span className="text-[10.5px] font-medium px-1.5 py-px rounded bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
                Source: {gen.sourceTemplateName}
              </span>
            )}
            {!isTemplate && doc.fromTemplate && (
              <span className="text-[10.5px] font-medium px-1.5 py-px rounded bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
                Source: Template
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <DocumentCategoryBadge category={doc.category} label={cat?.label} />
      </div>

      <div>
        <div className="text-[12.5px] text-gray-900">
          {formatDocumentDate(doc.lastModified)}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          by {documentUploaderFirstName(doc.uploadedBy)}
        </div>
      </div>

      <div>
        <DocumentExpiryCell expiryDate={doc.expiryDate} />
      </div>

      <div>
        <DocumentSignatureCell doc={doc} />
      </div>

      <div>
        <DocumentVersionBadge version={doc.currentVersion} />
      </div>

      <div className="flex justify-end items-center gap-0.5">
        {isTemplate && gen ? (
          <>
            <button
              type="button"
              title="Open details"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDrawer(row);
              }}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Download"
              onClick={(e) => {
                e.stopPropagation();
                downloadGeneratedDocumentHtmlFile(gen);
              }}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer(row);
            }}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
