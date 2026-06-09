"use client";

/* ----------------------------------------------------------------------------
 * AnnouncementsModule — VISUAL REDESIGN
 *
 * This is a presentation-only refresh. Every hook, piece of state, handler and
 * API call is IDENTICAL to the original component — only JSX structure and
 * Tailwind classes changed. Props, the DatePicker, SnippetRichTextEditor, the
 * shadcn primitives, and the create/edit/delete dialog flows are all preserved.
 *
 * What changed visually (see notes at bottom of this file):
 *  - Neutral "zinc" palette + mono numerals to match the Compensation module.
 *  - A summary strip (4 derived counters) above the list — computed from the
 *    already-loaded `announcements`, no new API calls.
 *  - The raw 7-column grid became a real, horizontally-scrollable table with a
 *    type icon tile, avatar author cell, and pill-style engagement chips.
 *  - Softer type/status badges; rounded icon-buttons for row actions.
 *  - Dialogs restyled with an eyebrow badge row + cleaner comment threads.
 * -------------------------------------------------------------------------- */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  Heart,
  Info,
  MessageCircle,
  Loader2,
  Megaphone,
  Newspaper,
  PartyPopper,
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

// ── Type metadata: softer tinted badges + an icon tile per type ─────────────
const ANNOUNCEMENT_TYPES: {
  value: AnnouncementType;
  label: string;
  badgeClass: string;
  tileClass: string;
  Icon: typeof Info;
}[] = [
  {
    value: "general",
    label: "General",
    badgeClass: "border-zinc-200 bg-zinc-100 text-zinc-700",
    tileClass: "border-zinc-200 bg-zinc-100 text-zinc-600",
    Icon: Info,
  },
  {
    value: "news",
    label: "News",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    tileClass: "border-sky-200 bg-sky-50 text-sky-600",
    Icon: Newspaper,
  },
  {
    value: "celebration",
    label: "Celebration",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    tileClass: "border-emerald-200 bg-emerald-50 text-emerald-600",
    Icon: PartyPopper,
  },
  {
    value: "urgent",
    label: "Urgent",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    tileClass: "border-rose-200 bg-rose-50 text-rose-600",
    Icon: AlertTriangle,
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
  scheduleMode: "now" as "now" | "scheduled",
  scheduledDate: "",
  scheduledTime: "",
  sendEmailNotifications: false,
};

// Format free-typed input into 24-hour HH:MM as the user types.
// Native <input type="time"> renders AM/PM per locale and can't be forced to
// 24h cross-browser, so the time is a plain text field instead.
function formatTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

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

function getInitials(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() ||
    (name?.[0]?.toUpperCase() ?? "?")
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
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

// ── Initials avatar (deterministic tint) ────────────────────────────────────
const AVATAR_TONES = [
  "bg-indigo-50 text-indigo-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
];
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const tone =
    AVATAR_TONES[(name || "").charCodeAt(0) % AVATAR_TONES.length] ??
    AVATAR_TONES[0];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </span>
  );
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
            onClick={(e) => {
              e.stopPropagation();
              onToggle(announcement, type);
            }}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium tabular-nums transition ${
              mine
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            } ${saving ? "opacity-60" : ""}`}
          >
            <span className="text-[13px] leading-none">
              {reactionEmoji(type)}
            </span>
            <span>{count}</span>
          </button>
        );
      })}
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 text-xs font-medium tabular-nums text-zinc-500">
        <MessageCircle className="h-3.5 w-3.5" />
        {engagement.comments}
      </span>
    </div>
  );
}

// ── Summary counter card (echoes the Compensation KPI strip) ────────────────
function SummaryCard({
  label,
  value,
  hint,
  Icon,
  iconClass,
}: {
  label: string;
  value: number;
  hint: React.ReactNode;
  Icon: typeof Megaphone;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-[12.5px] font-medium text-gray-500">
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg ${iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-3 font-mono text-[27px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums dark:text-gray-50">
        {value}
      </div>
      <div className="mt-2 text-[11.5px] text-gray-400">{hint}</div>
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

  // ── Derived summary counters (no extra API calls) ─────────────────────────
  const summary = useMemo(() => {
    let published = 0;
    let scheduled = 0;
    let reactions = 0;
    let comments = 0;
    for (const a of announcements) {
      if (getStatus(a).label === "Scheduled") scheduled += 1;
      else published += 1;
      reactions += Object.values(a.reaction_counts ?? {}).reduce(
        (sum, n) => sum + n,
        0
      );
      comments += a.comments_count ?? 0;
    }
    return {
      total: announcements.length,
      published,
      scheduled,
      reactions,
      comments,
    };
  }, [announcements]);

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
        scheduleMode: schedule ? "scheduled" : "now",
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
    if (form.scheduleMode === "scheduled") {
      if (!form.scheduledDate)
        return "Pick a date and time to schedule this announcement.";
      if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(form.scheduledTime))
        return "Enter a valid 24-hour time (HH:MM).";
    }
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
      scheduled_at:
        form.scheduleMode === "scheduled"
          ? fromScheduleParts(form.scheduledDate, form.scheduledTime)
          : null,
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
    <div className="flex h-full min-h-0 flex-col bg-zinc-50 dark:bg-gray-950">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                Announcements
              </h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Company updates, scheduled posts, and published notices.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void loadAnnouncements()}
              disabled={loading}
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
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
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-[1320px]">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              {isForbidden(error)
                ? "Not allowed to perform this announcement action."
                : error}
            </div>
          )}

          {/* ── Summary strip ───────────────────────────────────────────── */}
          <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Total announcements"
              value={summary.total}
              hint="Across all types"
              Icon={Megaphone}
              iconClass="bg-zinc-100 text-zinc-600"
            />
            <SummaryCard
              label="Published"
              value={summary.published}
              hint="Live to the company"
              Icon={CheckCircle2}
              iconClass="bg-emerald-50 text-emerald-600"
            />
            <SummaryCard
              label="Scheduled"
              value={summary.scheduled}
              hint="Queued to publish"
              Icon={CalendarClock}
              iconClass="bg-amber-50 text-amber-600"
            />
            <SummaryCard
              label="Engagement"
              value={summary.reactions + summary.comments}
              hint={
                <>
                  <b className="font-semibold">{summary.reactions}</b> reactions
                  · <b className="font-semibold">{summary.comments}</b> comments
                </>
              }
              Icon={Heart}
              iconClass="bg-rose-50 text-rose-600"
            />
          </div>

          {/* ── List panel ──────────────────────────────────────────────── */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Toolbar */}
            <div className="flex flex-wrap items-end gap-3.5 border-b border-zinc-100 p-4 dark:border-gray-800">
              <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Search
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Search title or body"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Type
                </span>
                <Select
                  value={typeFilter}
                  onValueChange={(value) =>
                    setTypeFilter(value as AnnouncementType | "all")
                  }
                >
                  <SelectTrigger className="w-[160px]">
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
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Sort
                </span>
                <Select
                  value={ordering}
                  onValueChange={(value) =>
                    setOrdering(value as AnnouncementListParams["ordering"])
                  }
                >
                  <SelectTrigger className="w-[180px]">
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

              <div className="ml-auto pb-2 text-[12.5px] text-gray-500">
                Showing{" "}
                <b className="font-semibold text-gray-700">
                  {announcements.length}
                </b>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading announcements
              </div>
            ) : announcements.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
                  <Megaphone className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                  No announcements found
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Adjust your filters, or create the first announcement.
                </p>
                {canManage && (
                  <Button className="mt-4" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    New Announcement
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Author</th>
                      <th className="px-4 py-3 text-left">Published</th>
                      <th className="px-4 py-3 text-left">Schedule</th>
                      <th className="px-4 py-3 text-left">Engagement</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((item) => {
                      const type = getTypeMeta(item.type);
                      const status = getStatus(item);
                      const TypeIcon = type.Icon;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-zinc-50 transition last:border-0 hover:bg-zinc-50/60 dark:border-gray-800"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => void openDetail(item)}
                              className="group flex min-w-0 items-center gap-3 text-left"
                            >
                              <span
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border ${type.tileClass}`}
                              >
                                <TypeIcon className="h-[18px] w-[18px]" />
                              </span>
                              <span className="min-w-0">
                                <span className="block max-w-[320px] truncate font-semibold text-gray-950 group-hover:text-blue-700 dark:text-gray-50">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block text-[11.5px] text-gray-500">
                                  Updated {formatDateTime(item.updated_at)}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`gap-1 ${type.badgeClass}`}
                            >
                              <TypeIcon className="h-3 w-3" />
                              {type.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <Avatar name={item.author_name} size={28} />
                              <span className="truncate text-[13px] font-medium text-gray-700 dark:text-gray-200">
                                {item.author_name || `User ${item.author_id}`}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[12.5px] text-gray-600 tabular-nums dark:text-gray-300">
                            {item.published_at ? (
                              formatDate(item.published_at)
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge variant={status.variant} className="w-fit">
                                {status.label}
                              </Badge>
                              <span className="font-mono text-[11.5px] text-gray-400">
                                {item.scheduled_at
                                  ? formatDate(item.scheduled_at)
                                  : "Not scheduled"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ReactionSummary
                              announcement={item}
                              onToggle={(announcement, reactionType) =>
                                void toggleReaction(announcement, reactionType)
                              }
                              savingKey={reactionSaving}
                              compact
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => void openDetail(item)}
                                disabled={detailLoadingId === item.id}
                                aria-label={`View ${item.title}`}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-gray-500 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-gray-700"
                              >
                                {detailLoadingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                              {canManage && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void openEdit(item)}
                                    aria-label={`Edit ${item.title}`}
                                    className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-gray-500 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-gray-700"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(item)}
                                    aria-label={`Delete ${item.title}`}
                                    className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="flex max-h-[90vh] min-h-0 flex-col gap-0 overflow-hidden rounded-[18px] p-0 shadow-2xl sm:max-w-[680px]">
          {selected && (
            <>
              <DialogHeader className="gap-0 px-6 pb-4 pr-20 pt-[22px]">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`h-6 rounded-md px-2 text-xs font-medium ${getTypeMeta(selected.type).badgeClass}`}
                  >
                    {getTypeMeta(selected.type).label}
                  </Badge>
                  <Badge
                    variant={getStatus(selected).variant}
                    className="h-6 rounded-md px-2 text-xs font-medium"
                  >
                    {getStatus(selected).label}
                  </Badge>
                </div>
                <DialogTitle className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-[15px] text-zinc-500">
                  By {selected.author_name || `User ${selected.author_id}`} ·{" "}
                  {getStatus(selected).label === "Scheduled"
                    ? `Scheduled for ${formatDateTime(selected.scheduled_at)}`
                    : `Published ${formatDateTime(selected.published_at)}`}
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-1">
                <div
                  className="announcement-rich-text max-w-none text-[14.5px] leading-[1.65] text-zinc-700 [&_h1]:!my-3 [&_h1]:!text-3xl [&_h1]:!font-bold [&_h1]:!leading-tight [&_h1]:!text-zinc-950 [&_h2]:!my-2 [&_h2]:!text-2xl [&_h2]:!font-bold [&_h2]:!leading-snug [&_h2]:!text-zinc-900 [&_h3]:!mb-2 [&_h3]:!mt-[18px] [&_h3]:!text-base [&_h3]:!font-semibold [&_h3]:!leading-snug [&_h3]:!text-zinc-950 [&_p]:!mb-3 [&_p]:!mt-0 [&_strong]:!font-semibold [&_strong]:!text-zinc-950"
                  dangerouslySetInnerHTML={{ __html: selected.body }}
                />
                <div className="my-[18px] h-0.5 bg-zinc-300" />
                <ReactionSummary
                  announcement={selected}
                  onToggle={(announcement, reactionType) =>
                    void toggleReaction(announcement, reactionType)
                  }
                  savingKey={reactionSaving}
                />
                <div className="my-[18px] h-0.5 bg-zinc-300" />

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-950">
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
                    <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {commentError}
                    </div>
                  ) : null}

                  <div className="mb-3.5 flex items-start gap-[11px]">
                    {currentUserId != null && <Avatar name="You" size={32} />}
                    <div className="flex-1">
                      <textarea
                        value={commentDraft}
                        onChange={(event) =>
                          setCommentDraft(event.target.value)
                        }
                        placeholder="Add a comment…"
                        className="min-h-[72px] w-full rounded-[10px] border border-zinc-200 px-3 py-2 text-[13.5px] text-zinc-800 shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-500/10"
                        disabled={commentSaving}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="primary"
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
                  </div>

                  {commentsLoading ? null : comments.length === 0 ? (
                    <div className="rounded-[11px] border border-dashed border-zinc-200 px-4 py-6 text-center text-[13px] text-zinc-500">
                      No comments yet. Be the first to respond.
                    </div>
                  ) : (
                    <div>
                      {comments.map((comment) => {
                        const canDeleteComment =
                          canManage ||
                          commentAuthorId(comment) === currentUserId;
                        return (
                          <div
                            key={comment.id}
                            className="group flex items-start gap-[11px] border-t border-zinc-300 py-3"
                          >
                            <Avatar
                              name={commentAuthorName(comment)}
                              size={32}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <p className="whitespace-nowrap text-[13px] font-semibold text-gray-900">
                                  {commentAuthorName(comment)}
                                </p>
                                <p className="whitespace-nowrap text-[11.5px] text-gray-400">
                                  {formatDateTime(comment.created_at)}
                                </p>
                                {canDeleteComment ? (
                                  <button
                                    type="button"
                                    disabled={commentSaving}
                                    onClick={() => void deleteComment(comment)}
                                    className="ml-auto grid h-7 w-7 place-items-center rounded-md text-gray-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : null}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-gray-700">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="mt-[18px] flex justify-end gap-[9px] border-t border-zinc-300 px-6 pb-5 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => void openEdit(selected)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
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

      {/* ── Create / edit dialog ──────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          ref={setFormPortalContainer}
          className="flex max-h-[90vh] min-h-0 flex-col gap-0 overflow-hidden rounded-[18px] p-0 shadow-2xl sm:max-w-[780px]"
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
          <DialogHeader className="gap-0 px-6 pb-4 pr-20 pt-[22px]">
            <DialogTitle className="text-[21px] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
              {editing ? "Edit announcement" : "New announcement"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] text-zinc-500">
              Rich-text body accepts saved HTML. Future schedule requires
              scheduler permission.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-1">
            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="grid gap-[18px] pb-1.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor="announcement-title"
                    className="mb-2 block text-[12.5px] font-semibold text-zinc-700"
                  >
                    Title
                  </Label>
                  <Input
                    id="announcement-title"
                    value={form.title}
                    placeholder="e.g. Welcome to the team"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    disabled={saving}
                    className="h-10 rounded-[10px] border-zinc-200 shadow-sm focus-visible:ring-zinc-500/10"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="announcement-type"
                    className="mb-2 block text-[12.5px] font-semibold text-zinc-700"
                  >
                    Type
                  </Label>
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
                      className="h-10 rounded-[10px] border-zinc-200 shadow-sm"
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
              </div>

              <div>
                <Label className="mb-2 block text-[12.5px] font-semibold text-zinc-700">
                  Body
                </Label>
                <SnippetRichTextEditor
                  key={editing?.id ?? "new-announcement"}
                  initialHtml={form.body || "<p><br></p>"}
                  onHtmlChange={(html) =>
                    setForm((prev) => ({ ...prev, body: html }))
                  }
                  showBackgroundColorControl={false}
                />
              </div>

              <div>
                <Label className="mb-2 block text-[12.5px] font-semibold text-zinc-700">
                  Schedule
                </Label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        scheduleMode: "now",
                        scheduledDate: "",
                        scheduledTime: "",
                      }))
                    }
                    disabled={saving}
                    aria-pressed={form.scheduleMode === "now"}
                    className={`flex items-start gap-3 rounded-[11px] border p-[13px] text-left transition ${
                      form.scheduleMode === "now"
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <Send className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
                    <span>
                      <span className="block text-sm font-medium text-zinc-900">
                        Publish now
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Goes live immediately after saving.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        scheduleMode: "scheduled",
                        scheduledTime: prev.scheduledTime || "09:00",
                      }))
                    }
                    disabled={saving}
                    aria-pressed={form.scheduleMode === "scheduled"}
                    className={`flex items-start gap-3 rounded-[11px] border p-[13px] text-left transition ${
                      form.scheduleMode === "scheduled"
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
                    <span>
                      <span className="block text-sm font-medium text-zinc-900">
                        Schedule for later
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Publishes automatically at a set date and time.
                      </span>
                    </span>
                  </button>
                </div>

                {form.scheduleMode === "scheduled" &&
                  (() => {
                    const timeInvalid =
                      form.scheduledTime !== "" &&
                      !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(
                        form.scheduledTime
                      );
                    return (
                      <>
                        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[minmax(200px,1fr)_104px]">
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
                            type="text"
                            inputMode="numeric"
                            placeholder="HH:MM"
                            maxLength={5}
                            value={form.scheduledTime}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                scheduledTime: formatTimeInput(
                                  event.target.value
                                ),
                              }))
                            }
                            disabled={saving || !form.scheduledDate}
                            aria-label="Time (24-hour)"
                            aria-invalid={timeInvalid}
                            className={`h-10 rounded-[10px] text-center shadow-sm ${
                              timeInvalid
                                ? "border-rose-300 focus-visible:ring-rose-500/10"
                                : "border-zinc-200"
                            }`}
                          />
                        </div>
                        {timeInvalid && (
                          <p className="mt-1.5 text-xs text-rose-600">
                            Enter a valid 24-hour time (HH:MM), e.g. 09:24 or
                            17:00.
                          </p>
                        )}
                      </>
                    );
                  })()}

                <p className="mt-2 text-xs text-zinc-500">
                  {form.scheduleMode === "scheduled"
                    ? "Scheduled posts notify users after the backend due-announcement job runs."
                    : "Notifications are sent as soon as the announcement is published."}
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-[11px] border border-zinc-200 bg-zinc-50 p-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-zinc-900"
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
                    In-app notifications are created automatically when an
                    announcement becomes published.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-[18px] flex justify-end gap-[9px] border-t border-zinc-100 px-6 pb-5 pt-4">
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
              {editing ? "Save changes" : "Save announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &quot;{deleteTarget?.title}&quot; from
              announcements. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void deleteAnnouncement()}
              disabled={saving}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
