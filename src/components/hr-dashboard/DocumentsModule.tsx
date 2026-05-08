"use client";

import type { ReactNode } from "react";
import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useId,
} from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  Download,
  Upload,
  Search,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  Archive,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  History,
  Send,
  Lock,
  X,
  FolderOpen,
  AlertTriangle,
  PenTool,
  MoreVertical,
  Share,
} from "lucide-react";
import { formatDate } from "@/utils";
import {
  DocumentCategory,
  SignatureStatus,
  DOCUMENT_CATEGORIES,
  DocumentFileDisplayType,
  ALL_CATEGORIES_FILTER,
  EXPIRY_FILTER_EXPIRING_SOON,
  EXPIRY_FILTER_EXPIRED,
  DocumentsListSource,
  DOCUMENT_ACCESS_ROLE_LABELS,
  documentDaysUntil,
  documentExpiryBucket,
  parseDocumentTags,
  isHrDocumentUser,
  isRestrictedDocument,
  filterDocumentsByAccess,
  getDocumentUserRole,
  documentInlinePreviewPresentation,
  DocumentInlinePreviewPresentation,
  type SessionUserRoleFlags,
} from "@/lib/documents/documentsHelpers";
import {
  DOCUMENT_CATEGORY_DEFAULT_PRESET,
  visibilityFromPreset,
  type DocumentVisibilitySettings,
} from "@/lib/documents/documentVisibilityPresets";
import { documentVisibilityLabel } from "@/lib/documents/documentVisibilityHelpers";
import { DocumentVisibilitySelector } from "./documents/DocumentVisibilitySelector";
import { VisibilityBadge } from "./documents/VisibilityBadge";
import { EditVisibilityDialog } from "./documents/EditVisibilityDialog";
import {
  type DocumentsTableRowModel,
  filterAndSortTableRows,
  buildMergedTableRows,
  tableRowKey,
  uploadDocumentIdsFromRowKeys,
  downloadGeneratedDocumentHtmlFile,
  generatedDocumentPreviewHtml,
  generatedDocumentFieldTags,
  DocumentBulkUserMessage,
  DocumentsDrawerPlaceholder,
  DocumentDrawerPreviewChrome,
} from "./documentsModuleHelpers";
import {
  documentsApi,
  type EmployeeDocument,
  type UploadEmployeeDocumentPayload,
} from "@/lib/api/modules/documents";
import {
  notifyApiError,
  notifySuccess,
  withNotification,
  NotificationMessages,
  notifyQuickFeedback,
} from "@/utils/notificationHelpers";
import { TemplateBuilder } from "./templates/TemplateBuilder";
import { TemplatesManagement } from "./templates/TemplatesManagement";
import { TemplatePicker, FieldFillModal } from "./templates/TemplatePicker";
import {
  templatesApi,
  type GeneratedDocument,
} from "@/lib/api/modules/templates";
import type { DocumentTemplate as FullDocumentTemplate } from "@/lib/templates/templatesHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DatePicker } from "./DatePicker";

// ─── Local UI-only types ──────────────────────────────────────────────────────

/** Narrow alias — keeps FileTile signature identical to before. */
type FileType = DocumentFileDisplayType;

type SortKey = "modified" | "expiry" | "category";

// ─── Display constants ────────────────────────────────────────────────────────

const CAT_COLORS: Record<DocumentCategory, string> = {
  contracts: "bg-purple-100 text-purple-800",
  policies: "bg-blue-100 text-blue-800",
  agreements: "bg-green-100 text-green-800",
  compliance: "bg-red-100 text-red-800",
  onboarding: "bg-orange-100 text-orange-800",
  training: "bg-indigo-100 text-indigo-800",
  benefits: "bg-emerald-100 text-emerald-800",
  other: "bg-gray-100 text-gray-700",
};

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-emerald-600",
  "bg-indigo-600",
  "bg-rose-600",
];

// ─── Pure UI helpers ──────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  return formatDate(iso);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── FileTile ─────────────────────────────────────────────────────────────────

function FileTile({
  type,
  compact = false,
}: {
  type: FileType;
  compact?: boolean;
}) {
  const colorMap: Record<FileType, string> = {
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

// ─── StatStrip ────────────────────────────────────────────────────────────────

function StatStrip({
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

// ─── AttentionStrips ──────────────────────────────────────────────────────────

function AttentionStrips({
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

// ─── ExpiryCell ───────────────────────────────────────────────────────────────

function ExpiryCell({ expiryDate }: { expiryDate?: string | null }) {
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
        {fmtDate(expiryDate)}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 pl-3">
        {bucket === "expired" ? `${Math.abs(d!)} days ago` : `in ${d} days`}
      </div>
    </div>
  );
}

// ─── SigCell ──────────────────────────────────────────────────────────────────

function SigCell({ doc }: { doc: EmployeeDocument }) {
  const { signatureStatus, signers } = doc;
  const signedCount = signers.filter((s) => s.status === "signed").length;
  const total = signers.length;

  if (signatureStatus === SignatureStatus.Signed) {
    return (
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
        <CheckCircle className="w-3.5 h-3.5" />
        Signed
      </div>
    );
  }
  if (signatureStatus === SignatureStatus.Pending) {
    return (
      <div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </div>
        {total > 0 && (
          <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
            {signedCount}/{total}
          </div>
        )}
      </div>
    );
  }
  if (signatureStatus === SignatureStatus.Rejected) {
    return (
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-red-600">
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </div>
    );
  }
  return <span className="text-[12px] text-gray-400">No signature</span>;
}

// ─── DocRow ───────────────────────────────────────────────────────────────────

function documentUploaderFirstName(uploadedBy: string): string {
  const first = uploadedBy.trim().split(/\s+/)[0];
  return first || "—";
}

function DocRow({
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

  return (
    <div
      className={`grid items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0 transition-colors relative ${
        selected ? "bg-gray-50/80" : "hover:bg-gray-50/60"
      } ${isRestrictedDocument(doc) ? "shadow-[inset_3px_0_0_#d97706]" : ""}`}
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
          <FileTile type={doc.fileType} />
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
              {doc.uploadedBy || "—"}
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
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:opacity-50 ${CAT_COLORS[doc.category]}`}
        >
          {cat?.label}
        </span>
      </div>

      <div>
        <div className="text-[12.5px] text-gray-900">
          {fmtDate(doc.lastModified)}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          by {documentUploaderFirstName(doc.uploadedBy)}
        </div>
      </div>

      <div>
        <ExpiryCell expiryDate={doc.expiryDate} />
      </div>

      <div>
        <SigCell doc={doc} />
      </div>

      <div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <History className="w-2.5 h-2.5" />v{doc.currentVersion}
        </button>
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

// ─── Drawer ───────────────────────────────────────────────────────────────────

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

function Drawer({
  row,
  onClose,
  isHR,
  viewingArchived,
  onDownload,
  onDelete,
  onSendReminder,
  onShare,
  onArchive,
  onUnarchive,
  onEditVisibility,
}: {
  row: DocumentsTableRowModel | null;
  onClose: () => void;
  isHR: boolean;
  viewingArchived: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onSendReminder: () => void;
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
                    {fmtDate(
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
                        {fmtDate(doc.expiryDate)}
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
                  Signatures ·{" "}
                  {doc.signers.filter((s) => s.status === "signed").length} of{" "}
                  {doc.signers.length}
                </h4>
                {doc.signers.length === 0 && (
                  <p className="text-[12px] text-gray-400">
                    No signature required for this document.
                  </p>
                )}
                <div className="space-y-2">
                  {doc.signers.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                      >
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-gray-900 truncate">
                          {s.name}
                        </div>
                        <div className="text-[11.5px] text-gray-500 truncate">
                          {s.email}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-1 rounded flex-shrink-0 ${s.status === "signed" ? "bg-emerald-50 text-emerald-700" : s.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {s.status === "signed"
                          ? "✓ Signed"
                          : s.status === "pending"
                            ? "Pending"
                            : "Not sent"}
                      </span>
                    </div>
                  ))}
                </div>
                {!isTemplate &&
                  doc.signatureStatus === SignatureStatus.Pending && (
                    <button
                      type="button"
                      onClick={() => onSendReminder()}
                      className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <Send className="w-3 h-3" /> Send reminder to pending
                      signers
                    </button>
                  )}
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

// ─── UploadModal ──────────────────────────────────────────────────────────────

interface UploadForm {
  name: string;
  category: DocumentCategory | "";
  description: string;
  expiryDate: string;
  noExpiry: boolean;
  visibility: DocumentVisibilitySettings;
  /** True once the user has manually edited visibility — disables category-driven prefill. */
  userTouchedVisibility: boolean;
  requestSig: boolean;
  tags: string;
  file: File | null;
}

const DEFAULT_UPLOAD_VISIBILITY: DocumentVisibilitySettings =
  visibilityFromPreset("everyone");

const EMPTY_UPLOAD_FORM: UploadForm = {
  name: "",
  category: "",
  description: "",
  expiryDate: "",
  noExpiry: false,
  visibility: DEFAULT_UPLOAD_VISIBILITY,
  userTouchedVisibility: false,
  requestSig: false,
  tags: "",
  file: null,
};

function UploadModal({
  open,
  onClose,
  onSuccess,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: EmployeeDocument) => void;
  initialValues?: Partial<UploadForm>;
}) {
  const modalFileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<UploadForm>(EMPTY_UPLOAD_FORM);

  // Seed form from template whenever the modal opens
  useEffect(() => {
    if (open) {
      setForm(
        initialValues
          ? { ...EMPTY_UPLOAD_FORM, ...initialValues }
          : EMPTY_UPLOAD_FORM
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof UploadForm>(k: K, v: UploadForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) set("file", f);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.file || !form.name || !form.category) return;

    setIsUploading(true);
    try {
      const payload: UploadEmployeeDocumentPayload = {
        file: form.file,
        name: form.name,
        category: form.category as DocumentCategory,
        description: form.description,
        expiryDate: form.noExpiry ? undefined : form.expiryDate || undefined,
        tags: parseDocumentTags(form.tags),
        allowedRoles: form.visibility.allowedRoles,
        visibilityScope: form.visibility.scope,
        // TODO [BACKEND REQUIRED]: POST /api/documents/{id}/request-signature/
        // — when requestSig is true, call documentsApi.requestSignature() after upload
        // with a signer selection step (signer picker UI not yet implemented).
        requestSignatures: form.requestSig,
      };
      const newDoc = await documentsApi.upload(payload);
      notifySuccess(NotificationMessages.UPLOADED_SUCCESS);
      onSuccess(newDoc);
      setForm(EMPTY_UPLOAD_FORM);
      onClose();
    } catch (e) {
      notifyApiError(e as Error);
    } finally {
      setIsUploading(false);
    }
  }, [form, onClose, onSuccess]);

  if (!open) return null;

  const canSubmit =
    !!form.file && !!form.name && !!form.category && !isUploading;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-[70] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[540px] max-h-[calc(100vh-48px)] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900">
            Upload document
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Add a file with category, expiry, and access rules.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg px-5 py-6 text-center transition-colors ${over ? "border-gray-700 bg-gray-50" : "border-gray-300"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={handleFileDrop}
            onClick={() => modalFileRef.current?.click()}
          >
            {form.file ? (
              <div
                className="flex items-center gap-3 text-left bg-gray-100 rounded-lg px-3 py-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="w-5 h-5 text-gray-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">
                    {form.file.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {(form.file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("file", null)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="cursor-pointer">
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <div className="text-[13px] font-medium text-gray-800">
                  <strong>Drop file here</strong> or click to browse
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  PDF, DOC, DOCX, PNG up to 25 MB
                </div>
              </div>
            )}
          </div>
          <input
            ref={modalFileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) set("file", f);
            }}
          />

          {/* Document name */}
          <div>
            <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
              Document name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Employment Agreement"
              className="h-10 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Category + Tags grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Category
              </label>
              <Select
                value={form.category || undefined}
                onValueChange={(value) => {
                  const nextCategory = value as DocumentCategory;
                  setForm((prev) => {
                    const shouldPrefill = !prev.userTouchedVisibility;
                    return {
                      ...prev,
                      category: nextCategory,
                      visibility: shouldPrefill
                        ? visibilityFromPreset(
                            DOCUMENT_CATEGORY_DEFAULT_PRESET[nextCategory]
                          )
                        : prev.visibility,
                    };
                  });
                }}
              >
                <SelectTrigger className="h-10 w-full text-[13px] font-medium text-gray-900 bg-white border-gray-200">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="z-[130] bg-white border-gray-200">
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="Add tags (e.g. Tax, HR, 2024)"
                className="h-10 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this document for?"
              rows={5}
              className="w-full min-h-[80px] px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors resize-y"
            />
          </div>

          {/* Expiry + no-expiry */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
                Expiry date
              </label>
              <DatePicker
                mode="single"
                value={form.expiryDate}
                onChange={(date) => set("expiryDate", date)}
                disabled={form.noExpiry}
                placeholder="Pick expiry date"
                size="compact"
              />
            </div>
            <label className="flex items-center gap-2 pt-5 cursor-pointer text-[13px] text-gray-700">
              <input
                type="checkbox"
                checked={form.noExpiry}
                onChange={(e) => set("noExpiry", e.target.checked)}
                className="rounded border-gray-300 accent-gray-800"
              />
              Does not expire
            </label>
          </div>

          {/* Visibility */}
          <div className="px-3 py-3 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-800">
                  Visibility
                </div>
                <div className="text-[11.5px] text-gray-500">
                  Who can see this document. Defaults follow the chosen
                  category.
                </div>
              </div>
            </div>
            <DocumentVisibilitySelector
              value={form.visibility}
              onChange={(visibility) =>
                setForm((prev) => ({
                  ...prev,
                  visibility,
                  userTouchedVisibility: true,
                }))
              }
            />
          </div>

          {/* Request sig toggle */}
          <div className="flex items-center gap-3 px-3 py-3 border border-gray-200 rounded-lg">
            <PenTool className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-gray-800">
                Request signatures on upload
              </div>
              <div className="text-[11.5px] text-gray-500">
                You&apos;ll choose signers next
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.requestSig}
              onClick={() => set("requestSig", !form.requestSig)}
              className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-150 ${form.requestSig ? "bg-gray-800" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${form.requestSig ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-gray-800 rounded-lg px-4 py-2 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DocumentsModule ──────────────────────────────────────────────────────────

export function DocumentsModule() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUserRoleFlags | undefined;
  const isHR = isHrDocumentUser(sessionUser);
  const userRole = useMemo(
    () => getDocumentUserRole(sessionUser),
    [sessionUser]
  );

  const [editVisibilityDoc, setEditVisibilityDoc] =
    useState<EmployeeDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<
    DocumentCategory | typeof ALL_CATEGORIES_FILTER
  >(ALL_CATEGORIES_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_CATEGORIES_FILTER);
  const [expiryFilter, setExpiryFilter] = useState(ALL_CATEGORIES_FILTER);
  const [sortBy, setSortBy] = useState<SortKey>("modified");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerRow, setDrawerRow] = useState<DocumentsTableRowModel | null>(
    null
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [moduleView, setModuleView] = useState<"documents" | "templates">(
    "documents"
  );
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderEditTemplate, setBuilderEditTemplate] = useState<
    FullDocumentTemplate | undefined
  >(undefined);
  const [useTemplateTarget, setUseTemplateTarget] =
    useState<FullDocumentTemplate | null>(null);
  const [templateRefreshSignal, setTemplateRefreshSignal] = useState(0);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // ─── Load documents ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setIsLoading(true);
      setLoadError(null);
      setSelected(new Set());
    });

    documentsApi
      .list({ archived: showArchived || undefined })
      .then((results) => {
        if (!cancelled) {
          // Frontend-side filter is the second line of defense; backend
          // should also enforce role-based visibility.
          setDocs(filterDocumentsByAccess(results, userRole));
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
        notifyApiError(e);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showArchived, userRole]);

  // Load template-generated documents
  useEffect(() => {
    templatesApi
      .listGenerated()
      .then((results) => setGeneratedDocs(results))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  // ─── Mutation handlers ───────────────────────────────────────────────────────

  const handleUploadSuccess = useCallback((newDoc: EmployeeDocument) => {
    setDocs((prev) => [newDoc, ...prev]);
  }, []);

  const handleTemplateUsed = useCallback(
    (_documentId: number | string) => {
      templatesApi
        .listGenerated()
        .then((results) => setGeneratedDocs(results))
        .catch(() => {
          /* non-critical */
        });
      documentsApi
        .list({ archived: showArchived || undefined })
        .then((results) => setDocs(results))
        .catch(() => {
          /* non-critical */
        });
      notifySuccess("Document generated from template");
    },
    [showArchived]
  );

  const handleDownload = useCallback(async (doc: EmployeeDocument) => {
    try {
      const url = await withNotification(
        documentsApi.getDownloadUrl(doc.id),
        "Generating download link…",
        NotificationMessages.DOWNLOADED_SUCCESS,
        "Download failed"
      );
      if (url) window.open(url, "_blank");
    } catch {
      // error already shown by withNotification
    }
  }, []);

  const handleDelete = useCallback(
    async (doc: EmployeeDocument) => {
      try {
        await withNotification(
          documentsApi.delete(doc.id),
          NotificationMessages.PROCESSING,
          NotificationMessages.DELETED_SUCCESS,
          "Delete failed"
        );
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        if (
          drawerRow?.listSource === DocumentsListSource.Upload &&
          drawerRow.doc.id === doc.id
        ) {
          setDrawerRow(null);
        }
      } catch {
        // error already shown by withNotification
      }
    },
    [drawerRow]
  );

  const handleSendReminder = useCallback(async (doc: EmployeeDocument) => {
    try {
      await withNotification(
        documentsApi.sendReminder(doc.id),
        "Sending reminders…",
        "Reminders sent to pending signers",
        "Failed to send reminders"
      );
    } catch {
      // error already shown by withNotification
    }
  }, []);

  // TODO [BACKEND REQUIRED]: POST /api/documents/{id}/share/
  // — generate a signed shareable link with optional expiry; return { url: string }.
  // Fallback: copy a direct link to the document derived from the current page origin.
  const handleShare = useCallback((doc: EmployeeDocument) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?document=${doc.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() =>
        notifySuccess(NotificationMessages.COPIED_SUCCESS, {
          description: `Link to "${doc.name}" copied`,
        })
      )
      .catch(() =>
        notifyQuickFeedback("Could not copy link to clipboard", "error")
      );
  }, []);

  // TODO [BACKEND REQUIRED]: POST /api/documents/{id}/archive/
  // — soft-delete: set archived=true; document hidden from default list but retrievable via archive view.
  const handleArchive = useCallback(
    async (doc: EmployeeDocument) => {
      try {
        await withNotification(
          documentsApi.archive(doc.id),
          "Archiving document…",
          `"${doc.name}" archived`,
          "Archive failed"
        );
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        if (
          drawerRow?.listSource === DocumentsListSource.Upload &&
          drawerRow.doc.id === doc.id
        ) {
          setDrawerRow(null);
        }
      } catch {
        // error already shown by withNotification
      }
    },
    [drawerRow]
  );

  const handleDrawerDownload = useCallback(() => {
    if (!drawerRow) return;
    if (
      drawerRow.listSource === DocumentsListSource.Template &&
      drawerRow.generated
    ) {
      downloadGeneratedDocumentHtmlFile(drawerRow.generated);
      notifySuccess(NotificationMessages.DOWNLOADED_SUCCESS);
      return;
    }
    void handleDownload(drawerRow.doc);
  }, [drawerRow, handleDownload]);

  const handleDrawerDelete = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    void handleDelete(drawerRow.doc);
  }, [drawerRow, handleDelete]);

  const handleDrawerArchive = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    void handleArchive(drawerRow.doc);
  }, [drawerRow, handleArchive]);

  const handleUnarchive = useCallback(
    async (doc: EmployeeDocument) => {
      try {
        await withNotification(
          documentsApi.unarchive(doc.id),
          "Restoring document…",
          `"${doc.name}" restored`,
          "Restore failed"
        );
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        if (
          drawerRow?.listSource === DocumentsListSource.Upload &&
          drawerRow.doc.id === doc.id
        ) {
          setDrawerRow(null);
        }
      } catch {}
    },
    [drawerRow]
  );

  const handleDrawerUnarchive = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    void handleUnarchive(drawerRow.doc);
  }, [drawerRow, handleUnarchive]);

  const handleDrawerShare = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    handleShare(drawerRow.doc);
  }, [drawerRow, handleShare]);

  const handleDrawerSendReminder = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    void handleSendReminder(drawerRow.doc);
  }, [drawerRow, handleSendReminder]);

  // TODO [BACKEND REQUIRED]: GET /api/documents/export/?format=csv|xlsx
  // — return { url: string } signed download URL for the generated file.
  const handleExport = useCallback(async () => {
    try {
      const url = await withNotification(
        documentsApi.exportDocuments({ format: "csv" }),
        "Preparing export…",
        "Export ready — opening download",
        "Export failed"
      );
      if (url) {
        window.open(url, "_blank");
      } else {
        notifyQuickFeedback("Export not available yet", "info");
      }
    } catch (err) {
      // withNotification already showed a toast; map known non-error cases to friendlier copy.
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("not found")) {
        // Suppress the duplicate error toast already shown and show friendlier copy.
        notifyQuickFeedback("Document export is not available yet", "info");
      }
      // All other errors already surfaced by withNotification.
    }
  }, []);

  const bulkDelete = useCallback(async () => {
    const ids = uploadDocumentIdsFromRowKeys(selected);
    if (ids.length === 0) {
      notifyQuickFeedback(
        DocumentBulkUserMessage.SelectUploadsToDelete,
        "info"
      );
      return;
    }
    try {
      await withNotification(
        documentsApi.bulkDelete(ids),
        NotificationMessages.PROCESSING,
        `${ids.length} document${ids.length > 1 ? "s" : ""} deleted`,
        "Bulk delete failed"
      );
      const idSet = new Set(ids);
      setDocs((prev) => prev.filter((d) => !idSet.has(d.id)));
      setSelected(new Set());
    } catch {
      // error already shown by withNotification
    }
  }, [selected]);

  const bulkArchive = useCallback(async () => {
    const ids = uploadDocumentIdsFromRowKeys(selected);
    if (ids.length === 0) {
      notifyQuickFeedback(
        DocumentBulkUserMessage.SelectUploadsToArchive,
        "info"
      );
      return;
    }
    try {
      await withNotification(
        documentsApi.bulkArchive(ids),
        "Archiving documents…",
        `${ids.length} document${ids.length > 1 ? "s" : ""} archived`,
        "Archive failed"
      );
      const idSet = new Set(ids);
      setDocs((prev) => prev.filter((d) => !idSet.has(d.id)));
      setSelected(new Set());
    } catch {
      // error already shown by withNotification
    }
  }, [selected]);

  const bulkDownload = useCallback(async () => {
    const ids = uploadDocumentIdsFromRowKeys(selected);
    if (ids.length === 0) {
      notifyQuickFeedback(
        DocumentBulkUserMessage.SelectUploadsToDownload,
        "info"
      );
      return;
    }
    try {
      const url = await withNotification(
        documentsApi.bulkDownload(ids),
        "Preparing ZIP download…",
        "Download ready",
        "Download failed"
      );
      if (url) window.open(url, "_blank");
    } catch {
      // error already shown by withNotification
    }
  }, [selected]);

  // ─── Derived state ───────────────────────────────────────────────────────────

  const mergedRows = useMemo(
    () => buildMergedTableRows(docs, generatedDocs),
    [docs, generatedDocs]
  );

  const filteredRows = useMemo(
    () =>
      filterAndSortTableRows(mergedRows, {
        search,
        activeCat,
        statusFilter,
        expiryFilter,
        sortBy,
      }),
    [mergedRows, search, activeCat, statusFilter, expiryFilter, sortBy]
  );

  const catCounts = useMemo(() => {
    const c: Record<string, number> = {
      all: docs.length + generatedDocs.length,
    };
    DOCUMENT_CATEGORIES.forEach((cat) => {
      c[cat.value] = docs.filter((d) => d.category === cat.value).length;
    });
    c[DocumentCategory.Other] =
      (c[DocumentCategory.Other] ?? 0) + generatedDocs.length;
    return c;
  }, [docs, generatedDocs]);

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const toggleAll = () => {
    const keys = filteredRows.map(tableRowKey);
    if (selected.size === keys.length && keys.length > 0)
      setSelected(new Set());
    else setSelected(new Set(keys));
  };

  // ─── Active filter chips ─────────────────────────────────────────────────────

  const activeChips: { label: string; clear: () => void }[] = [];
  if (expiryFilter === EXPIRY_FILTER_EXPIRING_SOON)
    activeChips.push({
      label: "Expiring soon",
      clear: () => setExpiryFilter(ALL_CATEGORIES_FILTER),
    });
  else if (expiryFilter === EXPIRY_FILTER_EXPIRED)
    activeChips.push({
      label: "Expired",
      clear: () => setExpiryFilter(ALL_CATEGORIES_FILTER),
    });
  if (statusFilter !== ALL_CATEGORIES_FILTER)
    activeChips.push({
      label: `Status: ${statusFilter.replace("_", " ")}`,
      clear: () => setStatusFilter(ALL_CATEGORIES_FILTER),
    });

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="space-y-0"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.[0]) setUploadOpen(true);
      }}
    >
      {/* Templates management view */}
      {moduleView === "templates" && (
        <TemplatesManagement
          onBack={() => setModuleView("documents")}
          onNewTemplate={() => {
            setBuilderEditTemplate(undefined);
            setBuilderOpen(true);
          }}
          onEditTemplate={(t) => {
            setBuilderEditTemplate(t);
            setBuilderOpen(true);
          }}
          onUseTemplate={(t) => setUseTemplateTarget(t)}
          refreshSignal={templateRefreshSignal}
        />
      )}

      {moduleView === "documents" && (
        <>
          {/* Page header */}
          <div className="flex items-start justify-between gap-6 mb-5">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-gray-900 leading-tight">
                Documents &amp; Agreements
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                Manage company documents, contracts, and signature workflows
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setModuleView("templates")}
                className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Templates
              </button>
              {isHR && (
                /* TODO [BACKEND REQUIRED]: GET /api/documents/?archived=true — list archived documents */
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className={`flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium border transition-colors ${
                    showArchived
                      ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-900"
                      : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  {showArchived ? "Active docs" : "Archive"}
                </button>
              )}
              {/* TODO [BACKEND REQUIRED]: GET /api/documents/export/?format=csv|xlsx — export filtered document list */}
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button
                type="button"
                onClick={() => setTemplatePickerOpen(true)}
                className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-white bg-gray-800 border border-gray-800 hover:bg-gray-900 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload document
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files?.[0]) setUploadOpen(true);
                }}
              />
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center text-[13px] text-gray-500">
              Loading documents…
            </div>
          )}

          {/* Error state */}
          {!isLoading && loadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-[13px] text-red-700">
              Failed to load documents: {loadError}
            </div>
          )}

          {!isLoading && !loadError && (
            <>
              {/* Archived view banner */}
              {showArchived && (
                <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
                  <Archive className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span className="flex-1">
                    Showing <strong>archived documents</strong>. These are
                    hidden from employees and regular views.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowArchived(false)}
                    className="text-[12px] font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
                  >
                    Back to active
                  </button>
                </div>
              )}

              {/* Stat strip */}
              <StatStrip
                uploadDocs={docs}
                generatedDocsCount={generatedDocs.length}
                isHR={isHR}
              />

              {/* Attention strips */}
              <AttentionStrips
                docs={docs}
                onJump={(k) => {
                  if (k === "pending") setStatusFilter(SignatureStatus.Pending);
                  if (k === "expiring")
                    setExpiryFilter(EXPIRY_FILTER_EXPIRING_SOON);
                }}
              />

              {/* Toolbar */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                {/* Filter row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, description, or tag…"
                      className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-[148px] text-[13px] font-medium text-gray-700 border-gray-200 bg-white flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value={ALL_CATEGORIES_FILTER}>
                        All statuses
                      </SelectItem>
                      <SelectItem value={SignatureStatus.Signed}>
                        Signed
                      </SelectItem>
                      <SelectItem value={SignatureStatus.Pending}>
                        Pending
                      </SelectItem>
                      <SelectItem value={SignatureStatus.Rejected}>
                        Rejected
                      </SelectItem>
                      <SelectItem value={SignatureStatus.NotRequired}>
                        No signature
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                    <SelectTrigger className="h-9 w-[148px] text-[13px] font-medium text-gray-700 border-gray-200 bg-white flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value={ALL_CATEGORIES_FILTER}>
                        All expiries
                      </SelectItem>
                      <SelectItem value={EXPIRY_FILTER_EXPIRING_SOON}>
                        Expiring &lt; 30d
                      </SelectItem>
                      <SelectItem value={EXPIRY_FILTER_EXPIRED}>
                        Expired
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortKey)}
                  >
                    <SelectTrigger className="h-9 w-[148px] text-[13px] font-medium text-gray-700 border-gray-200 bg-white flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="modified">Sort: Modified</SelectItem>
                      <SelectItem value="expiry">Sort: Expiry</SelectItem>
                      <SelectItem value="category">Sort: Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveCat(ALL_CATEGORIES_FILTER)}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium border transition-colors ${activeCat === ALL_CATEGORIES_FILTER ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
                  >
                    All{" "}
                    <span
                      className={`font-mono text-[10px] ${activeCat === ALL_CATEGORIES_FILTER ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {catCounts.all}
                    </span>
                  </button>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setActiveCat(cat.value)}
                      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium border transition-colors ${activeCat === cat.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
                    >
                      {cat.label}{" "}
                      <span
                        className={`font-mono text-[10px] ${activeCat === cat.value ? "text-gray-300" : "text-gray-400"}`}
                      >
                        {catCounts[cat.value] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active filter chips */}
                {activeChips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[11px] text-gray-400 uppercase tracking-widest mr-1">
                      Active filters
                    </span>
                    {activeChips.map((chip) => (
                      <span
                        key={chip.label}
                        className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-gray-100 text-[12px] font-medium text-gray-700"
                      >
                        {chip.label}
                        <button
                          type="button"
                          onClick={chip.clear}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setExpiryFilter(ALL_CATEGORIES_FILTER);
                        setStatusFilter(ALL_CATEGORIES_FILTER);
                      }}
                      className="h-6 px-2 rounded text-[12px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk action bar */}
              {selected.size > 0 && (
                <div className="flex items-center gap-3 px-3.5 py-2.5 mb-3 bg-gray-800 text-white rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === filteredRows.length &&
                      filteredRows.length > 0
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-500 accent-white cursor-pointer"
                  />
                  <span className="text-[13px] font-medium">
                    {selected.size} selected
                  </span>
                  <div className="flex gap-1.5 ml-auto">
                    {/* TODO [BACKEND REQUIRED]: POST /api/documents/{id}/request-signature/ — bulk signature request */}
                    <button
                      type="button"
                      onClick={() =>
                        notifyQuickFeedback(
                          "Signature request coming soon",
                          "info"
                        )
                      }
                      className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-gray-200 border border-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      <PenTool className="w-3 h-3" /> Request signature
                    </button>
                    <button
                      type="button"
                      onClick={bulkArchive}
                      className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-gray-200 border border-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      <Archive className="w-3 h-3" /> Archive
                    </button>
                    <button
                      type="button"
                      onClick={bulkDownload}
                      className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-gray-200 border border-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                    <button
                      type="button"
                      onClick={bulkDelete}
                      className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-red-300 border border-gray-600 hover:bg-red-900/40 hover:border-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Document list / empty state */}
              {filteredRows.length > 0 && (
                <>
                  <div
                    className="grid items-center gap-4 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-t-lg text-[11px] font-semibold text-gray-500 uppercase tracking-widest"
                    style={{
                      gridTemplateColumns:
                        "28px 1fr 140px 130px 130px 150px 80px 100px",
                    }}
                  >
                    <div>
                      <input
                        type="checkbox"
                        checked={
                          selected.size === filteredRows.length &&
                          filteredRows.length > 0
                        }
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-800 cursor-pointer"
                      />
                    </div>
                    <div>Document</div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSortBy("category")}
                        className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
                      >
                        Category{" "}
                        {sortBy === "category" && (
                          <ChevronDown className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSortBy("modified")}
                        className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
                      >
                        Modified{" "}
                        {sortBy === "modified" && (
                          <ChevronDown className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSortBy("expiry")}
                        className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
                      >
                        Expiry{" "}
                        {sortBy === "expiry" && (
                          <ChevronDown className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                    <div>Signature</div>
                    <div>Version</div>
                    <div />
                  </div>

                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
                    {filteredRows.map((row) => {
                      const key = tableRowKey(row);
                      return (
                        <DocRow
                          key={key}
                          row={row}
                          selected={selected.has(key)}
                          onSelect={() => toggleSelect(key)}
                          onOpenDrawer={setDrawerRow}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {filteredRows.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center">
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-1.5">
                    No documents found
                  </h3>
                  <p className="text-[13px] text-gray-500 mb-5">
                    {mergedRows.length > 0 ||
                    search ||
                    activeCat !== ALL_CATEGORIES_FILTER ||
                    expiryFilter !== ALL_CATEGORIES_FILTER ||
                    statusFilter !== ALL_CATEGORIES_FILTER
                      ? "Try adjusting your filters, or upload a new document below."
                      : "Drop a file to get started, or click upload."}
                  </p>
                  <div
                    className={`mx-auto max-w-[460px] border-2 border-dashed rounded-lg px-5 py-8 transition-colors cursor-pointer ${dragOver ? "border-gray-700 bg-gray-50" : "border-gray-300"}`}
                    onClick={() => setUploadOpen(true)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-[14px] font-medium text-gray-800">
                      Drop file here
                    </div>
                    <div className="text-[12px] text-gray-400 mt-1 mb-4">
                      or click to browse
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-gray-800 rounded-lg px-3 py-1.5 mx-auto hover:bg-gray-900 transition-colors"
                    >
                      <Upload className="w-3 h-3" /> Upload document
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Drawer */}
          <Drawer
            row={drawerRow}
            onClose={() => setDrawerRow(null)}
            isHR={isHR}
            viewingArchived={showArchived}
            onDownload={handleDrawerDownload}
            onDelete={handleDrawerDelete}
            onSendReminder={handleDrawerSendReminder}
            onShare={handleDrawerShare}
            onArchive={handleDrawerArchive}
            onUnarchive={handleDrawerUnarchive}
            onEditVisibility={() => {
              if (
                drawerRow &&
                drawerRow.listSource === DocumentsListSource.Upload
              ) {
                setEditVisibilityDoc(drawerRow.doc);
              }
            }}
          />

          {/* Edit visibility dialog */}
          <EditVisibilityDialog
            open={editVisibilityDoc !== null}
            doc={editVisibilityDoc}
            onClose={() => setEditVisibilityDoc(null)}
            onSaved={(updated) => {
              setDocs((prev) =>
                prev.map((d) => (d.id === updated.id ? updated : d))
              );
              if (
                drawerRow &&
                drawerRow.listSource === DocumentsListSource.Upload &&
                drawerRow.doc.id === updated.id
              ) {
                setDrawerRow({ ...drawerRow, doc: updated });
              }
            }}
          />

          {/* Upload modal */}
          <UploadModal
            open={uploadOpen}
            onClose={() => {
              setUploadOpen(false);
            }}
            onSuccess={handleUploadSuccess}
            initialValues={undefined}
          />
        </>
      )}

      {/* Template builder */}
      <TemplateBuilder
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setBuilderEditTemplate(undefined);
        }}
        onSaved={() => {
          setBuilderOpen(false);
          setBuilderEditTemplate(undefined);
          setTemplateRefreshSignal((v) => v + 1);
        }}
        editTemplate={builderEditTemplate}
      />

      {/* Template picker */}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onScratch={() => {
          setTemplatePickerOpen(false);
          setUploadOpen(true);
        }}
        onTemplateUsed={(documentId) => {
          setTemplatePickerOpen(false);
          handleTemplateUsed(documentId);
        }}
      />

      {/* Field fill modal — triggered from TemplatesManagement "Use" button */}
      {useTemplateTarget && (
        <FieldFillModal
          open={true}
          template={useTemplateTarget}
          onClose={() => setUseTemplateTarget(null)}
          onSubmit={async (fieldValues, format) => {
            const result = await templatesApi.use(useTemplateTarget.id, {
              fieldValues,
              format,
            });
            setUseTemplateTarget(null);
            handleTemplateUsed(result.documentId);
          }}
        />
      )}
    </div>
  );
}
