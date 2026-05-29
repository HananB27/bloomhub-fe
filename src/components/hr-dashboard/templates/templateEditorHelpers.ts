import type { TemplateField } from "@/lib/templates/templatesHelpers";
import {
  TemplateFieldType,
  displayLabelForPlaceholder,
  labelToKey,
} from "@/lib/templates/templatesHelpers";

export const DOCUMENT_EDITOR_DEFAULT_FONT =
  "system-ui, -apple-system, sans-serif";

export const DOCUMENT_EDITOR_DEFAULT_TEXT_COLOR = "#111827";

export const DOCUMENT_EDITOR_DEFAULT_PAGE_BG = "#ffffff";

// ─── Body-style wrapper ─────────────────────────────────────────────────────
// Persists the page-level font-family / background colour by wrapping the
// editor's HTML in a marker `<div>`. This way the body styling rides along
// inside the saved `content` itself, without needing a separate API field.
// `wrapEditorContentWithBodyStyles` runs before save; `unwrapEditorContent`
// runs on load and returns the inner HTML + the styles it found.

export const TEMPLATE_BODY_WRAPPER_ATTR = "data-template-body";
const TEMPLATE_VISIBILITY_SCOPE_ATTR = "data-visibility-scope";
const TEMPLATE_ALLOWED_ROLES_ATTR = "data-allowed-roles";
const FONT_FAMILY_STYLE_REGEX = /font-family\s*:\s*([^;"]+)/i;
const BACKGROUND_COLOR_STYLE_REGEX = /background-color\s*:\s*([^;"]+)/i;
const TEMPLATE_BODY_WRAPPER_OPEN_REGEX = new RegExp(
  `^\\s*<div\\b[^>]*\\b${TEMPLATE_BODY_WRAPPER_ATTR}\\b[^>]*>`,
  "i"
);
const TEMPLATE_BODY_WRAPPER_CLOSE_REGEX = /<\/div>\s*$/i;

interface BodyWrapperOptions {
  fontFamily: string;
  backgroundColor: string;
  /** Optional — embedded so visibility persists even if the backend doesn't store the new fields yet. */
  visibilityScope?: string;
  /** Optional — comma-separated role keys (e.g. "employee,manager"). */
  allowedRoles?: ReadonlyArray<string>;
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

export function wrapEditorContentWithBodyStyles(
  html: string,
  options: BodyWrapperOptions
): string {
  // Always strip an existing wrapper first so re-saves don't nest.
  const inner = unwrapEditorContent(html).html;
  const escapedFont = escapeAttr(options.fontFamily);
  const escapedBg = escapeAttr(options.backgroundColor);
  const scopeAttr = options.visibilityScope
    ? ` ${TEMPLATE_VISIBILITY_SCOPE_ATTR}="${escapeAttr(options.visibilityScope)}"`
    : "";
  const rolesAttr =
    options.allowedRoles && options.allowedRoles.length > 0
      ? ` ${TEMPLATE_ALLOWED_ROLES_ATTR}="${escapeAttr(options.allowedRoles.join(","))}"`
      : "";
  return `<div ${TEMPLATE_BODY_WRAPPER_ATTR}${scopeAttr}${rolesAttr} style="font-family: ${escapedFont}; background-color: ${escapedBg};">${inner}</div>`;
}

export interface UnwrappedEditorContent {
  html: string;
  fontFamily?: string;
  backgroundColor?: string;
  visibilityScope?: string;
  allowedRoles?: string[];
}

export function unwrapEditorContent(html: string): UnwrappedEditorContent {
  const openMatch = html.match(TEMPLATE_BODY_WRAPPER_OPEN_REGEX);
  if (!openMatch) return { html };
  const openTag = openMatch[0];
  const closeMatch = html.match(TEMPLATE_BODY_WRAPPER_CLOSE_REGEX);
  if (!closeMatch) return { html };
  const inner = html
    .slice(openTag.length, html.length - closeMatch[0].length)
    .trim();
  const styleMatch = openTag.match(/style\s*=\s*"([^"]*)"/i);
  const styleStr = styleMatch ? styleMatch[1] : "";
  const fontMatch = styleStr.match(FONT_FAMILY_STYLE_REGEX);
  const bgMatch = styleStr.match(BACKGROUND_COLOR_STYLE_REGEX);
  const scopeMatch = openTag.match(
    new RegExp(`${TEMPLATE_VISIBILITY_SCOPE_ATTR}\\s*=\\s*"([^"]*)"`, "i")
  );
  const rolesMatch = openTag.match(
    new RegExp(`${TEMPLATE_ALLOWED_ROLES_ATTR}\\s*=\\s*"([^"]*)"`, "i")
  );
  const rolesList = rolesMatch
    ? rolesMatch[1]
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : undefined;
  return {
    html: inner,
    fontFamily: fontMatch ? fontMatch[1].trim() : undefined,
    backgroundColor: bgMatch ? bgMatch[1].trim() : undefined,
    visibilityScope: scopeMatch ? scopeMatch[1].trim() : undefined,
    allowedRoles: rolesList,
  };
}

export const TPL_FIELD_DEFAULT_FONT_WEIGHT = "500";

export const TPL_FIELD_CHIP_INLINE_STYLE =
  "background:#cffafe;color:#0e7490;border-radius:4px;padding:1px 6px;font-size:12px;font-weight:500;display:inline-block;";

export const FONT_FAMILY_OPTIONS: ReadonlyArray<{
  label: string;
  value: string;
}> = [
  { label: "Sans-serif", value: DOCUMENT_EDITOR_DEFAULT_FONT },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Palatino", value: "'Palatino Linotype', Palatino, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Monospace", value: "ui-monospace, 'Cascadia Code', monospace" },
];

export enum TemplateSnippetId {
  SignatureBlock = "signature_block",
  ConfidentialFooter = "confidential_footer",
  NoticeClosing = "notice_closing",
  BulletedTerms = "bulleted_terms",
  TableRoles = "table_roles",
}

export interface TemplateEditorSnippet {
  id: TemplateSnippetId;
  label: string;
  category: string;
  html: string;
}

export const TEMPLATE_EDITOR_SNIPPETS: ReadonlyArray<TemplateEditorSnippet> = [
  {
    id: TemplateSnippetId.SignatureBlock,
    label: "Signature block",
    category: "Signatures",
    html: `<p><br></p><p>Sincerely,</p><p><br></p><p>_________________________<br>{{signatory_name}}<br>{{signatory_title}}</p>`,
  },
  {
    id: TemplateSnippetId.ConfidentialFooter,
    label: "Confidentiality footer",
    category: "Footers",
    html: `<p style="font-size:12px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px;">This document contains confidential information intended only for the addressee. Unauthorized review, use, or distribution is prohibited.</p>`,
  },
  {
    id: TemplateSnippetId.NoticeClosing,
    label: "Formal closing",
    category: "Closings",
    html: `<p>Please confirm receipt of this notice by {{confirmation_deadline}}.</p><p>If you have questions, contact {{contact_name}} at {{contact_email}}.</p>`,
  },
  {
    id: TemplateSnippetId.BulletedTerms,
    label: "Numbered obligations",
    category: "Lists",
    html: `<ol><li>{{obligation_one}}</li><li>{{obligation_two}}</li><li>{{obligation_three}}</li></ol>`,
  },
  {
    id: TemplateSnippetId.TableRoles,
    label: "Roles table (3×2)",
    category: "Tables",
    html: `<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb;">Role</th><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb;">Name</th></tr></thead><tbody><tr><td style="border:1px solid #e5e7eb;padding:8px;">{{role_one}}</td><td style="border:1px solid #e5e7eb;padding:8px;">{{name_one}}</td></tr><tr><td style="border:1px solid #e5e7eb;padding:8px;">{{role_two}}</td><td style="border:1px solid #e5e7eb;padding:8px;">{{name_two}}</td></tr></tbody></table>`,
  },
];

/** Apply built-in snippet overrides (saved by users in the Manage dialog) on
 *  top of the static defaults. Returns a new array with overrides applied;
 *  unchanged snippets pass through. */
export function applyBuiltinSnippetOverrides(
  base: ReadonlyArray<TemplateEditorSnippet>,
  overrides: Record<string, { label: string; html: string }>
): TemplateEditorSnippet[] {
  return base.map((s) => {
    const o = overrides[s.id];
    return o ? { ...s, label: o.label, html: o.html } : s;
  });
}

/** Group snippets by their `category` field, preserving the order in which
 *  categories first appear in the input. */
export function groupSnippetsByCategory<T extends { category: string }>(
  items: ReadonlyArray<T>
): Array<{ category: string; items: T[] }> {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const it of items) {
    if (!map.has(it.category)) {
      order.push(it.category);
      map.set(it.category, []);
    }
    map.get(it.category)!.push(it);
  }
  return order.map((category) => ({ category, items: map.get(category)! }));
}

const ALLOWED_PASTE_TAGS = new Set([
  "P",
  "BR",
  "H1",
  "H2",
  "H3",
  "H4",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "STRIKE",
  "UL",
  "OL",
  "LI",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
  "HR",
  "BLOCKQUOTE",
  "A",
  "DIV",
]);

function escapeHtmlText(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainTextToSanitizedHtml(text: string): string {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return "";
  const blocks = trimmed.split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const inner = escapeHtmlText(block).replace(/\n/g, "<br>");
      return `<p>${inner}</p>`;
    })
    .join("");
}

function sanitizeHref(raw: string): string | null {
  const t = raw.trim();
  if (
    t.startsWith("https://") ||
    t.startsWith("http://") ||
    t.startsWith("mailto:")
  ) {
    return t;
  }
  if (t.startsWith("/") && !t.startsWith("//")) {
    return t;
  }
  return null;
}

function stripElementAttributes(el: HTMLElement, tag: string): void {
  const href = tag === "A" ? (el.getAttribute("href")?.trim() ?? "") : "";
  const colspan =
    tag === "TD" || tag === "TH" ? el.getAttribute("colspan") : null;
  const rowspan =
    tag === "TD" || tag === "TH" ? el.getAttribute("rowspan") : null;
  while (el.attributes.length > 0) {
    el.removeAttribute(el.attributes[0].name);
  }
  if (tag === "A") {
    const safe = sanitizeHref(href);
    if (safe) el.setAttribute("href", safe);
  }
  if ((tag === "TD" || tag === "TH") && colspan) {
    const n = Number(colspan);
    if (Number.isFinite(n) && n >= 1 && n <= 24) {
      el.setAttribute("colspan", String(Math.floor(n)));
    }
  }
  if ((tag === "TD" || tag === "TH") && rowspan) {
    const n = Number(rowspan);
    if (Number.isFinite(n) && n >= 1 && n <= 24) {
      el.setAttribute("rowspan", String(Math.floor(n)));
    }
  }
}

function cleanPasteTree(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.parentNode?.removeChild(child);
      continue;
    }
    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME") {
      el.parentNode?.removeChild(el);
      continue;
    }
    if (!ALLOWED_PASTE_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      continue;
    }
    stripElementAttributes(el, tag);
    cleanPasteTree(el);
  }
}

export function sanitizePastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  cleanPasteTree(doc.body);
  return doc.body.innerHTML;
}

function headingLevelFromClass(className: string): 1 | 2 | 3 | null {
  const normalized = className.toLowerCase().replace(/[_\s]+/g, "-");
  if (/\bh1\b|\bheading-?1\b|\bheading-one\b/.test(normalized)) return 1;
  if (/\bh2\b|\bheading-?2\b|\bheading-two\b/.test(normalized)) return 2;
  if (/\bh3\b|\bheading-?3\b|\bheading-three\b/.test(normalized)) return 3;
  if (/\bheading\b/.test(normalized)) return 1;
  return null;
}

function cssSizeToPx(raw: string): number | null {
  const value = raw.trim().toLowerCase();
  const match = value.match(/^(\d+(?:\.\d+)?)(px|pt|rem|em)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = match[2];
  if (unit === "px") return amount;
  if (unit === "pt") return amount * (4 / 3);
  if (unit === "rem" || unit === "em") return amount * 16;
  return null;
}

function headingLevelFromStyle(el: HTMLElement): 1 | 2 | 3 | null {
  const size = el.style.fontSize ? cssSizeToPx(el.style.fontSize) : null;
  if (size === null) return null;
  if (size >= 28) return 1;
  if (size >= 22) return 2;
  if (size >= 18) return 3;
  return null;
}

function semanticHeadingLevel(el: HTMLElement): 1 | 2 | 3 | null {
  const tag = el.tagName.toUpperCase();
  if (tag === "H1" || tag === "H2" || tag === "H3") {
    return Number(tag.slice(1)) as 1 | 2 | 3;
  }
  return headingLevelFromClass(el.className) ?? headingLevelFromStyle(el);
}

function replaceWithSemanticHeading(
  doc: Document,
  el: HTMLElement,
  level: 1 | 2 | 3
): HTMLElement {
  if (el.tagName.toUpperCase() === `H${level}`) return el;
  const heading = doc.createElement(`h${level}`);
  while (el.firstChild) heading.appendChild(el.firstChild);
  el.replaceWith(heading);
  return heading;
}

function isOnlyMeaningfulChild(
  parent: HTMLElement,
  child: HTMLElement
): boolean {
  return Array.from(parent.childNodes).every((node) => {
    if (node === child) return true;
    return node.nodeType === Node.TEXT_NODE && !node.textContent?.trim();
  });
}

/**
 * Convert editor/browser heading fallbacks into semantic heading tags before
 * save. Some contenteditable implementations or pasted sources represent
 * headings as styled paragraphs/spans; announcement delivery needs h1-h3.
 */
export function normalizeSemanticHeadings(html: string): string {
  if (!html.trim()) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const candidates = Array.from(
    doc.body.querySelectorAll<HTMLElement>("h1,h2,h3,p,div,span")
  );

  for (const el of candidates) {
    if (!el.isConnected) continue;

    const directLevel = semanticHeadingLevel(el);
    const tag = el.tagName.toUpperCase();
    if (directLevel && (tag === "H1" || tag === "H2" || tag === "H3")) {
      el.removeAttribute("class");
      el.removeAttribute("style");
      continue;
    }

    if (directLevel && (tag === "P" || tag === "DIV" || tag === "SPAN")) {
      const heading = replaceWithSemanticHeading(doc, el, directLevel);
      heading.removeAttribute("class");
      heading.removeAttribute("style");
      continue;
    }

    if (tag !== "P" && tag !== "DIV") continue;
    const child = Array.from(el.children).find(
      (item): item is HTMLElement => item instanceof HTMLElement
    );
    if (!child || !isOnlyMeaningfulChild(el, child)) continue;
    const childLevel = semanticHeadingLevel(child);
    if (!childLevel) continue;

    while (child.firstChild) el.insertBefore(child.firstChild, child);
    child.remove();
    const heading = replaceWithSemanticHeading(doc, el, childLevel);
    heading.removeAttribute("class");
    heading.removeAttribute("style");
  }

  return doc.body.innerHTML;
}

// Tags allowed when importing a full document (mammoth output).
const ALLOWED_IMPORT_TAGS = new Set([
  ...ALLOWED_PASTE_TAGS,
  "SPAN",
  "SUP",
  "SUB",
  "H5",
  "H6",
]);

// Inline CSS properties we keep on imported elements.
const ALLOWED_IMPORT_STYLE_PROPS = new Set([
  "text-align",
  "text-decoration",
  "text-decoration-line",
  "text-decoration-style",
  "text-decoration-color",
  "font-weight",
  "font-style",
  "font-family",
  "font-size",
  "color",
  "background-color",
  "margin-left",
  "margin-right",
  "margin-top",
  "margin-bottom",
  "padding-left",
  "padding-right",
  "text-indent",
  "line-height",
  "list-style-type",
  "vertical-align",
  "white-space",
  "border",
  "border-top",
  "border-bottom",
  "border-left",
  "border-right",
  "border-collapse",
  "width",
]);

// CSS classes we preserve on imported elements (Word alignment classes we add).
const ALLOWED_IMPORT_CLASSES = new Set([
  "dx-center",
  "dx-right",
  "dx-justify",
  "dx-left",
]);

function filterStyleAttribute(raw: string): string {
  return raw
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const colonIdx = decl.indexOf(":");
      if (colonIdx <= 0) return null;
      const prop = decl.slice(0, colonIdx).trim().toLowerCase();
      const value = decl.slice(colonIdx + 1).trim();
      if (!ALLOWED_IMPORT_STYLE_PROPS.has(prop)) return null;
      // Reject anything that looks like JS / url-loading constructs.
      if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return null;
      return `${prop}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

function filterClassAttribute(raw: string): string {
  return raw
    .split(/\s+/)
    .filter((c) => ALLOWED_IMPORT_CLASSES.has(c))
    .join(" ");
}

function stripImportAttributes(el: HTMLElement, tag: string): void {
  const href = tag === "A" ? (el.getAttribute("href")?.trim() ?? "") : "";
  const colspan =
    tag === "TD" || tag === "TH" ? el.getAttribute("colspan") : null;
  const rowspan =
    tag === "TD" || tag === "TH" ? el.getAttribute("rowspan") : null;
  const olType = tag === "OL" ? el.getAttribute("type") : null;
  const olStart = tag === "OL" ? el.getAttribute("start") : null;
  const styleRaw = el.getAttribute("style");
  const classRaw = el.getAttribute("class");

  while (el.attributes.length > 0) {
    el.removeAttribute(el.attributes[0].name);
  }

  if (tag === "A") {
    const safe = sanitizeHref(href);
    if (safe) el.setAttribute("href", safe);
  }
  if ((tag === "TD" || tag === "TH") && colspan) {
    const n = Number(colspan);
    if (Number.isFinite(n) && n >= 1 && n <= 24) {
      el.setAttribute("colspan", String(Math.floor(n)));
    }
  }
  if ((tag === "TD" || tag === "TH") && rowspan) {
    const n = Number(rowspan);
    if (Number.isFinite(n) && n >= 1 && n <= 24) {
      el.setAttribute("rowspan", String(Math.floor(n)));
    }
  }
  if (tag === "OL") {
    if (olType && /^[a-zA-Z1iI]$/.test(olType)) el.setAttribute("type", olType);
    if (olStart && /^\d+$/.test(olStart)) el.setAttribute("start", olStart);
  }
  if (styleRaw) {
    const filtered = filterStyleAttribute(styleRaw);
    if (filtered) el.setAttribute("style", filtered);
  }
  if (classRaw) {
    const filtered = filterClassAttribute(classRaw);
    if (filtered) el.setAttribute("class", filtered);
  }
}

function cleanImportTree(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.parentNode?.removeChild(child);
      continue;
    }
    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME") {
      el.parentNode?.removeChild(el);
      continue;
    }
    if (!ALLOWED_IMPORT_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      continue;
    }
    stripImportAttributes(el, tag);
    cleanImportTree(el);
  }
}

/** Sanitizer for full-document imports (e.g. .docx via mammoth). Preserves
 *  inline styles whitelisted in `ALLOWED_IMPORT_STYLE_PROPS` plus alignment
 *  classes from `ALLOWED_IMPORT_CLASSES`. */
export function sanitizeImportedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  cleanImportTree(doc.body);
  return doc.body.innerHTML;
}

/** Read an attribute value tolerant of XML namespace prefixes. Tries the
 *  qualified-name form first, then falls back to scanning by `localName`. */
function readNsAttr(el: Element, localName: string): string | null {
  for (const name of [`w:${localName}`, localName]) {
    const v = el.getAttribute(name);
    if (v != null) return v;
  }
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (a.localName === localName) return a.value;
  }
  return null;
}

/** Find the paragraph's own `<w:jc>` (lives in the paragraph's direct-child
 *  `<w:pPr>`). Avoids matching jc elements from nested table-cell paragraphs. */
function getParagraphJc(p: Element): Element | null {
  for (let i = 0; i < p.children.length; i++) {
    const child = p.children[i];
    if (child.localName !== "pPr") continue;
    for (let j = 0; j < child.children.length; j++) {
      const grand = child.children[j];
      if (grand.localName === "jc") return grand;
    }
    return null;
  }
  return null;
}

/** Read paragraph alignment values out of a .docx's word/document.xml in
 *  document order. Returns one entry per `<w:p>` element. Values mirror
 *  OOXML jc values: "left" | "center" | "right" | "both" (justify). */
export async function extractDocxParagraphAlignments(
  arrayBuffer: ArrayBuffer
): Promise<string[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  const file = zip.file("word/document.xml");
  if (!file) return [];
  const xml = await file.async("string");
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = parsed.getElementsByTagNameNS("*", "p");
  const out: string[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const jc = getParagraphJc(paragraphs[i]);
    out.push((jc && readNsAttr(jc, "val")) || "left");
  }
  return out;
}

/** Walk top-level block elements (P, H1–H6, LI) of `root` in document order
 *  and assign a `dx-{align}` class to each based on `alignments[i]`. Skips
 *  paragraphs whose alignment is "left" (the default). */
export function applyDocxAlignmentsToHtml(
  rootHtml: string,
  alignments: string[]
): string {
  if (alignments.length === 0) return rootHtml;
  const doc = new DOMParser().parseFromString(rootHtml, "text/html");
  const blocks = doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li");
  const len = Math.min(blocks.length, alignments.length);
  for (let i = 0; i < len; i++) {
    const a = alignments[i];
    if (!a || a === "left") continue;
    const cls =
      a === "center"
        ? "dx-center"
        : a === "right"
          ? "dx-right"
          : a === "both" || a === "justify" || a === "distribute"
            ? "dx-justify"
            : null;
    if (!cls) continue;
    const existing = blocks[i].getAttribute("class");
    blocks[i].setAttribute("class", existing ? `${existing} ${cls}` : cls);
  }
  return doc.body.innerHTML;
}

export function buildTableHtml(rows: number, cols: number): string {
  const r = Math.min(Math.max(rows, 1), 12);
  const c = Math.min(Math.max(cols, 1), 12);
  const cells = () =>
    Array.from({ length: c })
      .map(
        () =>
          `<td style="border:1px solid #e5e7eb;padding:8px 10px;">&nbsp;</td>`
      )
      .join("");
  const bodyRows = Array.from({ length: r })
    .map(() => `<tr>${cells()}</tr>`)
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;"><tbody>${bodyRows}</tbody></table>`;
}

export function buildTableWithHeaderHtml(rows: number, cols: number): string {
  const r = Math.min(Math.max(rows, 1), 12);
  const c = Math.min(Math.max(cols, 1), 12);
  const headerCells = Array.from({ length: c })
    .map(
      () =>
        `<th style="border:1px solid #e5e7eb;padding:8px 10px;text-align:left;background:#f9fafb;font-weight:600;">&nbsp;</th>`
    )
    .join("");
  const dataRows = Math.max(0, r - 1);
  const bodyCells = () =>
    Array.from({ length: c })
      .map(
        () =>
          `<td style="border:1px solid #e5e7eb;padding:8px 10px;">&nbsp;</td>`
      )
      .join("");
  const body = Array.from({ length: dataRows })
    .map(() => `<tr>${bodyCells()}</tr>`)
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr>${headerCells}</tr></thead><tbody>${body}</tbody></table>`;
}

function normalizeExternalUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("mailto:")) return t;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return `mailto:${t}`;
  return `https://${t}`;
}

export function normalizeLinkUrl(input: string): string {
  return normalizeExternalUrl(input);
}

export function isRichTextEffectivelyEmpty(html: string): boolean {
  const trimmed = html.trim();
  if (!trimmed) return true;
  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const text = (doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim();
  return text.length === 0;
}

export function richTextToPlainPreview(html: string, maxLen: number): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

export function rangeCoversEditorContents(
  editor: HTMLElement,
  range: Range
): boolean {
  if (!editor.contains(range.commonAncestorContainer)) return false;
  const full = document.createRange();
  full.selectNodeContents(editor);
  try {
    return (
      range.compareBoundaryPoints(Range.START_TO_START, full) <= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, full) >= 0
    );
  } catch {
    return false;
  }
}

export function getTplFieldSpansInSelection(
  editor: HTMLElement,
  range: Range | null
): HTMLElement[] {
  if (!range) return [];
  if (!editor.contains(range.commonAncestorContainer)) return [];
  const spans = [...editor.querySelectorAll<HTMLElement>(".tpl-field")];
  if (spans.length === 0) return [];
  if (rangeCoversEditorContents(editor, range)) return spans;
  return spans.filter((span) => {
    try {
      return range.intersectsNode(span);
    } catch {
      return false;
    }
  });
}

export const TemplateEditorTextAlign = {
  Left: "left",
  Center: "center",
  Right: "right",
  Justify: "justify",
} as const;

export type TemplateEditorTextAlignValue =
  (typeof TemplateEditorTextAlign)[keyof typeof TemplateEditorTextAlign];

const ALIGNABLE_BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "DIV",
  "BLOCKQUOTE",
  "LI",
  "TD",
  "TH",
  "CAPTION",
]);

export function nearestAlignableBlockContainer(
  element: HTMLElement,
  editorRoot: HTMLElement
): HTMLElement | null {
  let node: HTMLElement | null = element;
  while (node && node !== editorRoot) {
    if (ALIGNABLE_BLOCK_TAGS.has(node.tagName)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function syncTplFieldBlocksTextAlign(
  editorRoot: HTMLElement,
  spans: HTMLElement[],
  textAlign: TemplateEditorTextAlignValue
): void {
  for (const span of spans) {
    span.style.removeProperty("text-align");
    const block = nearestAlignableBlockContainer(span, editorRoot);
    if (block && editorRoot.contains(block)) {
      block.style.textAlign = textAlign;
    }
  }
}

export const TEMPLATE_EDITOR_CARET_ANCHOR = "\u200b";

export function nodeIsInsideEditorRoot(
  editorRoot: HTMLElement | null,
  node: Node
): boolean {
  if (!editorRoot) return false;
  let current: Node | null = node;
  while (current) {
    if (current === editorRoot) return true;
    current = current.parentNode;
  }
  return false;
}

export function ensureSelectionInsideEditor(editorRoot: HTMLElement): void {
  // `preventScroll` keeps the browser from snapping the page back to the
  // focused element. Without it, every chip-style change (which calls this
  // via pushEditorContent) re-focuses the contentEditable and scrolls the
  // page to wherever the editor's selection sits.
  editorRoot.focus({ preventScroll: true });
  const sel = window.getSelection();
  if (!sel) return;
  let ok = false;
  if (sel.rangeCount > 0) {
    try {
      const r = sel.getRangeAt(0);
      ok = nodeIsInsideEditorRoot(editorRoot, r.commonAncestorContainer);
    } catch {
      ok = false;
    }
  }
  if (ok) return;
  const range = document.createRange();
  range.selectNodeContents(editorRoot);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function normalizeTplFieldCaretAnchors(editorRoot: HTMLElement): void {
  const fields = editorRoot.querySelectorAll<HTMLElement>(".tpl-field");
  fields.forEach((span) => {
    const next = span.nextSibling;
    if (next === null) {
      span.after(document.createTextNode(TEMPLATE_EDITOR_CARET_ANCHOR));
      return;
    }
    if (next.nodeType === Node.TEXT_NODE) {
      return;
    }
    if (
      next.nodeType === Node.ELEMENT_NODE &&
      (next as HTMLElement).tagName === "BR"
    ) {
      return;
    }
    span.after(document.createTextNode(TEMPLATE_EDITOR_CARET_ANCHOR));
  });
}

function textNodeAcceptableForPlaceholderScan(
  editorRoot: HTMLElement,
  textNode: Node
): boolean {
  let el: HTMLElement | null =
    textNode.nodeType === Node.TEXT_NODE ? textNode.parentElement : null;
  while (el && el !== editorRoot) {
    if (el.classList?.contains("tpl-field")) return false;
    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE") return false;
    el = el.parentElement;
  }
  return true;
}

function replaceTextRangeWithTplFieldChip(
  textNode: Text,
  start: number,
  end: number,
  innerRaw: string
): void {
  const trimmedInner = innerRaw.trim();
  const key = labelToKey(trimmedInner);
  if (!key) return;

  const full = textNode.textContent ?? "";
  const before = full.slice(0, start);
  const after = full.slice(end);
  const parent = textNode.parentNode;
  if (!parent) return;

  const span = document.createElement("span");
  span.className = "tpl-field";
  span.contentEditable = "false";
  span.dataset.fieldKey = key;
  span.dataset.fieldLabel = displayLabelForPlaceholder({
    key,
    label: trimmedInner,
  });
  span.textContent = `{{${key}}}`;
  span.style.cssText = TPL_FIELD_CHIP_INLINE_STYLE;

  const ref = textNode.nextSibling;
  parent.removeChild(textNode);
  if (before) parent.insertBefore(document.createTextNode(before), ref);
  parent.insertBefore(span, ref);
  if (after) parent.insertBefore(document.createTextNode(after), ref);
}

function collectEditableTextNodes(editorRoot: HTMLElement): Text[] {
  const out: Text[] = [];
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (textNodeAcceptableForPlaceholderScan(editorRoot, node)) {
        out.push(node as Text);
      }
      return;
    }
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      walk(children[i]);
    }
  }
  walk(editorRoot);
  return out;
}

export function materializePlainPlaceholdersInEditor(
  editorRoot: HTMLElement
): boolean {
  const replacements: Array<{
    textNode: Text;
    start: number;
    end: number;
    innerRaw: string;
  }> = [];

  for (const textNode of collectEditableTextNodes(editorRoot)) {
    const text = textNode.textContent ?? "";
    const re = /\{\{([^}]+)\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      replacements.push({
        textNode,
        start: m.index,
        end: m.index + m[0].length,
        innerRaw: m[1],
      });
    }
  }

  if (replacements.length === 0) return false;

  replacements.sort((a, b) => {
    if (a.textNode !== b.textNode) {
      const pos = a.textNode.compareDocumentPosition(b.textNode);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return 1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return -1;
      return 0;
    }
    return b.start - a.start;
  });

  let changed = false;
  for (const r of replacements) {
    if (!editorRoot.contains(r.textNode)) continue;
    replaceTextRangeWithTplFieldChip(r.textNode, r.start, r.end, r.innerRaw);
    changed = true;
  }

  return changed;
}

export function resolveCaretRangeForInsert(
  editorRoot: HTMLElement,
  saved: Range | null
): Range {
  if (saved) {
    try {
      if (nodeIsInsideEditorRoot(editorRoot, saved.commonAncestorContainer)) {
        return saved.cloneRange();
      }
    } catch {
      /* use live selection or end-of-editor fallback */
    }
  }
  const sel = window.getSelection();
  if (
    sel &&
    sel.rangeCount > 0 &&
    nodeIsInsideEditorRoot(
      editorRoot,
      sel.getRangeAt(0).commonAncestorContainer
    )
  ) {
    return sel.getRangeAt(0).cloneRange();
  }
  const r = document.createRange();
  r.selectNodeContents(editorRoot);
  r.collapse(false);
  return r;
}

export function insertTrustedHtmlFragmentAtCaret(
  editorRoot: HTMLElement,
  html: string,
  saved: Range | null
): void {
  const range = resolveCaretRangeForInsert(editorRoot, saved);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const frag = document.createDocumentFragment();
  const nodes = Array.from(wrapper.childNodes);
  nodes.forEach((n) => frag.appendChild(n));
  range.deleteContents();
  range.insertNode(frag);
  const last = nodes[nodes.length - 1];
  const sel = window.getSelection();
  if (last?.parentNode && sel) {
    try {
      const after = document.createRange();
      after.setStartAfter(last);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
    } catch {
      ensureSelectionInsideEditor(editorRoot);
    }
  } else {
    ensureSelectionInsideEditor(editorRoot);
  }
}

export function combineTplFieldTextDecoration(
  underline: boolean,
  strikeThrough: boolean
): string {
  const parts: string[] = [];
  if (underline) parts.push("underline");
  if (strikeThrough) parts.push("line-through");
  return parts.length ? parts.join(" ") : "";
}

function sampleForField(field: TemplateField): string {
  const d = field.defaultValue.trim();
  switch (field.type) {
    case TemplateFieldType.Date:
      return d || "Apr 5, 2026";
    case TemplateFieldType.Number:
      return d || "0";
    case TemplateFieldType.Dropdown: {
      const first = field.options
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)[0];
      return d || first || "—";
    }
    case TemplateFieldType.Checkbox:
      return d === "true" ? "Yes" : "No";
    default:
      return d || field.label || "Sample";
  }
}

export function previewTemplateHtml(
  html: string,
  fields: TemplateField[]
): string {
  let out = html;
  for (const f of fields) {
    const token = `{{${f.key}}}`;
    const sample = escapeHtmlText(sampleForField(f));
    out = out.split(token).join(sample);
  }
  return out;
}

export function sortTemplateFieldsForPicker(
  fields: ReadonlyArray<TemplateField>
): TemplateField[] {
  return [...fields].sort((a, b) => {
    const labelCmp = a.label.localeCompare(b.label, undefined, {
      sensitivity: "base",
      numeric: true,
    });
    if (labelCmp !== 0) return labelCmp;
    return a.key.localeCompare(b.key, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
}
