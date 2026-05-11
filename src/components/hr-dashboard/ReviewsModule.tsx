"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import type {
  ActionPointStatus,
  NoteVisibility,
  PerformanceReview,
  PerformanceReviewActionPoint,
  PerformanceReviewAttachment,
  PerformanceReviewListItem,
  PerformanceReviewNote,
  ReviewStatus,
} from "@/types/reviews";
import {
  createActionPoint,
  createPerformanceReview,
  createReviewNote,
  deleteActionPoint,
  deleteAttachment,
  deleteReviewNote,
  fetchActionPoints,
  fetchAttachments,
  fetchPerformanceReviews,
  fetchReviewNotes,
  fetchUserProfiles,
  updateActionPoint,
  updatePerformanceReview,
  updateReviewStatus,
  uploadAttachment,
  type UserProfile,
} from "@/lib/api/reviews";
import {
  REVIEW_STATUS_FILTER_ALL,
  ReviewDetailDrawer,
  ReviewsHeader,
  ReviewsList,
  ReviewsToolbar,
  ScheduleReviewDialog,
  bucketOpenReviews,
  computeReviewStats,
  filterReviews,
  sortHistory,
  type ReviewStatusFilter,
  type ScheduleReviewFormValues,
} from "./reviews";

interface ExtendedSession {
  accessToken?: string;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
  };
}

interface OutcomeDraft {
  overallRating: number | null;
  summary: string;
  cpfScore: number | null;
  performanceScore: number | null;
}

const EMPTY_OUTCOME: OutcomeDraft = {
  overallRating: null,
  summary: "",
  cpfScore: null,
  performanceScore: null,
};

type TopTab = "open" | "history";

function toOutcomeDraft(review: PerformanceReview): OutcomeDraft {
  return {
    overallRating: review.overallRating ?? null,
    summary: review.summary ?? "",
    cpfScore: review.cpfScore ?? null,
    performanceScore: review.performanceScore ?? null,
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function ReviewsModule() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const accessToken = session?.accessToken;
  const sessionUserId = session?.user?.id;
  const { isAdmin, isLoading: isAdminLoading } = useAdminAccess();

  const [reviews, setReviews] = useState<PerformanceReviewListItem[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [tab, setTab] = useState<TopTab>("open");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>(
    REVIEW_STATUS_FILTER_ALL
  );

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [selectedReview, setSelectedReview] =
    useState<PerformanceReview | null>(null);
  const [notes, setNotes] = useState<PerformanceReviewNote[]>([]);
  const [actionPoints, setActionPoints] = useState<
    PerformanceReviewActionPoint[]
  >([]);
  const [attachments, setAttachments] = useState<PerformanceReviewAttachment[]>(
    []
  );
  const [outcome, setOutcome] = useState<OutcomeDraft>(EMPTY_OUTCOME);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const refreshReviews = useCallback(async (token: string) => {
    const data = await fetchPerformanceReviews(token);
    setReviews(data);
  }, []);

  useEffect(() => {
    if (!accessToken || isAdminLoading) {
      if (!accessToken) setLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        setLoading(true);
        setPageError(null);
        const reviewsData = await fetchPerformanceReviews(accessToken);
        setReviews(reviewsData);

        if (isAdmin) {
          try {
            const usersData = await fetchUserProfiles(accessToken);
            setEmployees(usersData);
          } catch {
            // Non-fatal — admins without permission still get the reviews list.
            setEmployees([]);
          }
        } else {
          setEmployees([]);
        }
      } catch (err) {
        setPageError(getErrorMessage(err, "Failed to load reviews"));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken, isAdmin, isAdminLoading]);

  useEffect(() => {
    if (!selectedReview || !accessToken) return;
    const reviewId = selectedReview.id;
    const loadDetails = async () => {
      try {
        setDrawerError(null);
        const [notesData, actionsData, attachmentsData] = await Promise.all([
          fetchReviewNotes(reviewId, accessToken),
          fetchActionPoints(reviewId, accessToken),
          fetchAttachments(reviewId, accessToken),
        ]);
        setNotes(notesData);
        setActionPoints(actionsData);
        setAttachments(attachmentsData);
        setOutcome(toOutcomeDraft(selectedReview));
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to load review details"));
      }
    };
    loadDetails();
  }, [selectedReview, accessToken]);

  const stats = useMemo(() => computeReviewStats(reviews), [reviews]);

  const filteredOpen = useMemo(() => {
    const open = reviews.filter(
      (r) => r.status === "scheduled" || r.status === "in_progress"
    );
    return filterReviews(open, search, statusFilter);
  }, [reviews, search, statusFilter]);

  const openBuckets = useMemo(
    () => bucketOpenReviews(filteredOpen),
    [filteredOpen]
  );

  const historyList = useMemo(() => {
    const history = sortHistory(reviews);
    return filterReviews(history, search, statusFilter);
  }, [reviews, search, statusFilter]);

  const handleSchedule = useCallback(
    async (values: ScheduleReviewFormValues) => {
      if (!accessToken) return;
      setScheduleError(null);
      try {
        await createPerformanceReview(
          {
            employee: values.employeeId,
            reviewer: values.reviewerId,
            reviewType: values.reviewType,
            scheduledDate: values.scheduledDate,
          },
          accessToken
        );
        await refreshReviews(accessToken);
        setScheduleOpen(false);
      } catch (err) {
        setScheduleError(getErrorMessage(err, "Failed to create review"));
      }
    },
    [accessToken, refreshReviews]
  );

  const handleStatusChange = useCallback(
    async (next: ReviewStatus) => {
      if (!accessToken || !selectedReview) return;
      try {
        const updated = await updateReviewStatus(
          selectedReview.id,
          next,
          accessToken
        );
        setSelectedReview(updated);
        await refreshReviews(accessToken);
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to update status"));
      }
    },
    [accessToken, selectedReview, refreshReviews]
  );

  const handleSaveOutcome = useCallback(async () => {
    if (!accessToken || !selectedReview) return;
    try {
      const updated = await updatePerformanceReview(
        selectedReview.id,
        {
          overallRating: outcome.overallRating ?? undefined,
          summary: outcome.summary ?? undefined,
          cpfScore: outcome.cpfScore ?? undefined,
          performanceScore: outcome.performanceScore ?? undefined,
        },
        accessToken
      );
      setSelectedReview(updated);
      setOutcome(toOutcomeDraft(updated));
      await refreshReviews(accessToken);
    } catch (err) {
      setDrawerError(getErrorMessage(err, "Failed to save outcome"));
    }
  }, [accessToken, selectedReview, outcome, refreshReviews]);

  const handleAddNote = useCallback(
    async (content: string, visibility: NoteVisibility) => {
      if (!accessToken || !selectedReview) return;
      try {
        await createReviewNote(
          selectedReview.id,
          { content, visibility },
          accessToken
        );
        const next = await fetchReviewNotes(selectedReview.id, accessToken);
        setNotes(next);
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to add note"));
      }
    },
    [accessToken, selectedReview]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (!accessToken || !selectedReview) return;
      try {
        await deleteReviewNote(selectedReview.id, noteId, accessToken);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to delete note"));
      }
    },
    [accessToken, selectedReview]
  );

  const handleAddAction = useCallback(
    async (draft: {
      title: string;
      description: string;
      ownerId: string;
      dueDate: string;
    }) => {
      if (!accessToken || !selectedReview) return;
      const ownerId =
        draft.ownerId || (sessionUserId != null ? String(sessionUserId) : "");
      if (!ownerId) {
        setDrawerError("Pick an owner for this action item");
        return;
      }
      const dueDate =
        draft.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      try {
        await createActionPoint(
          selectedReview.id,
          {
            title: draft.title,
            description: draft.description,
            ownerId,
            dueDate,
          },
          accessToken
        );
        const next = await fetchActionPoints(selectedReview.id, accessToken);
        setActionPoints(next);
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to add action item"));
      }
    },
    [accessToken, selectedReview, sessionUserId]
  );

  const handleDeleteAction = useCallback(
    async (id: string) => {
      if (!accessToken || !selectedReview) return;
      try {
        await deleteActionPoint(selectedReview.id, id, accessToken);
        setActionPoints((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to delete action item"));
      }
    },
    [accessToken, selectedReview]
  );

  const handleUpdateActionStatus = useCallback(
    async (id: string, status: ActionPointStatus) => {
      if (!accessToken || !selectedReview) return;
      try {
        const updated = await updateActionPoint(
          selectedReview.id,
          id,
          { status },
          accessToken
        );
        setActionPoints((prev) => prev.map((a) => (a.id === id ? updated : a)));
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to update action item"));
      }
    },
    [accessToken, selectedReview]
  );

  const handleUploadAttachment = useCallback(
    async (file: File) => {
      if (!accessToken || !selectedReview) return;
      try {
        await uploadAttachment(selectedReview.id, file, accessToken);
        const next = await fetchAttachments(selectedReview.id, accessToken);
        setAttachments(next);
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to upload attachment"));
      }
    },
    [accessToken, selectedReview]
  );

  const handleDeleteAttachment = useCallback(
    async (id: string) => {
      if (!accessToken || !selectedReview) return;
      try {
        await deleteAttachment(selectedReview.id, id, accessToken);
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        setDrawerError(getErrorMessage(err, "Failed to delete attachment"));
      }
    },
    [accessToken, selectedReview]
  );

  if (loading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    );
  }

  const openCount = reviews.filter(
    (r) => r.status === "scheduled" || r.status === "in_progress"
  ).length;
  const historyCount = reviews.filter((r) => r.status === "completed").length;

  return (
    <div className="w-full max-w-[1400px] text-gray-900">
      <ReviewsHeader
        stats={stats}
        isAdmin={isAdmin}
        onSchedule={() => {
          setScheduleError(null);
          setScheduleOpen(true);
        }}
      />

      {pageError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-700 m-0">{pageError}</p>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        <UnderlineTab
          active={tab === "open"}
          onClick={() => setTab("open")}
          label="Open"
          count={openCount}
        />
        <UnderlineTab
          active={tab === "history"}
          onClick={() => setTab("history")}
          label="History"
          count={historyCount}
        />
      </div>

      <div className="pt-4">
        <ReviewsToolbar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {tab === "open" && (
        <div>
          {openBuckets.overdue.length > 0 && (
            <ReviewSection
              title="Overdue"
              subtitle="Need to be rescheduled or completed"
              tone="danger"
            >
              <ReviewsList
                reviews={openBuckets.overdue}
                emptyText="Nothing overdue."
                onOpen={setSelectedReview}
              />
            </ReviewSection>
          )}
          <ReviewSection
            title="This week"
            subtitle="Coming up in the next 7 days"
          >
            <ReviewsList
              reviews={openBuckets.thisWeek}
              emptyText="No reviews scheduled this week."
              onOpen={setSelectedReview}
            />
          </ReviewSection>
          {openBuckets.later.length > 0 && (
            <ReviewSection title="Later" subtitle="Beyond next week">
              <ReviewsList
                reviews={openBuckets.later}
                emptyText="Nothing scheduled later."
                onOpen={setSelectedReview}
              />
            </ReviewSection>
          )}
          {openBuckets.overdue.length === 0 &&
            openBuckets.thisWeek.length === 0 &&
            openBuckets.later.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-lg px-6 py-9 text-center text-gray-500 text-[13px]">
                No open reviews match the current filters.
              </div>
            )}
        </div>
      )}

      {tab === "history" && (
        <div>
          <ReviewSection title="Completed reviews" subtitle="Most recent first">
            <ReviewsList
              reviews={historyList}
              emptyText="No completed reviews yet."
              onOpen={setSelectedReview}
            />
          </ReviewSection>
        </div>
      )}

      <ScheduleReviewDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        employees={employees}
        errorMessage={scheduleError}
        onSubmit={handleSchedule}
      />

      <ReviewDetailDrawer
        open={!!selectedReview}
        onOpenChange={(next) => {
          if (!next) setSelectedReview(null);
        }}
        review={selectedReview}
        notes={notes}
        actionPoints={actionPoints}
        attachments={attachments}
        employees={employees}
        errorMessage={drawerError}
        outcome={outcome}
        onOutcomeChange={setOutcome}
        onSaveOutcome={handleSaveOutcome}
        onStatusChange={handleStatusChange}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onAddAction={handleAddAction}
        onDeleteAction={handleDeleteAction}
        onUpdateActionStatus={handleUpdateActionStatus}
        onUploadAttachment={handleUploadAttachment}
        onDeleteAttachment={handleDeleteAttachment}
      />
    </div>
  );
}

interface UnderlineTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function UnderlineTab({ active, onClick, label, count }: UnderlineTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-[38px] px-3.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "text-gray-900 border-gray-900"
          : "text-gray-500 border-transparent hover:text-gray-900"
      }`}
    >
      {label}
      <span
        className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
          active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

interface ReviewSectionProps {
  title: string;
  subtitle?: string;
  tone?: "danger";
  children: React.ReactNode;
}

function ReviewSection({
  title,
  subtitle,
  tone,
  children,
}: ReviewSectionProps) {
  return (
    <section className="mb-6 text-gray-900">
      <div className="mb-2.5">
        <h3 className="m-0 text-[13px] font-semibold text-gray-900 flex items-center gap-2">
          {tone === "danger" && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          )}
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 mb-0 text-[12px] text-gray-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
