import { describe, it, expect } from "vitest";
import {
  DocumentsListSource,
  DocumentCategory,
  SignatureStatus,
  ALL_CATEGORIES_FILTER,
} from "@/lib/documents/documentsHelpers";
import {
  buildMergedTableRows,
  buildUploadTableRow,
  buildGeneratedTableRow,
  filterAndSortTableRows,
  tableRowKey,
  uploadDocumentIdsFromRowKeys,
  generatedDocumentFieldTags,
} from "@/components/hr-dashboard/documentsModuleHelpers";
import type { EmployeeDocument } from "@/lib/api/modules/documents";
import type { GeneratedDocument } from "@/lib/api/modules/templates";

const sampleUpload: EmployeeDocument = {
  id: 42,
  name: "Handbook",
  description: "HR",
  category: DocumentCategory.Policies,
  fileType: "pdf",
  fileName: "h.pdf",
  fileSizeBytes: 1000,
  fileSizeDisplay: "0.0 MB",
  mimeType: "application/pdf",
  uploadedBy: "Ada Lovelace",
  uploadedAt: "2026-01-01T00:00:00Z",
  lastModified: "2026-01-02T00:00:00Z",
  signatureStatus: SignatureStatus.NotRequired,
  isConfidential: false,
  tags: ["hr"],
  allowedRoles: [],
  visibilityScope: "roles",
  currentVersion: "1.0",
  versionCount: 1,
  signers: [],
  fromTemplate: false,
};

const sampleGenerated: GeneratedDocument = {
  id: "gen-1",
  name: "Offer — PDF",
  sourceTemplate: 7,
  sourceTemplateName: "Offer letter",
  resolvedContent: "<p>x</p>",
  fieldValues: { name: "Pat" },
  createdBy: "Ada",
  createdAt: "2026-01-03T00:00:00Z",
  updatedAt: "2026-01-03T00:00:00Z",
};

describe("documentsModuleHelpers", () => {
  it("tags upload rows with DocumentsListSource.Upload", () => {
    const row = buildUploadTableRow(sampleUpload);
    expect(row.listSource).toBe(DocumentsListSource.Upload);
    expect(tableRowKey(row)).toBe("u:42");
  });

  it("tags generated rows with DocumentsListSource.Template", () => {
    const row = buildGeneratedTableRow(sampleGenerated);
    expect(row.listSource).toBe(DocumentsListSource.Template);
    expect(row.generated).toBe(sampleGenerated);
    expect(tableRowKey(row)).toBe("g:gen-1");
    expect(row.doc.category).toBe(DocumentCategory.Other);
  });

  it("merges uploads and generated into one list", () => {
    const merged = buildMergedTableRows([sampleUpload], [sampleGenerated]);
    expect(merged).toHaveLength(2);
  });

  it("filters merged rows by search across template fields", () => {
    const merged = buildMergedTableRows([], [sampleGenerated]);
    const out = filterAndSortTableRows(merged, {
      search: "Pat",
      activeCat: ALL_CATEGORIES_FILTER,
      statusFilter: ALL_CATEGORIES_FILTER,
      expiryFilter: ALL_CATEGORIES_FILTER,
      sortBy: "modified",
    });
    expect(out).toHaveLength(1);
  });

  it("uploadDocumentIdsFromRowKeys only returns u: keys", () => {
    const keys = new Set(["u:1", "g:a", "u:2"]);
    expect(uploadDocumentIdsFromRowKeys(keys)).toEqual([1, 2]);
  });

  it("generatedDocumentFieldTags formats field entries", () => {
    expect(generatedDocumentFieldTags({ name: "Pat", active: true })).toEqual([
      "name: Pat",
      "active: true",
    ]);
  });
});
