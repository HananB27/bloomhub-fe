"use client";

import { useEffect, useState } from "react";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Lock,
  Paperclip,
  Plus,
  Send,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet";
import { DatePicker } from "../DatePicker";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { formatDate } from "@/utils";
import type {
  ActionPointStatus,
  NoteVisibility,
  PerformanceReview,
  PerformanceReviewActionPoint,
  PerformanceReviewAttachment,
  PerformanceReviewNote,
  ReviewStatus,
} from "@/types/reviews";
import {
  ACTION_POINT_STATUS_LABELS,
  RATING_LABELS,
  RATING_SCALE,
  REVIEW_STATUS_LABELS,
  REVIEW_TYPE_LABELS,
} from "@/types/reviews";
import type { UserProfile } from "@/lib/api/reviews";
import { PersonAvatar } from "./PersonAvatar";
import { StatusPill } from "./StatusPill";
import { dueLabel, daysUntil } from "./reviewsModuleHelpers";

type DrawerTab = "agenda" | "notes" | "actions" | "attachments";

interface NewActionDraft {
  title: string;
  description: string;
  ownerId: string;
  dueDate: string;
}

interface OutcomeDraft {
  overallRating: number | null;
  summary: string;
  cpfScore: number | null;
  performanceScore: number | null;
}

interface ReviewDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: PerformanceReview | null;
  notes: PerformanceReviewNote[];
  actionPoints: PerformanceReviewActionPoint[];
  attachments: PerformanceReviewAttachment[];
  employees: UserProfile[];
  errorMessage?: string | null;
  outcome: OutcomeDraft;
  onOutcomeChange: (next: OutcomeDraft) => void;
  onSaveOutcome: () => void;
  onStatusChange: (next: ReviewStatus) => void;
  onAddNote: (content: string, visibility: NoteVisibility) => Promise<void>;
  onDeleteNote: (id: string) => void;
  onAddAction: (draft: NewActionDraft) => Promise<void>;
  onDeleteAction: (id: string) => void;
  onUpdateActionStatus: (id: string, status: ActionPointStatus) => void;
  onUploadAttachment: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => void;
}

const DRAWER_TABS: Array<{ value: DrawerTab; label: string }> = [
  { value: "agenda", label: "Summary & scores" },
  { value: "notes", label: "Notes" },
  { value: "actions", label: "Action items" },
  { value: "attachments", label: "Attachments" },
];

const STATUS_OPTIONS: ReviewStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

export function ReviewDetailDrawer(props: ReviewDetailDrawerProps) {
  const {
    open,
    onOpenChange,
    review,
    notes,
    actionPoints,
    attachments,
    employees,
    errorMessage,
    outcome,
    onOutcomeChange,
    onSaveOutcome,
    onStatusChange,
    onAddNote,
    onDeleteNote,
    onAddAction,
    onDeleteAction,
    onUpdateActionStatus,
    onUploadAttachment,
    onDeleteAttachment,
  } = props;

  const [tab, setTab] = useState<DrawerTab>("agenda");

  useEffect(() => {
    if (open) setTab("agenda");
  }, [open, review?.id]);

  if (!review) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-none w-full sm:!max-w-[560px] p-0 gap-0 !bg-white text-gray-900"
      >
        <SheetTitle className="sr-only">
          Review details — {review.employeeName}
        </SheetTitle>
        <DrawerHeader review={review} onStatusChange={onStatusChange} />

        <div className="flex gap-0 px-3 border-b border-gray-200">
          {DRAWER_TABS.map((t) => {
            const isActive = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`h-9 px-3 text-[12.5px] font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "text-gray-900 border-gray-900"
                    : "text-gray-500 border-transparent hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {errorMessage && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
              {errorMessage}
            </div>
          )}
          {tab === "agenda" && (
            <AgendaPanel
              review={review}
              outcome={outcome}
              onOutcomeChange={onOutcomeChange}
            />
          )}
          {tab === "notes" && (
            <NotesPanel
              notes={notes}
              onAdd={onAddNote}
              onDelete={onDeleteNote}
            />
          )}
          {tab === "actions" && (
            <ActionsPanel
              actionPoints={actionPoints}
              employees={employees}
              onAdd={onAddAction}
              onDelete={onDeleteAction}
              onUpdateStatus={onUpdateActionStatus}
            />
          )}
          {tab === "attachments" && (
            <AttachmentsPanel
              attachments={attachments}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
            />
          )}
        </div>

        <DrawerFooter
          onSaveOutcome={onSaveOutcome}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

interface DrawerHeaderProps {
  review: PerformanceReview;
  onStatusChange: (status: ReviewStatus) => void;
}

function DrawerHeader({ review, onStatusChange }: DrawerHeaderProps) {
  return (
    <div className="px-5 pt-5 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <StatusPill status={review.status} />
        <Select
          value={review.status}
          onValueChange={(v) => onStatusChange(v as ReviewStatus)}
        >
          <SelectTrigger className="h-7 w-auto gap-1 text-[12px] border-gray-200 bg-white px-2">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {REVIEW_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3 items-center mb-3">
        <PersonAvatar name={review.employeeName} size={48} />
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tracking-tight truncate">
            {review.employeeName}
          </div>
          <div className="text-[12px] text-gray-500 mt-0.5 truncate">
            {REVIEW_TYPE_LABELS[review.reviewType]}
            {review.cpfCurrentLevel ? ` · ${review.cpfCurrentLevel}` : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <SummaryStat label="Scheduled">
          <div className="text-[13px] font-medium">
            {formatDate(review.scheduledDate)}
          </div>
          {review.status !== "completed" && review.status !== "cancelled" && (
            <DueLine iso={review.scheduledDate} />
          )}
        </SummaryStat>
        <SummaryStat label="Type">
          <div className="text-[13px] font-medium">
            {REVIEW_TYPE_LABELS[review.reviewType]}
          </div>
        </SummaryStat>
        <SummaryStat label="Reviewer">
          <div className="flex items-center gap-1.5">
            <PersonAvatar name={review.reviewerName} size={18} />
            <span className="text-[13px] font-medium truncate">
              {review.reviewerName}
            </span>
          </div>
        </SummaryStat>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10.5px] text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function DueLine({ iso }: { iso: string }) {
  const n = daysUntil(iso);
  const color =
    n < 0 ? "text-red-600" : n <= 1 ? "text-amber-600" : "text-gray-500";
  return <div className={`text-[11px] mt-0.5 ${color}`}>{dueLabel(iso)}</div>;
}

interface DrawerFooterProps {
  onSaveOutcome: () => void;
  onClose: () => void;
}

function DrawerFooter({ onSaveOutcome, onClose }: DrawerFooterProps) {
  const handleSave = async () => {
    await onSaveOutcome();
  };
  const handleSaveAndClose = async () => {
    await onSaveOutcome();
    onClose();
  };
  return (
    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white">
      <Button variant="ghost" onClick={onClose} className="text-gray-600">
        Close
      </Button>
      <Button variant="outline" onClick={handleSave}>
        Save
      </Button>
      <Button onClick={handleSaveAndClose} className="gap-1.5">
        <Send className="w-3.5 h-3.5" />
        Save &amp; close
      </Button>
    </div>
  );
}

interface AgendaPanelProps {
  review: PerformanceReview;
  outcome: OutcomeDraft;
  onOutcomeChange: (next: OutcomeDraft) => void;
}

function AgendaPanel({ review, outcome, onOutcomeChange }: AgendaPanelProps) {
  return (
    <div className="space-y-5">
      <section>
        <SectionTitle title="Performance summary" />
        <Textarea
          rows={3}
          className="text-[13px]"
          placeholder="One-paragraph summary that will appear on the employee's profile timeline…"
          value={outcome.summary}
          onChange={(e) =>
            onOutcomeChange({ ...outcome, summary: e.target.value })
          }
        />
      </section>

      <section>
        <SectionTitle title="Overall rating" />
        <div className="flex gap-1.5">
          {RATING_SCALE.map((rating) => {
            const filled =
              outcome.overallRating != null && rating <= outcome.overallRating;
            return (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  onOutcomeChange({ ...outcome, overallRating: rating })
                }
                className={`p-2 rounded-md transition-colors ${
                  filled
                    ? "bg-amber-400 text-white hover:bg-amber-500"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                title={RATING_LABELS[rating]}
                aria-label={`Rate ${rating} out of 5 — ${RATING_LABELS[rating]}`}
              >
                <Star className="w-4 h-4" fill="currentColor" />
              </button>
            );
          })}
        </div>
        {outcome.overallRating != null && (
          <div className="mt-2 text-[12px] text-gray-500">
            {outcome.overallRating}/5 · {RATING_LABELS[outcome.overallRating]}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Scores" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px]">CPF score</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0–100"
              value={outcome.cpfScore ?? ""}
              onChange={(e) =>
                onOutcomeChange({
                  ...outcome,
                  cpfScore: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Performance score</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0–100"
              value={outcome.performanceScore ?? ""}
              onChange={(e) =>
                onOutcomeChange({
                  ...outcome,
                  performanceScore: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
            />
          </div>
        </div>
        {(review.cpfCurrentLevel || review.cpfRecommendedLevel) && (
          <div className="mt-3 px-3 py-2.5 bg-gray-50 rounded-md text-[12px] text-gray-600 flex gap-4">
            {review.cpfCurrentLevel && (
              <span>
                Current CPF: <strong>{review.cpfCurrentLevel}</strong>
              </span>
            )}
            {review.cpfRecommendedLevel && (
              <span>
                Recommended: <strong>{review.cpfRecommendedLevel}</strong>
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h4 className="m-0 mb-2 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </h4>
  );
}

interface NotesPanelProps {
  notes: PerformanceReviewNote[];
  onAdd: (content: string, visibility: NoteVisibility) => Promise<void>;
  onDelete: (id: string) => void;
}

function NotesPanel({ notes, onAdd, onDelete }: NotesPanelProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("shared");

  const handleAdd = async () => {
    if (!content.trim()) return;
    await onAdd(content, visibility);
    setContent("");
    setVisibility("shared");
  };

  return (
    <div className="space-y-4">
      <section>
        <SectionTitle title="Add a note" />
        <Textarea
          rows={3}
          className="text-[13px] mb-2"
          placeholder="Capture context, decisions, or follow-ups…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <Select
            value={visibility}
            onValueChange={(v) => setVisibility(v as NoteVisibility)}
          >
            <SelectTrigger className="h-8 w-[210px] text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">Shared with employee</SelectItem>
              <SelectItem value="private">Private to reviewer</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!content.trim()}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add note
          </Button>
        </div>
      </section>

      <section>
        <SectionTitle title={`Notes (${notes.length})`} />
        {notes.length === 0 ? (
          <div className="px-3 py-4 bg-gray-50 rounded-md text-[12.5px] text-gray-500">
            No notes yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="text-[12.5px] font-medium">
                    {note.authorName}
                  </div>
                  <div className="flex items-center gap-2">
                    {note.visibility === "private" ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        Shared
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(note.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="m-0 text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
                <div className="mt-1.5 text-[11px] text-gray-500">
                  {formatDate(note.updatedAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface ActionsPanelProps {
  actionPoints: PerformanceReviewActionPoint[];
  employees: UserProfile[];
  onAdd: (draft: NewActionDraft) => Promise<void>;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ActionPointStatus) => void;
}

const ACTION_STATUS_OPTIONS: ActionPointStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

function ActionsPanel({
  actionPoints,
  employees,
  onAdd,
  onDelete,
  onUpdateStatus,
}: ActionsPanelProps) {
  const [draft, setDraft] = useState<NewActionDraft>({
    title: "",
    description: "",
    ownerId: "",
    dueDate: "",
  });

  const handleAdd = async () => {
    if (!draft.title.trim()) return;
    await onAdd(draft);
    setDraft({ title: "", description: "", ownerId: "", dueDate: "" });
  };

  return (
    <div className="space-y-4">
      <section>
        <SectionTitle title="New action item" />
        <div className="space-y-2">
          <Input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="text-[13px]"
          />
          <Textarea
            rows={2}
            placeholder="Description (optional)"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            className="text-[13px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={draft.ownerId}
              onValueChange={(v) => setDraft({ ...draft, ownerId: v })}
            >
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePicker
              mode="single"
              value={draft.dueDate}
              onChange={(date) => setDraft({ ...draft, dueDate: date })}
              placeholder="Due date"
              size="compact"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!draft.title.trim()}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add action
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title={`Action items (${actionPoints.length})`} />
        {actionPoints.length === 0 ? (
          <div className="px-3 py-4 bg-gray-50 rounded-md text-[12.5px] text-gray-500 leading-relaxed">
            No action items yet. Add concrete, owned, dated commitments so this
            conversation doesn&apos;t evaporate.
          </div>
        ) : (
          <ul className="space-y-2">
            {actionPoints.map((ap) => {
              const isDone = ap.status === "completed";
              return (
                <li
                  key={ap.id}
                  className="border border-gray-200 rounded-md p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(ap.id, isDone ? "pending" : "completed")
                      }
                      className={`mt-0.5 w-4 h-4 rounded border grid place-items-center transition-colors ${
                        isDone
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[13px] font-medium ${
                          isDone ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {ap.title}
                      </div>
                      {ap.description && (
                        <div className="text-[12px] text-gray-600 mt-0.5 whitespace-pre-wrap">
                          {ap.description}
                        </div>
                      )}
                      <div className="mt-1.5 text-[11.5px] text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Owner: {ap.ownerName}</span>
                        <span>Due: {formatDate(ap.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={ap.status}
                        onValueChange={(v) =>
                          onUpdateStatus(ap.id, v as ActionPointStatus)
                        }
                      >
                        <SelectTrigger className="h-7 w-[120px] text-[11.5px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {ACTION_POINT_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={() => onDelete(ap.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

interface AttachmentsPanelProps {
  attachments: PerformanceReviewAttachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
}

function isImageAttachment(fileName: string | undefined | null): boolean {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp")
  );
}

function AttachmentsPanel({
  attachments,
  onUpload,
  onDelete,
}: AttachmentsPanelProps) {
  return (
    <div className="space-y-4">
      <section>
        <SectionTitle title="Upload" />
        <label
          htmlFor="review-attachment-input"
          className="flex flex-col items-center justify-center gap-2 py-7 px-5 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
          <div className="text-[13px] font-medium text-gray-900">
            Drop PDFs, screenshots, or notes here
          </div>
          <div className="text-[12px] max-w-[360px] leading-relaxed">
            Attachments are scoped to this review only.
          </div>
          <input
            id="review-attachment-input"
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file);
                e.target.value = "";
              }
            }}
          />
        </label>
      </section>

      <section>
        <SectionTitle title={`Files (${attachments.length})`} />
        {attachments.length === 0 ? (
          <div className="px-3 py-4 bg-gray-50 rounded-md text-[12.5px] text-gray-500">
            No attachments yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => {
              const isImg = isImageAttachment(a.fileName);
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 items-center border border-gray-200 rounded-md p-2.5"
                >
                  <div className="w-8 h-8 rounded-md bg-gray-100 text-gray-500 grid place-items-center">
                    {isImg ? (
                      <ImageIcon className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">
                      {a.fileName}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {a.uploadedByName} · {formatDate(a.uploadedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 rotate-180" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onDelete(a.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
