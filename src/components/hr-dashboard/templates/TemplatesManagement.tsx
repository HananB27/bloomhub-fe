"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  ArrowLeft,
  Lock,
  Users,
  Eye,
  Copy,
  Trash2,
  X,
  AlertTriangle,
  FolderOpen,
  Play,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  TemplateCategory,
  TemplateStatus,
  TemplateVisibility,
  TEMPLATE_CATEGORIES,
  type DocumentTemplate,
  getTemplateCategoryColor,
  getTemplateCategoryLabel,
} from "@/lib/templates/templatesHelpers";
import { templatesApi } from "@/lib/api/modules/templates";
import {
  notifySuccess,
  notifyApiError,
  withNotification,
} from "@/utils/notificationHelpers";
import { formatDate } from "@/utils";

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="w-7 h-7 bg-gray-100 rounded" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-14 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
}: {
  template: DocumentTemplate;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-[90] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[720px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">
              {template.name}
            </h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded mt-1 inline-block ${getTemplateCategoryColor(template.category)}`}
            >
              {getTemplateCategoryLabel(template.category)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className="prose prose-sm max-w-none text-[13.5px] text-gray-800 [&_.tpl-field]:bg-cyan-100 [&_.tpl-field]:text-cyan-800 [&_.tpl-field]:px-1.5 [&_.tpl-field]:py-0.5 [&_.tpl-field]:rounded [&_.tpl-field]:text-[12px] [&_.tpl-field]:font-medium"
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{
              __html:
                template.content ||
                '<span class="text-gray-400 italic">No content</span>',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────

function ActionMenu({
  template,
  onEdit,
  onDuplicate,
  onPreview,
  onToggleStatus,
  onDelete,
}: {
  template: DocumentTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function act(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          {!template.isSystem && (
            <button
              type="button"
              onClick={() => act(onEdit)}
              className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => act(onDuplicate)}
            className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button
            type="button"
            onClick={() => act(onPreview)}
            className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            type="button"
            onClick={() => act(onToggleStatus)}
            className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {template.status === TemplateStatus.Inactive
              ? "Activate"
              : "Deactivate"}
          </button>
          {!template.isSystem && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => act(onDelete)}
                className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onPreview,
  onToggleStatus,
  onDelete,
  onUse,
}: {
  template: DocumentTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onUse: () => void;
}) {
  const catColor = getTemplateCategoryColor(template.category);
  const catLabel = getTemplateCategoryLabel(template.category);

  const statusBadge: Record<TemplateStatus, { label: string; cls: string }> = {
    [TemplateStatus.Draft]: {
      label: "Draft",
      cls: "bg-amber-100 text-amber-800",
    },
    [TemplateStatus.Published]: {
      label: "Published",
      cls: "bg-emerald-100 text-emerald-800",
    },
    [TemplateStatus.Inactive]: {
      label: "Inactive",
      cls: "bg-gray-100 text-gray-600",
    },
  };
  const sb = statusBadge[template.status] ?? statusBadge[TemplateStatus.Draft];

  function creatorInitials(name: string): string {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white hover:border-gray-300 transition-colors flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-gray-900 truncate">
              {template.name}
            </h3>
            {template.isSystem && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500 flex-shrink-0">
                <Lock className="w-3 h-3" /> System template
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-[12.5px] text-gray-500 mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        <ActionMenu
          template={template}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onPreview={onPreview}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded ${catColor}`}
        >
          {catLabel}
        </span>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded ${sb.cls}`}
        >
          {sb.label}
        </span>
        {template.visibility === TemplateVisibility.Private ? (
          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            <Lock className="w-2.5 h-2.5" /> Private
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
            <Users className="w-2.5 h-2.5" /> Shared
          </span>
        )}
        <span className="text-[11.5px] text-gray-400 ml-auto">
          {template.fields.length} dynamic field
          {template.fields.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {template.createdBy && (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-semibold text-gray-700 flex-shrink-0">
              {creatorInitials(template.createdBy)}
            </div>
          )}
          <span className="text-[11.5px] text-gray-400">
            Updated {template.updatedAt ? formatDate(template.updatedAt) : "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={onUse}
          disabled={template.status === TemplateStatus.Inactive}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3 h-3" /> Use
        </button>
      </div>
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  template,
  onConfirm,
  onCancel,
}: {
  template: DocumentTemplate;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-[95] flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[400px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">
              Delete template?
            </h3>
            <p className="text-[13px] text-gray-500 mt-1">
              &ldquo;{template.name}&rdquo; will be permanently deleted. This
              action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TemplatesManagement (main export) ───────────────────────────────────────

export function TemplatesManagement({
  onBack,
  onNewTemplate,
  onEditTemplate,
  onUseTemplate,
  refreshSignal,
}: {
  onBack: () => void;
  onNewTemplate: () => void;
  onEditTemplate: (template: DocumentTemplate) => void;
  onUseTemplate?: (template: DocumentTemplate) => void;
  refreshSignal?: number;
}) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    TemplateCategory | "all"
  >("all");
  const [visibilityFilter, setVisibilityFilter] = useState<
    TemplateVisibility | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "all">(
    "all"
  );

  const [previewTemplate, setPreviewTemplate] =
    useState<DocumentTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(
    null
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTemplates = useCallback(
    async (s: string, cat: string, vis: string, stat: string) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const results = await templatesApi.list({
          search: s || undefined,
          category: cat !== "all" ? (cat as TemplateCategory) : undefined,
          visibility: vis !== "all" ? (vis as TemplateVisibility) : undefined,
          status: stat !== "all" ? (stat as TemplateStatus) : undefined,
        });
        setTemplates(results);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load templates";
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Single effect: immediate fetch on first mount, debounced refetch on filter changes.
  // Consolidated to avoid the duplicate /templates calls that occurred when both an
  // "initial fetch" effect and a filter-deps effect fired on the same mount.
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    const isInitial = isInitialMountRef.current;
    isInitialMountRef.current = false;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (isInitial) {
      void fetchTemplates(
        search,
        categoryFilter,
        visibilityFilter,
        statusFilter
      );
      return;
    }

    debounceRef.current = setTimeout(() => {
      void fetchTemplates(
        search,
        categoryFilter,
        visibilityFilter,
        statusFilter
      );
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, categoryFilter, visibilityFilter, statusFilter, fetchTemplates]);

  // Re-fetch immediately when parent signals a save (create / edit)
  useEffect(() => {
    if (refreshSignal === undefined || refreshSignal === 0) return;
    void fetchTemplates(search, categoryFilter, visibilityFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  async function handleDuplicate(template: DocumentTemplate) {
    try {
      const duped = await withNotification(
        templatesApi.duplicate(template.id),
        "Duplicating template…",
        "Template duplicated",
        "Duplicate failed"
      );
      setTemplates((prev) => [duped, ...prev]);
    } catch {
      // withNotification already showed error
    }
  }

  async function handleToggleStatus(template: DocumentTemplate) {
    const next =
      template.status === TemplateStatus.Inactive
        ? TemplateStatus.Published
        : TemplateStatus.Inactive;
    try {
      const updated = await templatesApi.update(template.id, {
        name: template.name,
        description: template.description,
        category: template.category,
        visibility: template.visibility,
        allowedRoles: template.allowedRoles,
        visibilityScope: template.visibilityScope,
        status: next,
        content: template.content,
        fields: template.fields,
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? updated : t))
      );
      notifySuccess(
        next === TemplateStatus.Inactive
          ? "Template deactivated"
          : "Template activated"
      );
    } catch (err) {
      notifyApiError(
        err instanceof Error
          ? err
          : new Error("Failed to update template status")
      );
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await withNotification(
        templatesApi.delete(id),
        "Deleting template…",
        "Template deleted",
        "Delete failed"
      );
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // withNotification already showed error
    }
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-5">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to documents
          </button>
          <h1 className="text-[22px] font-semibold tracking-tight text-gray-900 leading-tight">
            Document Templates
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Create and manage reusable document templates with dynamic fields
          </p>
        </div>
        <button
          type="button"
          onClick={onNewTemplate}
          className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium text-white bg-gray-800 border border-gray-800 hover:bg-gray-900 transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New template
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) =>
            setCategoryFilter(v as TemplateCategory | "all")
          }
        >
          <SelectTrigger className="h-9 w-[148px] text-[13px] font-medium text-gray-700 border-gray-200 bg-white flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All categories</SelectItem>
            {TEMPLATE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={visibilityFilter}
          onValueChange={(v) =>
            setVisibilityFilter(v as TemplateVisibility | "all")
          }
        >
          <SelectTrigger className="h-9 w-[140px] text-[13px] font-medium text-gray-700 border-gray-200 bg-white flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All visibility</SelectItem>
            <SelectItem value={TemplateVisibility.Private}>Private</SelectItem>
            <SelectItem value={TemplateVisibility.Shared}>Shared</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TemplateStatus | "all")}
        >
          <SelectTrigger className="h-9 w-[140px] text-[13px] font-medium text-gray-700 border-gray-200 bg-white flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={TemplateStatus.Draft}>Draft</SelectItem>
            <SelectItem value={TemplateStatus.Published}>Published</SelectItem>
            <SelectItem value={TemplateStatus.Inactive}>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 flex items-center justify-between">
          <span className="text-[13px] text-red-700">
            Failed to load templates: {loadError}
          </span>
          <button
            type="button"
            onClick={() =>
              fetchTemplates(
                search,
                categoryFilter,
                visibilityFilter,
                statusFilter
              )
            }
            className="text-[13px] font-medium text-red-700 underline hover:text-red-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !loadError && templates.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-[15px] font-semibold text-gray-800 mb-1">
            No templates yet
          </p>
          <p className="text-[13px] text-gray-500 mb-5">
            Create your first template to speed up document generation.
          </p>
          <button
            type="button"
            onClick={onNewTemplate}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create your first template
          </button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !loadError && templates.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => onEditTemplate(template)}
              onDuplicate={() => handleDuplicate(template)}
              onPreview={() => setPreviewTemplate(template)}
              onToggleStatus={() => handleToggleStatus(template)}
              onDelete={() => setDeleteTarget(template)}
              onUse={() => onUseTemplate?.(template)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          template={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
