import { describe, expect, it } from "vitest";
import {
  DocumentInlinePreviewPresentation,
  OFFICE_ONLINE_PREVIEW_EMBED_BASE,
  documentInlinePreviewPresentation,
} from "@/lib/documents/documentsHelpers";

describe("documentInlinePreviewPresentation", () => {
  const signed = "https://storage.example.com/a?sig=1";

  it("uses Office Online embed for docx by extension", () => {
    const r = documentInlinePreviewPresentation(
      "application/octet-stream",
      "Report.docx",
      signed
    );
    expect(r.presentation).toBe(
      DocumentInlinePreviewPresentation.OfficeOnlineEmbed
    );
    expect(r.embedSrc).toBe(
      `${OFFICE_ONLINE_PREVIEW_EMBED_BASE}${encodeURIComponent(signed)}`
    );
  });

  it("uses PDF object for application/pdf", () => {
    const r = documentInlinePreviewPresentation(
      "application/pdf",
      "file.bin",
      signed
    );
    expect(r.presentation).toBe(DocumentInlinePreviewPresentation.PdfObject);
    expect(r.embedSrc).toBe(signed);
  });

  it("uses PDF object when filename ends with .pdf", () => {
    const r = documentInlinePreviewPresentation("", "scan.PDF", signed);
    expect(r.presentation).toBe(DocumentInlinePreviewPresentation.PdfObject);
  });

  it("uses image for image/png", () => {
    const r = documentInlinePreviewPresentation("image/png", "x.png", signed);
    expect(r.presentation).toBe(DocumentInlinePreviewPresentation.Image);
    expect(r.embedSrc).toBe(signed);
  });

  it("uses browser iframe as default for unknown types", () => {
    const r = documentInlinePreviewPresentation(
      "application/zip",
      "bundle.zip",
      signed
    );
    expect(r.presentation).toBe(
      DocumentInlinePreviewPresentation.BrowserIframe
    );
    expect(r.embedSrc).toBe(signed);
  });
});
