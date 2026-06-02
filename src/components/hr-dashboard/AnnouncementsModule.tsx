"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Edit3,
  Eye,
  MessageCircle,
  Loader2,
  Megaphone,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  announcementApi,
  type AnnouncementDetail,
  type AnnouncementComment,
  type AnnouncementListItem,
  type AnnouncementListParams,
  type AnnouncementPayload,
  type AnnouncementType,
} from "@/lib/api/announcements";
import { getStoredUser } from "@/lib/api/tokens";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { DatePicker } from "./DatePicker";
import { SnippetRichTextEditor } from "./templates/SnippetRichTextEditor";
import {
  isRichTextEffectivelyEmpty,
  normalizeSemanticHeadings,
} from "./templates/templateEditorHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const ANNOUNCEMENT_TYPES: {
  value: AnnouncementType;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "general",
    label: "General",
    badgeClass: "border-slate-400 bg-slate-100 text-slate-900",
  },
  {
    value: "news",
    label: "News",
    badgeClass: "border-sky-300 bg-sky-100 text-sky-900",
  },
  {
    value: "celebration",
    label: "Celebration",
    badgeClass: "border-emerald-300 bg-emerald-100 text-emerald-900",
  },
  {
    value: "urgent",
    label: "Urgent",
    badgeClass: "border-rose-300 bg-rose-100 text-rose-900",
  },
];

const ORDERING_OPTIONS: {
  value: AnnouncementListParams["ordering"];
  label: string;
}[] = [
  { value: "-published_at", label: "Published newest" },
  { value: "published_at", label: "Published oldest" },
  { value: "scheduled_at", label: "Scheduled earliest" },
  { value: "-scheduled_at", label: "Scheduled latest" },
  { value: "-created_at", label: "Created newest" },
  { value: "created_at", label: "Created oldest" },
  { value: "-updated_at", label: "Updated newest" },
  { value: "updated_at", label: "Updated oldest" },
];

const EMPTY_FORM = {
  title: "",
  body: "",
  type: "general" as AnnouncementType,
  scheduledDate: "",
  scheduledTime: "",
  sendEmailNotifications: false,
};

const REACTION_OPTIONS = [
  { type: "party", label: "Party", emoji: "🎉" },
  { type: "heart", label: "Heart", emoji: "❤️" },
  { type: "clap", label: "Clap", emoji: "👏" },
  { type: "thumbsup", label: "Like", emoji: "👍" },
] as const;

function getTypeMeta(type: AnnouncementType) {
  return (
    ANNOUNCEMENT_TYPES.find((item) => item.value === type) ??
    ANNOUNCEMENT_TYPES[0]
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toScheduleParts(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs).toISOString();
  return {
    date: local.slice(0, 10),
    time: local.slice(11, 16),
  };
}

function fromScheduleParts(datePart: string, timePart: string) {
  if (!datePart) return null;
  const date = new Date(`${datePart}T${timePart || "09:00"}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getStatus(announcement: AnnouncementListItem) {
  if (!announcement.scheduled_at)
    return { label: "Published", variant: "success" as const };
  const scheduled = new Date(announcement.scheduled_at).getTime();
  if (!Number.isNaN(scheduled) && scheduled > Date.now()) {
    return { label: "Scheduled", variant: "warning" as const };
  }
  return { label: "Published", variant: "success" as const };
}

function roleFrom(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function useCanManageAnnouncements() {
  const { data: session } = useSession();
  const [storedUser, setStoredUser] = useState<Record<string, unknown> | null>(
    null
  );

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const sessionUser = session?.user as
    | {
        role?: string;
        career_level?: string;
        is_staff?: boolean;
        is_superuser?: boolean;
      }
    | undefined;

  const role =
    roleFrom(sessionUser?.role) ??
    roleFrom(sessionUser?.career_level) ??
    roleFrom(storedUser?.role) ??
    roleFrom(storedUser?.career_level);

  return (
    Boolean(sessionUser?.is_staff) ||
    Boolean(sessionUser?.is_superuser) ||
    isHrLikeRole(role)
  );
}

function isForbidden(error: string | null) {
  return Boolean(
    error?.toLowerCase().includes("not allowed") ||
    error?.includes("403") ||
    error?.toLowerCase().includes("permission")
  );
}

function normalizeReactionType(value: string) {
  return value.trim().toLowerCase();
}

function reactionEmoji(type: string) {
  return (
    REACTION_OPTIONS.find((option) => option.type === type)?.emoji ??
    type.slice(0, 1).toUpperCase()
  );
}

function reactionLabel(type: string) {
  return REACTION_OPTIONS.find((option) => option.type === type)?.label ?? type;
}

function engagementFor(
  announcement: AnnouncementListItem | AnnouncementDetail
) {
  return {
    counts: announcement.reaction_counts ?? {},
    mine: new Set(announcement.my_reactions ?? []),
    comments: announcement.comments_count ?? 0,
  };
}

function applyReactionToggle<
  T extends AnnouncementListItem | AnnouncementDetail,
>(announcement: T, reactionType: string, active: boolean): T {
  const normalized = normalizeReactionType(reactionType);
  const counts = { ...(announcement.reaction_counts ?? {}) };
  const mine = new Set(announcement.my_reactions ?? []);
  const wasActive = mine.has(normalized);

  if (active && !wasActive) {
    counts[normalized] = (counts[normalized] ?? 0) + 1;
    mine.add(normalized);
  }
  if (!active && wasActive) {
    counts[normalized] = Math.max((counts[normalized] ?? 1) - 1, 0);
    if (counts[normalized] === 0) delete counts[normalized];
    mine.delete(normalized);
  }

  return {
    ...announcement,
    reaction_counts: counts,
    my_reactions: Array.from(mine),
  };
}

function commentAuthorId(comment: AnnouncementComment) {
  return comment.author_id ?? comment.user_id ?? null;
}

function commentAuthorName(comment: AnnouncementComment) {
  return comment.author_name ?? comment.user_name ?? "Employee";
}

function ReactionSummary({
  announcement,
  onToggle,
  savingKey,
  compact = false,
}: {
  announcement: AnnouncementListItem | AnnouncementDetail;
  onToggle: (
    announcement: AnnouncementListItem | AnnouncementDetail,
    reactionType: string
  ) => void;
  savingKey: string | null;
  compact?: boolean;
}) {
  const engagement = engagementFor(announcement);
  const reactionTypes = Array.from(
    new Set([
      ...REACTION_OPTIONS.map((option) => option.type),
      ...Object.keys(engagement.counts),
      ...engagement.mine,
    ])
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactionTypes.map((type) => {
        const count = engagement.counts[type] ?? 0;
        const mine = engagement.mine.has(type);
        const saving = savingKey === `${announcement.id}:${type}`;
        if (compact && count === 0 && !mine) return null;
        return (
          <button
            key={type}
            type="button"
            title={reactionLabel(type)}
            aria-pressed={mine}
            disabled={saving}
            onClick={() => onToggle(announcement, type)}
            className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition ${
              mine
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            } ${saving ? "opacity-60" : ""}`}
          >
            <span>{reactionEmoji(type)}</span>
            <span>{count}</span>
          </button>
        );
      })}
      <span className="inline-flex h-7 items-center gap-1 rounded-full border border-gray-200 bg-white px-2 text-xs text-gray-600">
        <MessageCircle className="h-3.5 w-3.5" />
        {engagement.comments}
      </span>
    </div>
  );
}

const OPEN_ANNOUNCEMENT_EVENT = "bloomhub:open-announcement";

export function AnnouncementsModule() {
  const { data: session } = useSession();
  const canManage = useCanManageAnnouncements();
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>(
    []
  );
  const [selected, setSelected] = useState<AnnouncementDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
  const [ordering, setOrdering] =
    useState<AnnouncementListParams["ordering"]>("-published_at");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementDetail | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementListItem | null>(
    null
  );
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSaving, setCommentSaving] = useState(false);
  const [reactionSaving, setReactionSaving] = useState<string | null>(null);
  const [formPortalContainer, setFormPortalContainer] =
    useState<HTMLDivElement | null>(null);

  const currentUserId = useMemo(() => {
    const sessionId = Number((session?.user as { id?: string | number })?.id);
    if (Number.isFinite(sessionId)) return sessionId;
    const storedId = Number(getStoredUser()?.id);
    return Number.isFinite(storedId) ? storedId : null;
  }, [session]);

  const listParams = useMemo<AnnouncementListParams>(
    () => ({
      search: search.trim() || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
      ordering,
    }),
    [ordering, search, typeFilter]
  );
  const selectedId = selected?.id;

  const loadAnnouncements = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await announcementApi.list(listParams, { signal });
        setAnnouncements(data.results);
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load announcements"
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [listParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadAnnouncements(controller.signal);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadAnnouncements]);

  const openAnnouncementById = useCallback(async (id: number) => {
    setDetailLoadingId(id);
    setError(null);
    try {
      setSelected(await announcementApi.get(id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load announcement"
      );
    } finally {
      setDetailLoadingId(null);
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const id = (event as CustomEvent<{ id?: number }>).detail?.id;
      if (!id) return;
      void openAnnouncementById(id);
    };
    window.addEventListener(OPEN_ANNOUNCEMENT_EVENT, handler);
    return () => window.removeEventListener(OPEN_ANNOUNCEMENT_EVENT, handler);
  }, [openAnnouncementById]);

  useEffect(() => {
    if (!selectedId) {
      setComments([]);
      setCommentDraft("");
      setCommentError(null);
      return;
    }

    let stale = false;
    setCommentsLoading(true);
    setCommentError(null);
    announcementApi
      .listComments(selectedId)
      .then((items) => {
        if (!stale) setComments(items);
      })
      .catch((err) => {
        if (stale) return;
        const message =
          err instanceof Error ? err.message : "Failed to load comments";
        setCommentError(
          isForbidden(message) ? "Not allowed to view comments." : message
        );
      })
      .finally(() => {
        if (!stale) setCommentsLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [selectedId]);

  const openDetail = async (item: AnnouncementListItem) => {
    await openAnnouncementById(item.id);
  };

  const toggleReaction = async (
    announcement: AnnouncementListItem | AnnouncementDetail,
    reactionType: string
  ) => {
    const normalized = normalizeReactionType(reactionType);
    if (!normalized || reactionSaving) return;
    setReactionSaving(`${announcement.id}:${normalized}`);
    setError(null);
    setCommentError(null);
    try {
      const result = await announcementApi.toggleReaction(
        announcement.id,
        normalized
      );
      const active = result.active !== false;
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === announcement.id
            ? applyReactionToggle(item, normalized, active)
            : item
        )
      );
      setSelected((prev) =>
        prev && prev.id === announcement.id
          ? applyReactionToggle(prev, normalized, active)
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update reaction";
      const normalizedMessage = isForbidden(message)
        ? "Not allowed to react to this announcement."
        : message;
      if (selected?.id === announcement.id) setCommentError(normalizedMessage);
      else setError(normalizedMessage);
    } finally {
      setReactionSaving(null);
    }
  };

  const createComment = async () => {
    if (!selected || commentSaving) return;
    const body = commentDraft.trim();
    if (!body) {
      setCommentError("Comment cannot be empty.");
      return;
    }

    setCommentSaving(true);
    setCommentError(null);
    try {
      const created = await announcementApi.createComment(selected.id, body);
      setComments((prev) => [...prev, created]);
      setCommentDraft("");
      const nextCount = (selected.comments_count ?? 0) + 1;
      setSelected({ ...selected, comments_count: nextCount });
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? { ...item, comments_count: nextCount }
            : item
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add comment";
      setCommentError(
        isForbidden(message) ? "Not allowed to comment here." : message
      );
    } finally {
      setCommentSaving(false);
    }
  };

  const deleteComment = async (comment: AnnouncementComment) => {
    if (!selected || commentSaving) return;
    setCommentSaving(true);
    setCommentError(null);
    try {
      await announcementApi.deleteComment(selected.id, comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      const nextCount = Math.max((selected.comments_count ?? 1) - 1, 0);
      setSelected({ ...selected, comments_count: nextCount });
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? { ...item, comments_count: nextCount }
            : item
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete comment";
      setCommentError(
        isForbidden(message) ? "Not allowed to delete this comment." : message
      );
    } finally {
      setCommentSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = async (item: AnnouncementListItem) => {
    setFormError(null);
    setEditing(null);
    setIsFormOpen(true);
    setSaving(true);
    try {
      const detail = await announcementApi.get(item.id);
      const schedule = toScheduleParts(detail.scheduled_at);
      setEditing(detail);
      setForm({
        title: detail.title,
        body: detail.body,
        type: detail.type,
        scheduledDate: schedule ? schedule.date : "",
        scheduledTime: schedule ? schedule.time : "",
        sendEmailNotifications: false,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to load announcement"
      );
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required.";
    if (isRichTextEffectivelyEmpty(form.body)) return "Body is required.";
    return null;
  };

  const saveAnnouncement = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: AnnouncementPayload = {
      title: form.title.trim(),
      body: normalizeSemanticHeadings(form.body.trim()),
      type: form.type,
      scheduled_at: fromScheduleParts(form.scheduledDate, form.scheduledTime),
      send_email_notifications: form.sendEmailNotifications,
    };

    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? await announcementApi.update(editing.id, payload)
        : await announcementApi.create(payload);
      setIsFormOpen(false);
      setEditing(null);
      setSelected(saved);
      await loadAnnouncements();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save announcement";
      setFormError(
        isForbidden(message) ? "Not allowed to manage announcements." : message
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await announcementApi.delete(deleteTarget.id);
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete announcement";
      setError(
        isForbidden(message) ? "Not allowed to delete announcements." : message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              <h1 className="text-2xl font-semibold text-gray-950 dark:text-gray-50">
                Announcements
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Company updates, scheduled posts, and published notices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void loadAnnouncements()}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            {canManage && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New Announcement
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_210px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-300" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 text-gray-950 placeholder:text-gray-600 dark:text-gray-50 dark:placeholder:text-gray-400"
              placeholder="Search title or body"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as AnnouncementType | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ANNOUNCEMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ordering}
            onValueChange={(value) =>
              setOrdering(value as AnnouncementListParams["ordering"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {ORDERING_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value ?? "-published_at"}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {isForbidden(error)
              ? "Not allowed to perform this announcement action."
              : error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading announcements
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Megaphone className="mx-auto h-8 w-8 text-gray-400" />
            <h2 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">
              No announcements found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Adjust filters or create first announcement.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-[minmax(220px,1.5fr)_120px_150px_180px_180px_170px_140px] border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
              <div>Title</div>
              <div>Type</div>
              <div>Author</div>
              <div>Published</div>
              <div>Schedule</div>
              <div>Engagement</div>
              <div className="text-right">Actions</div>
            </div>

            {announcements.map((item) => {
              const type = getTypeMeta(item.type);
              const status = getStatus(item);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(220px,1.5fr)_120px_150px_180px_180px_170px_140px] items-center gap-3 border-b border-gray-100 px-4 py-4 last:border-0 dark:border-gray-800"
                >
                  <button
                    type="button"
                    onClick={() => void openDetail(item)}
                    className="min-w-0 text-left"
                  >
                    <div className="truncate font-semibold text-gray-950 hover:text-blue-700 dark:text-gray-50">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-400">
                      Updated {formatDateTime(item.updated_at)}
                    </div>
                  </button>
                  <div>
                    <Badge variant="outline" className={type.badgeClass}>
                      {type.label}
                    </Badge>
                  </div>
                  <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.author_name || `User ${item.author_id}`}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    {formatDateTime(item.published_at)}
                  </div>
                  <div className="space-y-1">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <div className="text-xs text-gray-700 dark:text-gray-400">
                      {formatDateTime(item.scheduled_at)}
                    </div>
                  </div>
                  <ReactionSummary
                    announcement={item}
                    onToggle={(announcement, reactionType) =>
                      void toggleReaction(announcement, reactionType)
                    }
                    savingKey={reactionSaving}
                    compact
                  />
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 bg-white px-2 text-gray-900 shadow-sm hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                      onClick={() => void openDetail(item)}
                      disabled={detailLoadingId === item.id}
                      aria-label={`View ${item.title}`}
                    >
                      {detailLoadingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 bg-white px-2 text-gray-900 shadow-sm hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                          onClick={() => void openEdit(item)}
                          aria-label={`Edit ${item.title}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getTypeMeta(selected.type).badgeClass}
                  >
                    {getTypeMeta(selected.type).label}
                  </Badge>
                  <Badge variant={getStatus(selected).variant}>
                    {getStatus(selected).label}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selected.title}</DialogTitle>
                <DialogDescription>
                  By {selected.author_name || `User ${selected.author_id}`} ·
                  Published {formatDateTime(selected.published_at)}
                </DialogDescription>
              </DialogHeader>
              <div
                className="announcement-rich-text max-w-none text-gray-700 dark:text-gray-200 [&_h1]:!my-3 [&_h1]:!text-3xl [&_h1]:!font-bold [&_h1]:!leading-tight [&_h1]:!text-gray-950 [&_h2]:!my-2 [&_h2]:!text-2xl [&_h2]:!font-bold [&_h2]:!leading-snug [&_h2]:!text-gray-900 [&_h3]:!my-2 [&_h3]:!text-xl [&_h3]:!font-semibold [&_h3]:!leading-snug [&_h3]:!text-gray-900 [&_p]:!my-1.5 [&_p]:!text-sm [&_p]:!leading-6 dark:[&_h1]:!text-gray-50 dark:[&_h2]:!text-gray-100 dark:[&_h3]:!text-gray-100"
                dangerouslySetInnerHTML={{ __html: selected.body }}
              />
              <div className="border-t pt-4">
                <ReactionSummary
                  announcement={selected}
                  onToggle={(announcement, reactionType) =>
                    void toggleReaction(announcement, reactionType)
                  }
                  savingKey={reactionSaving}
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Comments ({selected.comments_count ?? comments.length})
                  </h3>
                  {commentsLoading ? (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading
                    </span>
                  ) : null}
                </div>

                {commentError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {commentError}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Add a comment"
                    className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    disabled={commentSaving}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => void createComment()}
                      disabled={commentSaving || !commentDraft.trim()}
                    >
                      {commentSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Comment
                    </Button>
                  </div>
                </div>

                {commentsLoading ? null : comments.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
                    No comments yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {comments.map((comment) => {
                      const canDeleteComment =
                        canManage || commentAuthorId(comment) === currentUserId;
                      return (
                        <div
                          key={comment.id}
                          className="rounded-md border border-gray-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {commentAuthorName(comment)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(comment.created_at)}
                              </p>
                            </div>
                            {canDeleteComment ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-red-600 hover:text-red-700"
                                disabled={commentSaving}
                                onClick={() => void deleteComment(comment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                            {comment.body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {canManage && (
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    className="border-gray-300 bg-white text-gray-900 shadow-sm hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                    onClick={() => void openEdit(selected)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 bg-white text-red-700 shadow-sm hover:border-red-400 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    onClick={() => setDeleteTarget(selected)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          ref={setFormPortalContainer}
          className="max-h-[90vh] overflow-auto sm:max-w-5xl"
          onPointerDownOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-datepicker-popover="true"]')) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-datepicker-popover="true"]')) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit announcement" : "New announcement"}
            </DialogTitle>
            <DialogDescription>
              Rich text body accepts saved HTML. Future schedule requires
              scheduler permission.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="announcement-type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value as AnnouncementType,
                  }))
                }
                disabled={saving}
              >
                <SelectTrigger
                  id="announcement-type"
                  className="h-11 px-4 text-gray-950 dark:text-gray-50"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Body</Label>
              <SnippetRichTextEditor
                key={editing?.id ?? "new-announcement"}
                initialHtml={form.body || "<p><br></p>"}
                onHtmlChange={(html) =>
                  setForm((prev) => ({ ...prev, body: html }))
                }
                showBackgroundColorControl={false}
              />
            </div>

            <div className="grid gap-2">
              <Label>Schedule</Label>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_120px_auto_auto]">
                <DatePicker
                  key={form.scheduledDate || "no-schedule-date"}
                  mode="single"
                  value={form.scheduledDate}
                  onChange={(date) =>
                    setForm((prev) => ({
                      ...prev,
                      scheduledDate: date,
                      scheduledTime:
                        date && !prev.scheduledTime
                          ? "09:00"
                          : prev.scheduledTime,
                    }))
                  }
                  placeholder="Pick date"
                  size="compact"
                  floatPortal
                  portalContainer={formPortalContainer}
                  disabled={saving}
                />
                <Input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      scheduledTime: event.target.value,
                      scheduledDate: prev.scheduledDate,
                    }))
                  }
                  disabled={saving || !form.scheduledDate}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      scheduledDate: "",
                      scheduledTime: "",
                    }))
                  }
                  disabled={saving}
                >
                  <Send className="h-4 w-4" />
                  Publish now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void saveAnnouncement()}
                  disabled={saving || !form.scheduledDate}
                >
                  <CalendarClock className="h-4 w-4" />
                  Schedule
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Notifications are sent when scheduled announcement is published.
                Scheduled posts notify users after backend due-announcement job
                runs.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-md border border-gray-200 p-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={form.sendEmailNotifications}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sendEmailNotifications: event.target.checked,
                  }))
                }
                disabled={saving}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Send email notification
                </span>
                <span className="block text-xs text-gray-500">
                  In-app notifications are created automatically when
                  announcement becomes published.
                </span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={() => void saveAnnouncement()} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleteTarget?.title}&quot; from announcements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void deleteAnnouncement()}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
