"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Lock, Upload, X } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { cn } from "../../ui/utils";
import {
  documentsApi,
  type EmployeeDocument,
} from "@/lib/api/modules/documents";
import {
  DocumentAccessRole,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
} from "@/lib/documents/documentsHelpers";
import type { Project } from "../types";

interface ProjectDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onUploaded?: (doc: EmployeeDocument) => void;
}

/**
 * Visibility for project-uploaded documents: restricted to project members
 * + upper management (Managers, Document staff, Admins). The backend enforces
 * the `project_group` scope by intersecting allowed_roles with project
 * membership; Admins always retain access.
 */
const UPPER_MANAGEMENT_ROLES: DocumentAccessRole[] = [
  DocumentAccessRole.Manager,
  DocumentAccessRole.Staff,
  DocumentAccessRole.Admin,
];

export function ProjectDocumentUploadDialog({
  open,
  onOpenChange,
  project,
  onUploaded,
}: ProjectDocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>(
    DocumentCategory.Other
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setCategory(DocumentCategory.Other);
    setBusy(false);
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f && !name) setName(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSubmit = async () => {
    if (!file || !name.trim()) {
      setError("Pick a file and give it a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const doc = await documentsApi.upload({
        file,
        name: name.trim(),
        category,
        description: description.trim(),
        isConfidential: false,
        tags: [],
        allowedRoles: UPPER_MANAGEMENT_ROLES,
        visibilityScope: "project_group",
        projectId: project.id,
      });
      // Backfill project metadata client-side until the backend persists +
      // returns project_id/project_name on the document record.
      const decorated = {
        ...doc,
        projectId: doc.projectId ?? project.id,
        projectName: doc.projectName ?? project.name,
      };
      try {
        if (typeof window !== "undefined" && doc.id) {
          const raw = localStorage.getItem("bh.docProjects") || "{}";
          const cache = JSON.parse(raw) as Record<
            string,
            { id: string | number; name: string }
          >;
          cache[String(doc.id)] = { id: project.id, name: project.name };
          localStorage.setItem("bh.docProjects", JSON.stringify(cache));
        }
      } catch {
        /* non-critical */
      }
      onUploaded?.(decorated);
      handleClose(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            Upload document to {project.name}
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            File is linked to this project and visible to project members plus
            upper management only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          {file ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="grid h-9 w-9 place-items-center rounded bg-white text-gray-700">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-gray-900">
                  {file.name}
                </div>
                <div className="text-[11px] text-gray-700">
                  {(file.size / 1024).toFixed(1)} KB ·{" "}
                  {file.type || "unknown type"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFile(null)}
                aria-label="Remove file"
                className="rounded p-1 text-gray-500 hover:bg-black/5 hover:text-gray-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100"
              )}
            >
              <Upload className="h-5 w-5" />
              <span className="text-[13px] font-medium text-gray-900">
                Click to select a file
              </span>
              <span className="text-[11px] text-gray-700">
                PDF, DOCX, XLSX, images, etc.
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7 space-y-1.5">
              <Label
                htmlFor="doc-name"
                className="text-[12px] font-medium text-gray-700"
              >
                Document name
              </Label>
              <Input
                id="doc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Architecture-RFC"
              />
            </div>
            <div className="col-span-5 space-y-1.5">
              <Label
                htmlFor="doc-cat"
                className="text-[12px] font-medium text-gray-700"
              >
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as DocumentCategory)}
              >
                <SelectTrigger id="doc-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="doc-desc"
              className="text-[12px] font-medium text-gray-700"
            >
              Description (optional)
            </Label>
            <Textarea
              id="doc-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short context for the file."
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[12px] text-blue-800">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <div className="font-medium text-blue-900">Visibility locked</div>
              Visible to <strong>{project.name}</strong> members plus Managers,
              Document staff, and Admins. Change later from the Documents
              module.
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-red-700">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={busy}
            className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || !file || !name.trim()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{" "}
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
