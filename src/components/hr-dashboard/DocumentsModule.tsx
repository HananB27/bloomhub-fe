"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Download,
  Upload,
  Search,
  Archive,
  Trash2,
  ChevronDown,
  X,
  FolderOpen,
  PenTool,
} from "lucide-react";
import {
  DocumentCategory,
  SignatureStatus,
  DOCUMENT_CATEGORIES,
  ALL_CATEGORIES_FILTER,
  EXPIRY_FILTER_EXPIRING_SOON,
  EXPIRY_FILTER_EXPIRED,
  DocumentsListSource,
  isHrDocumentUser,
  filterDocumentsByAccess,
  getDocumentUserRole,
  type SessionUserRoleFlags,
} from "@/lib/documents/documentsHelpers";
import { EditVisibilityDialog } from "./documents/EditVisibilityDialog";
import { DocumentAttentionStrips } from "./documents/DocumentAttentionStrips";
import { DocumentDrawer } from "./documents/DocumentDrawer";
import { DocumentStats } from "./documents/DocumentStats";
import { DocumentUploadModal } from "./documents/DocumentUploadModal";
import { DocumentsTableRow } from "./documents/DocumentsTableRow";
import { SignatureDialog } from "./documents/SignatureDialog";
import { SignatureRequestDialog } from "./documents/SignatureRequestDialog";
import {
  type DocumentsTableRowModel,
  filterAndSortTableRows,
  buildMergedTableRows,
  tableRowKey,
  uploadDocumentIdsFromRowKeys,
  downloadGeneratedDocumentHtmlFile,
  DocumentBulkUserMessage,
} from "./documentsModuleHelpers";
import {
  documentsApi,
  type EmployeeDocument,
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

type SortKey = "modified" | "expiry" | "category";

// ─── DocumentsModule ──────────────────────────────────────────────────────────

export function DocumentsModule() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUserRoleFlags | undefined;
  const currentUserEmail =
    typeof (session?.user as { email?: unknown } | undefined)?.email ===
    "string"
      ? ((session?.user as { email: string }).email ?? "").trim().toLowerCase()
      : undefined;
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
  const [signatureRequestDoc, setSignatureRequestDoc] =
    useState<EmployeeDocument | null>(null);
  const [signatureSignDoc, setSignatureSignDoc] =
    useState<EmployeeDocument | null>(null);
  const [reminderDocId, setReminderDocId] = useState<number | null>(null);
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

  const refreshDocuments = useCallback(() => {
    return documentsApi
      .list({ archived: showArchived || undefined })
      .then((results) => setDocs(filterDocumentsByAccess(results, userRole)))
      .catch(() => {
        /* non-critical follow-up refresh */
      });
  }, [showArchived, userRole]);

  const applyDocumentUpdate = useCallback(
    (updated: EmployeeDocument) => {
      if (!updated.id) {
        void refreshDocuments();
        return;
      }
      setDocs((prev) =>
        prev.map((doc) => (doc.id === updated.id ? updated : doc))
      );
      setDrawerRow((prev) => {
        if (
          !prev ||
          prev.listSource !== DocumentsListSource.Upload ||
          prev.doc.id !== updated.id
        ) {
          return prev;
        }
        return { ...prev, doc: updated };
      });
    },
    [refreshDocuments]
  );

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
    setReminderDocId(doc.id);
    try {
      await withNotification(
        documentsApi.sendReminder(doc.id),
        "Sending reminders…",
        "Reminders sent to pending signers",
        "Failed to send reminders"
      );
    } catch {
      // error already shown by withNotification
    } finally {
      setReminderDocId(null);
    }
  }, []);

  const handleSignatureMutationSuccess = useCallback(
    (updated: EmployeeDocument) => {
      applyDocumentUpdate(updated);
      notifySuccess(NotificationMessages.UPDATED_SUCCESS);
      if (!updated.signers.length) void refreshDocuments();
    },
    [applyDocumentUpdate, refreshDocuments]
  );

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

  const handleDrawerRequestSignature = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    setSignatureRequestDoc(drawerRow.doc);
  }, [drawerRow]);

  const handleDrawerSign = useCallback(() => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    setSignatureSignDoc(drawerRow.doc);
  }, [drawerRow]);

  const handleDrawerResetSignatures = useCallback(async () => {
    if (!drawerRow || drawerRow.listSource !== DocumentsListSource.Upload)
      return;
    try {
      const updated = await withNotification(
        documentsApi.resetSignatures(drawerRow.doc.id),
        "Resetting signatures…",
        "Signatures cleared",
        "Failed to reset signatures"
      );
      handleSignatureMutationSuccess(updated);
    } catch {
      // notification handled
    }
  }, [drawerRow, handleSignatureMutationSuccess]);

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

  const requestSignatureForSelection = useCallback(() => {
    const ids = uploadDocumentIdsFromRowKeys(selected);
    if (ids.length !== 1) {
      notifyQuickFeedback(
        ids.length === 0
          ? "Select one uploaded document to request a signature"
          : "Request signatures for one document at a time",
        "info"
      );
      return;
    }
    const doc = docs.find((item) => item.id === ids[0]);
    if (!doc) {
      notifyQuickFeedback(
        DocumentBulkUserMessage.SelectUploadsToDownload,
        "info"
      );
      return;
    }
    setSignatureRequestDoc(doc);
  }, [docs, selected]);

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
              <DocumentStats
                uploadDocs={docs}
                generatedDocsCount={generatedDocs.length}
                isHR={isHR}
              />

              {/* Attention strips */}
              <DocumentAttentionStrips
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
                    <button
                      type="button"
                      onClick={requestSignatureForSelection}
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
                        <DocumentsTableRow
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
          <DocumentDrawer
            row={drawerRow}
            onClose={() => setDrawerRow(null)}
            isHR={isHR}
            currentUserEmail={currentUserEmail}
            viewingArchived={showArchived}
            reminderLoading={
              !!drawerRow &&
              drawerRow.listSource === DocumentsListSource.Upload &&
              reminderDocId === drawerRow.doc.id
            }
            onDownload={handleDrawerDownload}
            onDelete={handleDrawerDelete}
            onSendReminder={handleDrawerSendReminder}
            onSign={handleDrawerSign}
            onRequestSignature={handleDrawerRequestSignature}
            onResetSignatures={handleDrawerResetSignatures}
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

          <SignatureRequestDialog
            open={signatureRequestDoc !== null}
            document={signatureRequestDoc}
            onOpenChange={(open) => {
              if (!open) setSignatureRequestDoc(null);
            }}
            onSuccess={handleSignatureMutationSuccess}
          />

          <SignatureDialog
            open={signatureSignDoc !== null}
            document={signatureSignDoc}
            currentUserEmail={currentUserEmail}
            allowSignerOverride={isHR}
            onOpenChange={(open) => {
              if (!open) setSignatureSignDoc(null);
            }}
            onSuccess={(updated) => {
              applyDocumentUpdate(updated);
              notifySuccess(NotificationMessages.SIGNED_SUCCESS);
              if (!updated.signers.length) void refreshDocuments();
            }}
          />

          {/* Upload modal */}
          <DocumentUploadModal
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
