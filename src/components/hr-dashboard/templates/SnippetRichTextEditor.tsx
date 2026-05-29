"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import {
  DOCUMENT_EDITOR_DEFAULT_FONT,
  DOCUMENT_EDITOR_DEFAULT_PAGE_BG,
  DOCUMENT_EDITOR_DEFAULT_TEXT_COLOR,
  FONT_FAMILY_OPTIONS,
  TPL_FIELD_DEFAULT_FONT_WEIGHT,
  combineTplFieldTextDecoration,
  getTplFieldSpansInSelection,
  normalizeLinkUrl,
  normalizeSemanticHeadings,
  plainTextToSanitizedHtml,
  sanitizePastedHtml,
  ensureSelectionInsideEditor,
  nodeIsInsideEditorRoot,
  normalizeTplFieldCaretAnchors,
  syncTplFieldBlocksTextAlign,
  TemplateEditorTextAlign,
  type TemplateEditorTextAlignValue,
} from "./templateEditorHelpers";

export function SnippetRichTextEditor({
  initialHtml,
  onHtmlChange,
  showBackgroundColorControl = true,
}: {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  showBackgroundColorControl?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState(
    DOCUMENT_EDITOR_DEFAULT_TEXT_COLOR
  );
  const [highlightColor, setHighlightColor] = useState("#ffffff");
  const [editorBgColor, setEditorBgColor] = useState(
    DOCUMENT_EDITOR_DEFAULT_PAGE_BG
  );
  const [editorFontFamily, setEditorFontFamily] = useState(
    DOCUMENT_EDITOR_DEFAULT_FONT
  );
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const initialSnapshot = useRef(initialHtml);

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
    const el = editorRef.current;
    if (!el) return;
    const raw = initialSnapshot.current;
    el.innerHTML = raw.trim().length > 0 ? raw : "<p><br></p>";
    normalizeTplFieldCaretAnchors(el);
  }, []);

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

  function emitChange() {
    onHtmlChange(normalizeSemanticHeadings(editorRef.current?.innerHTML ?? ""));
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
    if (editor) {
      normalizeTplFieldCaretAnchors(editor);
      ensureSelectionInsideEditor(editor);
    }
    emitChange();
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
    emitChange();
  }

  function applyTextColor(color: string) {
    restoreSelectionToEditor();
    document.execCommand("foreColor", false, color);
    applyToFieldSpansInSelection("color", color);
    emitChange();
  }

  function applyHighlightColor(color: string) {
    restoreSelectionToEditor();
    document.execCommand("backColor", false, color);
    applyToFieldSpansInSelection("backgroundColor", color);
    emitChange();
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
    const ed = editorRef.current;
    if (ed) {
      normalizeTplFieldCaretAnchors(ed);
      ensureSelectionInsideEditor(ed);
    }
    emitChange();
  }

  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const mod = e.ctrlKey || e.metaKey;
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
    if (e.key === "z" && mod && e.shiftKey) {
      e.preventDefault();
      execFormat("redo");
      return;
    }
  }

  function applyLinkFromPanel() {
    const normalized = normalizeLinkUrl(linkDraft);
    if (!normalized) return;
    restoreSelectionToEditor();
    execFormat("createLink", normalized);
    setLinkPanelOpen(false);
    setLinkDraft("");
  }

  const tRound =
    "flex items-center gap-0.5 rounded-xl border border-slate-200/80 bg-white px-1 py-1 shadow-sm";
  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] leading-snug text-slate-500">
        Select text and use the same formatting tools as in document templates.
        Paste from Word is cleaned automatically.
      </p>

      {linkPanelOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2.5 shadow-sm">
          <span className="text-[12px] font-medium text-slate-800">Link</span>
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
            className="min-w-[160px] flex-1 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] text-slate-900 outline-none focus:border-gray-400"
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

      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className={tRound}>
            <button
              type="button"
              title="Undo"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("undo");
              }}
              className={iconBtn}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Redo"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("redo");
              }}
              className={iconBtn}
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div className={tRound}>
            <button
              type="button"
              title="Heading 1"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("formatBlock", "<h1>");
              }}
              className={iconBtn}
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Heading 2"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("formatBlock", "<h2>");
              }}
              className={iconBtn}
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Heading 3"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("formatBlock", "<h3>");
              }}
              className={iconBtn}
            >
              <Heading3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Paragraph"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("formatBlock", "<p>");
              }}
              className="flex h-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              ¶
            </button>
          </div>

          <div className={tRound}>
            <button
              type="button"
              title="Bold"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("bold");
              }}
              className={iconBtn}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Italic"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("italic");
              }}
              className={iconBtn}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Underline"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("underline");
              }}
              className={iconBtn}
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Strikethrough"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("strikeThrough");
              }}
              className={iconBtn}
            >
              <Strikethrough className="h-4 w-4" />
            </button>
          </div>

          <div className={tRound}>
            <button
              type="button"
              title="Align left"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("justifyLeft");
              }}
              className={iconBtn}
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Align center"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("justifyCenter");
              }}
              className={iconBtn}
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Align right"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("justifyRight");
              }}
              className={iconBtn}
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Justify"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("justifyFull");
              }}
              className={iconBtn}
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>

          <div className={tRound}>
            <button
              type="button"
              title="Bullet list"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("insertUnorderedList");
              }}
              className={iconBtn}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Numbered list"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("insertOrderedList");
              }}
              className={iconBtn}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>

          <div className={tRound}>
            <button
              type="button"
              title="Insert link"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setLinkDraft("");
                setLinkPanelOpen(true);
              }}
              className={iconBtn}
            >
              <Link2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Remove link"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("unlink");
              }}
              className={iconBtn}
            >
              <Link2Off className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Horizontal rule"
              onMouseDown={(e) => {
                e.preventDefault();
                execFormat("insertHorizontalRule");
              }}
              className={iconBtn}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-2">
          <label
            className="flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 shadow-sm hover:bg-slate-50"
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
            className="flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 shadow-sm hover:bg-slate-50"
            title="Highlight"
            onMouseDown={() => saveSelection()}
          >
            <span className="text-[11px] font-semibold text-slate-500">HL</span>
            <span
              className="h-4 w-4 shrink-0 rounded border border-slate-300"
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

          {showBackgroundColorControl && (
            <label
              className="flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 shadow-sm hover:bg-slate-50"
              title="Background"
              onMouseDown={() => saveSelection()}
            >
              <span className="text-[11px] font-semibold text-slate-500">
                Bg
              </span>
              <span
                className="h-4 w-4 shrink-0 rounded border border-slate-300"
                style={{ backgroundColor: editorBgColor }}
              />
              <input
                type="color"
                value={editorBgColor}
                onChange={(e) => setEditorBgColor(e.target.value)}
                className="sr-only"
              />
            </label>
          )}

          <div className="relative z-[140]" ref={fontDropdownRef}>
            <button
              type="button"
              title="Font"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setFontDropdownOpen((v) => !v);
              }}
              className="flex h-9 min-w-[110px] max-w-[150px] items-center gap-1 rounded-xl border border-slate-200/80 bg-white pl-2.5 pr-1.5 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span
                className="min-w-0 flex-1 truncate text-left"
                style={{ fontFamily: editorFontFamily }}
              >
                {FONT_FAMILY_OPTIONS.find((o) => o.value === editorFontFamily)
                  ?.label ?? "Font"}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
            </button>
            {fontDropdownOpen && (
              <div className="absolute left-0 top-full z-[140] mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {FONT_FAMILY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFont(opt.value);
                      setFontDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${
                      editorFontFamily === opt.value
                        ? "bg-gray-100 text-gray-900"
                        : "text-slate-700"
                    }`}
                  >
                    <span style={{ fontFamily: opt.value }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
        onBlur={saveSelection}
        onKeyDown={handleEditorKeyDown}
        className="template-editor min-h-[280px] rounded-2xl border border-slate-200/90 bg-white p-4 text-[14px] text-slate-900 shadow-inner outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/25"
        style={{
          lineHeight: 1.7,
          backgroundColor: editorBgColor,
          fontFamily: editorFontFamily,
        }}
      />
    </div>
  );
}
