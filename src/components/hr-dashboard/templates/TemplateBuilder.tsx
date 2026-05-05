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
  Minus,
  Image as ImageIcon,
  Type,
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
  getTemplateCategoryColor,
  getTemplateCategoryLabel,
} from "@/lib/templates/templatesHelpers";
import { templatesApi } from "@/lib/api/modules/templates";
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
  visibility: TemplateVisibility;
  status: TemplateStatus;
  content: string;
  fields: TemplateField[];
}

const EMPTY_STATE: BuilderState = {
  name: "",
  description: "",
  category: "",
  visibility: TemplateVisibility.Private,
  status: TemplateStatus.Draft,
  content: "",
  fields: [],
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
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          {[
            { value: TemplateVisibility.Private, label: "Private" },
            { value: TemplateVisibility.Shared, label: "Shared" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ visibility: value })}
              className={`px-5 py-2 text-[13px] font-medium transition-colors ${
                state.visibility === value
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-gray-400 mt-1.5">
          {state.visibility === TemplateVisibility.Private
            ? "Only visible to HR admins"
            : "Visible to all HR users"}
        </p>
      </div>
    </div>
  );
}

// ─── Step 2 — Content editor ──────────────────────────────────────────────────

const FONT_FAMILY_OPTIONS = [
  { label: "Sans-serif", value: "system-ui, -apple-system, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Palatino", value: "'Palatino Linotype', Palatino, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Monospace", value: "ui-monospace, 'Cascadia Code', monospace" },
];

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
        className={cls}
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

function TemplateBuilderStep2({
  state,
  onContentChange,
  onFieldsChange,
}: {
  state: BuilderState;
  onContentChange: (html: string) => void;
  onFieldsChange: (fields: TemplateField[]) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [fieldPanelOpen, setFieldPanelOpen] = useState(false);
  const [newFieldMode, setNewFieldMode] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<TemplateFieldType>(
    TemplateFieldType.Text
  );
  const fieldPanelRef = useRef<HTMLDivElement>(null);
  const newFieldInputRef = useRef<HTMLInputElement>(null);
  const [editorBgColor, setEditorBgColor] = useState("#ffffff");
  const [editorFontFamily, setEditorFontFamily] = useState(
    FONT_FAMILY_OPTIONS[0].value
  );
  // ─ Text color / highlight / font dropdown ─────────────────────────────────
  const [textColor, setTextColor] = useState("#111827");
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
  // ─ Chip-popup font dropdown ─────────────────────────────────────────────────
  const [chipFontDropdownOpen, setChipFontDropdownOpen] = useState(false);
  const [chipFontDropdownPos, setChipFontDropdownPos] = useState({
    x: 0,
    y: 0,
  });
  const chipFontBtnRef = useRef<HTMLButtonElement>(null);

  // Initialize content once on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = state.content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Sync local editing + style state whenever a new field chip is clicked
  useEffect(() => {
    if (!fieldEditTarget) return;
    const { field, span } = fieldEditTarget;
    setEditingLabel(field.label);
    setEditingType(field.type);
    setPreviewValue(field.defaultValue ?? "");
    // Read current inline styles from the span so controls start at the right values
    const s = span.style;
    setChipFontFamily(s.fontFamily || "");
    setChipFontSize(s.fontSize ? s.fontSize.replace(/[^0-9.]/g, "") : "13");
    setChipTextColor(s.color || "#0e7490");
    setChipBgColor(s.backgroundColor || "#cffafe");
    setChipBold(s.fontWeight === "bold" || s.fontWeight === "700");
    setChipItalic(s.fontStyle === "italic");
    setChipFontDropdownOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldEditTarget?.field.key]);

  // Close field popup when clicking outside both the popup and .tpl-field spans
  useEffect(() => {
    if (!fieldEditTarget) return;
    function handleOutside(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (
        fieldPopupRef.current &&
        !fieldPopupRef.current.contains(t) &&
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
    function handleOutside() {
      setChipFontDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [chipFontDropdownOpen]);

  // ─── Selection helpers ──────────────────────────────────────────────────────

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Only save if selection is inside the editor
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }

  function restoreSelectionToEditor() {
    editorRef.current?.focus();
    const range = savedRangeRef.current;
    if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  // ─── Formatting ─────────────────────────────────────────────────────────────

  /**
   * Apply an execCommand while keeping/restoring the editor selection.
   * Toolbar buttons use onMouseDown + e.preventDefault() which keeps the
   * editor focused, so we just call execCommand directly.  We also call
   * editorRef.current.focus() as a safety net for when focus was lost.
   */
  function execFormat(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val ?? undefined);
    onContentChange(editorRef.current?.innerHTML ?? "");
  }

  /**
   * Apply an inline CSS property to every .tpl-field span whose DOM node
   * intersects the current selection.  Used so that font / color commands
   * work on field chips just like on regular text.
   */
  function applyToFieldSpansInSelection(cssProp: string, value: string) {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    editor.querySelectorAll<HTMLElement>(".tpl-field").forEach((span) => {
      if (range.intersectsNode(span)) {
        (span.style as unknown as Record<string, string>)[cssProp] = value;
      }
    });
  }

  function applyFont(fontValue: string) {
    restoreSelectionToEditor();
    document.execCommand("fontName", false, fontValue);
    applyToFieldSpansInSelection("fontFamily", fontValue);
    setEditorFontFamily(fontValue);
    onContentChange(editorRef.current?.innerHTML ?? "");
  }

  function applyTextColor(color: string) {
    restoreSelectionToEditor();
    document.execCommand("foreColor", false, color);
    applyToFieldSpansInSelection("color", color);
    onContentChange(editorRef.current?.innerHTML ?? "");
  }

  function applyHighlightColor(color: string) {
    restoreSelectionToEditor();
    document.execCommand("backColor", false, color);
    applyToFieldSpansInSelection("backgroundColor", color);
    onContentChange(editorRef.current?.innerHTML ?? "");
  }

  // ─── Field click popup handlers ──────────────────────────────────────────────

  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
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
    onContentChange(editorRef.current?.innerHTML ?? "");
    setFieldEditTarget(null);
  }

  function deleteFieldCompletely() {
    if (!fieldEditTarget) return;
    const key = fieldEditTarget.field.key;
    editorRef.current
      ?.querySelectorAll<HTMLElement>(`.tpl-field[data-field-key="${key}"]`)
      .forEach((s) => s.remove());
    onFieldsChange(state.fields.filter((f) => f.key !== key));
    onContentChange(editorRef.current?.innerHTML ?? "");
    setFieldEditTarget(null);
  }

  /** Apply a CSS property directly to the clicked chip span and persist. */
  function applyChipStyle(prop: string, value: string) {
    if (!fieldEditTarget) return;
    (fieldEditTarget.span.style as unknown as Record<string, string>)[prop] =
      value;
    onContentChange(editorRef.current?.innerHTML ?? "");
  }

  /** Open the chip font dropdown anchored to the font button. */
  function openChipFontDropdown() {
    const btn = chipFontBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setChipFontDropdownPos({ x: r.left, y: r.bottom + 4 });
    setChipFontDropdownOpen((v) => !v);
  }

  /** Ctrl/Cmd+A selects only content inside the editor, not the whole page. */
  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  // ─── Field panel ────────────────────────────────────────────────────────────

  function openFieldPanel() {
    saveSelection();
    setNewFieldMode(false);
    setNewFieldLabel("");
    setNewFieldType(TemplateFieldType.Text);
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
    // Inline style as fallback for wherever the template HTML is rendered
    span.style.cssText =
      "background:#cffafe;color:#0e7490;border-radius:4px;padding:1px 6px;font-size:12px;font-weight:500;display:inline-block;";

    // Restore focus + selection, then insert
    editor.focus();
    const range = savedRangeRef.current;
    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else {
      // Fallback: append at end
      const r = document.createRange();
      r.selectNodeContents(editor);
      r.collapse(false);
      r.insertNode(span);
      r.setStartAfter(span);
      r.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    }

    onContentChange(editor.innerHTML);
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
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(div);
        range.setStartAfter(div);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        onContentChange(editor.innerHTML);
        return;
      }
    }
    editor.appendChild(div);
    onContentChange(editor.innerHTML);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        {/* Block format buttons — onMouseDown + preventDefault keeps editor focused */}
        <button
          type="button"
          title="Heading 1"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("formatBlock", "<h1>");
          }}
          className="h-7 px-2.5 rounded text-[12px] font-bold text-gray-700 hover:bg-gray-200 transition-colors"
        >
          H1
        </button>
        <button
          type="button"
          title="Heading 2"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("formatBlock", "<h2>");
          }}
          className="h-7 px-2.5 rounded text-[12px] font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
        >
          H2
        </button>
        <button
          type="button"
          title="Paragraph"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("formatBlock", "<p>");
          }}
          className="h-7 px-2.5 rounded text-[12px] text-gray-700 hover:bg-gray-200 transition-colors"
        >
          P
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          title="Bold"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("bold");
          }}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Italic"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("italic");
          }}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Bullet list"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("insertUnorderedList");
          }}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Horizontal rule"
          onMouseDown={(e) => {
            e.preventDefault();
            execFormat("insertHorizontalRule");
          }}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Image placeholder"
          onMouseDown={(e) => {
            e.preventDefault();
            insertImagePlaceholder();
          }}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Text color */}
        <label
          className="flex items-center gap-1 cursor-pointer h-7 px-2 rounded hover:bg-gray-200 transition-colors select-none"
          title="Text color"
          onMouseDown={() => saveSelection()}
        >
          <span
            className="text-[13px] font-bold leading-none"
            style={{ color: textColor }}
          >
            A
          </span>
          <span
            className="w-4 h-[3px] rounded-sm flex-shrink-0"
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

        {/* Text highlight */}
        <label
          className="flex items-center gap-1 cursor-pointer h-7 px-2 rounded hover:bg-gray-200 transition-colors select-none"
          title="Text highlight"
          onMouseDown={() => saveSelection()}
        >
          <span className="text-[11px] font-medium text-gray-600">H</span>
          <span
            className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
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

        {/* Page background */}
        <label
          className="flex items-center gap-1 cursor-pointer h-7 px-2 rounded hover:bg-gray-200 transition-colors select-none"
          title="Page background"
        >
          <span className="text-[11px] font-medium text-gray-600">Pg</span>
          <span
            className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: editorBgColor }}
          />
          <input
            type="color"
            value={editorBgColor}
            onChange={(e) => setEditorBgColor(e.target.value)}
            className="sr-only"
          />
        </label>

        {/* Font family — custom dropdown */}
        <div className="relative" ref={fontDropdownRef}>
          <button
            type="button"
            title="Font family"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setFontDropdownOpen((v) => !v);
            }}
            className="h-7 pl-2.5 pr-1.5 flex items-center gap-1 text-[12px] font-medium text-gray-700 border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors min-w-[110px] max-w-[140px]"
          >
            <span
              className="truncate flex-1 text-left"
              style={{ fontFamily: editorFontFamily }}
            >
              {FONT_FAMILY_OPTIONS.find((o) => o.value === editorFontFamily)
                ?.label ?? "Font"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
          </button>
          {fontDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-40 py-1 overflow-hidden">
              {FONT_FAMILY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFont(opt.value);
                    setFontDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    editorFontFamily === opt.value
                      ? "text-cyan-700 bg-cyan-50"
                      : "text-gray-700"
                  }`}
                >
                  <span style={{ fontFamily: opt.value }}>{opt.label}</span>
                  <span
                    style={{ fontFamily: opt.value }}
                    className="text-[12px] text-gray-400"
                  >
                    Aa
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Insert field panel */}
        <div className="relative" ref={fieldPanelRef}>
          {/* The trigger button uses onMouseDown to save selection BEFORE focus leaves the editor */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              openFieldPanel();
            }}
            className="h-7 px-3 rounded text-[12px] font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center gap-1.5"
          >
            <Type className="w-3 h-3" /> Insert field
          </button>

          {fieldPanelOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
              {!newFieldMode ? (
                <>
                  {/* Existing fields */}
                  {state.fields.length > 0 && (
                    <div className="py-1.5 max-h-48 overflow-y-auto">
                      {state.fields.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => insertFieldSpan(f)}
                          className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <span className="inline-block bg-cyan-50 text-cyan-700 text-[11px] font-medium px-1.5 py-0.5 rounded flex-shrink-0">
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
                      ))}
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
                    className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-cyan-700 hover:bg-cyan-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-3 h-3 text-cyan-600" />
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
                      className="h-8 w-full px-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-md bg-white outline-none focus:border-cyan-400 transition-colors"
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
                      {FIELD_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewFieldType(opt.value)}
                          className={`h-6 px-2 rounded text-[11px] font-medium border transition-colors ${
                            newFieldType === opt.value
                              ? "bg-cyan-600 text-white border-cyan-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-700"
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
                      className="flex-1 h-7 text-[12px] font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover / cursor styles for tpl-field chips */}
      <style>{`
        .template-editor .tpl-field {
          cursor: pointer;
          transition: box-shadow 0.12s, filter 0.12s;
        }
        .template-editor .tpl-field:hover {
          filter: brightness(0.93);
          box-shadow: 0 0 0 2px rgba(6,182,212,0.45);
        }
      `}</style>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onContentChange(editorRef.current?.innerHTML ?? "")}
        onBlur={saveSelection}
        onClick={handleEditorClick}
        onKeyDown={handleEditorKeyDown}
        className="template-editor min-h-[360px] border border-gray-200 rounded-lg p-4 text-[14px] text-gray-900 outline-none focus:border-gray-400 transition-colors"
        style={{
          lineHeight: 1.7,
          backgroundColor: editorBgColor,
          fontFamily: editorFontFamily,
        }}
      />

      {state.content === "" && (
        <p className="text-[11.5px] text-amber-600 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Content is empty — you can
          still proceed and add content later.
        </p>
      )}

      {/* ── Field chip popup ─────────────────────────────────────────────────── */}
      {fieldEditTarget && (
        <div
          ref={fieldPopupRef}
          style={{
            position: "fixed",
            left: Math.min(fieldEditTarget.x, window.innerWidth - 300),
            ...(fieldEditTarget.above
              ? { bottom: window.innerHeight - fieldEditTarget.y + 6 }
              : { top: fieldEditTarget.y + 6 }),
            zIndex: 60,
            width: 292,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2.5 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {fieldEditTarget.field.label}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
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

          <div className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
            {/* ── Style section ── */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Style
              </p>

              {/* Row 1: font + size */}
              <div className="flex items-center gap-2">
                {/* Font button — opens separate overlay */}
                <button
                  ref={chipFontBtnRef}
                  type="button"
                  onClick={openChipFontDropdown}
                  className="flex-1 h-8 pl-2.5 pr-1.5 flex items-center gap-1 text-[12px] font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors min-w-0"
                >
                  <span
                    className="truncate flex-1 text-left"
                    style={{ fontFamily: chipFontFamily || editorFontFamily }}
                  >
                    {FONT_FAMILY_OPTIONS.find((o) => o.value === chipFontFamily)
                      ?.label ?? "Default"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                </button>
                {/* Size */}
                <div className="flex items-center gap-0.5 border border-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const s = String(
                        Math.max(8, parseInt(chipFontSize || "13") - 1)
                      );
                      setChipFontSize(s);
                      applyChipStyle("fontSize", s + "px");
                    }}
                    className="w-6 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-[14px] font-bold"
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
                    className="w-8 h-8 text-center text-[12px] text-gray-900 outline-none border-x border-gray-200 bg-white"
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
                    className="w-6 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-[14px] font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  px
                </span>
              </div>

              {/* Row 2: text color, bg color, bold, italic */}
              <div className="flex items-center gap-1.5">
                {/* Text color */}
                <label
                  className="flex items-center gap-1 h-8 px-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  title="Text color"
                >
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: chipTextColor }}
                  >
                    A
                  </span>
                  <span
                    className="w-3 h-[3px] rounded-sm"
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
                {/* Background color */}
                <label
                  className="flex items-center gap-1 h-8 px-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  title="Background color"
                >
                  <span className="text-[11px] font-medium text-gray-500">
                    Bg
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded border border-gray-300"
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
                {/* Bold */}
                <button
                  type="button"
                  title="Bold"
                  onClick={() => {
                    const next = !chipBold;
                    setChipBold(next);
                    applyChipStyle("fontWeight", next ? "700" : "500");
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors text-[13px] font-bold ${
                    chipBold
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  B
                </button>
                {/* Italic */}
                <button
                  type="button"
                  title="Italic"
                  onClick={() => {
                    const next = !chipItalic;
                    setChipItalic(next);
                    applyChipStyle("fontStyle", next ? "italic" : "normal");
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors text-[13px] italic ${
                    chipItalic
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <em>I</em>
                </button>
                {/* Reset styles */}
                <button
                  type="button"
                  title="Reset to default"
                  onClick={() => {
                    const span = fieldEditTarget.span;
                    span.style.cssText =
                      "background:#cffafe;color:#0e7490;border-radius:4px;padding:1px 6px;font-size:13px;font-weight:500;display:inline-block;";
                    setChipFontFamily("");
                    setChipFontSize("13");
                    setChipTextColor("#0e7490");
                    setChipBgColor("#cffafe");
                    setChipBold(false);
                    setChipItalic(false);
                    onContentChange(editorRef.current?.innerHTML ?? "");
                  }}
                  className="ml-auto text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
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
                className="h-8 w-full px-2.5 text-[13px] text-gray-900 border border-gray-200 rounded-md outline-none focus:border-cyan-400 transition-colors"
              />
              <div className="flex flex-wrap gap-1">
                {FIELD_TYPE_OPTIONS.map((opt) => (
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
                        ? "bg-cyan-600 text-white border-cyan-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-700"
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
      )}

      {/* ── Chip font dropdown overlay (fixed, escapes popup overflow) ────────── */}
      {chipFontDropdownOpen && fieldEditTarget && (
        <div
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
            onClick={() => {
              setChipFontFamily("");
              applyChipStyle("fontFamily", "");
              setChipFontDropdownOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
              !chipFontFamily
                ? "text-cyan-700 bg-cyan-50"
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
              onClick={() => {
                setChipFontFamily(opt.value);
                applyChipStyle("fontFamily", opt.value);
                setChipFontDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
                chipFontFamily === opt.value
                  ? "text-cyan-700 bg-cyan-50"
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
                {FIELD_TYPE_OPTIONS.map((opt) => (
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
    setSaving(true);
    const payload: TemplatePayload = {
      name: state.name,
      description: state.description,
      category: state.category as TemplateCategory,
      visibility: state.visibility,
      status,
      content: state.content,
      fields: state.fields,
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

  return (
    <div className="space-y-5">
      {/* Template preview */}
      <div>
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Content preview
        </h3>
        <div
          className="border border-gray-200 rounded-lg p-5 bg-white prose prose-sm max-w-none min-h-[120px] text-[13.5px] text-gray-800"
          style={{ lineHeight: 1.7 }}
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
            <div className="text-[13px] font-medium text-gray-900 capitalize">
              {state.visibility}
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
          disabled={saving || !state.name || !state.category}
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
        setState({
          name: editTemplate.name,
          description: editTemplate.description,
          category: editTemplate.category,
          visibility: editTemplate.visibility,
          status: editTemplate.status,
          content: editTemplate.content,
          fields: editTemplate.fields,
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
    (update: Partial<BuilderState>) => {
      setState((prev) => {
        const next = { ...prev, ...update };

        // Warn if fields changed during edit
        if (editTemplate?.id && update.fields !== undefined) {
          const prevIds = fieldsPreviousIds;
          const nextIds = (update.fields as TemplateField[]).map((f) => f.id);
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
        className="bg-white rounded-xl w-full max-w-[860px] flex flex-col shadow-2xl my-4"
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
              onContentChange={(html) => patch({ content: html })}
              onFieldsChange={(fields) => patch({ fields })}
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
        {step < 3 && (
          <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white bg-gray-800 border border-gray-800 hover:bg-gray-900 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
