"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { ProjectDocumentUploadDialog } from "../dialogs/ProjectDocumentUploadDialog";
import { fmtDate } from "../projectsHelpers";
import {
  documentsApi,
  type EmployeeDocument,
} from "@/lib/api/modules/documents";
import type { Project, ProjectDocument } from "../types";

interface ProjectDocumentsSectionProps {
  project: Project;
  /** Seed documents (mock) to display until live ones load. */
  documents?: ProjectDocument[];
  /** Navigate to the Documents module and open this document. */
  onOpenDocument?: (documentId: string | number) => void;
}

interface Row {
  id: string;
  name: string;
  category: string;
  uploaded_by: string;
  uploaded_at: string;
  size: string;
  downloadUrl?: string;
}

function fmtSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mapToRow(d: EmployeeDocument): Row {
  return {
    id: String(d.id),
    name: d.name,
    category: d.category,
    uploaded_by: d.uploadedBy,
    uploaded_at: d.uploadedAt,
    size: d.fileSizeDisplay || fmtSize(d.fileSizeBytes),
  };
}

export function ProjectDocumentsSection({
  project,
  documents = [],
  onOpenDocument,
}: ProjectDocumentsSectionProps) {
  const [rows, setRows] = useState<Row[]>(documents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    documentsApi
      .list({ project_id: project.id })
      .then((res) => setRows(res.map(mapToRow)))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load documents.");
      })
      .finally(() => setLoading(false));
  }, [project.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUploaded = (doc: EmployeeDocument) => {
    setRows((prev) => [mapToRow(doc), ...prev]);
    toast.success("Document uploaded", {
      description: `${doc.name} linked to ${project.name}.`,
    });
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-6 py-[22px]">
      <div className="mb-[18px] flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="mb-1 text-[11px] font-medium text-gray-700">
            Linked
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
            Documents · {rows.length}
          </h2>
        </div>
        <Button variant="outline" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-gray-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading documents…
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-[13px] text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-gray-700">
          No documents linked yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => {
              const open = () => onOpenDocument?.(d.id);
              const clickable = Boolean(onOpenDocument);
              return (
                <TableRow
                  key={d.id}
                  className={clickable ? "group cursor-pointer" : undefined}
                  onClick={clickable ? open : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            open();
                          }
                        }
                      : undefined
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded bg-gray-100 text-gray-700">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[13px] font-medium text-gray-900 group-hover:underline">
                        {d.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-gray-800">
                    {d.category}
                  </TableCell>
                  <TableCell className="text-[13px] text-gray-800">
                    {d.uploaded_by}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-gray-700">
                    {fmtDate(d.uploaded_at)}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-gray-800">
                    {d.size}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Download ${d.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Download started", {
                          description: d.name,
                        });
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <ProjectDocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        project={project}
        onUploaded={handleUploaded}
      />
    </section>
  );
}
