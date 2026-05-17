import { type ChangeEvent, type RefObject } from "react";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import type { EmployeeCVVersion } from "@/lib/api/modules/employee-cvs";
import { formatDate } from "@/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { ProfileSection, Segmented } from "./atoms";
import { cvVersionSupportsEmbeddedPreview } from "./profilesModuleHelpers";

type CvAddMode = "file" | "link";

interface ProfileCvSectionProps {
  editMode: boolean;
  canUploadCV: boolean;
  cvAddMode: CvAddMode;
  onCvAddModeChange: (mode: CvAddMode) => void;
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

const CV_ADD_MODE_OPTIONS = [
  { value: "file" as const, label: "Upload file", icon: <Upload size={13} /> },
  { value: "link" as const, label: "Paste link", icon: <LinkIcon size={13} /> },
];

/** D-09 CV section — segmented add control + version list. */
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
    <ProfileSection id="cv" kicker="Resume" title="CV / Resume">
      <div className="space-y-4">
        {editMode && canUploadCV ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="mb-2 text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
              Add a CV version
            </p>
            <Segmented<CvAddMode>
              ariaLabel="CV source"
              value={cvAddMode}
              options={CV_ADD_MODE_OPTIONS}
              onChange={onCvAddModeChange}
              className="mb-3"
            />
            {cvAddMode === "file" ? (
              <CvFilePicker
                fileInputRef={cvFileInputRef}
                isUploading={isUploadingCV}
                onFilePicked={onCvFilePicked}
              />
            ) : (
              <CvLinkPicker
                value={cvLinkDraft}
                onChange={onCvLinkDraftChange}
                isAdding={isAddingCvLink}
                onAdd={onAddCvLink}
              />
            )}
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
          <p className="text-sm italic text-zinc-500">No CV on file yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cvVersions.map((cv) => (
              <CvRow
                key={cv.id}
                cv={cv}
                canDelete={canUploadCV && editMode}
                onAccess={onCVAccess}
                onPreview={onCVPreview}
                onDelete={onDeleteCV}
              />
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}

interface CvFilePickerProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onFilePicked: (event: ChangeEvent<HTMLInputElement>) => void;
}

function CvFilePicker({
  fileInputRef,
  isUploading,
  onFilePicked,
}: CvFilePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-tight text-zinc-500">
        PDF, DOC or DOCX · max 10MB
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onFilePicked}
        aria-label="Upload CV file"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="h-8 gap-2 px-3 text-xs"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" aria-hidden />
            Choose file
          </>
        )}
      </Button>
    </div>
  );
}

interface CvLinkPickerProps {
  value: string;
  onChange: (value: string) => void;
  isAdding: boolean;
  onAdd: () => void;
}

function CvLinkPicker({ value, onChange, isAdding, onAdd }: CvLinkPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-tight text-zinc-500">
        Canva share URL or any https link
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="url"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 bg-white text-sm sm:flex-1"
          disabled={isAdding}
          aria-label="CV link URL"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full shrink-0 justify-center gap-2 px-3 text-xs sm:w-auto"
          onClick={onAdd}
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Save link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface CvRowProps {
  cv: EmployeeCVVersion;
  canDelete: boolean;
  onAccess: (cv: EmployeeCVVersion) => void;
  onPreview: (cv: EmployeeCVVersion) => void;
  onDelete: (cv: EmployeeCVVersion) => void;
}

function CvRow({ cv, canDelete, onAccess, onPreview, onDelete }: CvRowProps) {
  const isExternal = cv.source_type === "external_link";
  const supportsPreview = cvVersionSupportsEmbeddedPreview(cv);
  const displayName =
    cv.file_name || (cv.provider === "canva" ? "Canva CV link" : "CV file");
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 transition-colors hover:border-zinc-300">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
        <FileText size={16} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-zinc-900">
            {displayName}
          </p>
          {cv.provider === "canva" ? (
            <Badge className="border-purple-200 bg-purple-100 text-purple-700">
              Canva
            </Badge>
          ) : null}
          {cv.is_current ? (
            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
              Current
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Uploaded {formatDate(cv.uploaded_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onAccess(cv)}
        >
          {isExternal ? (
            <ExternalLink className="h-4 w-4" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          {isExternal ? "Open link" : "Download"}
        </Button>
        {supportsPreview ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => onPreview(cv)}
          >
            <Eye className="h-4 w-4" aria-hidden />
            Preview
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-700"
            onClick={() => onDelete(cv)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
