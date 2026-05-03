"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Eye, FileText } from "lucide-react";
import {
  TemplateCategory,
  TEMPLATE_CATEGORIES,
  type DocumentTemplate,
  type UseTemplatePayload,
  type TemplateOutputFormat,
  getTemplateCategoryColor,
  getTemplateCategoryLabel,
} from "@/lib/templates/templatesHelpers";
import { templatesApi } from "@/lib/api/modules/templates";
import { notifySuccess, notifyApiError } from "@/utils/notificationHelpers";
import { FieldRenderer } from "./FieldComponents";

// ─── PreviewModal ─────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: DocumentTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-[85] flex items-center justify-center p-6"
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
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              onUse();
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors"
          >
            Use this template
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document download helper ─────────────────────────────────────────────────

/**
 * Wrap resolved HTML in a print-ready HTML document and trigger a browser
 * download.  Called after a successful template.use() API call so the user
 * always gets a concrete file (HTML that prints to PDF or opens as DOCX).
 */
export function downloadGeneratedDocument(
  resolvedContent: string,
  templateName: string,
  format: TemplateOutputFormat
): void {
  const safeName = templateName.replace(/[/\\?%*:|"<>]/g, "-");
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${templateName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.7;
      max-width: 210mm;
      margin: 20mm auto;
      padding: 0 10mm;
      color: #111827;
    }
    h1 { font-size: 20pt; font-weight: 700; margin: 12pt 0 6pt; }
    h2 { font-size: 16pt; font-weight: 700; margin: 10pt 0 4pt; }
    h3 { font-size: 13pt; font-weight: 700; margin: 8pt 0 4pt; }
    strong, b { font-weight: 700; }
    em, i { font-style: italic; }
    ul, ol { margin: 6pt 0; padding-left: 24pt; }
    li { margin: 2pt 0; }
    hr { border: none; border-top: 1pt solid #6b7280; margin: 14pt 0; }
    a { color: #1d4ed8; }
    .tpl-field { font-weight: 700; }
    @media print { body { margin: 0; padding: 10mm; } }
  </style>
</head>
<body>${resolvedContent || "<p><em>No content</em></p>"}</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Always download as HTML — can be printed to PDF directly from the browser.
  a.download = `${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── FieldFillModal ───────────────────────────────────────────────────────────

const FORMAT_OPTIONS: {
  value: TemplateOutputFormat;
  label: string;
  ext: string;
}[] = [
  { value: "pdf", label: "PDF", ext: ".pdf" },
  { value: "docx", label: "Word (DOCX)", ext: ".docx" },
];

export function FieldFillModal({
  open,
  template,
  onClose,
  onSubmit,
}: {
  open: boolean;
  template: DocumentTemplate;
  onClose: () => void;
  onSubmit: (
    fieldValues: Record<string, string | boolean | number>,
    format: TemplateOutputFormat
  ) => Promise<void>;
}) {
  const [values, setValues] = useState<
    Record<string, string | boolean | number>
  >({});
  const [format, setFormat] = useState<TemplateOutputFormat>("pdf");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      const defaults: Record<string, string | boolean | number> = {};
      template.fields.forEach((f) => {
        defaults[f.key] = f.defaultValue ?? "";
      });
      setValues(defaults);
      setErrors([]);
      setFormat("pdf");
    }
  }, [open, template]);

  function setFieldValue(key: string, value: string | boolean | number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const missing = template.fields
      .filter((f) => {
        if (!f.required) return false;
        const v = values[f.key];
        return v === undefined || String(v).trim() === "" || v === false;
      })
      .map((f) => f.label);
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit(values, format);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const hasFields = template.fields.length > 0;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-[85] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[560px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">
              Create document
            </h3>
            <p className="text-[13px] text-gray-500 mt-0.5">
              From template:{" "}
              <span className="font-medium text-gray-700">{template.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Output format picker — always shown */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-2">
              Output format
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`px-5 py-2 text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                    format === opt.value
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                  <span
                    className={`text-[11px] font-mono ${format === opt.value ? "text-gray-300" : "text-gray-400"}`}
                  >
                    {opt.ext}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
              Please fill in required fields:{" "}
              <strong>{errors.join(", ")}</strong>
            </div>
          )}

          {/* Template fields */}
          {hasFields && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Template fields
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              {template.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.key] ?? ""}
                  onChange={(v) => setFieldValue(field.key, v)}
                  disabled={submitting}
                />
              ))}
            </div>
          )}

          {!hasFields && (
            <p className="text-[13px] text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
              This template has no dynamic fields — the document will be
              generated exactly as designed.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-9 px-5 rounded-lg text-[13px] font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Create document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template card (picker context) ──────────────────────────────────────────

function PickerCard({
  template,
  onPreview,
  onUse,
}: {
  template: DocumentTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const catColor = getTemplateCategoryColor(template.category);
  const catLabel = getTemplateCategoryLabel(template.category);

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors flex flex-col gap-3">
      <div>
        <h3 className="text-[13.5px] font-semibold text-gray-900 mb-1">
          {template.name}
        </h3>
        {template.description && (
          <p className="text-[12px] text-gray-500 line-clamp-2">
            {template.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded ${catColor}`}
        >
          {catLabel}
        </span>
        <span className="text-[11.5px] text-gray-400 ml-auto">
          {template.fields.length} field
          {template.fields.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-3 h-3" /> Preview
        </button>
        <button
          type="button"
          onClick={onUse}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors ml-auto"
        >
          Use
        </button>
      </div>
    </div>
  );
}

// ─── "Start from scratch" card ────────────────────────────────────────────────

function ScratchCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2 min-h-[140px]"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <FileText className="w-5 h-5 text-gray-400" />
      </div>
      <div>
        <p className="text-[13.5px] font-semibold text-gray-700">
          Start from scratch
        </p>
        <p className="text-[12px] text-gray-400 mt-0.5">
          Upload or create a blank document
        </p>
      </div>
    </button>
  );
}

// ─── TemplatePicker (main export) ────────────────────────────────────────────

export function TemplatePicker({
  open,
  onClose,
  onScratch,
  onTemplateUsed,
}: {
  open: boolean;
  onClose: () => void;
  onScratch: () => void;
  onTemplateUsed: (documentId: number | string) => void;
}) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | "all"
  >("all");

  const [previewTemplate, setPreviewTemplate] =
    useState<DocumentTemplate | null>(null);
  const [fillTemplate, setFillTemplate] = useState<DocumentTemplate | null>(
    null
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTemplates = useCallback(async (s: string, cat: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const results = await templatesApi.list({
        search: s || undefined,
        category: cat !== "all" ? (cat as TemplateCategory) : undefined,
      });
      setTemplates(results);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load templates"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on open
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setActiveCategory("all");
    void fetchTemplates("", "all");
  }, [open, fetchTemplates]);

  // Debounced refetch on search / category
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchTemplates(search, activeCategory);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, activeCategory, open, fetchTemplates]);

  function handleUseTemplate(template: DocumentTemplate) {
    if (template.fields.length > 0) {
      setFillTemplate(template);
    } else {
      void generateFromTemplateWithoutFields(template);
    }
  }

  async function generateFromTemplateWithoutFields(template: DocumentTemplate) {
    try {
      const payload: UseTemplatePayload = { fieldValues: {}, format: "pdf" };
      const result = await templatesApi.use(template.id, payload);
      notifySuccess("Document saved to Documents", {
        description: template.name,
      });
      onTemplateUsed(result.documentId);
      onClose();
    } catch (err) {
      notifyApiError(
        err instanceof Error
          ? err
          : new Error("Failed to create document from template")
      );
    }
  }

  async function handleFieldSubmit(
    fieldValues: Record<string, string | boolean | number>,
    format: TemplateOutputFormat
  ) {
    if (!fillTemplate) return;
    const result = await templatesApi.use(fillTemplate.id, {
      fieldValues,
      format,
    });
    notifySuccess("Document saved to Documents", {
      description: fillTemplate.name,
    });
    setFillTemplate(null);
    onTemplateUsed(result.documentId);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/50 z-[75] flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl w-full max-w-[900px] flex flex-col shadow-2xl max-h-[80vh] my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">
                Start from a template
              </h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Choose a template or start with a blank document
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter row */}
          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors"
              />
            </div>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`inline-flex items-center h-7 px-2.5 rounded-full text-[12px] font-medium border transition-colors ${activeCategory === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
              >
                All
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setActiveCategory(cat.value)}
                  className={`inline-flex items-center h-7 px-2.5 rounded-full text-[12px] font-medium border transition-colors ${activeCategory === cat.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-4 animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && loadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-[13px] text-red-700">
                Failed to load templates: {loadError}
              </div>
            )}

            {!isLoading && !loadError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ScratchCard
                  onClick={() => {
                    onClose();
                    onScratch();
                  }}
                />
                {templates.map((template) => (
                  <PickerCard
                    key={template.id}
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            setPreviewTemplate(null);
            handleUseTemplate(previewTemplate);
          }}
        />
      )}

      {/* Field fill modal */}
      {fillTemplate && (
        <FieldFillModal
          open={Boolean(fillTemplate)}
          template={fillTemplate}
          onClose={() => setFillTemplate(null)}
          onSubmit={handleFieldSubmit}
        />
      )}
    </>
  );
}
