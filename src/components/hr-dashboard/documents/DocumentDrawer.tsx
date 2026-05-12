"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  Archive,
  Download,
  Eye,
  History,
  Lock,
  RotateCcw,
  Share,
  Trash2,
  X,
} from "lucide-react";
import { documentsApi } from "@/lib/api/modules/documents";
import {
  DOCUMENT_ACCESS_ROLE_LABELS,
  DOCUMENT_CATEGORIES,
  DocumentInlinePreviewPresentation,
  DocumentsListSource,
  SignatureStatus,
  documentDaysUntil,
  documentExpiryBucket,
  documentInlinePreviewPresentation,
  isRestrictedDocument,
} from "@/lib/documents/documentsHelpers";
import { documentVisibilityLabel } from "@/lib/documents/documentVisibilityHelpers";
import {
  type DocumentsTableRowModel,
  DocumentDrawerPreviewChrome,
  DocumentsDrawerPlaceholder,
  generatedDocumentFieldTags,
  generatedDocumentPreviewHtml,
  tableRowKey,
} from "../documentsModuleHelpers";
import { DocumentSignaturePanel } from "./DocumentSignaturePanel";
import { formatDocumentDate } from "./documentDisplay";

function SignedDocumentPreviewSurface({
  mimeType,
  fileName,
  signedUrl,
  title,
  frameClassName,
}: {
  mimeType: string;
  fileName: string;
  signedUrl: string;
  title: string;
  frameClassName: string;
}) {
  const { presentation, embedSrc } = useMemo(
    () => documentInlinePreviewPresentation(mimeType, fileName, signedUrl),
    [mimeType, fileName, signedUrl]
  );

  let node: ReactNode;
  if (presentation === DocumentInlinePreviewPresentation.Image) {
    node = <iframe title={title} src={embedSrc} className={frameClassName} />;
  } else if (presentation === DocumentInlinePreviewPresentation.PdfObject) {
    node = (
      <object
        data={embedSrc}
        type="application/pdf"
        title={title}
        className={frameClassName}
      >
        <iframe
          title={title}
          src={embedSrc}
          className={`${frameClassName} block`}
        />
      </object>
    );
  } else if (
    presentation === DocumentInlinePreviewPresentation.OfficeOnlineEmbed
  ) {
    node = (
      <iframe
        title={title}
        src={embedSrc}
        className={frameClassName}
        allowFullScreen
      />
    );
  } else {
    node = <iframe title={title} src={embedSrc} className={frameClassName} />;
  }

  return node;
}

function DrawerUploadPreview({
  documentId,
  title,
  mimeType,
  fileName,
}: {
  documentId: number;
  title: string;
  mimeType: string;
  fileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    documentsApi
      .resolveInlineDocumentUrl(documentId)
      .then((resolvedUrl) => {
        if (cancelled) return;
        if (resolvedUrl) {
          setUrl(resolvedUrl);
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (status === "loading") {
    return (
      <div className={DocumentDrawerPreviewChrome.UploadLoadingFull}>
        {DocumentsDrawerPlaceholder.UploadPreviewLoading}
      </div>
    );
  }
  if (status === "ready" && url) {
    return (
      <SignedDocumentPreviewSurface
        mimeType={mimeType}
        fileName={fileName}
        signedUrl={url}
        title={title}
        frameClassName={DocumentDrawerPreviewChrome.ModalIframe}
      />
    );
  }
  return (
    <div className={DocumentDrawerPreviewChrome.UploadEmptyFull}>
      {DocumentsDrawerPlaceholder.UploadPreviewUnavailable}
    </div>
  );
}

export function DocumentDrawer({
  row,
  onClose,
  isHR,
  currentUserEmail,
  viewingArchived,
  reminderLoading,
  onDownload,
  onDelete,
  onSendReminder,
  onSign,
  onRequestSignature,
  onResetSignatures,
  onShare,
  onArchive,
  onUnarchive,
  onEditVisibility,
}: {
  row: DocumentsTableRowModel | null;
  onClose: () => void;
  isHR: boolean;
  currentUserEmail?: string;
  viewingArchived: boolean;
  reminderLoading?: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onSendReminder: () => void;
  onSign: () => void;
  onRequestSignature: () => void;
  onResetSignatures: () => void;
  onShare: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onEditVisibility: () => void;
}) {
  const open = !!row;
  const doc = row?.doc;
  const isTemplate =
    Boolean(row) &&
    row!.listSource === DocumentsListSource.Template &&
    Boolean(row!.generated);
  const gen = row?.generated;
  const bucket = open && doc ? documentExpiryBucket(doc.expiryDate) : "none";
  const d = open && doc ? documentDaysUntil(doc.expiryDate) : null;
  const cat =
    open && doc
      ? DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)
      : null;
  const templateFieldTags =
    isTemplate && gen ? generatedDocumentFieldTags(gen.fieldValues) : [];
  const signerMatchesCurrentUser =
    !!currentUserEmail &&
    !!doc?.signers.some(
      (signer) =>
        signer.status === "pending" &&
        signer.email.trim().toLowerCase() === currentUserEmail.toLowerCase()
    );
  const canSign =
    !!doc &&
    !isTemplate &&
    !viewingArchived &&
    doc.signatureStatus === SignatureStatus.Pending &&
    signerMatchesCurrentUser;
  const canRequestSignature =
    !!doc &&
    !isTemplate &&
    !viewingArchived &&
    !doc.fromTemplate &&
    isHR &&
    (doc.signatureStatus === SignatureStatus.NotRequired ||
      doc.signatureStatus === SignatureStatus.Rejected);
  const canSendReminder =
    !!doc &&
    !isTemplate &&
    !viewingArchived &&
    isHR &&
    doc.signatureStatus === SignatureStatus.Pending &&
    doc.signers.some((signer) => signer.status === "pending");

  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const fullPreviewTitleId = useId();
  const drawerRowKey = row ? tableRowKey(row) : "";

  useEffect(() => {
    queueMicrotask(() => {
      setFullPreviewOpen(false);
    });
  }, [drawerRowKey]);

  useEffect(() => {
    if (!fullPreviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullPreviewOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/30 z-50 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-[480px] max-w-full bg-white shadow-2xl z-60 flex flex-col transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ zIndex: 60 }}
      >
        {open && doc && row && (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-semibold text-gray-900 leading-snug">
                  {doc.name}
                </h2>
                <div className="text-[12px] text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
                  {cat?.label}
                  <span className="text-gray-300">·</span>v{doc.currentVersion}
                  <span className="text-gray-300">·</span>
                  {doc.fileSizeDisplay}
                  {gen?.sourceTemplateName && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Source: {gen.sourceTemplateName}
                    </span>
                  )}
                  {isRestrictedDocument(doc) && (
                    <span className="ml-1 text-amber-600 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Restricted
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Description
                </h4>
                {isTemplate && gen ? (
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {DocumentsDrawerPlaceholder.TemplatePreviewHint}
                  </p>
                ) : (
                  <p className="text-[13px] text-gray-800 leading-relaxed">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    {isTemplate ? "Created" : "Uploaded"}
                  </h4>
                  <div className="text-[13px] text-gray-800">
                    {formatDocumentDate(
                      isTemplate && gen ? gen.createdAt : doc.uploadedAt
                    )}
                  </div>
                  <div className="text-[12px] text-gray-500">
                    by {isTemplate && gen ? gen.createdBy : doc.uploadedBy}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Expiry
                  </h4>
                  {doc.expiryDate ? (
                    <>
                      <div
                        className={`flex items-center gap-1.5 text-[13px] ${bucket === "expired" ? "text-red-600 font-medium" : bucket === "soon" ? "text-amber-600 font-medium" : "text-gray-800"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${bucket === "expired" ? "bg-red-500" : bucket === "soon" ? "bg-amber-500" : "bg-gray-300"}`}
                        />
                        {formatDocumentDate(doc.expiryDate)}
                      </div>
                      <div className="text-[12px] text-gray-500 mt-0.5">
                        {bucket === "expired"
                          ? `Expired ${Math.abs(d!)} days ago`
                          : `${d} days remaining`}
                      </div>
                    </>
                  ) : (
                    <span className="text-[13px] text-gray-400 italic">
                      No expiry
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  {isTemplate ? "Template fields" : "Tags"}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {isTemplate && gen
                    ? templateFieldTags.map((t) => (
                        <span
                          key={t}
                          className="text-[11.5px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-600"
                        >
                          {t}
                        </span>
                      ))
                    : doc.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11.5px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-600"
                        >
                          {t}
                        </span>
                      ))}
                  {isTemplate && gen && templateFieldTags.length === 0 && (
                    <span className="text-[12px] text-gray-400">
                      {DocumentsDrawerPlaceholder.TemplateFieldsEmpty}
                    </span>
                  )}
                  {!isTemplate && doc.tags.length === 0 && (
                    <span className="text-[12px] text-gray-400">No tags</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                    Access ·{" "}
                    {documentVisibilityLabel(
                      doc.visibilityScope,
                      doc.allowedRoles
                    )}
                  </h4>
                  {isHR && !isTemplate && (
                    <button
                      type="button"
                      onClick={onEditVisibility}
                      className="text-[11px] font-medium text-gray-600 hover:text-gray-900 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors"
                    >
                      Edit visibility
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {doc.allowedRoles.length === 0 && isTemplate ? (
                    <span className="text-[12px] text-gray-400">
                      {DocumentsDrawerPlaceholder.GeneratedAccessRoles}
                    </span>
                  ) : (
                    doc.allowedRoles.map((r) => (
                      <span
                        key={r}
                        className="text-[11.5px] font-medium px-2 py-1 rounded bg-blue-50 text-blue-700"
                      >
                        {DOCUMENT_ACCESS_ROLE_LABELS[r]}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Signatures
                </h4>
                <DocumentSignaturePanel
                  document={doc}
                  currentUserEmail={currentUserEmail}
                  canSign={canSign}
                  canRequestSignature={canRequestSignature}
                  canSendReminder={canSendReminder}
                  reminderLoading={reminderLoading}
                  onSign={onSign}
                  onRequestSignature={onRequestSignature}
                  onSendReminder={onSendReminder}
                  onResetSignatures={onResetSignatures}
                  canResetSignatures={isHR && !viewingArchived}
                />
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Version history · {doc.versionCount}
                </h4>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                  <History className="w-3.5 h-3.5 text-gray-500" />
                  <div className="text-[12px] text-gray-800 flex-1">
                    v{doc.currentVersion}{" "}
                    <span className="text-gray-400">· current</span>
                  </div>
                  <button className="text-[11px] font-medium text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                    View all
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFullPreviewOpen(true)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                type="button"
                onClick={() => onDownload()}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              {!isTemplate && (
                <button
                  type="button"
                  onClick={() => onShare()}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Share className="w-3.5 h-3.5" /> Share
                </button>
              )}
              {isHR && !isTemplate && (
                <div className="ml-auto flex gap-1.5">
                  {viewingArchived ? (
                    <button
                      type="button"
                      onClick={() => onUnarchive()}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onArchive()}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete()}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-red-600 border border-transparent rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {fullPreviewOpen && open && doc && row && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={fullPreviewTitleId}
          className={DocumentDrawerPreviewChrome.FullPreviewOverlay}
        >
          <button
            type="button"
            className={DocumentDrawerPreviewChrome.FullPreviewBackdrop}
            onClick={() => setFullPreviewOpen(false)}
            aria-label={DocumentsDrawerPlaceholder.FullPreviewCloseBackdrop}
          />
          <div className={DocumentDrawerPreviewChrome.FullPreviewPanel}>
            <div className={DocumentDrawerPreviewChrome.FullPreviewHeader}>
              <h3
                id={fullPreviewTitleId}
                className="truncate pr-2 text-[15px] font-semibold text-gray-900"
              >
                {doc.name}
              </h3>
              <button
                type="button"
                onClick={() => setFullPreviewOpen(false)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
                aria-label={DocumentsDrawerPlaceholder.FullPreviewCloseBackdrop}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={DocumentDrawerPreviewChrome.FullPreviewBody}>
              {isTemplate && gen ? (
                <iframe
                  title={doc.name}
                  className={DocumentDrawerPreviewChrome.ModalIframe}
                  srcDoc={generatedDocumentPreviewHtml(gen)}
                />
              ) : (
                <DrawerUploadPreview
                  key={`full-${doc.id}`}
                  documentId={doc.id}
                  title={doc.name}
                  mimeType={doc.mimeType}
                  fileName={doc.fileName}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
