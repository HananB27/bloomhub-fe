import { type ChangeEvent, type RefObject } from "react";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import type { EmployeeCVVersion } from "@/lib/api/modules/employee-cvs";
import { cvVersionSupportsEmbeddedPreview } from "./profilesModuleHelpers";
import { formatDate } from "@/utils";

interface ProfileCvSectionProps {
  editMode: boolean;
  canUploadCV: boolean;
  cvAddMode: "file" | "link";
  onCvAddModeChange: (mode: "file" | "link") => void;
  cvFileInputRef: RefObject<HTMLInputElement | null>;
  isUploadingCV: boolean;
  onCvFilePicked: (event: ChangeEvent<HTMLInputElement>) => void;
  cvLinkDraft: string;
  onCvLinkDraftChange: (value: string) => void;
  isAddingCvLink: boolean;
  onAddCvLink: () => void;
  isLoadingCVs: boolean;
  cvVersions: EmployeeCVVersion[];
  onCVAccess: (cv: EmployeeCVVersion) => void;
  onCVPreview: (cv: EmployeeCVVersion) => void;
  onDeleteCV: (cv: EmployeeCVVersion) => void;
}

export function ProfileCvSection({
  editMode,
  canUploadCV,
  cvAddMode,
  onCvAddModeChange,
  cvFileInputRef,
  isUploadingCV,
  onCvFilePicked,
  cvLinkDraft,
  onCvLinkDraftChange,
  isAddingCvLink,
  onAddCvLink,
  isLoadingCVs,
  cvVersions,
  onCVAccess,
  onCVPreview,
  onDeleteCV,
}: ProfileCvSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">CV</h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          SECTION 04
        </span>
      </div>
      <div className="space-y-4">
        {editMode && canUploadCV ? (
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Add a CV version
            </p>

            <div
              className="relative flex min-h-8 w-full rounded-lg border border-zinc-300/70 bg-zinc-200 p-1 shadow-inner"
              role="tablist"
              aria-label="CV source"
            >
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute rounded-[6px] bg-white shadow-md ring-1 ring-black/8 transition-[left,right] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  cvAddMode === "file"
                    ? "inset-y-1 left-1 right-1/2"
                    : "inset-y-1 left-1/2 right-1",
                ].join(" ")}
              />
              <button
                type="button"
                role="tab"
                aria-selected={cvAddMode === "file"}
                className={[
                  "relative z-10 flex-1 rounded-md py-1 text-xs font-medium transition-colors duration-200",
                  cvAddMode === "file"
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700",
                ].join(" ")}
                onClick={() => onCvAddModeChange("file")}
              >
                Upload file
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={cvAddMode === "link"}
                className={[
                  "relative z-10 flex-1 rounded-md py-1 text-xs font-medium transition-colors duration-200",
                  cvAddMode === "link"
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700",
                ].join(" ")}
                onClick={() => onCvAddModeChange("link")}
              >
                Paste link
              </button>
            </div>

            <div
              key={cvAddMode}
              className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 pt-0.5"
            >
              {cvAddMode === "file" ? (
                <>
                  <p className="text-[11px] leading-tight text-zinc-500">
                    PDF, DOC or DOCX · max 10MB
                  </p>
                  <div>
                    <input
                      ref={cvFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={onCvFilePicked}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => cvFileInputRef.current?.click()}
                      disabled={isUploadingCV}
                      className="h-8 gap-2 px-3 text-xs"
                    >
                      {isUploadingCV ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Choose file
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[11px] leading-tight text-zinc-500">
                    Canva share URL or any https link
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="url"
                      placeholder="https://…"
                      value={cvLinkDraft}
                      onChange={(e) => onCvLinkDraftChange(e.target.value)}
                      className="h-8 bg-white text-sm sm:flex-1"
                      disabled={isAddingCvLink}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2 px-3 text-xs shrink-0 sm:w-auto w-full justify-center"
                      onClick={onAddCvLink}
                      disabled={isAddingCvLink}
                    >
                      {isAddingCvLink ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          Save link
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : editMode && !canUploadCV ? (
          <p className="text-xs text-zinc-500">
            You don&apos;t have permission to add or remove CVs for this
            profile.
          </p>
        ) : null}

        {isLoadingCVs ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : cvVersions.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No CV on file yet</p>
        ) : (
          <div className="space-y-2">
            {cvVersions.map((cv) => (
              <div
                key={cv.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {cv.file_name ||
                        (cv.provider === "canva" ? "Canva CV link" : "CV file")}
                    </p>
                    {cv.provider === "canva" ? (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        Canva
                      </Badge>
                    ) : null}
                    {cv.is_current ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Uploaded {formatDate(cv.uploaded_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => onCVAccess(cv)}
                  >
                    {cv.source_type === "external_link" ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {cv.source_type === "external_link"
                      ? "Open link"
                      : "Download"}
                  </Button>
                  {cvVersionSupportsEmbeddedPreview(cv) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => onCVPreview(cv)}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  ) : null}
                  {canUploadCV && editMode ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-red-600 hover:text-red-700"
                      onClick={() => onDeleteCV(cv)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
