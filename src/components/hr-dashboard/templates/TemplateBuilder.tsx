"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  AlertTriangle,
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Image as ImageIcon,
  Type,
  Undo2,
  Redo2,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Link2Off,
  Table,
  LayoutTemplate,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  FileUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DatePicker } from "../DatePicker";
import {
  TemplateCategory,
  TemplateFieldType,
  TemplateStatus,
  TemplateVisibility,
  TEMPLATE_CATEGORIES,
  FIELD_TYPE_OPTIONS,
  TEMPLATE_FIELD_TYPE_LABELS,
  type DocumentTemplate,
  type TemplateField,
  type TemplatePayload,
  extractPlaceholders,
  labelToKey,
  generateFieldId,
  mergeTemplateFieldsFromPlaceholders,
  getTemplateCategoryColor,
  getTemplateCategoryLabel,
} from "@/lib/templates/templatesHelpers";
import {
  presetFromVisibility,
  visibilityFromPreset,
  type DocumentVisibilitySettings,
} from "@/lib/documents/documentVisibilityPresets";
import { documentVisibilityLabel } from "@/lib/documents/documentVisibilityHelpers";
import { DocumentVisibilitySelector } from "../documents/DocumentVisibilitySelector";
import { templatesApi } from "@/lib/api/modules/templates";
import {
  templateSnippetsApi,
  type UserTemplateSnippetDto,
} from "@/lib/api/modules/templateSnippets";
import {
  loadLocalUserSnippets,
  saveLocalUserSnippets,
  loadBuiltinSnippetOverrides,
} from "@/lib/templateSnippets/userTemplateSnippetsStorage";
import { TemplateSnippetsManageDialog } from "./TemplateSnippetsManageDialog";
import {
  DOCUMENT_EDITOR_DEFAULT_FONT,
  DOCUMENT_EDITOR_DEFAULT_PAGE_BG,
  DOCUMENT_EDITOR_DEFAULT_TEXT_COLOR,
  FONT_FAMILY_OPTIONS,
  TEMPLATE_EDITOR_SNIPPETS,
  applyBuiltinSnippetOverrides,
  TPL_FIELD_DEFAULT_FONT_WEIGHT,
  buildTableHtml,
  buildTableWithHeaderHtml,
  combineTplFieldTextDecoration,
  getTplFieldSpansInSelection,
  nearestAlignableBlockContainer,
  normalizeLinkUrl,
  plainTextToSanitizedHtml,
  previewTemplateHtml,
  sanitizePastedHtml,
  sanitizeImportedHtml,
  wrapEditorContentWithBodyStyles,
  unwrapEditorContent,
  extractDocxParagraphAlignments,
  applyDocxAlignmentsToHtml,
  ensureSelectionInsideEditor,
  insertTrustedHtmlFragmentAtCaret,
  nodeIsInsideEditorRoot,
  normalizeTplFieldCaretAnchors,
  resolveCaretRangeForInsert,
  materializePlainPlaceholdersInEditor,
  sortTemplateFieldsForPicker,
  syncTplFieldBlocksTextAlign,
  TEMPLATE_EDITOR_CARET_ANCHOR,
  TPL_FIELD_CHIP_INLINE_STYLE,
  TemplateEditorTextAlign,
  type TemplateEditorTextAlignValue,
} from "./templateEditorHelpers";
import {
  notifySuccess,
  notifyApiError,
  notifyWarning,
} from "@/utils/notificationHelpers";

// ─── State shape ──────────────────────────────────────────────────────────────

interface BuilderState {
  name: string;
  description: string;
  category: TemplateCategory | "";
  /** Legacy private/shared flag — derived from visibilitySettings on save. */
  visibility: TemplateVisibility;
  visibilitySettings: DocumentVisibilitySettings;
  status: TemplateStatus;
  content: string;
  fields: TemplateField[];
  /**
   * Page-level body styles. Lifted out of Step 2 so they survive navigation
   * to Step 4 (Review) and round-trip through save / load. Per-element styles
   * still live inline inside `content`.
   */
  bodyFontFamily: string;
  bodyBackgroundColor: string;
}

const DEFAULT_TEMPLATE_VISIBILITY: DocumentVisibilitySettings =
  visibilityFromPreset("hr_and_above");

const EMPTY_STATE: BuilderState = {
  name: "",
  description: "",
  category: "",
  visibility: TemplateVisibility.Private,
  visibilitySettings: DEFAULT_TEMPLATE_VISIBILITY,
  status: TemplateStatus.Draft,
  content: "",
  fields: [],
  bodyFontFamily: DOCUMENT_EDITOR_DEFAULT_FONT,
  bodyBackgroundColor: DOCUMENT_EDITOR_DEFAULT_PAGE_BG,
};

const DRAFT_STORAGE_KEY = "bloomhub_template_draft";

// ─── Step 1 — Metadata ────────────────────────────────────────────────────────

function TemplateBuilderStep1({
  state,
  onChange,
}: {
  state: BuilderState;
  onChange: (patch: Partial<BuilderState>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
          Template name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Employment Agreement"
          className="h-10 w-full px-3 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors"
          style={{ color: "#111827" }}
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
          Description
        </label>
        <textarea
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What is this template for?"
          rows={3}
          className="w-full px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-gray-400 transition-colors resize-none"
          style={{ color: "#111827" }}
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-800 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <Select
          value={state.category || undefined}
          onValueChange={(v) => onChange({ category: v as TemplateCategory })}
        >
          <SelectTrigger className="h-10 w-full text-[13px] font-medium text-gray-900 bg-white border-gray-200">
            <SelectValue placeholder="Select category…" />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-white border-gray-200">
            {TEMPLATE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-gray-800 mb-2">
          Visibility
        </label>
        <DocumentVisibilitySelector
          value={state.visibilitySettings}
          onChange={(visibilitySettings) => onChange({ visibilitySettings })}
          density="compact"
        />
      </div>
    </div>
  );
}

// ─── Field-click preview input (type-aware sample value widget) ───────────────

function PreviewInput({
  type,
  value,
  options,
  onChange,
}: {
  type: TemplateFieldType;
  value: string | boolean | number;
  options: string;
  onChange: (v: string | boolean | number) => void;
}) {
  const cls =
    "h-8 w-full px-2.5 text-[13px] text-gray-900 border border-gray-200 rounded-md outline-none focus:border-cyan-400 transition-colors bg-white";

  if (type === TemplateFieldType.Date) {
    return (
      <DatePicker
        mode="single"
        value={String(value ?? "")}
        onChange={(d) => onChange(d)}
        placeholder="Pick a date…"
        size="compact"
        floatPortal
      />
    );
  }
  if (type === TemplateFieldType.Number) {
    return (
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`${cls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
    );
  }
  if (type === TemplateFieldType.Dropdown) {
    const opts = options
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      >
        <option value="">— pick option —</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (type === TemplateFieldType.Checkbox) {
    const checked = value === true || value === "true";
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            checked ? "bg-cyan-600 border-cyan-600" : "bg-white border-gray-300"
          }`}
        >
          {checked && (
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
        <span className="text-[12px] text-gray-600">
          {checked ? "Checked" : "Unchecked"}
        </span>
      </div>
    );
  }
  // Text / UserSelect
  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Sample value…"
      className={cls}
    />
  );
}

// ─── FieldEditTarget ──────────────────────────────────────────────────────────

interface FieldEditTarget {
  span: HTMLElement;
  field: TemplateField;
  x: number; // viewport left of the span
  y: number; // viewport bottom (show below) OR top (show above)
  above: boolean; // true → anchor popup above the span
}

interface SelectionBookmark {
  path: number[];
  offset: number;
}

const SORTED_FIELD_TYPE_OPTIONS = [...FIELD_TYPE_OPTIONS].sort((a, b) =>
  a.label.localeCompare(b.label, undefined, {
    sensitivity: "base",
    numeric: true,
  })
);

function normalizeFontFamilyForMatch(value: string): string {
  return value.replace(/["']/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function ToolbarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-col items-start gap-1">
      <span className="pl-1 text-[9px] font-semibold uppercase leading-none tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex min-h-8 items-center gap-1">{children}</div>
    </div>
  );
}

function TemplateEditorContentStyles() {
  return (
    <style>{`
      .template-editor .tpl-field {
        cursor: pointer;
        transition: box-shadow 0.12s, filter 0.12s;
      }
      .template-editor .tpl-field:hover {
        filter: brightness(0.93);
        box-shadow: 0 0 0 2px rgba(31, 41, 55, 0.35);
      }
      .template-editor-preview .tpl-field {
        cursor: default !important;
        pointer-events: none;
      }
      .template-editor-preview .tpl-field:hover {
        filter: none !important;
        box-shadow: none !important;
      }
      /* Alignment classes applied during .docx import (from <w:jc>) */
      .template-editor .dx-center { text-align: center; }
      .template-editor .dx-right  { text-align: right; }
      .template-editor .dx-justify { text-align: justify; }
      .template-editor .dx-left   { text-align: left; }
      /* Word-like rhythm for headings + paragraphs in the editor.
         Sized conservatively so that a Word "Heading 1" paragraph imported
         from a contract (often just a bold-underlined run, not a real H1)
         doesn't blow up to banner size. */
      .template-editor h1 { font-size: 13pt; font-weight: 700; margin: 12px 0 6px; line-height: 1.3; }
      .template-editor h2 { font-size: 12pt; font-weight: 700; margin: 10px 0 4px; line-height: 1.3; }
      .template-editor h3 { font-size: 12pt; font-weight: 700; margin: 8px 0 4px;  line-height: 1.3; }
      .template-editor h4 { font-size: 11pt; font-weight: 700; margin: 6px 0 4px;  line-height: 1.3; }
      .template-editor p  { margin: 0 0 8px; }
      .template-editor ul, .template-editor ol { margin: 0 0 8px; padding-left: 1.6em; }
      .template-editor ul ul, .template-editor ol ol, .template-editor ul ol, .template-editor ol ul {
        margin-bottom: 0;
      }
      .template-editor li { margin: 0 0 4px; }
      .template-editor u  { text-decoration: underline; }
    `}</style>
  );
}

function TemplateBuilderStep2({
  state,
  onContentChange,
  onFieldsChange,
  onChange,
}: {
  state: BuilderState;
  onContentChange: (html: string) => void;
  onFieldsChange: (fields: TemplateField[]) => void;
  onChange: (patch: Partial<BuilderState>) => void;
}) {
  // Body styles live on BuilderState so they survive step navigation and are
  // saved with the template — Step 4 reads them for the preview.
  const editorBgColor = state.bodyBackgroundColor;
  const setEditorBgColor = (next: string) =>
    onChange({ bodyBackgroundColor: next });
  const editorFontFamily = state.bodyFontFamily;
  const setEditorFontFamily = (next: string) =>
    onChange({ bodyFontFamily: next });
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [fieldPanelOpen, setFieldPanelOpen] = useState(false);
  const [newFieldMode, setNewFieldMode] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<TemplateFieldType>(
    TemplateFieldType.Text
  );
  const fieldPanelRef = useRef<HTMLDivElement>(null);
  const fieldPanelBtnRef = useRef<HTMLButtonElement>(null);
  const [fieldPanelPos, setFieldPanelPos] = useState({
    x: 0,
    y: 0,
    above: false,
  });
  const newFieldInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState("");
  const [textColor, setTextColor] = useState(
    DOCUMENT_EDITOR_DEFAULT_TEXT_COLOR
  );
  const [highlightColor, setHighlightColor] = useState("#ffffff");
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  // ─ Field click popup ────────────────────────────────────────────────────────
  const [fieldEditTarget, setFieldEditTarget] =
    useState<FieldEditTarget | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingType, setEditingType] = useState<TemplateFieldType>(
    TemplateFieldType.Text
  );
  const [previewValue, setPreviewValue] = useState<string | boolean | number>(
    ""
  );
  const fieldPopupRef = useRef<HTMLDivElement>(null);
  // ─ Chip styling state (mirrors the clicked span's inline styles) ────────────
  const [chipFontFamily, setChipFontFamily] = useState("");
  const [chipFontSize, setChipFontSize] = useState("13");
  const [chipTextColor, setChipTextColor] = useState("#0e7490");
  const [chipBgColor, setChipBgColor] = useState("#cffafe");
  const [chipBold, setChipBold] = useState(false);
  const [chipItalic, setChipItalic] = useState(false);
  // Block-level styling (applied to the chip's parent paragraph / heading / list-item)
  const [chipBlockAlign, setChipBlockAlign] = useState<
    "" | "left" | "center" | "right" | "justify"
  >("");
  // ─ Chip-popup font dropdown ─────────────────────────────────────────────────
  const [chipFontDropdownOpen, setChipFontDropdownOpen] = useState(false);
  const [chipFontDropdownPos, setChipFontDropdownPos] = useState({
    x: 0,
    y: 0,
  });
  const chipFontBtnRef = useRef<HTMLButtonElement>(null);
  const chipFontDropdownRef = useRef<HTMLDivElement>(null);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [snippetMenuOpen, setSnippetMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const snippetMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const [userSnippets, setUserSnippets] = useState<UserTemplateSnippetDto[]>(
    []
  );
  const [builtinOverrides, setBuiltinOverrides] = useState<
    Record<string, { label: string; html: string }>
  >({});
  const [snippetsManageOpen, setSnippetsManageOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  // ─ History stack for undo / redo ────────────────────────────────────────────
  const historyStack = useRef<string[]>([]);
  const historySelectionStack = useRef<Array<SelectionBookmark | null>>([]);
  const historyIndex = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const onContentChangeRef = useRef(onContentChange);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = state.content;
      materializePlainPlaceholdersInEditor(editorRef.current);
      normalizeTplFieldCaretAnchors(editorRef.current);
      const initialHtml = editorRef.current.innerHTML;
      onContentChange(initialHtml);
      // Seed the history stack so undo is available from the first change
      historyStack.current = [initialHtml];
      historySelectionStack.current = [null];
      historyIndex.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    return () => {
      if (el) {
        materializePlainPlaceholdersInEditor(el);
        normalizeTplFieldCaretAnchors(el);
        onContentChangeRef.current(el.innerHTML);
      }
    };
  }, []);

  useEffect(() => {
    const mountEditor = editorRef.current;
    if (!mountEditor) return;
    function onSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const r = sel.getRangeAt(0);
      if (nodeIsInsideEditorRoot(mountEditor, r.commonAncestorContainer)) {
        savedRangeRef.current = r.cloneRange();
      }
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    templateSnippetsApi
      .list()
      .then((rows) => {
        if (!cancelled) {
          setUserSnippets(rows);
          saveLocalUserSnippets(rows);
        }
      })
      .catch(() => {
        if (!cancelled) setUserSnippets(loadLocalUserSnippets());
      });
    setBuiltinOverrides(loadBuiltinSnippetOverrides());
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-read overrides whenever the manage dialog closes (so picker reflects edits)
  useEffect(() => {
    if (!snippetsManageOpen) {
      setBuiltinOverrides(loadBuiltinSnippetOverrides());
    }
  }, [snippetsManageOpen]);

  // Auto-focus the label input when new-field form opens
  useEffect(() => {
    if (newFieldMode && newFieldInputRef.current) {
      // Small timeout so the element is fully rendered before focus
      setTimeout(() => newFieldInputRef.current?.focus(), 0);
    }
  }, [newFieldMode]);

  // Close field panel on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        fieldPanelOpen &&
        fieldPanelRef.current &&
        !fieldPanelRef.current.contains(e.target as Node)
      ) {
        setFieldPanelOpen(false);
        setNewFieldMode(false);
        setNewFieldLabel("");
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [fieldPanelOpen]);

  // Close font dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        fontDropdownOpen &&
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(e.target as Node)
      ) {
        setFontDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [fontDropdownOpen]);

  useEffect(() => {
    if (!snippetMenuOpen && !tableMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (
        snippetMenuOpen &&
        snippetMenuRef.current &&
        !snippetMenuRef.current.contains(t)
      ) {
        setSnippetMenuOpen(false);
      }
      if (
        tableMenuOpen &&
        tableMenuRef.current &&
        !tableMenuRef.current.contains(t)
      ) {
        setTableMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [snippetMenuOpen, tableMenuOpen]);

  // Sync local editing + style state whenever a new field chip is clicked
  useEffect(() => {
    if (!fieldEditTarget) return;
    const { field, span } = fieldEditTarget;
    setEditingLabel(field.label);
    setEditingType(field.type);
    setPreviewValue(field.defaultValue ?? "");
    // Read current inline styles from the span so controls start at the right values
    const s = span.style;
    const chipFont = s.fontFamily || "";
    const matchingFont = FONT_FAMILY_OPTIONS.find(
      (opt) =>
        normalizeFontFamilyForMatch(opt.value) ===
        normalizeFontFamilyForMatch(chipFont)
    );
    setChipFontFamily(matchingFont?.value ?? chipFont);
    setChipFontSize(s.fontSize ? s.fontSize.replace(/[^0-9.]/g, "") : "13");
    setChipTextColor(s.color || "#0e7490");
    setChipBgColor(s.backgroundColor || "#cffafe");
    setChipBold(s.fontWeight === "bold" || s.fontWeight === "700");
    setChipItalic(s.fontStyle === "italic");
    // Read parent block element so the popup reflects line-level state
    const editor = editorRef.current;
    const block = editor ? nearestAlignableBlockContainer(span, editor) : null;
    if (block) {
      const blockAlign = (block.style.textAlign || "").toLowerCase();
      const cls = block.classList;
      const fromClass = cls.contains("dx-center")
        ? "center"
        : cls.contains("dx-right")
          ? "right"
          : cls.contains("dx-justify")
            ? "justify"
            : cls.contains("dx-left")
              ? "left"
              : "";
      setChipBlockAlign(
        ((blockAlign || fromClass) as
          | ""
          | "left"
          | "center"
          | "right"
          | "justify") || ""
      );
    } else {
      setChipBlockAlign("");
    }
    setChipFontDropdownOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldEditTarget?.field.key]);

  // Keep the field-edit popup anchored to its chip on every animation frame.
  // The chip can move when the user changes the chip's font/size/style or when
  // the editor reflows; without this, the popup would drift or end up
  // off-screen relative to the chip and the page might appear to "jump".
  useEffect(() => {
    if (!fieldEditTarget) return;
    const span = fieldEditTarget.span;
    let raf = 0;
    const POPUP_WIDTH = 292;
    const MARGIN = 8;
    const VIEWPORT_BOTTOM_BUFFER = 360;
    function reposition() {
      const popup = fieldPopupRef.current;
      if (!popup || !span.isConnected) {
        raf = requestAnimationFrame(reposition);
        return;
      }
      const rect = span.getBoundingClientRect();
      const above = window.innerHeight - rect.bottom < VIEWPORT_BOTTOM_BUFFER;
      const left = Math.max(
        MARGIN,
        Math.min(rect.left, window.innerWidth - POPUP_WIDTH - MARGIN)
      );
      popup.style.left = `${left}px`;
      if (above) {
        popup.style.top = "auto";
        popup.style.bottom = `${window.innerHeight - rect.top + 6}px`;
      } else {
        popup.style.bottom = "auto";
        popup.style.top = `${rect.bottom + 6}px`;
      }
      raf = requestAnimationFrame(reposition);
    }
    raf = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(raf);
  }, [fieldEditTarget]);

  // Close field popup when clicking outside both the popup and .tpl-field spans
  useEffect(() => {
    if (!fieldEditTarget) return;
    function handleOutside(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (
        fieldPopupRef.current &&
        !fieldPopupRef.current.contains(t) &&
        !(
          chipFontDropdownRef.current && chipFontDropdownRef.current.contains(t)
        ) &&
        !t.closest(".tpl-field")
      ) {
        setFieldEditTarget(null);
        setChipFontDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [fieldEditTarget]);

  // Close chip font dropdown on outside click
  useEffect(() => {
    if (!chipFontDropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (
        chipFontDropdownRef.current &&
        chipFontDropdownRef.current.contains(t)
      ) {
        return;
      }
      setChipFontDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [chipFontDropdownOpen]);

  // ─── Selection helpers ──────────────────────────────────────────────────────

  function saveSelection() {
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (sel && sel.rangeCount > 0 && editor) {
      const range = sel.getRangeAt(0);
      if (nodeIsInsideEditorRoot(editor, range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }

  function restoreSelectionToEditor() {
    const editor = editorRef.current;
    editor?.focus();
    const range = savedRangeRef.current;
    if (
      range &&
      editor &&
      nodeIsInsideEditorRoot(editor, range.commonAncestorContainer)
    ) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      try {
        sel?.addRange(range);
      } catch {
        savedRangeRef.current = null;
      }
    }
  }

  function getNodePathFromEditor(editor: HTMLElement, node: Node): number[] {
    const path: number[] = [];
    let current: Node | null = node;
    while (current && current !== editor) {
      const parent: Node | null = current.parentNode;
      if (!parent) return [];
      path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
      current = parent;
    }
    return current === editor ? path : [];
  }

  function getNodeByPathFromEditor(
    editor: HTMLElement,
    path: number[]
  ): Node | null {
    let current: Node = editor;
    for (const index of path) {
      const next = current.childNodes[index];
      if (!next) return null;
      current = next;
    }
    return current;
  }

  function getCurrentSelectionBookmark(): SelectionBookmark | null {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return null;
    if (!nodeIsInsideEditorRoot(editor, range.commonAncestorContainer)) {
      return null;
    }
    return {
      path: getNodePathFromEditor(editor, range.startContainer),
      offset: range.startOffset,
    };
  }

  function restoreSelectionBookmark(
    editor: HTMLElement,
    bookmark: SelectionBookmark | null
  ): boolean {
    if (!bookmark) return false;
    const node = getNodeByPathFromEditor(editor, bookmark.path);
    if (!node || !nodeIsInsideEditorRoot(editor, node)) return false;
    const maxOffset =
      node.nodeType === Node.TEXT_NODE
        ? (node.textContent ?? "").length
        : node.childNodes.length;
    const range = document.createRange();
    try {
      range.setStart(node, Math.min(bookmark.offset, maxOffset));
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      savedRangeRef.current = range.cloneRange();
      return true;
    } catch {
      return false;
    }
  }

  function pushToHistory(html: string) {
    const stack = historyStack.current;
    const selections = historySelectionStack.current;
    const idx = historyIndex.current;
    const bookmark = getCurrentSelectionBookmark();
    if (stack[idx] === html) {
      selections[idx] = bookmark;
      return; // no net change
    }
    // Discard any redo branch
    stack.splice(idx + 1);
    selections.splice(idx + 1);
    stack.push(html);
    selections.push(bookmark);
    if (stack.length > 100) {
      stack.shift();
      selections.shift();
    }
    historyIndex.current = stack.length - 1;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  }

  // debouncedHistory=true groups rapid keystrokes into one history entry (600 ms idle)
  function pushEditorContent(debouncedHistory = false) {
    const ed = editorRef.current;
    if (!ed) {
      onContentChange("");
      return;
    }
    materializePlainPlaceholdersInEditor(ed);
    normalizeTplFieldCaretAnchors(ed);
    ensureSelectionInsideEditor(ed);
    const html = ed.innerHTML;
    onContentChange(html);
    if (debouncedHistory) {
      if (historyPushTimerRef.current)
        clearTimeout(historyPushTimerRef.current);
      historyPushTimerRef.current = setTimeout(() => pushToHistory(html), 600);
    } else {
      if (historyPushTimerRef.current)
        clearTimeout(historyPushTimerRef.current);
      pushToHistory(html);
    }
  }

  function undo() {
    // Flush any pending debounced push so the very latest state is in the stack
    if (historyPushTimerRef.current) {
      clearTimeout(historyPushTimerRef.current);
      historyPushTimerRef.current = null;
      const ed = editorRef.current;
      if (ed) pushToHistory(ed.innerHTML);
    }
    const idx = historyIndex.current;
    if (idx <= 0) return;
    const newIdx = idx - 1;
    historyIndex.current = newIdx;
    const html = historyStack.current[newIdx];
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      normalizeTplFieldCaretAnchors(editorRef.current);
      if (
        !restoreSelectionBookmark(
          editorRef.current,
          historySelectionStack.current[newIdx]
        )
      ) {
        ensureSelectionInsideEditor(editorRef.current);
      }
    }
    onContentChangeRef.current(html);
    setCanUndo(newIdx > 0);
    setCanRedo(true);
  }

  function redo() {
    if (historyPushTimerRef.current) {
      clearTimeout(historyPushTimerRef.current);
      historyPushTimerRef.current = null;
    }
    const stack = historyStack.current;
    const idx = historyIndex.current;
    if (idx >= stack.length - 1) return;
    const newIdx = idx + 1;
    historyIndex.current = newIdx;
    const html = stack[newIdx];
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      normalizeTplFieldCaretAnchors(editorRef.current);
      if (
        !restoreSelectionBookmark(
          editorRef.current,
          historySelectionStack.current[newIdx]
        )
      ) {
        ensureSelectionInsideEditor(editorRef.current);
      }
    }
    onContentChangeRef.current(html);
    setCanUndo(true);
    setCanRedo(newIdx < stack.length - 1);
  }

  function execFormat(cmd: string, val?: string) {
    const editor = editorRef.current;
    editor?.focus();
    const sel = window.getSelection();
    let rangeBefore: Range | null = null;
    if (
      sel &&
      sel.rangeCount > 0 &&
      editor &&
      nodeIsInsideEditorRoot(editor, sel.getRangeAt(0).commonAncestorContainer)
    ) {
      rangeBefore = sel.getRangeAt(0).cloneRange();
    } else if (
      savedRangeRef.current &&
      editor &&
      nodeIsInsideEditorRoot(
        editor,
        savedRangeRef.current.commonAncestorContainer
      )
    ) {
      rangeBefore = savedRangeRef.current.cloneRange();
    }
    document.execCommand(cmd, false, val ?? undefined);
    if (editor && rangeBefore) {
      const spans = getTplFieldSpansInSelection(editor, rangeBefore);
      if (spans.length > 0) {
        const justifyMap: Partial<
          Record<string, TemplateEditorTextAlignValue>
        > = {
          justifyLeft: TemplateEditorTextAlign.Left,
          justifyCenter: TemplateEditorTextAlign.Center,
          justifyRight: TemplateEditorTextAlign.Right,
          justifyFull: TemplateEditorTextAlign.Justify,
        };
        const ja = justifyMap[cmd];
        if (ja !== undefined) {
          syncTplFieldBlocksTextAlign(editor, spans, ja);
        }
        if (
          cmd === "bold" ||
          cmd === "italic" ||
          cmd === "underline" ||
          cmd === "strikeThrough"
        ) {
          const bold = document.queryCommandState("bold");
          const italic = document.queryCommandState("italic");
          const underline = document.queryCommandState("underline");
          const strikeThrough = document.queryCommandState("strikeThrough");
          spans.forEach((span) => {
            span.style.fontWeight = bold
              ? "700"
              : TPL_FIELD_DEFAULT_FONT_WEIGHT;
            span.style.fontStyle = italic ? "italic" : "normal";
            span.style.textDecoration = combineTplFieldTextDecoration(
              underline,
              strikeThrough
            );
          });
        }
      }
    }
    pushEditorContent();
  }

  function applyToFieldSpansInSelection(cssProp: string, value: string) {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    getTplFieldSpansInSelection(editor, range).forEach((span) => {
      (span.style as unknown as Record<string, string>)[cssProp] = value;
    });
  }

  function applyFont(fontValue: string) {
    restoreSelectionToEditor();
    document.execCommand("fontName", false, fontValue);
    applyToFieldSpansInSelection("fontFamily", fontValue);
    setEditorFontFamily(fontValue);
    pushEditorContent();
  }

  function applyFontSize(sizePx: string) {
    restoreSelectionToEditor();
    const editor = editorRef.current;
    if (!editor) return;
    // execCommand("fontSize") only accepts 1–7. We use 7 as a tag marker and
    // then rewrite the resulting <font size="7"> elements into <span> with
    // the exact pixel value. This handles cross-element selections cleanly.
    document.execCommand("fontSize", false, "7");
    editor.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = sizePx;
      while (font.firstChild) span.appendChild(font.firstChild);
      font.replaceWith(span);
    });
    applyToFieldSpansInSelection("fontSize", sizePx);
    pushEditorContent();
  }

  function applyTextColor(color: string) {
    restoreSelectionToEditor();
    document.execCommand("foreColor", false, color);
    applyToFieldSpansInSelection("color", color);
    pushEditorContent();
  }

  function applyHighlightColor(color: string) {
    restoreSelectionToEditor();
    document.execCommand("backColor", false, color);
    applyToFieldSpansInSelection("backgroundColor", color);
    pushEditorContent();
  }

  // ─── Field click popup handlers ──────────────────────────────────────────────

  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isPreviewMode) return;
    const span = (e.target as HTMLElement).closest<HTMLElement>(".tpl-field");
    if (!span) return;
    const fieldKey = span.dataset.fieldKey;
    const field = state.fields.find((f) => f.key === fieldKey);
    if (!field) return;
    const rect = span.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < 360;
    setFieldEditTarget({
      span,
      field,
      x: rect.left,
      y: above ? rect.top : rect.bottom,
      above,
    });
    e.stopPropagation();
  }

  function commitFieldEdit() {
    if (!fieldEditTarget) return;
    const label = editingLabel.trim();
    if (!label) return;
    const updated: TemplateField = {
      ...fieldEditTarget.field,
      label,
      type: editingType,
    };
    onFieldsChange(
      state.fields.map((f) => (f.key === updated.key ? updated : f))
    );
    fieldEditTarget.span.dataset.fieldLabel = label;
    setFieldEditTarget((prev) => (prev ? { ...prev, field: updated } : null));
  }

  function removeFieldSpanFromEditor() {
    if (!fieldEditTarget) return;
    fieldEditTarget.span.remove();
    pushEditorContent();
    setFieldEditTarget(null);
  }

  function deleteFieldCompletely() {
    if (!fieldEditTarget) return;
    const key = fieldEditTarget.field.key;
    editorRef.current
      ?.querySelectorAll<HTMLElement>(`.tpl-field[data-field-key="${key}"]`)
      .forEach((s) => s.remove());
    onFieldsChange(state.fields.filter((f) => f.key !== key));
    pushEditorContent();
    setFieldEditTarget(null);
  }

  /** Apply a CSS property directly to the clicked chip span and persist. */
  function applyChipStyle(prop: string, value: string) {
    if (!fieldEditTarget) return;
    (fieldEditTarget.span.style as unknown as Record<string, string>)[prop] =
      value;
    pushEditorContent();
  }

  /** Apply a CSS property to the chip's parent block (paragraph / heading /
   *  list item). Used for line-level styling controls in the chip popup. */
  function resolveChipBlockForStyling(
    editor: HTMLElement,
    span: HTMLElement
  ): HTMLElement | null {
    const existing = nearestAlignableBlockContainer(span, editor);
    if (existing) return existing;
    if (span.parentElement !== editor) return null;
    const p = document.createElement("p");
    span.before(p);
    p.appendChild(span);
    const maybeAnchor = p.nextSibling;
    if (
      maybeAnchor &&
      maybeAnchor.nodeType === Node.TEXT_NODE &&
      (maybeAnchor.textContent ?? "") === "\u200b"
    ) {
      p.appendChild(maybeAnchor);
    }
    return p;
  }

  function applyChipBlockStyle(prop: string, value: string) {
    if (!fieldEditTarget) return;
    const editor = editorRef.current;
    if (!editor) return;
    const block = resolveChipBlockForStyling(editor, fieldEditTarget.span);
    if (!block) return;
    if (value) {
      (block.style as unknown as Record<string, string>)[prop] = value;
    } else {
      // Convert camelCase to kebab-case for removeProperty
      const kebab = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      block.style.removeProperty(kebab);
    }
    // Drop any stale alignment class so inline style wins cleanly
    if (prop === "textAlign") {
      block.classList.remove("dx-left", "dx-center", "dx-right", "dx-justify");
    }
    pushEditorContent();
  }

  function handleChipStyleReset() {
    if (!fieldEditTarget) return;
    const span = fieldEditTarget.span;
    span.style.cssText =
      "background:#cffafe;color:#0e7490;border-radius:4px;padding:1px 6px;font-size:13px;font-weight:500;display:inline-block;";
    setChipFontFamily("");
    setChipFontSize("13");
    setChipTextColor("#0e7490");
    setChipBgColor("#cffafe");
    setChipBold(false);
    setChipItalic(false);
    pushEditorContent();
  }

  function handleChipBlockAlign(
    value: "left" | "center" | "right" | "justify"
  ) {
    setChipBlockAlign(value);
    applyChipBlockStyle("textAlign", value);
  }

  function handleChipBlockAlignClick(e: React.MouseEvent<HTMLButtonElement>) {
    const value = e.currentTarget.dataset.align as
      | "left"
      | "center"
      | "right"
      | "justify"
      | undefined;
    if (!value) return;
    handleChipBlockAlign(value);
  }

  /** Open the chip font dropdown anchored to the font button. */
  function openChipFontDropdown() {
    const btn = chipFontBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setChipFontDropdownPos({ x: r.left, y: r.bottom + 4 });
    setChipFontDropdownOpen((v) => !v);
  }

  function previousNodeInEditor(editor: HTMLElement, node: Node): Node | null {
    let current: Node | null = node;
    while (current && current !== editor) {
      if (current.previousSibling) {
        let previous: Node = current.previousSibling;
        while (previous.lastChild) previous = previous.lastChild;
        return previous;
      }
      current = current.parentNode;
    }
    return null;
  }

  function lastNodeFromCaretChild(node: Node): Node {
    let current = node;
    while (current.lastChild) current = current.lastChild;
    return current;
  }

  function textHasContentBeforeCaret(text: Text, offset: number): boolean {
    return (
      (text.textContent ?? "")
        .slice(0, offset)
        .replaceAll(TEMPLATE_EDITOR_CARET_ANCHOR, "").length > 0
    );
  }

  function textNodeIsOnlyCaretAnchor(node: Text): boolean {
    return (
      (node.textContent ?? "").replaceAll(TEMPLATE_EDITOR_CARET_ANCHOR, "") ===
      ""
    );
  }

  function findTplFieldImmediatelyBeforeCaret(
    editor: HTMLElement,
    range: Range
  ): HTMLElement | null {
    if (!range.collapsed) return null;
    const { startContainer, startOffset } = range;
    let candidate: Node | null = null;

    if (startContainer.nodeType === Node.TEXT_NODE) {
      const text = startContainer as Text;
      if (textHasContentBeforeCaret(text, startOffset)) return null;
      candidate = previousNodeInEditor(editor, text);
    } else {
      const container = startContainer;
      if (startOffset > 0) {
        candidate = lastNodeFromCaretChild(
          container.childNodes[startOffset - 1]
        );
      } else {
        candidate = previousNodeInEditor(editor, container);
      }
    }

    while (candidate && nodeIsInsideEditorRoot(editor, candidate)) {
      if (
        candidate.nodeType === Node.ELEMENT_NODE &&
        (candidate as HTMLElement).classList.contains("tpl-field")
      ) {
        return candidate as HTMLElement;
      }
      if (candidate.nodeType === Node.TEXT_NODE) {
        if (!textNodeIsOnlyCaretAnchor(candidate as Text)) return null;
        candidate = previousNodeInEditor(editor, candidate);
        continue;
      }
      return null;
    }
    return null;
  }

  function removeTplFieldSpanAndPlaceCaret(
    editor: HTMLElement,
    span: HTMLElement
  ): void {
    const sel = window.getSelection();
    if (!sel) return;
    const parent = span.parentNode;
    const spanIndex = parent
      ? Array.prototype.indexOf.call(parent.childNodes, span)
      : -1;
    const next = span.nextSibling;
    let caretTextNode: Text | null = null;
    if (next?.nodeType === Node.TEXT_NODE) {
      const cleaned = (next.textContent ?? "").replaceAll(
        TEMPLATE_EDITOR_CARET_ANCHOR,
        ""
      );
      if (cleaned) {
        next.textContent = cleaned;
        caretTextNode = next as Text;
      } else {
        next.parentNode?.removeChild(next);
      }
    }
    span.remove();
    setFieldEditTarget((target) => (target?.span === span ? null : target));

    const nextRange = document.createRange();
    if (caretTextNode && nodeIsInsideEditorRoot(editor, caretTextNode)) {
      nextRange.setStart(caretTextNode, 0);
      nextRange.collapse(true);
    } else if (parent && nodeIsInsideEditorRoot(editor, parent)) {
      nextRange.setStart(parent, Math.max(0, spanIndex));
      nextRange.collapse(true);
    } else {
      nextRange.selectNodeContents(editor);
      nextRange.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    pushEditorContent();
  }

  function removeTplFieldImmediatelyBeforeCaret(): boolean {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!nodeIsInsideEditorRoot(editor, range.commonAncestorContainer)) {
      return false;
    }
    const span = findTplFieldImmediatelyBeforeCaret(editor, range);
    if (!span) return false;

    removeTplFieldSpanAndPlaceCaret(editor, span);
    return true;
  }

  function removeLastTextCharacterAndPreviousTplField(): boolean {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) {
      return false;
    }
    if (!nodeIsInsideEditorRoot(editor, range.startContainer)) return false;

    const text = range.startContainer as Text;
    const full = text.textContent ?? "";
    const before = full.slice(0, range.startOffset);
    const after = full.slice(range.startOffset);
    if (after.replaceAll(TEMPLATE_EDITOR_CARET_ANCHOR, "").length > 0) {
      return false;
    }
    if (before.replaceAll(TEMPLATE_EDITOR_CARET_ANCHOR, "").length !== 1) {
      return false;
    }
    const candidate = previousNodeInEditor(editor, text);
    if (
      !candidate ||
      candidate.nodeType !== Node.ELEMENT_NODE ||
      !(candidate as HTMLElement).classList.contains("tpl-field")
    ) {
      return false;
    }
    const span = candidate as HTMLElement;

    text.textContent = after.replaceAll(TEMPLATE_EDITOR_CARET_ANCHOR, "");
    if ((text.textContent ?? "") === "") text.parentNode?.removeChild(text);
    removeTplFieldSpanAndPlaceCaret(editor, span);
    return true;
  }

  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "Backspace" && !mod && !e.altKey) {
      if (
        removeLastTextCharacterAndPreviousTplField() ||
        removeTplFieldImmediatelyBeforeCaret()
      ) {
        e.preventDefault();
        return;
      }
    }
    if (e.key === "a" && mod) {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    if (e.key === "k" && mod) {
      e.preventDefault();
      saveSelection();
      setLinkDraft("");
      setLinkPanelOpen(true);
      return;
    }
    if (e.key === "b" && mod) {
      e.preventDefault();
      execFormat("bold");
      return;
    }
    if (e.key === "i" && mod && !e.shiftKey) {
      e.preventDefault();
      execFormat("italic");
      return;
    }
    if (e.key === "u" && mod) {
      e.preventDefault();
      execFormat("underline");
      return;
    }
    if (e.key === "z" && mod && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if ((e.key === "y" && mod) || (e.key === "z" && mod && e.shiftKey)) {
      e.preventDefault();
      redo();
      return;
    }
  }

  // ─── Field panel ────────────────────────────────────────────────────────────

  function openFieldPanel() {
    saveSelection();
    setNewFieldMode(false);
    setNewFieldLabel("");
    setNewFieldType(TemplateFieldType.Text);
    const btn = fieldPanelBtnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      const PANEL_WIDTH = 256; // matches w-64
      const PANEL_HEIGHT_ESTIMATE = 320;
      const spaceBelow = window.innerHeight - r.bottom;
      const above =
        spaceBelow < PANEL_HEIGHT_ESTIMATE && r.top > PANEL_HEIGHT_ESTIMATE;
      setFieldPanelPos({
        // anchor right edge of dropdown to right edge of button (extends to the left)
        x: Math.max(8, r.right - PANEL_WIDTH),
        y: above ? r.top - 6 : r.bottom + 6,
        above,
      });
    }
    setFieldPanelOpen((v) => !v);
  }

  function insertFieldSpan(field: TemplateField) {
    const editor = editorRef.current;
    if (!editor) return;

    const span = document.createElement("span");
    span.className = "tpl-field";
    span.contentEditable = "false";
    span.dataset.fieldKey = field.key;
    span.dataset.fieldLabel = field.label;
    // Use the field KEY as the text so the backend can find and replace {{key}}.
    // The label is stored in data-field-label for display reference only.
    span.textContent = `{{${field.key}}}`;
    span.style.cssText = TPL_FIELD_CHIP_INLINE_STYLE;

    editor.focus();
    const range = resolveCaretRangeForInsert(editor, savedRangeRef.current);
    range.deleteContents();
    range.insertNode(span);
    range.setStartAfter(span);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    try {
      sel?.addRange(range);
    } catch {
      ensureSelectionInsideEditor(editor);
    }

    pushEditorContent();
    setFieldPanelOpen(false);
    setNewFieldMode(false);
    setNewFieldLabel("");
    savedRangeRef.current = null;
  }

  function handleNewFieldSubmit() {
    const label = newFieldLabel.trim();
    if (!label) return;
    const key = labelToKey(label);
    const newField: TemplateField = {
      id: generateFieldId(),
      key,
      label,
      type: newFieldType,
      placeholder: "",
      required: false,
      defaultValue: "",
      options: "",
    };
    onFieldsChange([...state.fields, newField]);
    insertFieldSpan(newField);
  }

  function insertImagePlaceholder() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const div = document.createElement("div");
    div.contentEditable = "false";
    div.style.cssText =
      "border:2px dashed #d1d5db;border-radius:8px;padding:24px;text-align:center;color:#9ca3af;font-size:13px;margin:8px 0;user-select:none;";
    div.textContent = "[ Image placeholder ]";
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (nodeIsInsideEditorRoot(editor, range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(div);
        range.setStartAfter(div);
        range.collapse(true);
        sel.removeAllRanges();
        try {
          sel.addRange(range);
        } catch {
          ensureSelectionInsideEditor(editor);
        }
        pushEditorContent();
        return;
      }
    }
    editor.appendChild(div);
    pushEditorContent();
  }

  function insertHtmlAtCaret(html: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    insertTrustedHtmlFragmentAtCaret(editor, html, savedRangeRef.current);
    savedRangeRef.current = null;
    pushEditorContent();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    const fragment = html
      ? sanitizePastedHtml(html)
      : plainTextToSanitizedHtml(plain);
    if (!fragment) return;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, fragment);
    pushEditorContent();
  }

  function applyLinkFromPanel() {
    const normalized = normalizeLinkUrl(linkDraft);
    if (!normalized) return;
    restoreSelectionToEditor();
    execFormat("createLink", normalized);
    setLinkPanelOpen(false);
    setLinkDraft("");
  }

  async function handleDocxImport(file: File) {
    const editor = editorRef.current;
    if (!editor) return;
    const hasExisting =
      editor.innerHTML.replace(/<br\s*\/?>(\s|&nbsp;)*/g, "").trim() !== "";
    if (
      hasExisting &&
      !window.confirm(
        "Importing will replace the current editor content. Continue?"
      )
    ) {
      return;
    }
    setIsImporting(true);
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      // Run mammoth and the JSZip alignment scan in parallel — they both
      // operate on the same buffer but mammoth doesn't expose alignment.
      const [{ value: rawHtml, messages }, alignments] = await Promise.all([
        mammoth.convertToHtml(
          { arrayBuffer },
          {
            // Preserve underline runs (mammoth drops them by default), keep
            // explicit heading mappings, and preserve emphasis tags as-is.
            styleMap: [
              "u => u",
              "r[underline] => u",
              "b => strong",
              "i => em",
              "p[style-name='Title'] => h1.docx-title:fresh",
              "p[style-name='Subtitle'] => h2.docx-subtitle:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Heading 4'] => h4:fresh",
            ],
          }
        ),
        extractDocxParagraphAlignments(arrayBuffer).catch(() => [] as string[]),
      ]);
      const aligned = applyDocxAlignmentsToHtml(rawHtml, alignments);
      const sanitized = sanitizeImportedHtml(aligned) || "";
      editor.innerHTML = sanitized;
      // Imported docs typically read better in a serif (Word default = Calibri/TNR)
      setEditorFontFamily("'Times New Roman', Times, serif");
      // Convert any plain {{key}} text into chip spans, then sync fields panel
      materializePlainPlaceholdersInEditor(editor);
      normalizeTplFieldCaretAnchors(editor);
      const html = editor.innerHTML;
      onContentChangeRef.current(html);
      onFieldsChange(mergeTemplateFieldsFromPlaceholders(state.fields, html));
      pushToHistory(html);
      const placeholderCount = (html.match(/data-field-key=/g) || []).length;
      notifySuccess(
        placeholderCount > 0
          ? `Imported document — detected ${placeholderCount} placeholder${placeholderCount === 1 ? "" : "s"}`
          : "Imported document",
        { description: file.name }
      );
      if (messages?.length) {
        const warnings = messages.filter((m) => m.type === "warning").length;
        if (warnings > 0) {
          notifyWarning(
            `${warnings} formatting note${warnings === 1 ? "" : "s"} from import — review the content`
          );
        }
      }
    } catch (err) {
      notifyApiError(
        err instanceof Error ? err : new Error("Failed to import document")
      );
    } finally {
      setIsImporting(false);
      if (docxInputRef.current) docxInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Document body
          </p>
          {!isPreviewMode && (
            <p className="mt-0.5 text-[12px] text-slate-500">
              Rich formatting · Safe paste from Word ·{" "}
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-px text-[10px] font-medium text-slate-600">
                ⌘K
              </kbd>{" "}
              link
            </p>
          )}
          {isPreviewMode && (
            <p className="mt-0.5 text-[12px] font-medium text-amber-700">
              Read-only · showing filled sample values
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          {!isPreviewMode && (
            <>
              <input
                ref={docxInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleDocxImport(file);
                }}
              />
              <button
                type="button"
                disabled={isImporting}
                onClick={() => docxInputRef.current?.click()}
                title="Import a .docx file as a starting point"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileUp className="h-4 w-4 text-slate-500" />
                {isImporting ? "Importing…" : "Import .docx"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsPreviewMode((v) => !v)}
            className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium shadow-sm transition-colors ${
              isPreviewMode
                ? "border-gray-800 bg-gray-800 text-white hover:bg-gray-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {isPreviewMode ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                Back to Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-slate-500" />
                Preview with filled data
              </>
            )}
          </button>
        </div>
      </div>

      {linkPanelOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2.5 shadow-sm">
          <span className="text-[12px] font-medium text-slate-800">
            Link URL
          </span>
          <input
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLinkFromPanel();
              }
              if (e.key === "Escape") {
                setLinkPanelOpen(false);
                setLinkDraft("");
              }
            }}
            placeholder="https://…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] text-slate-900 outline-none focus:border-gray-400"
            autoFocus
          />
          <button
            type="button"
            onClick={applyLinkFromPanel}
            className="h-8 rounded-lg border border-gray-800 bg-gray-800 px-3 text-[12px] font-semibold text-white hover:bg-gray-900"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkPanelOpen(false);
              setLinkDraft("");
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}

      {!isPreviewMode && (
        <div className="relative z-[100] overflow-visible rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-1.5 shadow-sm">
          <div className="flex min-w-0 max-w-full flex-nowrap items-start gap-4 pb-0.5 [scrollbar-width:thin]">
            <ToolbarGroup label="History">
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Undo (Ctrl+Z)"
                  disabled={!canUndo}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    undo();
                  }}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${canUndo ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "cursor-not-allowed text-slate-300"}`}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Redo (Ctrl+Y)"
                  disabled={!canRedo}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    redo();
                  }}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${canRedo ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "cursor-not-allowed text-slate-300"}`}
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Blocks">
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Heading 1"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("formatBlock", "<h1>");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Heading1 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Heading 2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("formatBlock", "<h2>");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Heading 3"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("formatBlock", "<h3>");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Heading3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Paragraph"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("formatBlock", "<p>");
                  }}
                  className="flex h-7 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  ¶
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Text">
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Bold"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("bold");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("italic");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Underline"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("underline");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Strikethrough"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("strikeThrough");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Align">
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Align left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("justifyLeft");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Align center"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("justifyCenter");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Align right"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("justifyRight");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Justify"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("justifyFull");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Lists">
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Bullet list"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("insertUnorderedList");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Numbered list"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("insertOrderedList");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Links">
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Insert link (⌘K)"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelection();
                    setLinkDraft("");
                    setLinkPanelOpen(true);
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Remove link"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("unlink");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Insert">
              <div className="relative shrink-0" ref={tableMenuRef}>
                <button
                  type="button"
                  title="Insert table"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelection();
                    setTableMenuOpen((v) => !v);
                  }}
                  className="flex h-8 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Table className="h-3.5 w-3.5" />
                  Table
                  <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
                </button>
                {tableMenuOpen && (
                  <div className="absolute left-0 top-full z-[200] mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertHtmlAtCaret(buildTableHtml(2, 2));
                        setTableMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                    >
                      2 × 2 table
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertHtmlAtCaret(buildTableHtml(3, 3));
                        setTableMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                    >
                      3 × 3 table
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertHtmlAtCaret(buildTableWithHeaderHtml(4, 3));
                        setTableMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                    >
                      Table with header row
                    </button>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  title="Horizontal rule"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat("insertHorizontalRule");
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Image placeholder"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertImagePlaceholder();
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Snippets">
              <div className="relative shrink-0" ref={snippetMenuRef}>
                <button
                  type="button"
                  title="Insert snippet"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelection();
                    setSnippetMenuOpen((v) => !v);
                  }}
                  className="flex h-8 items-center gap-0.5 rounded-lg border border-gray-800 bg-gray-800 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-gray-900"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Snippets
                  <ChevronDown className="h-3 w-3 shrink-0 text-gray-300" />
                </button>
                {snippetMenuOpen && (
                  <div className="absolute left-0 top-full z-[200] mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Built-in
                    </p>
                    {applyBuiltinSnippetOverrides(
                      TEMPLATE_EDITOR_SNIPPETS,
                      builtinOverrides
                    ).map((sn) => (
                      <button
                        key={sn.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertHtmlAtCaret(sn.html);
                          setSnippetMenuOpen(false);
                        }}
                        className="w-full px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-gray-50"
                      >
                        <span className="font-medium text-slate-900">
                          {sn.label}
                        </span>
                      </button>
                    ))}
                    {userSnippets.length > 0 && (
                      <>
                        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          My snippets
                        </p>
                        {userSnippets.map((sn) => (
                          <button
                            key={String(sn.id)}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertHtmlAtCaret(sn.html);
                              setSnippetMenuOpen(false);
                            }}
                            className="w-full px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-gray-50"
                          >
                            <span className="font-medium text-slate-900">
                              {sn.label}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSnippetMenuOpen(false);
                        setSnippetsManageOpen(true);
                      }}
                      className="mt-1 w-full border-t border-slate-100 px-3 py-2.5 text-left text-[13px] font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Manage snippets…
                    </button>
                  </div>
                )}
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Colors">
              <div className="flex items-center gap-1">
                <label
                  className="flex h-7 shrink-0 cursor-pointer select-none items-center gap-1 rounded-md border border-slate-200/80 bg-white px-1.5 shadow-sm transition-colors hover:bg-slate-50"
                  title="Text color"
                  onMouseDown={() => saveSelection()}
                >
                  <span
                    className="text-[12px] font-bold leading-none"
                    style={{ color: textColor }}
                  >
                    A
                  </span>
                  <span
                    className="h-[3px] w-4 shrink-0 rounded-sm"
                    style={{ backgroundColor: textColor }}
                  />
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      applyTextColor(e.target.value);
                    }}
                    className="sr-only"
                  />
                </label>

                <label
                  className="flex h-7 shrink-0 cursor-pointer select-none items-center gap-1 rounded-md border border-slate-200/80 bg-white px-1.5 shadow-sm transition-colors hover:bg-slate-50"
                  title="Highlight"
                  onMouseDown={() => saveSelection()}
                >
                  <span className="text-[11px] font-semibold text-slate-500">
                    HL
                  </span>
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded border border-slate-300"
                    style={{ backgroundColor: highlightColor }}
                  />
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => {
                      setHighlightColor(e.target.value);
                      applyHighlightColor(e.target.value);
                    }}
                    className="sr-only"
                  />
                </label>

                <label
                  className="flex h-7 shrink-0 cursor-pointer select-none items-center gap-1 rounded-md border border-slate-200/80 bg-white px-1.5 shadow-sm transition-colors hover:bg-slate-50"
                  title="Canvas background"
                >
                  <span className="text-[11px] font-semibold text-slate-500">
                    Canvas
                  </span>
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded border border-slate-300"
                    style={{ backgroundColor: editorBgColor }}
                  />
                  <input
                    type="color"
                    value={editorBgColor}
                    onChange={(e) => setEditorBgColor(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Typography">
              <div className="flex items-center gap-1">
                <div className="relative shrink-0" ref={fontDropdownRef}>
                  <button
                    type="button"
                    title="Font family"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelection();
                      setFontDropdownOpen((v) => !v);
                    }}
                    className="flex h-8 min-w-[96px] max-w-[132px] items-center gap-0.5 rounded-lg border border-slate-200/80 bg-white pl-2 pr-1 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-left"
                      style={{ fontFamily: editorFontFamily }}
                    >
                      {FONT_FAMILY_OPTIONS.find(
                        (o) => o.value === editorFontFamily
                      )?.label ?? "Font"}
                    </span>
                    <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
                  </button>
                  {fontDropdownOpen && (
                    <div className="absolute left-0 top-full z-[200] mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                      {FONT_FAMILY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyFont(opt.value);
                            setFontDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-slate-50 ${
                            editorFontFamily === opt.value
                              ? "bg-gray-100 text-gray-900"
                              : "text-slate-700"
                          }`}
                        >
                          <span style={{ fontFamily: opt.value }}>
                            {opt.label}
                          </span>
                          <span
                            style={{ fontFamily: opt.value }}
                            className="text-[12px] text-slate-400"
                          >
                            Aa
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="flex h-8 shrink-0 items-center gap-0 rounded-lg border border-slate-200/80 bg-white px-0.5 shadow-sm"
                  title="Font size"
                >
                  <button
                    type="button"
                    title="Decrease font size"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelection();
                      const cur = parseInt(editorFontSize || "13");
                      const s = String(Math.max(8, cur - 1));
                      setEditorFontSize(s);
                      applyFontSize(s + "px");
                    }}
                    className="flex h-7 w-6 items-center justify-center rounded-md text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={editorFontSize}
                    placeholder="13"
                    onMouseDown={() => saveSelection()}
                    onChange={(e) => setEditorFontSize(e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value) applyFontSize(e.target.value + "px");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="h-7 w-9 border-x border-slate-200 bg-white text-center text-[12px] text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    min={8}
                    max={96}
                  />
                  <button
                    type="button"
                    title="Increase font size"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      saveSelection();
                      const cur = parseInt(editorFontSize || "13");
                      const s = String(Math.min(96, cur + 1));
                      setEditorFontSize(s);
                      applyFontSize(s + "px");
                    }}
                    className="flex h-7 w-6 items-center justify-center rounded-md text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="Fields">
              <div className="relative shrink-0" ref={fieldPanelRef}>
                {/* The trigger button uses onMouseDown to save selection BEFORE focus leaves the editor */}
                <button
                  ref={fieldPanelBtnRef}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openFieldPanel();
                  }}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-gray-800 bg-gray-800 px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-gray-900"
                >
                  <Type className="h-3.5 w-3.5" /> Insert field
                </button>

                {fieldPanelOpen && (
                  <div
                    style={{
                      position: "fixed",
                      left: fieldPanelPos.x,
                      ...(fieldPanelPos.above
                        ? { bottom: window.innerHeight - fieldPanelPos.y }
                        : { top: fieldPanelPos.y }),
                      width: 256,
                      zIndex: 200,
                    }}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                  >
                    {!newFieldMode ? (
                      <>
                        {/* Existing fields */}
                        {state.fields.length > 0 && (
                          <div className="py-1.5 max-h-48 overflow-y-auto">
                            {sortTemplateFieldsForPicker(state.fields).map(
                              (f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => insertFieldSpan(f)}
                                  className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <span className="inline-block bg-gray-100 text-gray-800 text-[11px] font-medium px-1.5 py-0.5 rounded flex-shrink-0">
                                    {"{{"}
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span className="font-medium truncate block">
                                      {f.label}
                                    </span>
                                    <span className="text-[11px] text-gray-400">
                                      {f.key}
                                    </span>
                                  </span>
                                </button>
                              )
                            )}
                            <div className="h-px bg-gray-100 mx-3 my-1" />
                          </div>
                        )}
                        {state.fields.length === 0 && (
                          <p className="text-[12px] text-gray-400 px-3 pt-3 pb-1">
                            No fields yet — create one below.
                          </p>
                        )}
                        {/* New field trigger */}
                        <button
                          type="button"
                          onClick={() => setNewFieldMode(true)}
                          className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200">
                            <Plus className="h-3 w-3 text-gray-800" />
                          </span>
                          New field…
                        </button>
                      </>
                    ) : (
                      /* Inline new-field form */
                      <div className="p-3 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNewFieldMode(false);
                              setNewFieldLabel("");
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[13px] font-semibold text-gray-800">
                            New field
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={newFieldInputRef}
                            type="text"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleNewFieldSubmit();
                              }
                              if (e.key === "Escape") {
                                setNewFieldMode(false);
                                setNewFieldLabel("");
                              }
                            }}
                            placeholder="e.g. Employee Name"
                            className="h-8 w-full px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none transition-colors focus:border-gray-400"
                          />
                          {newFieldLabel.trim() && (
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              key: {labelToKey(newFieldLabel.trim())}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Type
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {SORTED_FIELD_TYPE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setNewFieldType(opt.value)}
                                className={`h-6 px-2 rounded text-[11px] font-medium border transition-colors ${
                                  newFieldType === opt.value
                                    ? "border-gray-800 bg-gray-800 text-white"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNewFieldMode(false);
                              setNewFieldLabel("");
                            }}
                            className="flex-1 h-7 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!newFieldLabel.trim()}
                            onClick={handleNewFieldSubmit}
                            className="flex-1 h-7 text-[12px] font-medium rounded-lg border border-gray-800 bg-gray-800 text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ToolbarGroup>
          </div>
        </div>
      )}

      {/* Chip / editor styles */}
      <TemplateEditorContentStyles />

      {/* Editor — always mounted; hidden in preview mode to preserve DOM / history */}
      <div
        ref={editorRef}
        contentEditable={isPreviewMode ? "false" : "true"}
        suppressContentEditableWarning
        onInput={() => pushEditorContent(true)}
        onPaste={handlePaste}
        onBlur={isPreviewMode ? undefined : saveSelection}
        onClick={handleEditorClick}
        onKeyDown={isPreviewMode ? undefined : handleEditorKeyDown}
        className={`relative z-0 template-editor min-h-[380px] rounded-2xl border p-5 text-[14px] text-slate-900 shadow-inner outline-none transition-all duration-200${isPreviewMode ? " hidden" : " border-slate-200/90 bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-400/25"}`}
        style={{
          lineHeight: 1.45,
          backgroundColor: editorBgColor,
          fontFamily: editorFontFamily,
        }}
      />

      {/* Preview pane — rendered from the latest content with filled sample
          values. We deliberately do NOT use Tailwind's `prose` typography
          classes here: the editor stores per-element inline styles
          (font-family, font-size, color, alignment, weight, …) and `prose`
          would reset element-level color/spacing/font-family, making the
          preview look different from what the user authored. */}
      {isPreviewMode && (
        <div
          className="template-editor template-editor-preview min-h-[380px] rounded-2xl border border-slate-200/90 bg-white p-5 text-[14px] text-slate-900 shadow-inner transition-all duration-200 [&_.tpl-field]:inline [&_.tpl-field]:rounded [&_.tpl-field]:bg-emerald-50 [&_.tpl-field]:px-1 [&_.tpl-field]:py-px [&_.tpl-field]:text-emerald-800 [&_.tpl-field]:font-medium"
          style={{
            lineHeight: 1.45,
            backgroundColor: editorBgColor,
            fontFamily: editorFontFamily,
          }}
          dangerouslySetInnerHTML={{
            __html:
              previewTemplateHtml(state.content, state.fields) ||
              '<span style="color:#94a3b8;font-style:italic">No content yet</span>',
          }}
        />
      )}

      {state.content === "" && (
        <p className="text-[11.5px] text-amber-600 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Content is empty — you can
          still proceed and add content later.
        </p>
      )}

      <TemplateSnippetsManageDialog
        open={snippetsManageOpen}
        onOpenChange={setSnippetsManageOpen}
        onSaved={() => {
          templateSnippetsApi
            .list()
            .then((rows) => {
              setUserSnippets(rows);
              saveLocalUserSnippets(rows);
            })
            .catch(() => setUserSnippets(loadLocalUserSnippets()));
        }}
      />

      {/* ── Field chip popup ─────────────────────────────────────────────────── */}
      {fieldEditTarget &&
        (() => {
          // Cap the popup's height to the room actually available above/below
          // the chip, so the bottom (Remove span / Delete) is never clipped
          // off-screen — and never larger than 80% of the viewport.
          const margin = 12;
          const space = fieldEditTarget.above
            ? fieldEditTarget.y - margin
            : window.innerHeight - fieldEditTarget.y - margin;
          const popupMaxH = Math.max(
            240,
            Math.min(window.innerHeight * 0.8, space)
          );
          return (
            <div
              ref={fieldPopupRef}
              style={{
                position: "fixed",
                // top / left / bottom are managed by the rAF reposition effect
                // so the popup stays anchored to the chip even when the editor
                // reflows or the page scrolls.
                zIndex: 60,
                width: 292,
                maxHeight: popupMaxH,
              }}
              className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2.5 border-b border-gray-100 sticky top-0 bg-white z-[1]">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                    {fieldEditTarget.field.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-800">
                      {`{{${fieldEditTarget.field.key}}}`}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">
                      {TEMPLATE_FIELD_TYPE_LABELS[fieldEditTarget.field.type] ??
                        fieldEditTarget.field.type}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFieldEditTarget(null);
                    setChipFontDropdownOpen(false);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-3">
                {/* ── Style section ── */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Style
                  </p>

                  {/* Row 1: font + size */}
                  <div className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Font
                    </span>
                    <button
                      ref={chipFontBtnRef}
                      type="button"
                      onClick={openChipFontDropdown}
                      className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-md border border-gray-200 bg-white pl-2.5 pr-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <span
                        className="min-w-0 flex-1 truncate text-left"
                        style={{
                          fontFamily: chipFontFamily || editorFontFamily,
                        }}
                      >
                        {FONT_FAMILY_OPTIONS.find(
                          (o) => o.value === chipFontFamily
                        )?.label ?? "Default"}
                      </span>
                      <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
                    </button>
                    <div className="flex items-center gap-0.5 overflow-hidden rounded-md border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          const s = String(
                            Math.max(8, parseInt(chipFontSize || "13") - 1)
                          );
                          setChipFontSize(s);
                          applyChipStyle("fontSize", s + "px");
                        }}
                        className="flex h-8 w-6 items-center justify-center text-[14px] font-bold text-gray-500 transition-colors hover:bg-gray-100"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={chipFontSize}
                        onChange={(e) => {
                          setChipFontSize(e.target.value);
                          if (e.target.value)
                            applyChipStyle("fontSize", e.target.value + "px");
                        }}
                        className="h-8 w-8 border-x border-gray-200 bg-white text-center text-[12px] text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        min={8}
                        max={96}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const s = String(
                            Math.min(96, parseInt(chipFontSize || "13") + 1)
                          );
                          setChipFontSize(s);
                          applyChipStyle("fontSize", s + "px");
                        }}
                        className="flex h-8 w-6 items-center justify-center text-[14px] font-bold text-gray-500 transition-colors hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400">px</span>
                  </div>

                  {/* Row 2: text color, bg color, bold, italic */}
                  <div className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Text
                    </span>
                    <label
                      className="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 transition-colors hover:bg-gray-50"
                      title="Text color"
                    >
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: chipTextColor }}
                      >
                        A
                      </span>
                      <span
                        className="h-[3px] w-3 rounded-sm"
                        style={{ backgroundColor: chipTextColor }}
                      />
                      <input
                        type="color"
                        value={chipTextColor}
                        onChange={(e) => {
                          setChipTextColor(e.target.value);
                          applyChipStyle("color", e.target.value);
                        }}
                        className="sr-only"
                      />
                    </label>
                    <label
                      className="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 transition-colors hover:bg-gray-50"
                      title="Background color"
                    >
                      <span className="text-[11px] font-medium text-gray-500">
                        Bg
                      </span>
                      <span
                        className="h-3.5 w-3.5 rounded border border-gray-300"
                        style={{ backgroundColor: chipBgColor }}
                      />
                      <input
                        type="color"
                        value={chipBgColor}
                        onChange={(e) => {
                          setChipBgColor(e.target.value);
                          applyChipStyle("backgroundColor", e.target.value);
                        }}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => {
                        const next = !chipBold;
                        setChipBold(next);
                        applyChipStyle("fontWeight", next ? "700" : "500");
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-md border text-[13px] font-bold transition-colors ${
                        chipBold
                          ? "border-gray-800 bg-gray-800 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => {
                        const next = !chipItalic;
                        setChipItalic(next);
                        applyChipStyle("fontStyle", next ? "italic" : "normal");
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-md border text-[13px] italic transition-colors ${
                        chipItalic
                          ? "border-gray-800 bg-gray-800 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      title="Reset to default"
                      onClick={handleChipStyleReset}
                      className="ml-auto h-8 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Live preview of the chip */}
                  <div className="flex items-center justify-center py-2 bg-gray-50 rounded-lg">
                    <span
                      style={{
                        backgroundColor: chipBgColor,
                        color: chipTextColor,
                        fontFamily: chipFontFamily || editorFontFamily,
                        fontSize: (chipFontSize || "13") + "px",
                        fontWeight: chipBold ? "700" : "500",
                        fontStyle: chipItalic ? "italic" : "normal",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        display: "inline-block",
                      }}
                    >
                      {`{{${fieldEditTarget.field.key}}}`}
                    </span>
                  </div>
                </div>

                {/* ── Line styling (applies to the surrounding paragraph) ── */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Line
                  </p>
                  {/* Alignment buttons */}
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { value: "left", icon: AlignLeft, title: "Align left" },
                        {
                          value: "center",
                          icon: AlignCenter,
                          title: "Align center",
                        },
                        {
                          value: "right",
                          icon: AlignRight,
                          title: "Align right",
                        },
                        {
                          value: "justify",
                          icon: AlignJustify,
                          title: "Justify",
                        },
                      ] as const
                    ).map((opt) => {
                      const active = chipBlockAlign === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          title={opt.title}
                          data-align={opt.value}
                          onClick={handleChipBlockAlignClick}
                          className={`h-8 flex-1 rounded-md border text-[12px] font-semibold transition-colors ${
                            active
                              ? "border-gray-800 bg-gray-800 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="mx-auto h-4 w-4" />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      title="Clear alignment"
                      onClick={() => {
                        setChipBlockAlign("");
                        applyChipBlockStyle("textAlign", "");
                      }}
                      className="ml-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* ── Label & type ── */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Label &amp; type
                  </p>
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={commitFieldEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitFieldEdit();
                      }
                    }}
                    placeholder="Field label"
                    className="h-8 w-full px-2.5 text-[13px] text-gray-900 border border-gray-200 rounded-md outline-none transition-colors focus:border-gray-400"
                  />
                  <div className="flex flex-wrap gap-1">
                    {SORTED_FIELD_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const label =
                            editingLabel.trim() || fieldEditTarget.field.label;
                          const updated: TemplateField = {
                            ...fieldEditTarget.field,
                            label,
                            type: opt.value,
                          };
                          setEditingType(opt.value);
                          onFieldsChange(
                            state.fields.map((f) =>
                              f.key === updated.key ? updated : f
                            )
                          );
                          setFieldEditTarget((prev) =>
                            prev ? { ...prev, field: updated } : null
                          );
                        }}
                        className={`h-6 px-2 rounded text-[11px] font-medium border transition-colors ${
                          editingType === opt.value
                            ? "border-gray-800 bg-gray-800 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Preview ── */}
                <div className="space-y-1.5 border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Value preview
                  </p>
                  <PreviewInput
                    type={editingType}
                    value={previewValue}
                    options={fieldEditTarget.field.options}
                    onChange={setPreviewValue}
                  />
                  {previewValue !== "" && previewValue !== false && (
                    <div className="px-2.5 py-2 bg-gray-50 rounded-lg text-[12px] flex items-center gap-2">
                      <span className="text-gray-400">Renders as:</span>
                      <span
                        style={{
                          backgroundColor: chipBgColor,
                          color: chipTextColor,
                          fontFamily: chipFontFamily || editorFontFamily,
                          fontSize: (chipFontSize || "13") + "px",
                          fontWeight: chipBold ? "700" : "500",
                          fontStyle: chipItalic ? "italic" : "normal",
                          borderRadius: "4px",
                          padding: "1px 6px",
                        }}
                      >
                        {String(previewValue)}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={removeFieldSpanFromEditor}
                    className="flex-1 h-7 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Remove span
                  </button>
                  <button
                    type="button"
                    onClick={deleteFieldCompletely}
                    className="flex-1 h-7 text-[12px] font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete field
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Chip font dropdown overlay (fixed, escapes popup overflow) ────────── */}
      {chipFontDropdownOpen && fieldEditTarget && (
        <div
          ref={chipFontDropdownRef}
          style={{
            position: "fixed",
            left: chipFontDropdownPos.x,
            top: chipFontDropdownPos.y,
            zIndex: 70,
            width: 192,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* "Default" option — remove override */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setChipFontFamily("");
              applyChipStyle("fontFamily", "");
              setChipFontDropdownOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
              !chipFontFamily
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 italic"
            }`}
          >
            <span>Default</span>
          </button>
          <div className="h-px bg-gray-100 mx-2 my-0.5" />
          {FONT_FAMILY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setChipFontFamily(opt.value);
                applyChipStyle("fontFamily", opt.value);
                setChipFontDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
                chipFontFamily === opt.value
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700"
              }`}
            >
              <span style={{ fontFamily: opt.value }}>{opt.label}</span>
              <span
                style={{ fontFamily: opt.value }}
                className="text-[11px] text-gray-400"
              >
                Aa
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3 — Fields ──────────────────────────────────────────────────────────

function FieldCard({
  field,
  onChange,
  onDelete,
}: {
  field: TemplateField;
  onChange: (updated: TemplateField) => void;
  onDelete: () => void;
}) {
  const patch = (k: keyof TemplateField, v: unknown) =>
    onChange({ ...field, [k]: v });

  const options = field.options
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
          {/* Label */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => patch("label", e.target.value)}
              placeholder="e.g. Employee Name"
              className="h-8 w-full px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded bg-white outline-none focus:border-gray-400 transition-colors"
              style={{ color: "#111827" }}
            />
          </div>
          {/* Type */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Field type
            </label>
            <Select
              value={field.type}
              onValueChange={(v) => patch("type", v as TemplateFieldType)}
            >
              <SelectTrigger className="h-8 w-full text-[13px] bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-[120]">
                {SORTED_FIELD_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0 mt-5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Placeholder / hint */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Hint / placeholder
        </label>
        <input
          type="text"
          value={field.placeholder}
          onChange={(e) => patch("placeholder", e.target.value)}
          placeholder="Helper text shown below the input"
          className="h-8 w-full px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded bg-white outline-none focus:border-gray-400 transition-colors"
          style={{ color: "#111827" }}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Required toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={field.required}
            onClick={() => patch("required", !field.required)}
            className={`relative w-8 h-4 rounded-full transition-colors ${field.required ? "bg-gray-800" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${field.required ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
          <span className="text-[12px] text-gray-600">Required</span>
        </div>

        {/* Default value — input type matches field type */}
        {field.type !== TemplateFieldType.Checkbox && (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-[11px] font-medium text-gray-600 whitespace-nowrap flex-shrink-0">
              Default value
            </label>
            {field.type === TemplateFieldType.Date ? (
              <DatePicker
                mode="single"
                value={field.defaultValue}
                onChange={(date) => patch("defaultValue", date)}
                placeholder="Optional default date"
                size="compact"
              />
            ) : field.type === TemplateFieldType.Number ? (
              <input
                type="number"
                value={field.defaultValue}
                onChange={(e) => patch("defaultValue", e.target.value)}
                placeholder="0"
                className="h-7 flex-1 px-2 text-[12px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded bg-white outline-none focus:border-gray-400 transition-colors"
                style={{ color: "#111827" }}
              />
            ) : field.type === TemplateFieldType.Dropdown ? (
              <Select
                value={field.defaultValue || "__none__"}
                onValueChange={(v) =>
                  patch("defaultValue", v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger className="h-7 flex-1 text-[12px] text-gray-900 bg-white border-gray-200">
                  <SelectValue placeholder="— none —" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 z-[120]">
                  <SelectItem value="__none__">— none —</SelectItem>
                  {field.options
                    .split("\n")
                    .map((o) => o.trim())
                    .filter(Boolean)
                    .map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <input
                type="text"
                value={field.defaultValue}
                onChange={(e) => patch("defaultValue", e.target.value)}
                placeholder="Optional default"
                className="h-7 flex-1 px-2 text-[12px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded bg-white outline-none focus:border-gray-400 transition-colors"
                style={{ color: "#111827" }}
              />
            )}
          </div>
        )}
      </div>

      {/* Options editor — only for dropdown */}
      {field.type === TemplateFieldType.Dropdown && (
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Options <span className="text-gray-400">(one per line)</span>
          </label>
          <textarea
            value={field.options}
            onChange={(e) => patch("options", e.target.value)}
            placeholder={"Option A\nOption B\nOption C"}
            rows={3}
            className="w-full px-2.5 py-2 text-[12px] border border-gray-200 rounded bg-white outline-none focus:border-gray-400 transition-colors resize-none"
          />
          {options.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {options.map((opt) => (
                <span
                  key={opt}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateBuilderStep3({
  state,
  onChange,
}: {
  state: BuilderState;
  onChange: (patch: Partial<BuilderState>) => void;
}) {
  // Detect placeholders in content that have no matching field
  const placeholders = extractPlaceholders(state.content);
  const unmatchedCount = placeholders.filter(
    (p) => !state.fields.some((f) => f.key === p.key)
  ).length;

  function updateField(id: string, updated: TemplateField) {
    onChange({
      fields: state.fields.map((f) => (f.id === id ? updated : f)),
    });
  }

  function deleteField(id: string) {
    onChange({ fields: state.fields.filter((f) => f.id !== id) });
  }

  function addField() {
    const newField: TemplateField = {
      id: generateFieldId(),
      key: `field_${state.fields.length + 1}`,
      label: "",
      type: TemplateFieldType.Text,
      placeholder: "",
      required: false,
      defaultValue: "",
      options: "",
    };
    onChange({ fields: [...state.fields, newField] });
  }

  return (
    <div className="space-y-4">
      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <span>
            <strong>{unmatchedCount}</strong> placeholder
            {unmatchedCount > 1 ? "s" : ""} in your template{" "}
            {unmatchedCount > 1 ? "have" : "has"} no field definition.
          </span>
        </div>
      )}

      {state.fields.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-[13px] text-gray-500 mb-3">
            No fields yet. Add fields manually or insert{" "}
            <code className="bg-gray-100 px-1 rounded text-[12px]">
              {"{{placeholders}}"}
            </code>{" "}
            in your content.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              onChange={(updated) => updateField(field.id, updated)}
              onDelete={() => deleteField(field.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-gray-700 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors w-full justify-center"
      >
        <Plus className="w-3.5 h-3.5" /> Add field manually
      </button>
    </div>
  );
}

// ─── Step 4 — Review ──────────────────────────────────────────────────────────

function TemplateBuilderStep4({
  state,
  editId,
  onSaved,
}: {
  state: BuilderState;
  editId?: number | string;
  onSaved: (template: DocumentTemplate) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function save(status: TemplateStatus) {
    if (!state.name || !state.category) return;
    if (
      status === TemplateStatus.Published &&
      extractPlaceholders(state.content).some(
        (p) => !state.fields.some((f) => f.key === p.key)
      )
    ) {
      notifyWarning(
        "Fix placeholders without matching fields before publishing."
      );
      return;
    }
    setSaving(true);
    // Embed the page-level font / background AND the new visibility settings
    // (allowedRoles + scope) in the saved HTML itself so they persist even if
    // the backend doesn't yet store the new columns.
    const wrappedContent = wrapEditorContentWithBodyStyles(state.content, {
      fontFamily: state.bodyFontFamily,
      backgroundColor: state.bodyBackgroundColor,
      visibilityScope: state.visibilitySettings.scope,
      allowedRoles: state.visibilitySettings.allowedRoles,
    });
    const payload: TemplatePayload = {
      name: state.name,
      description: state.description,
      category: state.category as TemplateCategory,
      visibility: state.visibility,
      allowedRoles: state.visibilitySettings.allowedRoles,
      visibilityScope: state.visibilitySettings.scope,
      status,
      content: wrappedContent,
      fields: state.fields,
      bodyFontFamily: state.bodyFontFamily,
      bodyBackgroundColor: state.bodyBackgroundColor,
    };
    try {
      const result = editId
        ? await templatesApi.update(editId, payload)
        : await templatesApi.create(payload);
      notifySuccess(
        status === TemplateStatus.Published
          ? "Template published"
          : "Template saved as draft",
        { description: result.name }
      );
      onSaved(result);
    } catch (err) {
      notifyApiError(
        err instanceof Error ? err : new Error("Failed to save template")
      );
    } finally {
      setSaving(false);
    }
  }

  const catColor = state.category
    ? getTemplateCategoryColor(state.category as TemplateCategory)
    : "bg-gray-100 text-gray-700";
  const catLabel = state.category
    ? getTemplateCategoryLabel(state.category as TemplateCategory)
    : "—";

  const placeholdersInContent = extractPlaceholders(state.content);
  const unmatchedMergeKeys = placeholdersInContent.filter(
    (p) => !state.fields.some((f) => f.key === p.key)
  );
  const publishBlocked = unmatchedMergeKeys.length > 0;

  return (
    <div className="space-y-5">
      {publishBlocked && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>{unmatchedMergeKeys.length}</strong> placeholder
            {unmatchedMergeKeys.length !== 1 ? "s" : ""}{" "}
            {unmatchedMergeKeys.length !== 1 ? "do" : "does"} not match a
            defined field. Publishing is disabled until this is resolved (draft
            save still allowed).
          </span>
        </div>
      )}

      {/* Template preview */}
      <div>
        <TemplateEditorContentStyles />
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Content preview
        </h3>
        {/* Same as the in-builder Preview pane: no `prose` (it would override
            element-level color / font-family / spacing from the inline styles
            the editor produced) and inherit the editor's font + bg so the
            preview matches what the user authored. */}
        <div
          className="template-editor template-editor-preview border border-gray-200 rounded-lg p-5 max-w-none min-h-[120px] text-[13.5px] text-gray-800"
          style={{
            lineHeight: 1.45,
            backgroundColor: state.bodyBackgroundColor,
            fontFamily: state.bodyFontFamily,
          }}
          dangerouslySetInnerHTML={{
            __html:
              state.content ||
              '<span class="text-gray-400 italic">No content</span>',
          }}
        />
      </div>

      {/* Metadata grid */}
      <div>
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Metadata
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="px-4 py-3 border border-gray-200 rounded-lg bg-white">
            <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
              Name
            </div>
            <div className="text-[13.5px] font-medium text-gray-900">
              {state.name || "—"}
            </div>
          </div>
          <div className="px-4 py-3 border border-gray-200 rounded-lg bg-white">
            <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
              Category
            </div>
            <span
              className={`text-[12px] font-medium px-2 py-0.5 rounded ${catColor}`}
            >
              {catLabel}
            </span>
          </div>
          <div className="px-4 py-3 border border-gray-200 rounded-lg bg-white">
            <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
              Visibility
            </div>
            <div className="text-[13px] font-medium text-gray-900">
              {documentVisibilityLabel(
                state.visibilitySettings.scope,
                state.visibilitySettings.allowedRoles
              )}
            </div>
          </div>
          <div className="px-4 py-3 border border-gray-200 rounded-lg bg-white">
            <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
              Dynamic fields
            </div>
            <div className="text-[13px] font-medium text-gray-900">
              {state.fields.length} field{state.fields.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Save buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={saving || !state.name || !state.category}
          onClick={() => save(TemplateStatus.Draft)}
          className="flex items-center gap-1.5 h-10 px-5 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
        <button
          type="button"
          disabled={saving || !state.name || !state.category || publishBlocked}
          title={
            publishBlocked
              ? "Resolve unmatched placeholders before publishing"
              : undefined
          }
          onClick={() => save(TemplateStatus.Published)}
          className="flex items-center gap-1.5 h-10 px-5 rounded-lg text-[13px] font-medium text-white bg-gray-800 border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Metadata" },
  { label: "Content" },
  { label: "Fields" },
  { label: "Review" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 px-8 py-4 border-b border-gray-100">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 transition-colors ${
                  done
                    ? "bg-gray-800 border-gray-800 text-white"
                    : active
                      ? "bg-white border-gray-800 text-gray-800"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium ${active ? "text-gray-900" : done ? "text-gray-500" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mb-5 transition-colors ${i < current ? "bg-gray-800" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── TemplateBuilder (main export) ───────────────────────────────────────────

export function TemplateBuilder({
  open,
  onClose,
  onSaved,
  editTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (template: DocumentTemplate) => void;
  editTemplate?: DocumentTemplate;
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>(EMPTY_STATE);
  const [fieldsPreviousIds, setFieldsPreviousIds] = useState<string[]>([]);
  const [stateInitialized, setStateInitialized] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!open) {
        setStateInitialized(false);
        return;
      }

      if (editTemplate) {
        // Strip the body wrapper and recover its font / bg / visibility so
        // the editor shows the naked HTML and the controls reflect the saved
        // settings (even when the backend doesn't yet round-trip the new
        // visibility / body-style columns).
        const unwrapped = unwrapEditorContent(editTemplate.content);
        const recoveredScope =
          (unwrapped.visibilityScope as
            | DocumentVisibilitySettings["scope"]
            | undefined) ?? editTemplate.visibilityScope;
        const recoveredRoles =
          unwrapped.allowedRoles && unwrapped.allowedRoles.length > 0
            ? (unwrapped.allowedRoles as DocumentVisibilitySettings["allowedRoles"])
            : editTemplate.allowedRoles;
        setState({
          name: editTemplate.name,
          description: editTemplate.description,
          category: editTemplate.category,
          visibility: editTemplate.visibility,
          visibilitySettings: {
            scope: recoveredScope,
            allowedRoles: recoveredRoles,
            preset: presetFromVisibility(recoveredScope, recoveredRoles),
          },
          status: editTemplate.status,
          content: unwrapped.html,
          fields: editTemplate.fields,
          bodyFontFamily:
            editTemplate.bodyFontFamily ??
            unwrapped.fontFamily ??
            DOCUMENT_EDITOR_DEFAULT_FONT,
          bodyBackgroundColor:
            editTemplate.bodyBackgroundColor ??
            unwrapped.backgroundColor ??
            DOCUMENT_EDITOR_DEFAULT_PAGE_BG,
        });
        setFieldsPreviousIds(editTemplate.fields.map((f) => f.id));
      } else {
        setState(EMPTY_STATE);
      }

      setStep(0);
      setStateInitialized(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, editTemplate]);

  // Autosave to localStorage (debounced 500ms) — only when not editing existing
  const patch = useCallback(
    (
      update:
        | Partial<BuilderState>
        | ((prev: BuilderState) => Partial<BuilderState>)
    ) => {
      setState((prev) => {
        const partial = typeof update === "function" ? update(prev) : update;
        const next = { ...prev, ...partial };

        if (
          editTemplate?.id &&
          partial.fields !== undefined &&
          partial.content === undefined
        ) {
          const prevIds = fieldsPreviousIds;
          const nextIds = (partial.fields as TemplateField[]).map((f) => f.id);
          const changed =
            prevIds.length !== nextIds.length ||
            prevIds.some((id, i) => id !== nextIds[i]);
          if (changed) {
            notifyWarning(
              "Changes to fields may affect documents already created from this template"
            );
            setFieldsPreviousIds(nextIds);
          }
        }

        if (!editTemplate) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            try {
              localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
          }, 500);
        }

        return next;
      });
    },
    [editTemplate, fieldsPreviousIds]
  );

  const commitEditorHtml = useCallback(
    (html: string) => {
      patch((prev) => ({
        content: html,
        fields: mergeTemplateFieldsFromPlaceholders(prev.fields, html),
      }));
    },
    [patch]
  );

  function validateStep(): boolean {
    if (step === 0) return Boolean(state.name.trim() && state.category);
    if (step === 2) return state.fields.every((f) => f.label.trim().length > 0);
    return true;
  }

  function handleNext() {
    if (!validateStep()) {
      notifyWarning(
        step === 0
          ? "Please fill in the template name and category before proceeding."
          : "Please fill in all field labels before proceeding."
      );
      return;
    }
    if (step === 1 && !state.content.trim()) {
      notifyWarning(
        "Content is empty — consider adding some before continuing."
      );
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function handleClose() {
    clearDraft();
    onClose();
  }

  function handleSaved(template: DocumentTemplate) {
    clearDraft();
    onSaved(template);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-[80] flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="my-4 flex w-full max-w-[min(1500px,calc(100vw-2rem))] flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-0">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900">
              {editTemplate ? "Edit template" : "New template"}
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {editTemplate
                ? `Editing "${editTemplate.name}"`
                : "Create a reusable document template"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <StepIndicator current={step} />

        {/* Step content */}
        <div className="px-8 py-6 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {step === 0 && (
            <TemplateBuilderStep1 state={state} onChange={patch} />
          )}
          {step === 1 && stateInitialized && (
            <TemplateBuilderStep2
              key={`editor-${editTemplate?.id ?? "new"}`}
              state={state}
              onContentChange={commitEditorHtml}
              onFieldsChange={(fields) => patch({ fields })}
              onChange={patch}
            />
          )}
          {step === 2 && (
            <TemplateBuilderStep3 state={state} onChange={patch} />
          )}
          {step === 3 && (
            <TemplateBuilderStep4
              state={state}
              editId={editTemplate?.id}
              onSaved={handleSaved}
            />
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          {step < 3 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-gray-800 border border-gray-800 hover:bg-gray-900 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
