import { describe, expect, it } from "vitest";
import {
  buildTableHtml,
  getTplFieldSpansInSelection,
  insertTrustedHtmlFragmentAtCaret,
  isRichTextEffectivelyEmpty,
  nearestAlignableBlockContainer,
  nodeIsInsideEditorRoot,
  normalizeLinkUrl,
  normalizeTplFieldCaretAnchors,
  materializePlainPlaceholdersInEditor,
  plainTextToSanitizedHtml,
  previewTemplateHtml,
  rangeCoversEditorContents,
  resolveCaretRangeForInsert,
  richTextToPlainPreview,
  sanitizePastedHtml,
  syncTplFieldBlocksTextAlign,
  TemplateEditorTextAlign,
  TEMPLATE_EDITOR_CARET_ANCHOR,
} from "@/components/hr-dashboard/templates/templateEditorHelpers";
import {
  TemplateFieldType,
  type TemplateField,
} from "@/lib/templates/templatesHelpers";

describe("sanitizePastedHtml", () => {
  it("strips script and keeps safe markup", () => {
    const dirty = `<p onclick="evil()">Hi</p><script>x</script><p>OK</p>`;
    const clean = sanitizePastedHtml(dirty);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("Hi");
    expect(clean).toContain("OK");
  });

  it("allows safe links and drops unsafe hrefs", () => {
    const dirty = `<p><a href="https://example.com">x</a></p><a href="javascript:alert(1)">bad</a>`;
    const clean = sanitizePastedHtml(dirty);
    expect(clean).toContain('href="https://example.com"');
    expect(clean).not.toContain("javascript:");
  });
});

describe("plainTextToSanitizedHtml", () => {
  it("wraps paragraphs and escapes entities", () => {
    const html = plainTextToSanitizedHtml(`Hello <world>
same block

Next`);
    expect(html).toContain("&lt;world&gt;");
    expect(html).toContain("<p>");
    expect(html).toContain("<br>");
    expect(html).toContain("<p>Next</p>");
  });
});

describe("normalizeLinkUrl", () => {
  it("prefixes bare domains", () => {
    expect(normalizeLinkUrl("example.com/path")).toBe(
      "https://example.com/path"
    );
  });

  it("preserves mailto", () => {
    expect(normalizeLinkUrl("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
});

describe("buildTableHtml", () => {
  it("builds a tbody table", () => {
    const html = buildTableHtml(2, 3);
    expect(html).toContain("<tbody>");
    expect(html.split("<tr>").length - 1).toBe(2);
  });
});

describe("isRichTextEffectivelyEmpty", () => {
  it("treats blank paragraphs as empty", () => {
    expect(isRichTextEffectivelyEmpty("<p><br></p>")).toBe(true);
    expect(isRichTextEffectivelyEmpty("<p> </p>")).toBe(true);
  });

  it("detects real text", () => {
    expect(isRichTextEffectivelyEmpty("<p>Hello</p>")).toBe(false);
  });
});

describe("richTextToPlainPreview", () => {
  it("strips tags for preview", () => {
    expect(richTextToPlainPreview("<p>a</p><b>b</b>", 10)).toBe("ab");
  });
});

describe("getTplFieldSpansInSelection", () => {
  it("returns all field spans when range covers the full editor", () => {
    const editor = document.createElement("div");
    editor.innerHTML =
      '<p>a</p><span class="tpl-field" data-field-key="x">{{x}}</span><p>b</p>';
    const span = editor.querySelector(".tpl-field") as HTMLElement;
    expect(span).toBeTruthy();
    const range = document.createRange();
    range.selectNodeContents(editor);
    expect(rangeCoversEditorContents(editor, range)).toBe(true);
    const got = getTplFieldSpansInSelection(editor, range);
    expect(got.length).toBe(1);
    expect(got[0]?.classList.contains("tpl-field")).toBe(true);
  });
});

describe("nearestAlignableBlockContainer", () => {
  it("returns the wrapping paragraph", () => {
    const editor = document.createElement("div");
    editor.innerHTML = '<p><span class="tpl-field" id="f">{{x}}</span></p>';
    const span = editor.querySelector("#f") as HTMLElement;
    const block = nearestAlignableBlockContainer(span, editor);
    expect(block?.tagName).toBe("P");
  });
});

describe("normalizeTplFieldCaretAnchors", () => {
  it("inserts a caret anchor after a trailing merge-field chip", () => {
    const editor = document.createElement("div");
    editor.innerHTML = '<p><span class="tpl-field">{{k}}</span></p>';
    normalizeTplFieldCaretAnchors(editor);
    const span = editor.querySelector(".tpl-field") as HTMLElement;
    expect(span?.nextSibling?.nodeType).toBe(Node.TEXT_NODE);
    expect(span?.nextSibling?.textContent).toBe(TEMPLATE_EDITOR_CARET_ANCHOR);
  });
});

describe("nodeIsInsideEditorRoot", () => {
  it("returns true for a text node inside the editor", () => {
    const editor = document.createElement("div");
    editor.innerHTML = "<p>x</p>";
    const text = editor.querySelector("p")?.firstChild;
    expect(text).toBeTruthy();
    expect(nodeIsInsideEditorRoot(editor, text as Node)).toBe(true);
  });
});

describe("resolveCaretRangeForInsert", () => {
  it("falls back to end of editor when saved range is null", () => {
    const editor = document.createElement("div");
    editor.innerHTML = "<p>a</p>";
    const r = resolveCaretRangeForInsert(editor, null);
    r.collapse(true);
    expect(r.collapsed).toBe(true);
    expect(editor.contains(r.startContainer)).toBe(true);
  });
});

describe("insertTrustedHtmlFragmentAtCaret", () => {
  it("inserts fragment HTML into the editor", () => {
    const editor = document.createElement("div");
    editor.innerHTML = "<p><br></p>";
    insertTrustedHtmlFragmentAtCaret(editor, "<span>x</span>", null);
    expect(editor.innerHTML).toContain("<span>x</span>");
  });
});

describe("syncTplFieldBlocksTextAlign", () => {
  it("applies alignment to the block parent and clears chip text-align", () => {
    const editor = document.createElement("div");
    editor.innerHTML =
      '<p style="text-align:left"><span class="tpl-field" style="text-align:left">{{k}}</span></p>';
    const span = editor.querySelector(".tpl-field") as HTMLElement;
    syncTplFieldBlocksTextAlign(editor, [span], TemplateEditorTextAlign.Center);
    const p = span.parentElement as HTMLElement;
    expect(p.style.textAlign).toBe("center");
    expect(span.style.textAlign).toBe("");
  });
});

describe("materializePlainPlaceholdersInEditor", () => {
  it("wraps completed brace placeholders as tpl-field spans", () => {
    const editor = document.createElement("div");
    const p = document.createElement("p");
    p.appendChild(document.createTextNode("{{signatory_name}}"));
    editor.appendChild(p);
    const changed = materializePlainPlaceholdersInEditor(editor);
    expect(changed).toBe(true);
    const chip = editor.querySelector(".tpl-field");
    expect(chip).toBeTruthy();
    expect(chip?.getAttribute("data-field-key")).toBe("signatory_name");
    expect(chip?.textContent).toBe("{{signatory_name}}");
  });

  it("returns false when no plain placeholders exist", () => {
    const editor = document.createElement("div");
    editor.innerHTML =
      '<p><span class="tpl-field" data-field-key="x">{{x}}</span></p>';
    const changed = materializePlainPlaceholdersInEditor(editor);
    expect(changed).toBe(false);
    expect(editor.querySelectorAll(".tpl-field")).toHaveLength(1);
  });
});

describe("previewTemplateHtml", () => {
  it("replaces field tokens with samples", () => {
    const fields: TemplateField[] = [
      {
        id: "1",
        key: "employee_name",
        label: "Employee name",
        type: TemplateFieldType.Text,
        placeholder: "",
        required: false,
        defaultValue: "Jane Doe",
        options: "",
      },
    ];
    const html = previewTemplateHtml("<p>{{employee_name}}</p>", fields);
    expect(html).toContain("Jane Doe");
    expect(html).not.toContain("{{employee_name}}");
  });
});
