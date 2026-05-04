import type { EmployeeDocument } from "@/lib/api/modules/documents";
import type { GeneratedDocument } from "@/lib/api/modules/templates";
import {
  DocumentsListSource,
  DocumentCategory,
  SignatureStatus,
  DocumentFileDisplayType,
  ALL_CATEGORIES_FILTER,
  EXPIRY_FILTER_EXPIRING_SOON,
  EXPIRY_FILTER_EXPIRED,
  documentExpiryBucket,
} from "@/lib/documents/documentsHelpers";

export type DocumentsTableSortKey = "modified" | "expiry" | "category";

export interface DocumentsTableRowModel {
  listSource: DocumentsListSource;
  doc: EmployeeDocument;
  generated?: GeneratedDocument;
}

export const DOCUMENT_LIST_GENERATED_SIZE_DISPLAY = "—";

export enum DocumentBulkUserMessage {
  SelectUploadsToDelete = "Select uploaded documents to delete",
  SelectUploadsToArchive = "Select uploaded documents to archive",
  SelectUploadsToDownload = "Select uploaded documents to download",
}

export enum DocumentsDrawerPlaceholder {
  GeneratedAccessRoles = "Not set for generated copies",
  TemplateFieldsEmpty = "No fields",
  TemplatePreviewHint = "Use Preview in the footer to open the full document in a popup.",
  UploadPreviewLoading = "Loading preview…",
  UploadPreviewUnavailable = "Preview is not available for this file.",
  FullPreviewCloseBackdrop = "Close full preview",
}

export const DocumentDrawerPreviewChrome = {
  ModalIframe: "w-full flex-1 min-h-0 border-0 bg-white",
  UploadLoadingFull:
    "flex flex-1 min-h-[50vh] items-center justify-center text-[13px] text-gray-500",
  UploadEmptyFull:
    "flex flex-1 min-h-[50vh] items-center justify-center px-4 text-center text-[13px] text-gray-500",
  FullPreviewOverlay:
    "fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6",
  FullPreviewBackdrop: "absolute inset-0 bg-slate-900/50",
  FullPreviewPanel:
    "relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl h-[min(90vh,820px)]",
  FullPreviewHeader:
    "flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3",
  FullPreviewBody: "flex min-h-0 flex-1 flex-col bg-gray-50 p-2 sm:p-3",
} as const;

export function tableRowKey(row: DocumentsTableRowModel): string {
  return row.listSource === DocumentsListSource.Upload
    ? `u:${row.doc.id}`
    : `g:${String(row.generated?.id ?? "")}`;
}

export function syntheticNumericIdForGenerated(
  generatedId: number | string
): number {
  const s = `g:${String(generatedId)}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  if (h >= 0) h = -h - 1;
  return h === 0 ? -1 : h;
}

function fileDisplayTypeFromGeneratedName(
  name: string
): DocumentFileDisplayType {
  const upper = name.toUpperCase();
  if (upper.includes("PDF")) return "pdf";
  if (upper.includes("DOCX") || upper.includes("DOC")) return "doc";
  return "file";
}

export function buildUploadTableRow(
  doc: EmployeeDocument
): DocumentsTableRowModel {
  return { listSource: DocumentsListSource.Upload, doc };
}

export function buildGeneratedTableRow(
  generated: GeneratedDocument
): DocumentsTableRowModel {
  const id = syntheticNumericIdForGenerated(generated.id);
  const templateIdNum =
    typeof generated.sourceTemplate === "number"
      ? generated.sourceTemplate
      : undefined;
  const doc: EmployeeDocument = {
    id,
    name: generated.name,
    description: "",
    category: DocumentCategory.Other,
    fileType: fileDisplayTypeFromGeneratedName(generated.name),
    fileName: `${generated.name}.html`,
    fileSizeBytes: 0,
    fileSizeDisplay: DOCUMENT_LIST_GENERATED_SIZE_DISPLAY,
    mimeType: "text/html",
    uploadedBy: generated.createdBy,
    uploadedAt: generated.createdAt,
    lastModified: generated.updatedAt || generated.createdAt,
    expiryDate: undefined,
    signatureStatus: SignatureStatus.NotRequired,
    isConfidential: false,
    tags: [],
    allowedRoles: [],
    currentVersion: "1.0",
    versionCount: 1,
    signers: [],
    fromTemplate: true,
    templateId: templateIdNum,
  };
  return {
    listSource: DocumentsListSource.Template,
    doc,
    generated,
  };
}

export function buildMergedTableRows(
  docs: EmployeeDocument[],
  generated: GeneratedDocument[]
): DocumentsTableRowModel[] {
  return [
    ...docs.map(buildUploadTableRow),
    ...generated.map(buildGeneratedTableRow),
  ];
}

export function filterAndSortTableRows(
  rows: DocumentsTableRowModel[],
  options: {
    search: string;
    activeCat: DocumentCategory | typeof ALL_CATEGORIES_FILTER;
    statusFilter: string;
    expiryFilter: string;
    sortBy: DocumentsTableSortKey;
  }
): DocumentsTableRowModel[] {
  let out = rows;

  if (options.search) {
    const q = options.search.toLowerCase();
    out = out.filter((row) => {
      const d = row.doc;
      const gen = row.generated;
      const fieldBlob =
        gen && Object.keys(gen.fieldValues).length > 0
          ? Object.values(gen.fieldValues)
              .map((v) => String(v))
              .join(" ")
              .toLowerCase()
          : "";
      return (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        (gen?.sourceTemplateName ?? "").toLowerCase().includes(q) ||
        fieldBlob.includes(q)
      );
    });
  }

  if (options.activeCat !== ALL_CATEGORIES_FILTER) {
    out = out.filter((row) => row.doc.category === options.activeCat);
  }

  if (options.statusFilter !== ALL_CATEGORIES_FILTER) {
    out = out.filter((row) => row.doc.signatureStatus === options.statusFilter);
  }

  if (options.expiryFilter === EXPIRY_FILTER_EXPIRING_SOON) {
    out = out.filter(
      (row) => documentExpiryBucket(row.doc.expiryDate) === "soon"
    );
  } else if (options.expiryFilter === EXPIRY_FILTER_EXPIRED) {
    out = out.filter(
      (row) => documentExpiryBucket(row.doc.expiryDate) === "expired"
    );
  }

  out = [...out].sort((a, b) => {
    if (options.sortBy === "modified")
      return (
        new Date(b.doc.lastModified).getTime() -
        new Date(a.doc.lastModified).getTime()
      );
    if (options.sortBy === "expiry")
      return (
        new Date(a.doc.expiryDate || "2999").getTime() -
        new Date(b.doc.expiryDate || "2999").getTime()
      );
    return a.doc.category.localeCompare(b.doc.category);
  });

  return out;
}

export function uploadDocumentIdsFromRowKeys(keys: Iterable<string>): number[] {
  const ids: number[] = [];
  for (const k of keys) {
    if (k.startsWith("u:")) {
      const n = Number(k.slice(2));
      if (Number.isFinite(n)) ids.push(n);
    }
  }
  return ids;
}

function fullHtmlDocumentFromGenerated(doc: GeneratedDocument): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${doc.name}</title></head><body>${doc.resolvedContent ?? ""}</body></html>`;
}

export function generatedDocumentPreviewHtml(doc: GeneratedDocument): string {
  return fullHtmlDocumentFromGenerated(doc);
}

export function downloadGeneratedDocumentHtmlFile(
  doc: GeneratedDocument
): void {
  const safeName = doc.name.replace(/[/\\?%*:|"<>]/g, "-");
  const blob = new Blob([fullHtmlDocumentFromGenerated(doc)], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openGeneratedDocumentPreviewTab(doc: GeneratedDocument): void {
  const blob = new Blob([generatedDocumentPreviewHtml(doc)], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export function generatedDocumentFieldTags(
  fieldValues: Record<string, string | boolean | number>
): string[] {
  return Object.entries(fieldValues).map(
    ([key, value]) => `${key}: ${String(value)}`
  );
}
