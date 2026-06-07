import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
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
  Plus,
  Search,
  Users,
  Briefcase,
  Layers,
  Send,
  Check,
  X,
  MapPin,
  Clock,
  ChevronRight,
  Award,
  FileText,
  AlertCircle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  daysUntil,
  formatDate,
  formatDateShort as fmtDateShort,
  formatPostedAgo as fmtPostedAgo,
} from "@/utils";
import { useSession } from "next-auth/react";
import { DatePicker } from "./DatePicker";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";
import { jobListingsApi } from "@/lib/api/modules/jobListings";
import { promotionsApi } from "@/lib/api/modules/promotions";
import { cpfLevelChangesApi } from "@/lib/api/modules/cpf-level-changes";
import { cpfLevelsApi } from "@/lib/api/modules/cpf-levels";
import { employeeApi } from "@/lib/api/modules/employees";
import { departmentsApi, type Department } from "@/lib/api/departments";
import type {
  ApplicationStatus,
  CreateListingPayload,
  JobApplication,
  JobListing,
  JobListingDetail,
  JobListingStatus,
  ListingTone,
} from "@/types/jobListing";
import {
  APPLICATION_STATUS_BADGE_COLORS,
  APPLICATION_STATUS_LABELS,
  JOB_LISTING_STATUS_LABELS,
  isTerminalApplicationStatus,
  LISTING_TONE_PILLS,
} from "@/types/jobListing";
import type {
  CreatePromotionPayload,
  PromotionRecord,
} from "@/types/promotion";
import {
  ALL_CPF_CHANGE_SOURCES,
  CPF_CHANGE_SOURCE_LABELS,
  CPF_PROGRESSION_EVENT_TYPE_BADGE_COLORS,
  CPF_PROGRESSION_EVENT_TYPE_LABELS,
  type CPFChangeSource,
  type CPFProgression,
  type CPFProgressionEvent,
  type CreateCPFLevelChangePayload,
} from "@/types/cpf";

const DEPARTMENT_FILTER_ALL = "all";
const LISTING_ROLE_NONE = "__none";

function applicationStatusStyle(status: ApplicationStatus) {
  return APPLICATION_STATUS_BADGE_COLORS[status];
}

function listingTone(listing: JobListing): ListingTone {
  if (listing.status === "draft") return "draft";
  if (listing.status === "cancelled") return "cancelled";
  if (listing.status === "closed") return "closed";
  const openAt = new Date(listing.openAt).getTime();
  const closeAt = new Date(listing.closeAt).getTime();
  const now = Date.now();
  if (Number.isNaN(openAt) || Number.isNaN(closeAt)) return "open";
  if (openAt > now) return "upcoming";
  if (closeAt < now) return "expired";
  const days = daysUntil(listing.closeAt);
  if (days <= 7) return "closing-soon";
  return "open";
}

function listingStatusPill(tone: ListingTone) {
  return LISTING_TONE_PILLS[tone];
}

function isListingActiveNow(listing: JobListing): boolean {
  if (listing.status !== "open") return false;
  const openAt = new Date(listing.openAt).getTime();
  const closeAt = new Date(listing.closeAt).getTime();
  const now = Date.now();
  if (Number.isNaN(openAt) || Number.isNaN(closeAt)) return true;
  return openAt <= now && closeAt >= now;
}

function formatDateTimeInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseDateTimeInput(value: string): string {
  return new Date(value).toISOString();
}

type ListingFormErrors = Partial<
  Record<
    | "title"
    | "description"
    | "departmentId"
    | "openAt"
    | "closeAt"
    | "status"
    | "general",
    string
  >
>;

function extractListingFormErrors(message: string): ListingFormErrors {
  const errors: ListingFormErrors = { general: message };
  const fields = [
    ["title", "title"],
    ["description", "description"],
    ["department_id", "departmentId"],
    ["open_at", "openAt"],
    ["close_at", "closeAt"],
    ["status", "status"],
  ] as const;

  for (const [rawField, field] of fields) {
    const match = message.match(new RegExp(`${rawField}:\\s*([^;]+)`, "i"));
    if (match?.[1]) {
      errors[field] = match[1].trim();
      delete errors.general;
    }
  }

  return errors;
}

function getListingActionError(
  err: unknown,
  fallback: string
): string | ListingFormErrors {
  if (!(err instanceof Error)) return fallback;
  const status = (err as { status?: number }).status;
  if (status === 403) return "You do not have permission to manage listings.";
  if (status === 404) return "Listing unavailable or outside your scope.";
  if (status === 400) return extractListingFormErrors(err.message);
  return err.message || fallback;
}

function isFormErrors(
  value: string | ListingFormErrors
): value is ListingFormErrors {
  return typeof value !== "string";
}

function formatListingFormErrors(errors: ListingFormErrors): string {
  const entries = Object.entries(errors).filter(([, value]) => Boolean(value));
  if (entries.length === 0) return "Failed to update listing.";
  return entries.map(([field, value]) => `${field}: ${value}`).join("; ");
}

function Pill({ label, bg, dot }: { label: string; bg: string; dot: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

type TabKey = "jobs" | "applications" | "history" | "promotions" | "cpf";

export function MobilityModule() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>(
    DEPARTMENT_FILTER_ALL
  );

  const [departments, setDepartments] = useState<Department[]>([]);
  const [listings, setListings] = useState<JobListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  // HR-only org-wide application roster (powers the HR stat strip and the
  // HR view of the "Applications" tab). Employees never read this state.
  const [allApplications, setAllApplications] = useState<JobApplication[]>([]);
  const [allApplicationsLoading, setAllApplicationsLoading] = useState(false);

  const [selectedListing, setSelectedListing] =
    useState<JobListingDetail | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "applicants">(
    "overview"
  );
  const [drawerApplications, setDrawerApplications] = useState<
    JobApplication[]
  >([]);
  const [drawerAppsLoading, setDrawerAppsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<JobListingDetail | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [listingActionError, setListingActionError] = useState<string | null>(
    null
  );

  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] =
    useState<PromotionRecord | null>(null);
  const [deletingPromotion, setDeletingPromotion] =
    useState<PromotionRecord | null>(null);
  const [deletingPromotionBusy, setDeletingPromotionBusy] = useState(false);

  const sessionUser = session?.user as
    | {
        role?: string;
        career_level?: string;
        is_staff?: boolean;
        is_superuser?: boolean;
      }
    | undefined;
  const roleSource = sessionUser?.role || sessionUser?.career_level;
  const isHRUser =
    isHrLikeRole(roleSource) ||
    sessionUser?.is_staff === true ||
    sessionUser?.is_superuser === true;

  useEffect(() => {
    const handle = window.setTimeout(() => setSearchTerm(searchInput), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    departmentsApi
      .listDepartments()
      .then((rows) => {
        if (!cancelled) setDepartments(rows);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    setListingsError(null);
    try {
      const rows = await jobListingsApi.listListings({
        department:
          departmentFilter === DEPARTMENT_FILTER_ALL
            ? undefined
            : Number(departmentFilter),
        search: searchTerm.trim() || undefined,
      });
      setListings(rows);
    } catch (err) {
      setListingsError(
        err instanceof Error ? err.message : "Failed to load job listings."
      );
    } finally {
      setListingsLoading(false);
    }
  }, [departmentFilter, searchTerm]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const loadMyApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const rows = await jobListingsApi.listMyApplications();
      setMyApplications(rows);
    } catch {
      setMyApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyApplications();
  }, [loadMyApplications]);

  const loadAllApplications = useCallback(async () => {
    if (!isHRUser) return;
    setAllApplicationsLoading(true);
    try {
      const rows = await jobListingsApi.listAllApplications();
      setAllApplications(rows);
    } catch {
      setAllApplications([]);
    } finally {
      setAllApplicationsLoading(false);
    }
  }, [isHRUser]);

  useEffect(() => {
    void loadAllApplications();
  }, [loadAllApplications]);

  const loadPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    setPromotionsError(null);
    try {
      const rows = await promotionsApi.listPromotions();
      setPromotions(rows);
    } catch (err) {
      setPromotionsError(
        err instanceof Error ? err.message : "Failed to load promotions."
      );
    } finally {
      setPromotionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const appliedListingIds = useMemo(
    () => new Set(myApplications.map((a) => a.listingId)),
    [myApplications]
  );

  const refreshAfterListingMutation = useCallback(
    async (listingId: number, action: "updated" | "published" | "deleted") => {
      await Promise.all([
        loadListings(),
        loadAllApplications(),
        loadMyApplications(),
      ]);

      if (selectedListing?.id === listingId) {
        if (action === "deleted") {
          setIsApplicationDialogOpen(false);
          setSelectedListing(null);
          setDrawerApplications([]);
          return;
        }

        try {
          const detail = await jobListingsApi.getListing(listingId);
          setSelectedListing(detail);
        } catch {
          setSelectedListing(null);
          setIsApplicationDialogOpen(false);
        }
      }
    },
    [loadListings, loadAllApplications, loadMyApplications, selectedListing]
  );

  const openRoleDrawer = async (listing: JobListing) => {
    setDetailLoading(true);
    setSubmitError(null);
    setListingActionError(null);
    setCoverNote("");
    setDrawerTab("overview");
    setDrawerApplications([]);
    try {
      const detail = await jobListingsApi.getListing(listing.id);
      setSelectedListing(detail);
      setIsApplicationDialogOpen(true);
      if (isHRUser) {
        setDrawerAppsLoading(true);
        jobListingsApi
          .listApplicationsForListing(listing.id)
          .then((rows) => setDrawerApplications(rows))
          .catch(() => setDrawerApplications([]))
          .finally(() => setDrawerAppsLoading(false));
      }
    } catch (err) {
      const message = getListingActionError(
        err,
        "Failed to load listing details."
      );
      setListingActionError(
        typeof message === "string" ? message : formatListingFormErrors(message)
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApplicationStatusChange = useCallback(
    async (
      applicationId: number,
      nextStatus: ApplicationStatus,
      decisionNote?: string
    ) => {
      await jobListingsApi.updateApplicationStatus(applicationId, {
        status: nextStatus,
        decisionNote,
      });
      if (selectedListing) {
        const rows = await jobListingsApi.listApplicationsForListing(
          selectedListing.id
        );
        setDrawerApplications(rows);
      }
      await Promise.all([
        loadListings(),
        loadAllApplications(),
        loadMyApplications(),
      ]);
    },
    [selectedListing, loadListings, loadAllApplications, loadMyApplications]
  );

  const handleApplicationWithdraw = useCallback(
    async (applicationId: number, decisionNote?: string) => {
      await jobListingsApi.withdrawApplication(applicationId, {
        decisionNote,
      });
      if (selectedListing) {
        const rows = await jobListingsApi.listApplicationsForListing(
          selectedListing.id
        );
        setDrawerApplications(rows);
      }
      await Promise.all([
        loadListings(),
        loadAllApplications(),
        loadMyApplications(),
      ]);
    },
    [selectedListing, loadListings, loadAllApplications, loadMyApplications]
  );

  const submitApplication = async () => {
    if (!selectedListing) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await jobListingsApi.applyToListing(selectedListing.id, {
        coverNote: coverNote.trim(),
      });
      setIsApplicationDialogOpen(false);
      setSelectedListing(null);
      setCoverNote("");
      await Promise.all([loadMyApplications(), loadListings()]);
      setActiveTab("applications");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeListings = useMemo(
    () => listings.filter(isListingActiveNow),
    [listings]
  );

  const departmentBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of activeListings) {
      const name = listing.departmentName || "Unspecified";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [activeListings]);

  const visibleListings = isHRUser
    ? listings
    : listings.filter((l) => !appliedListingIds.has(l.id));

  const visibleActiveListings = visibleListings.filter(isListingActiveNow);

  const closingSoonCount = visibleActiveListings.filter((l) => {
    const d = daysUntil(l.closeAt);
    return d >= 0 && d <= 7;
  }).length;

  // HR sees the whole organisation's pipeline; employees see only their own.
  const applicationsForStrip = isHRUser ? allApplications : myApplications;
  const inProgressCount = applicationsForStrip.filter(
    (a) =>
      a.status === "submitted" ||
      a.status === "under_review" ||
      a.status === "shortlisted"
  ).length;
  const historyCount = applicationsForStrip.filter(
    (a) =>
      a.status === "accepted" ||
      a.status === "rejected" ||
      a.status === "withdrawn"
  ).length;

  const tabCounts = {
    jobs: isHRUser ? listings.length : visibleListings.length,
    applications: applicationsForStrip.length,
    history: historyCount,
    promotions: promotions.length,
  };

  const handleListingCreated = async () => {
    setIsPostDialogOpen(false);
    await loadListings();
  };

  const openListingEditor = async (listing: JobListing) => {
    setListingActionError(null);
    try {
      const detail =
        selectedListing?.id === listing.id
          ? selectedListing
          : await jobListingsApi.getListing(listing.id);
      setEditingListing(detail);
      setIsEditDialogOpen(true);
    } catch (err) {
      const message = getListingActionError(
        err,
        "Failed to load listing for editing."
      );
      setListingActionError(
        typeof message === "string" ? message : formatListingFormErrors(message)
      );
    }
  };

  const handleListingMutated = useCallback(
    async (listingId: number, action: "updated" | "published" | "deleted") => {
      setListingActionError(null);
      await refreshAfterListingMutation(listingId, action);
    },
    [refreshAfterListingMutation]
  );

  const handleListingPublish = useCallback(
    async (listing: JobListing) => {
      setListingActionError(null);
      try {
        await jobListingsApi.patchListing(listing.id, { status: "open" });
        await handleListingMutated(listing.id, "published");
      } catch (err) {
        const message = getListingActionError(
          err,
          "Failed to publish listing."
        );
        setListingActionError(
          typeof message === "string"
            ? message
            : formatListingFormErrors(message)
        );
      }
    },
    [handleListingMutated]
  );

  const handlePromotionSaved = async () => {
    setIsPromotionDialogOpen(false);
    setEditingPromotion(null);
    await loadPromotions();
  };

  const confirmDeletePromotion = async () => {
    if (!deletingPromotion) return;
    setDeletingPromotionBusy(true);
    try {
      await promotionsApi.deletePromotion(deletingPromotion.id);
      await loadPromotions();
    } catch (err) {
      setPromotionsError(
        err instanceof Error ? err.message : "Failed to delete promotion."
      );
    } finally {
      setDeletingPromotionBusy(false);
      setDeletingPromotion(null);
    }
  };

  return (
    <div className="space-y-4 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-6 mb-5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
              Mobility &amp; Promotions · H1 2026 cycle
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-1.5">
              {isHRUser
                ? "Run mobility & the promo cycle"
                : "Find your next chapter — without leaving"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              {isHRUser
                ? "Source, post, and govern. Every internal application and transfer runs through here with a full audit trail."
                : "Browse internal openings, track your applications, and see where you stand. The recruiter for any role is one click away."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isHRUser && (
              <Button
                variant="primary"
                onClick={() => setIsPostDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Post a role
              </Button>
            )}
            <Button variant="outline" onClick={() => setActiveTab("cpf")}>
              <Layers className="w-3.5 h-3.5" />
              CPF ladder
            </Button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
          <StripCell
            label="Open roles"
            value={visibleActiveListings.length}
            trend={`${closingSoonCount} closing in < 7d`}
          />
          <StripCell
            label={isHRUser ? "Active applications" : "Your applications"}
            value={applicationsForStrip.length}
            trend={`${inProgressCount} in active loops`}
          />
          <StripCell
            label="Departments hiring"
            value={departmentBreakdown.length}
            trend="With active roles"
          />
          <StripCell
            label="In progress"
            value={inProgressCount}
            trend="Across your loops"
            last
          />
        </div>

        {/* Tabs */}
        <nav className="flex border-b border-gray-200 dark:border-gray-700">
          <TabButton
            label="Open roles"
            count={tabCounts.jobs}
            active={activeTab === "jobs"}
            onClick={() => setActiveTab("jobs")}
          />
          <TabButton
            label={isHRUser ? "Applications" : "My applications"}
            count={tabCounts.applications}
            active={activeTab === "applications"}
            onClick={() => setActiveTab("applications")}
          />
          <TabButton
            label="History"
            count={tabCounts.history}
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
          <TabButton
            label="Promotions"
            count={tabCounts.promotions}
            active={activeTab === "promotions"}
            onClick={() => setActiveTab("promotions")}
          />
          <TabButton
            label="Career progression"
            active={activeTab === "cpf"}
            onClick={() => setActiveTab("cpf")}
          />
        </nav>
      </header>

      {listingActionError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {listingActionError}
        </div>
      )}

      {/* Tab body */}
      <div className="pt-2">
        {activeTab === "jobs" && (
          <JobsTab
            listings={listings}
            loading={listingsLoading}
            error={listingsError}
            search={searchInput}
            onSearch={setSearchInput}
            departments={departments}
            departmentFilter={departmentFilter}
            onDepartmentFilter={setDepartmentFilter}
            appliedListingIds={appliedListingIds}
            onOpen={openRoleDrawer}
            isHRUser={isHRUser}
            onPost={() => setIsPostDialogOpen(true)}
            onEdit={openListingEditor}
            onPublish={handleListingPublish}
          />
        )}
        {activeTab === "applications" && (
          <ApplicationsTab
            apps={applicationsForStrip}
            loading={isHRUser ? allApplicationsLoading : applicationsLoading}
            isHRUser={isHRUser}
            onBrowse={() => setActiveTab("jobs")}
            onWithdraw={handleApplicationWithdraw}
            onStatusChange={handleApplicationStatusChange}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            isHRUser={isHRUser}
            apps={applicationsForStrip.filter(
              (a) =>
                a.status === "accepted" ||
                a.status === "rejected" ||
                a.status === "withdrawn"
            )}
          />
        )}
        {activeTab === "promotions" && (
          <PromotionsTab
            promotions={promotions}
            loading={promotionsLoading}
            error={promotionsError}
            isHRUser={isHRUser}
            onAdd={() => {
              setEditingPromotion(null);
              setIsPromotionDialogOpen(true);
            }}
            onEdit={(p) => {
              setEditingPromotion(p);
              setIsPromotionDialogOpen(true);
            }}
            onDelete={setDeletingPromotion}
          />
        )}
        {activeTab === "cpf" && <CPFProgressionTab isHRUser={isHRUser} />}
      </div>

      {/* Role drawer (overlay) */}
      {isApplicationDialogOpen && selectedListing && (
        <RoleDrawer
          listing={selectedListing}
          isHRUser={isHRUser}
          drawerTab={drawerTab}
          setDrawerTab={setDrawerTab}
          drawerApplications={drawerApplications}
          drawerAppsLoading={drawerAppsLoading}
          onApplicationStatusChange={handleApplicationStatusChange}
          coverNote={coverNote}
          setCoverNote={setCoverNote}
          submitting={submitting}
          submitError={submitError}
          onSubmit={submitApplication}
          onEditListing={() => void openListingEditor(selectedListing!)}
          onPublishListing={() => void handleListingPublish(selectedListing!)}
          onClose={() => {
            setIsApplicationDialogOpen(false);
            setSelectedListing(null);
            setSubmitError(null);
            setCoverNote("");
          }}
        />
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/10 grid place-items-center z-40">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-md text-sm shadow">
            Loading role…
          </div>
        </div>
      )}

      {/* Post role modal (HR/admin) */}
      {isHRUser && (
        <PostRoleDialog
          open={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
          departments={departments}
          onCreated={handleListingCreated}
        />
      )}

      {isHRUser && (
        <ListingEditDialog
          open={isEditDialogOpen}
          listing={editingListing}
          departments={departments}
          onOpenChange={(v) => {
            setIsEditDialogOpen(v);
            if (!v) setEditingListing(null);
          }}
          onSaved={handleListingMutated}
        />
      )}

      {/* Promotion form modal (HR/admin) */}
      {isHRUser && (
        <PromotionDialog
          open={isPromotionDialogOpen}
          onOpenChange={(v) => {
            setIsPromotionDialogOpen(v);
            if (!v) setEditingPromotion(null);
          }}
          editing={editingPromotion}
          onSaved={handlePromotionSaved}
        />
      )}

      {/* Delete promotion confirmation (HR/admin) */}
      {isHRUser && (
        <Dialog
          open={deletingPromotion !== null}
          onOpenChange={(v) => {
            if (!v && !deletingPromotionBusy) setDeletingPromotion(null);
          }}
        >
          <DialogContent className="max-w-md min-h-0">
            <DialogHeader>
              <DialogTitle>Delete promotion record</DialogTitle>
              <DialogDescription>
                {deletingPromotion
                  ? `Delete the promotion for ${
                      deletingPromotion.employeeName || "this employee"
                    } dated ${formatDate(
                      deletingPromotion.date
                    )}? This cannot be undone.`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingPromotion(null)}
                disabled={deletingPromotionBusy}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeletePromotion}
                disabled={deletingPromotionBusy}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingPromotionBusy ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ============ Atoms ============ */
function StripCell({
  label,
  value,
  trend,
  last,
}: {
  label: string;
  value: number;
  trend: string;
  last?: boolean;
}) {
  return (
    <div
      className={`px-4 py-3.5 ${
        last ? "" : "md:border-r border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="text-[22px] font-semibold tracking-tight tabular-nums mt-1.5">
        {value}
      </div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
        {trend}
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-[38px] px-3.5 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
        active
          ? "text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100"
          : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
            active
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ============ Jobs Tab ============ */
function JobsTab({
  listings,
  loading,
  error,
  search,
  onSearch,
  departments,
  departmentFilter,
  onDepartmentFilter,
  appliedListingIds,
  onOpen,
  isHRUser,
  onPost,
  onEdit,
  onPublish,
}: {
  listings: JobListing[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearch: (v: string) => void;
  departments: Department[];
  departmentFilter: string;
  onDepartmentFilter: (v: string) => void;
  appliedListingIds: Set<number>;
  onOpen: (l: JobListing) => void;
  isHRUser: boolean;
  onPost: () => void;
  onEdit: (l: JobListing) => void;
  onPublish: (l: JobListing) => void;
}) {
  // Employees never see roles they already applied to in the Open roles tab.
  const visible = isHRUser
    ? listings
    : listings.filter((l) => !appliedListingIds.has(l.id));
  // Spotlight a matched role for employees but keep it in the grid too.
  const spotlight = !isHRUser
    ? visible.find((l) => listingTone(l) === "open")
    : null;
  const rest = visible;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-2.5 items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 mb-4 flex-wrap">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search roles, skills, teams…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={departmentFilter} onValueChange={onDepartmentFilter}>
          <SelectTrigger className="w-full md:w-56 h-9">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEPARTMENT_FILTER_ALL}>
              All departments
            </SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isHRUser && (
          <Button variant="primary" onClick={onPost}>
            <Plus className="w-3.5 h-3.5" />
            Post a role
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {spotlight && (
        <section className="mb-7">
          <SectionHead
            icon={<Sparkles className="w-3 h-3" />}
            title="Matched to your level &amp; team"
            sub="Suggestions are based on your role and the areas you've worked in."
          />
          <SpotlightCard listing={spotlight} onOpen={onOpen} />
        </section>
      )}

      <section>
        <SectionHead
          title={
            isHRUser
              ? "All role listings"
              : spotlight
                ? "All open roles"
                : "Currently hiring"
          }
          sub={
            isHRUser
              ? `${rest.length} listings · drafts, active, closed, cancelled`
              : `${rest.length} open · sorted by closing date`
          }
        />
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            Loading roles…
          </div>
        ) : rest.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-10 px-6 text-center text-sm text-gray-500">
            <p className="mb-3">
              {isHRUser
                ? "No listings match your filters."
                : "No positions match your filters."}
            </p>
            {isHRUser && (
              <Button variant="primary" onClick={onPost}>
                <Plus className="w-3.5 h-3.5" />
                Post a role
              </Button>
            )}
          </div>
        ) : isHRUser ? (
          <ManagementListingsTable
            listings={rest}
            onOpen={onOpen}
            onEdit={onEdit}
            onPublish={onPublish}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
            {rest.map((l) => (
              <JobCard
                key={l.id}
                listing={l}
                onOpen={onOpen}
                applied={appliedListingIds.has(l.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHead({
  icon,
  title,
  sub,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-[13px] font-semibold flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
        {icon}
        {title}
      </h3>
      {sub && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function SpotlightCard({
  listing,
  onOpen,
}: {
  listing: JobListing;
  onOpen: (l: JobListing) => void;
}) {
  const tone = listingTone(listing);
  const pill = listingStatusPill(tone);
  return (
    <div
      onClick={() => onOpen(listing)}
      className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 bg-gradient-to-b from-indigo-50/40 to-white dark:from-gray-800 dark:to-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Pill {...pill} />
          <span className="text-[11px] text-gray-500 ml-auto">
            Closes {fmtDateShort(listing.closeAt)}
          </span>
        </div>
        <h4 className="text-lg font-semibold tracking-tight mb-1.5">
          {listing.title}
        </h4>
        <div className="flex flex-wrap gap-3.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="w-3 h-3" />{" "}
            {listing.departmentName || "Unspecified"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Posted {fmtPostedAgo(listing.openAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3 h-3" /> {listing.applicationCount} applicants
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-center pb-2 border-b border-gray-200 dark:border-gray-700 mb-1">
          <div className="text-[26px] font-semibold tracking-tight tabular-nums">
            {listing.applicationCount}
          </div>
          <div className="text-[11px] uppercase tracking-[0.05em] text-gray-500">
            internal applicants
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(listing);
          }}
        >
          <Send className="w-3 h-3" /> Apply
        </Button>
      </div>
    </div>
  );
}

function JobCard({
  listing,
  onOpen,
  applied,
}: {
  listing: JobListing;
  onOpen: (l: JobListing) => void;
  applied: boolean;
}) {
  const tone = listingTone(listing);
  const pill = listingStatusPill(tone);
  const days = daysUntil(listing.closeAt);
  return (
    <div
      onClick={() => onOpen(listing)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-px flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-1.5">
        <Pill {...pill} />
        {applied && (
          <Pill
            label="Applied"
            bg="bg-blue-50 text-blue-700"
            dot="bg-blue-600"
          />
        )}
      </div>
      <h4 className="text-[14.5px] font-semibold leading-tight tracking-tight">
        {listing.title}
      </h4>
      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <Briefcase className="w-3 h-3" />
          {listing.departmentName || "Unspecified"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Posted {fmtPostedAgo(listing.openAt)}
        </span>
      </div>
      <div className="flex items-center justify-between pt-2.5 mt-auto border-t border-gray-200 dark:border-gray-700">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[11.5px] text-gray-700 dark:text-gray-200">
          <Users className="w-3 h-3" /> {listing.applicationCount}
        </span>
        <span
          className={`text-[11.5px] font-medium ${
            days <= 7 && days >= 0
              ? "text-amber-700 dark:text-amber-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {days < 0
            ? "Closed"
            : days <= 7
              ? `${days}d left`
              : `Closes ${fmtDateShort(listing.closeAt)}`}
        </span>
      </div>
    </div>
  );
}

function ManagementListingsTable({
  listings,
  onOpen,
  onEdit,
  onPublish,
}: {
  listings: JobListing[];
  onOpen: (listing: JobListing) => void;
  onEdit: (listing: JobListing) => void;
  onPublish: (listing: JobListing) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-50 dark:hover:bg-gray-900/40">
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Opens</TableHead>
            <TableHead>Closes</TableHead>
            <TableHead className="text-right">Applicants</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => {
            const tone = listingTone(listing);
            const pill = listingStatusPill(tone);
            return (
              <TableRow
                key={listing.id}
                className="cursor-pointer"
                onClick={() => onOpen(listing)}
              >
                <TableCell className="max-w-[320px]">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{listing.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                      #{listing.id}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <span className="truncate block">
                    {listing.departmentName || "Unspecified"}
                  </span>
                </TableCell>
                <TableCell>
                  <Pill {...pill} />
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {formatDate(listing.openAt)}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {formatDate(listing.closeAt)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-gray-600">
                  {listing.applicationCount}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-[12px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(listing);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    {tone === "draft" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-8 px-2.5 text-[12px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPublish(listing);
                        }}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Publish
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/* ============ Applications Tab ============ */
function ApplicationsTab({
  apps,
  loading,
  isHRUser,
  onBrowse,
  onWithdraw,
  onStatusChange,
}: {
  apps: JobApplication[];
  loading: boolean;
  isHRUser: boolean;
  onBrowse: () => void;
  onWithdraw: (applicationId: number, decisionNote?: string) => Promise<void>;
  onStatusChange: (
    applicationId: number,
    nextStatus: ApplicationStatus,
    decisionNote?: string
  ) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Re-derive the selected row from the live ``apps`` array so the dialog
  // always reflects the latest server state after a mutation.
  const selected = apps.find((a) => a.id === selectedId) ?? null;
  if (loading) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        {isHRUser ? "Loading applications…" : "Loading your applications…"}
      </div>
    );
  }
  const active = apps.filter(
    (a) =>
      a.status !== "accepted" &&
      a.status !== "rejected" &&
      a.status !== "withdrawn"
  );
  const closed = apps.filter(
    (a) =>
      a.status === "accepted" ||
      a.status === "rejected" ||
      a.status === "withdrawn"
  );

  if (apps.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-12 px-6 text-center">
        <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-medium mb-1">
          {isHRUser ? "No applications yet" : "No applications yet"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {isHRUser
            ? "Once employees apply to an open role their applications will appear here."
            : "Browse open positions and apply to start your internal mobility journey."}
        </p>
        {!isHRUser && (
          <Button variant="outline" onClick={onBrowse}>
            Browse roles
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionHead
          title="In progress"
          sub={
            isHRUser ? "Active organisation-wide loops" : "Your active loops"
          }
        />
        <AppList
          apps={active}
          isHRUser={isHRUser}
          onWithdraw={onWithdraw}
          onSelect={isHRUser ? setSelectedId : undefined}
          empty="Nothing in flight."
        />
      </section>
      {closed.length > 0 && (
        <section>
          <SectionHead title="Closed" />
          <AppList
            apps={closed}
            isHRUser={isHRUser}
            onWithdraw={onWithdraw}
            onSelect={isHRUser ? setSelectedId : undefined}
          />
        </section>
      )}
      <ApplicationDetailDialog
        open={selected !== null}
        application={selected}
        onClose={() => setSelectedId(null)}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

function AppList({
  apps,
  isHRUser,
  onWithdraw,
  onSelect,
  empty,
}: {
  apps: JobApplication[];
  isHRUser: boolean;
  onWithdraw: (applicationId: number, decisionNote?: string) => Promise<void>;
  onSelect?: (applicationId: number) => void;
  empty?: string;
}) {
  if (apps.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-8 px-6 text-center text-sm text-gray-500">
        {empty || "No items."}
      </div>
    );
  }
  // HR view exposes an extra "Applicant" column; employees keep the
  // existing role-first layout since the applicant is always them.
  const headerClass = isHRUser
    ? "grid grid-cols-[1fr_1fr_140px_140px_40px] md:grid-cols-[1.2fr_1.2fr_1fr_120px_140px_40px] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500"
    : "grid grid-cols-[1fr_120px_140px_80px] md:grid-cols-[1.5fr_1fr_120px_140px_80px] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500";
  const baseRowClass = isHRUser
    ? "grid grid-cols-[1fr_1fr_140px_140px_40px] md:grid-cols-[1.2fr_1.2fr_1fr_120px_140px_40px] gap-4 px-4 py-3 items-center border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-sm transition-colors"
    : "grid grid-cols-[1fr_120px_140px_80px] md:grid-cols-[1.5fr_1fr_120px_140px_80px] gap-4 px-4 py-3 items-center border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-sm transition-colors";
  const rowClass = onSelect
    ? `${baseRowClass} hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer`
    : `${baseRowClass} hover:bg-gray-50 dark:hover:bg-gray-900/30`;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className={headerClass}>
        {isHRUser && <div>Applicant</div>}
        <div>Role</div>
        <div className="hidden md:block">Cover note</div>
        <div>Applied</div>
        <div>Status</div>
        <div />
      </div>
      {apps.map((a) => {
        const style = applicationStatusStyle(a.status);
        const canWithdraw =
          !isHRUser && a.allowedNextStatuses.includes("withdrawn");
        const terminal = isTerminalApplicationStatus(a.status);
        const decisionLead =
          a.status === "withdrawn"
            ? "Withdrawal note"
            : a.status === "rejected"
              ? "Rejection note"
              : a.status === "accepted"
                ? "Decision note"
                : "Decision note";
        return (
          <div
            key={a.id}
            className={rowClass}
            onClick={onSelect ? () => onSelect(a.id) : undefined}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(a.id);
                    }
                  }
                : undefined
            }
          >
            {isHRUser && (
              <div>
                <div className="font-medium">
                  {a.applicantName || `Applicant #${a.applicantId}`}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  App #{a.id}
                </div>
              </div>
            )}
            <div>
              <div className="font-medium">{a.listingTitle}</div>
              {!isHRUser && (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  App #{a.id}
                </div>
              )}
              {terminal && a.decisionNote && (
                <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 italic leading-relaxed">
                  <span className="not-italic font-medium text-gray-500">
                    {decisionLead}:
                  </span>{" "}
                  “{a.decisionNote}”
                </div>
              )}
              {terminal && a.decidedByName && (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Decided by {a.decidedByName}
                  {a.decidedAt ? ` · ${formatDate(a.decidedAt)}` : ""}
                </div>
              )}
            </div>
            <div className="hidden md:block text-xs text-gray-500 truncate">
              {a.coverNote || "—"}
            </div>
            <div className="text-xs text-gray-500 tabular-nums">
              {formatDate(a.appliedAt)}
            </div>
            <div>
              <Pill label={a.statusDisplay} bg={style.bg} dot={style.dot} />
            </div>
            <div className="flex justify-end">
              {isHRUser ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : canWithdraw ? (
                <WithdrawButton application={a} onWithdraw={onWithdraw} />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ Withdraw Button (applicant side) ============ */
function WithdrawButton({
  application,
  onWithdraw,
}: {
  application: JobApplication;
  onWithdraw: (applicationId: number, decisionNote?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");

  const submit = async () => {
    setBusy(true);
    try {
      await onWithdraw(application.id, note.trim() || undefined);
      setConfirming(false);
      setNote("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        aria-label="Withdraw application"
      >
        Withdraw
      </button>
      <Dialog
        open={confirming}
        onOpenChange={(v) => {
          if (!v && !busy) setConfirming(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw application</DialogTitle>
            <DialogDescription>
              Withdraw your application for &quot;{application.listingTitle}
              &quot;? This is recorded in the application&apos;s history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`withdraw-note-${application.id}`}>
                Note (optional)
              </Label>
              <Textarea
                id={`withdraw-note-${application.id}`}
                rows={3}
                placeholder="Anything you'd like the recruiter to know…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={submit} disabled={busy}>
                {busy ? "Withdrawing…" : "Withdraw"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============ Application Detail Dialog (HR review) ============ */
function ApplicationDetailDialog({
  open,
  application,
  onClose,
  onStatusChange,
}: {
  open: boolean;
  application: JobApplication | null;
  onClose: () => void;
  onStatusChange: (
    applicationId: number,
    nextStatus: ApplicationStatus,
    decisionNote?: string
  ) => Promise<void>;
}) {
  return (
    <Dialog
      open={open && application !== null}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {application
              ? application.applicantName ||
                `Applicant #${application.applicantId}`
              : "Application"}
          </DialogTitle>
          <DialogDescription>
            {application
              ? `${application.listingTitle} · applied ${formatDate(application.appliedAt)}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {application && (
          <div className="space-y-4">
            <section className="space-y-1.5">
              <h4 className="text-[11px] uppercase tracking-[0.06em] font-semibold text-gray-500">
                Cover note
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {application.coverNote || (
                  <span className="text-gray-500 italic">
                    No cover note provided.
                  </span>
                )}
              </p>
            </section>
            <ApplicantRow
              application={application}
              onStatusChange={(next, note) =>
                onStatusChange(application.id, next, note)
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ============ History Tab ============ */
function HistoryTab({
  apps,
  isHRUser,
}: {
  apps: JobApplication[];
  isHRUser: boolean;
}) {
  if (apps.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-12 px-6 text-center">
        <Award className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-medium mb-1">No history yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Closed and accepted applications will appear here.
        </p>
      </div>
    );
  }
  return (
    <section>
      <SectionHead
        title="Application ledger"
        sub="Closed loops, accepted offers, and withdrawals"
      />
      <div className="flex flex-col gap-2">
        {apps.map((a) => {
          const style = applicationStatusStyle(a.status);
          return (
            <div
              key={a.id}
              className="grid grid-cols-[1fr_auto] gap-3 items-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isHRUser && (
                    <span className="text-[13.5px] font-semibold">
                      {a.applicantName || `Applicant #${a.applicantId}`}
                    </span>
                  )}
                  <span
                    className={
                      isHRUser
                        ? "text-[12.5px] text-gray-600 dark:text-gray-300"
                        : "text-[13.5px] font-semibold"
                    }
                  >
                    {isHRUser ? `· ${a.listingTitle}` : a.listingTitle}
                  </span>
                  <Pill label={a.statusDisplay} bg={style.bg} dot={style.dot} />
                </div>
                <div className="text-[11.5px] text-gray-500 mt-1">
                  Applied {formatDate(a.appliedAt)} · last updated{" "}
                  {formatDate(a.updatedAt)}
                </div>
                {a.coverNote && (
                  <p className="text-xs mt-1.5 text-gray-700 dark:text-gray-300 leading-relaxed">
                    {a.coverNote}
                  </p>
                )}
                {a.decisionNote && (
                  <p className="text-xs mt-1.5 text-gray-600 dark:text-gray-300 italic leading-relaxed">
                    <span className="not-italic font-medium text-gray-500">
                      {a.status === "withdrawn"
                        ? "Withdrawal note"
                        : a.status === "rejected"
                          ? "Rejection note"
                          : "Decision note"}
                      :
                    </span>{" "}
                    “{a.decisionNote}”
                  </p>
                )}
                {a.decidedByName && (
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Decided by {a.decidedByName}
                    {a.decidedAt ? ` · ${formatDate(a.decidedAt)}` : ""}
                  </div>
                )}
              </div>
              <div className="text-[11px] text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                #{a.id}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============ Role Drawer ============ */
function RoleDrawer({
  listing,
  isHRUser,
  drawerTab,
  setDrawerTab,
  drawerApplications,
  drawerAppsLoading,
  onApplicationStatusChange,
  coverNote,
  setCoverNote,
  submitting,
  submitError,
  onSubmit,
  onEditListing,
  onPublishListing,
  onClose,
}: {
  listing: JobListingDetail;
  isHRUser: boolean;
  drawerTab: "overview" | "applicants";
  setDrawerTab: (k: "overview" | "applicants") => void;
  drawerApplications: JobApplication[];
  drawerAppsLoading: boolean;
  onApplicationStatusChange: (
    applicationId: number,
    nextStatus: ApplicationStatus,
    decisionNote?: string
  ) => Promise<void>;
  coverNote: string;
  setCoverNote: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onEditListing: () => void;
  onPublishListing: () => void;
  onClose: () => void;
}) {
  const tone = listingTone(listing);
  const pill = listingStatusPill(tone);
  const rawDescription = listing.description || "";
  // Split on first blank line: summary block above, requirements list below.
  const blankIdx = rawDescription.search(/\r?\n\s*\r?\n/);
  const summaryText =
    blankIdx >= 0
      ? rawDescription.slice(0, blankIdx).trim()
      : rawDescription.trim();
  const requirements =
    blankIdx >= 0
      ? rawDescription
          .slice(blankIdx)
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/30 z-50 flex justify-end animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Head */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 grid place-items-center"
            >
              <X className="w-4 h-4" />
            </button>
            <Pill {...pill} />
            <div className="flex-1" />
          </div>
          <h2 className="text-[19px] font-semibold tracking-tight mb-2">
            {listing.title}
          </h2>
          <div className="flex flex-wrap gap-3.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />{" "}
              {listing.departmentName || "Unspecified"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Posted{" "}
              {fmtPostedAgo(listing.openAt)} · closes{" "}
              {formatDate(listing.closeAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3 h-3" /> {listing.applicationCount}{" "}
              applicants
            </span>
          </div>
          {listing.createdByName && (
            <div className="mt-3.5 pt-3.5 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.06em] font-medium text-gray-500 mb-1.5">
                  Posted by
                </div>
                <div className="text-[12.5px] font-medium">
                  {listing.createdByName}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.06em] font-medium text-gray-500 mb-1.5">
                  Status
                </div>
                <div className="text-[12.5px] font-medium">
                  {listing.statusDisplay}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-3.5 border-b border-gray-200 dark:border-gray-700">
          {(
            [
              ["overview", "Overview"],
              isHRUser
                ? ["applicants", `Applicants · ${listing.applicationCount}`]
                : null,
            ].filter(Boolean) as Array<["overview" | "applicants", string]>
          ).map(([k, l]) => (
            <button
function ListingEditDialog({
  open,
  listing,
  departments,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  listing: JobListingDetail | null;
  departments: Department[];
  onOpenChange: (v: boolean) => void;
  onSaved: (
    listingId: number,
    action: "updated" | "published" | "deleted"
  ) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(LISTING_ROLE_NONE);
  const [openAt, setOpenAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [status, setStatus] = useState<JobListingStatus>("draft");
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !listing) return;
    setTitle(listing.title);
    setDescription(listing.description || "");
    setDepartmentId(
      listing.departmentId !== null
        ? String(listing.departmentId)
        : LISTING_ROLE_NONE
    );
    setOpenAt(formatDateTimeInput(listing.openAt));
    setCloseAt(formatDateTimeInput(listing.closeAt));
    setStatus(listing.status);
    setErrors({});
    setDeleteConfirmOpen(false);
    setDeleteError(null);
  }, [open, listing]);

  const resetAndClose = () => {
    if (saving || publishing || deleting) return;
    onOpenChange(false);
    setDeleteConfirmOpen(false);
    setDeleteError(null);
    setErrors({});
  };

  const validate = (): ListingFormErrors => {
    const next: ListingFormErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) next.title = "Title is required.";
    if (!openAt) next.openAt = "Open date is required.";
    if (!closeAt) next.closeAt = "Close date is required.";
    if (openAt && closeAt) {
      const start = new Date(openAt).getTime();
      const end = new Date(closeAt).getTime();
      if (Number.isNaN(start)) next.openAt = "Open date is invalid.";
      if (Number.isNaN(end)) next.closeAt = "Close date is invalid.";
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        next.closeAt = "Close date must be after the open date.";
      }
    }

    return next;
  };

  const saveListing = async () => {
    if (!listing) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setErrors({});
    try {
      await jobListingsApi.updateListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        departmentId:
          departmentId !== LISTING_ROLE_NONE ? Number(departmentId) : null,
        openAt: parseDateTimeInput(openAt),
        closeAt: parseDateTimeInput(closeAt),
        status,
      });
      await onSaved(listing.id, "updated");
      onOpenChange(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to update listing.");
      if (isFormErrors(message)) {
        setErrors(message);
      } else {
        setErrors({ general: message });
      }
    } finally {
      setSaving(false);
    }
  };

  const publishListing = async () => {
    if (!listing) return;
    setPublishing(true);
    setErrors({});
    try {
      await jobListingsApi.patchListing(listing.id, { status: "open" });
      await onSaved(listing.id, "published");
      onOpenChange(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to publish listing.");
      if (isFormErrors(message)) {
        setErrors(message);
      } else {
        setErrors({ general: message });
      }
    } finally {
      setPublishing(false);
    }
  };

  const deleteListing = async () => {
    if (!listing) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await jobListingsApi.deleteListing(listing.id);
      await onSaved(listing.id, "deleted");
      onOpenChange(false);
      setDeleteConfirmOpen(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to delete listing.");
      setDeleteError(
        typeof message === "string"
          ? message
          : message.general || "Failed to delete listing."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && listing !== null}
        onOpenChange={(v) => {
          if (!v) resetAndClose();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit role listing</DialogTitle>
            <DialogDescription>
              Update the role details, dates, and lifecycle status.
            </DialogDescription>
          </DialogHeader>

          {listing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-title">Title</Label>
                  <Input
                    id="listing-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-700">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="listing-description">Description</Label>
                  <Textarea
                    id="listing-description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-700">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LISTING_ROLE_NONE}>
                        Unspecified
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-xs text-red-700">
                      {errors.departmentId}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as JobListingStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["draft", "open", "closed", "cancelled"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {JOB_LISTING_STATUS_LABELS[value as JobListingStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-xs text-red-700">{errors.status}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-open-at">Open date</Label>
                  <Input
                    id="listing-open-at"
                    type="datetime-local"
                    value={openAt}
                    onChange={(e) => setOpenAt(e.target.value)}
                    aria-invalid={Boolean(errors.openAt)}
                  />
                  {errors.openAt && (
                    <p className="text-xs text-red-700">{errors.openAt}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="listing-close-at">Close date</Label>
                  <Input
                    id="listing-close-at"
                    type="datetime-local"
                    value={closeAt}
                    onChange={(e) => setCloseAt(e.target.value)}
                    aria-invalid={Boolean(errors.closeAt)}
                  />
                  {errors.closeAt && (
                    <p className="text-xs text-red-700">{errors.closeAt}</p>
                  )}
                </div>
              </div>

              {errors.general && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
                  {errors.general}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={resetAndClose}
                  disabled={saving || publishing}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={publishListing}
                    disabled={saving || publishing || status === "open"}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {publishing ? "Publishing…" : "Publish"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={saving || publishing}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                  <Button onClick={saveListing} disabled={saving || publishing}>
                    <Pencil className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => {
          if (!v && !deleting) setDeleteConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role listing</DialogTitle>
            <DialogDescription>
              {listing
                ? `Delete "${listing.title}"? This cannot be undone.`
                : "Delete this listing? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteListing}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============ Applicant Row (HR) ============ */
function ApplicantRow({
  application,
  onStatusChange,
}: {
  application: JobApplication;
  onStatusChange: (
    nextStatus: ApplicationStatus,
    decisionNote?: string
  ) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null
  );
  const style = applicationStatusStyle(application.status);
  const terminal = isTerminalApplicationStatus(application.status);

  const allowed = application.allowedNextStatuses;
  const canApprove = allowed.includes("accepted");
  const canReject = allowed.includes("rejected");
  // Intermediate transitions belong in the dropdown (under_review, shortlisted).
  // Accept/Reject live on their own buttons that open the decision dialog.
  const intermediateOptions = allowed.filter(
    (s) => s !== "accepted" && s !== "rejected"
  );

  const commit = async (next: ApplicationStatus, note?: string) => {
    if (next === application.status || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onStatusChange(next, note);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application."
      );
      throw err;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-md">
        <div>
          <div className="text-[13px] font-medium">
            {application.applicantName ||
              `Applicant #${application.applicantId}`}
          </div>
          <div className="text-[11.5px] text-gray-500 mt-0.5">
            Applied {fmtPostedAgo(application.appliedAt)}
          </div>
          {application.coverNote && (
            <p className="text-xs mt-1.5 leading-relaxed">
              {application.coverNote}
            </p>
          )}
          {terminal && application.decidedAt && (
            <p className="text-[11.5px] text-gray-500 mt-1.5">
              Decided by{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {application.decidedByName || "—"}
              </span>{" "}
              · {formatDate(application.decidedAt)}
            </p>
          )}
          {application.decisionNote && (
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300 italic leading-relaxed">
              “{application.decisionNote}”
            </p>
          )}
          {error && (
            <p className="text-[11.5px] text-red-700 mt-1.5">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
          <Pill
            label={application.statusDisplay}
            bg={style.bg}
            dot={style.dot}
          />
          {!terminal && intermediateOptions.length > 0 && (
            <Select
              value={application.status}
              onValueChange={(v) => void commit(v as ApplicationStatus)}
              disabled={busy}
            >
              <SelectTrigger className="w-44 h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={application.status} disabled>
                  {application.statusDisplay}
                </SelectItem>
                {intermediateOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    Advance to {APPLICATION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!terminal && (canApprove || canReject) && (
            <div className="flex gap-1.5">
              {canApprove && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("accepted")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  aria-label="Approve application"
                >
                  <Check className="w-3 h-3" />
                  Approve
                </button>
              )}
              {canReject && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("rejected")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                  aria-label="Reject application"
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <DecisionDialog
        open={pendingStatus !== null}
        decisionStatus={pendingStatus}
        applicantName={application.applicantName}
        onClose={() => setPendingStatus(null)}
        onConfirm={async (note) => {
          if (pendingStatus === null) return;
          await commit(pendingStatus, note);
          setPendingStatus(null);
        }}
      />
    </>
  );
}

/* ============ Decision Dialog (approve / reject) ============ */
function DecisionDialog({
  open,
  decisionStatus,
  applicantName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  decisionStatus: ApplicationStatus | null;
  applicantName: string;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rejecting demands a reason; approving makes it optional.
  const noteRequired = decisionStatus === "rejected";
  const verb = decisionStatus === "accepted" ? "Approve" : "Reject";

  useEffect(() => {
    if (open) {
      setNote("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = note.trim();
    if (noteRequired && !trimmed) {
      setError("A reason is required to reject an application.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{verb} application</DialogTitle>
          <DialogDescription>
            {decisionStatus === "accepted"
              ? `Confirm approval for ${applicantName || "this applicant"}. The applicant will be notified.`
              : `Provide a short reason. ${applicantName || "The applicant"} will be notified.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">
              Decision note{noteRequired ? "" : " (optional)"}
            </Label>
            <Textarea
              id="decision-note"
              rows={4}
              placeholder={
                decisionStatus === "accepted"
                  ? "Offer details, next steps, sponsor…"
                  : "Why is this candidate not progressing?"
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={
                decisionStatus === "accepted" ? "primary" : "destructive"
              }
              onClick={submit}
              disabled={submitting}
            >
              {decisionStatus === "accepted" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              {submitting ? "Saving…" : `${verb} application`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Post Role Dialog ============ */
function PostRoleDialog({
  open,
  onOpenChange,
  departments,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departments: Department[];
  onCreated: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("__none");
  const [openAt, setOpenAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [closeAt, setCloseAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDepartmentId("__none");
    setSummary("");
    setRequirements("");
    setError(null);
  };

  const submit = async (asDraft: boolean) => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const description = [summary.trim(), requirements.trim()]
      .filter(Boolean)
      .join("\n\n");
    const payload: CreateListingPayload = {
      title: title.trim(),
      description,
      departmentId:
        departmentId && departmentId !== "__none" ? Number(departmentId) : null,
      openAt,
      closeAt,
      status: asDraft ? "draft" : "open",
    };
    setPosting(true);
    setError(null);
    try {
      await jobListingsApi.createListing(payload);
      reset();
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post role.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a new role</DialogTitle>
          <DialogDescription>
            Internal listings are visible to all employees and notify matched
            subscribers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="e.g. Senior Product Designer · Growth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => setDepartmentId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unspecified</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opens</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={openAt}
                onChange={setOpenAt}
                placeholder="Select open date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Closes</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={closeAt}
                onChange={setCloseAt}
                placeholder="Select close date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-summary">One-paragraph summary</Label>
            <Textarea
              id="post-summary"
              rows={3}
              placeholder="What's the scope of the role? What kind of person is going to thrive here?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-req">Requirements (one per line)</Label>
            <Textarea
              id="post-req"
              rows={4}
              placeholder={
                "3+ years of …\nTrack record on …\nOperating at P3 today or …"
              }
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={posting}
            >
              Cancel
            </Button>
=======
              key={k}
              onClick={() => setDrawerTab(k)}
              className={`h-9 px-3 text-[12.5px] font-medium -mb-px border-b-2 ${
                drawerTab === k
                  ? "text-gray-900 dark:text-gray-100 border-gray-900 dark:border-gray-100"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {drawerTab === "overview" && (
            <>
              <section className="mb-6">
                <h4 className="text-[11.5px] uppercase tracking-[0.06em] font-semibold text-gray-500 mb-2.5">
                  About the role
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {summaryText || "No description provided."}
                </p>
              </section>
              {requirements.length > 0 && (
                <section className="mb-6">
                  <h4 className="text-[11.5px] uppercase tracking-[0.06em] font-semibold text-gray-500 mb-2.5">
                    What we&apos;re looking for
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {requirements.slice(0, 12).map((r, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
          {drawerTab === "applicants" && isHRUser && (
            <section>
              <h4 className="text-[11.5px] uppercase tracking-[0.06em] font-semibold text-gray-500 mb-2.5">
                Internal applicants
              </h4>
              {drawerAppsLoading ? (
                <div className="text-sm text-gray-500 py-6 text-center">
                  Loading applicants…
                </div>
              ) : drawerApplications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-md py-8 text-center text-sm text-gray-500">
                  No one has applied yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {drawerApplications.map((a) => (
                    <ApplicantRow
                      key={a.id}
                      application={a}
                      onStatusChange={(next) =>
                        onApplicationStatusChange(a.id, next)
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Foot */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
          {isHRUser && (
            <>
              <Button variant="outline" onClick={onEditListing}>
                <Pencil className="w-3.5 h-3.5" />
                Edit listing
              </Button>
              {listing.status === "draft" && (
                <Button variant="primary" onClick={onPublishListing}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Publish
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="flex-1" />
          {!isHRUser &&
            (listing.hasApplied ? (
              <Button variant="outline" disabled>
                <Check className="w-3.5 h-3.5" /> Applied
              </Button>
            ) : (
              <>
                <div className="flex-1 max-w-[280px]">
                  <Textarea
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Optional cover note…"
                    rows={2}
                    className="text-xs"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={onSubmit}
                  disabled={submitting}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Submitting…" : "Apply"}
                </Button>
              </>
            ))}
        </div>
        {submitError && (
          <div className="px-5 py-2 text-xs text-red-700 bg-red-50 border-t border-red-200">
            <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Listing Edit Dialog (HR) ============ */
function ListingEditDialog({
  open,
  listing,
  departments,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  listing: JobListingDetail | null;
  departments: Department[];
  onOpenChange: (v: boolean) => void;
  onSaved: (
    listingId: number,
    action: "updated" | "published" | "deleted"
  ) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(LISTING_ROLE_NONE);
  const [openAt, setOpenAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [status, setStatus] = useState<JobListingStatus>("draft");
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !listing) return;
    setTitle(listing.title);
    setDescription(listing.description || "");
    setDepartmentId(
      listing.departmentId !== null
        ? String(listing.departmentId)
        : LISTING_ROLE_NONE
    );
    setOpenAt(formatDateTimeInput(listing.openAt));
    setCloseAt(formatDateTimeInput(listing.closeAt));
    setStatus(listing.status);
    setErrors({});
    setDeleteConfirmOpen(false);
    setDeleteError(null);
  }, [open, listing]);

  const resetAndClose = () => {
    if (saving || publishing || deleting) return;
    onOpenChange(false);
    setDeleteConfirmOpen(false);
    setDeleteError(null);
    setErrors({});
  };

  const validate = (): ListingFormErrors => {
    const next: ListingFormErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) next.title = "Title is required.";
    if (!openAt) next.openAt = "Open date is required.";
    if (!closeAt) next.closeAt = "Close date is required.";
    if (openAt && closeAt) {
      const start = new Date(openAt).getTime();
      const end = new Date(closeAt).getTime();
      if (Number.isNaN(start)) next.openAt = "Open date is invalid.";
      if (Number.isNaN(end)) next.closeAt = "Close date is invalid.";
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        next.closeAt = "Close date must be after the open date.";
      }
    }

    return next;
  };

  const saveListing = async () => {
    if (!listing) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setErrors({});
    try {
      await jobListingsApi.updateListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        departmentId:
          departmentId !== LISTING_ROLE_NONE ? Number(departmentId) : null,
        openAt: parseDateTimeInput(openAt),
        closeAt: parseDateTimeInput(closeAt),
        status,
      });
      await onSaved(listing.id, "updated");
      onOpenChange(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to update listing.");
      if (isFormErrors(message)) {
        setErrors(message);
      } else {
        setErrors({ general: message });
      }
    } finally {
      setSaving(false);
    }
  };

  const publishListing = async () => {
    if (!listing) return;
    setPublishing(true);
    setErrors({});
    try {
      await jobListingsApi.patchListing(listing.id, { status: "open" });
      await onSaved(listing.id, "published");
      onOpenChange(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to publish listing.");
      if (isFormErrors(message)) {
        setErrors(message);
      } else {
        setErrors({ general: message });
      }
    } finally {
      setPublishing(false);
    }
  };

  const deleteListing = async () => {
    if (!listing) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await jobListingsApi.deleteListing(listing.id);
      await onSaved(listing.id, "deleted");
      onOpenChange(false);
      setDeleteConfirmOpen(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to delete listing.");
      setDeleteError(
        typeof message === "string"
          ? message
          : message.general || "Failed to delete listing."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && listing !== null}
        onOpenChange={(v) => {
          if (!v) resetAndClose();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit role listing</DialogTitle>
            <DialogDescription>
              Update the role details, dates, and lifecycle status.
            </DialogDescription>
          </DialogHeader>

          {listing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-title">Title</Label>
                  <Input
                    id="listing-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-700">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="listing-description">Description</Label>
                  <Textarea
                    id="listing-description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-700">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LISTING_ROLE_NONE}>
                        Unspecified
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-xs text-red-700">
                      {errors.departmentId}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as JobListingStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["draft", "open", "closed", "cancelled"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {JOB_LISTING_STATUS_LABELS[value as JobListingStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-xs text-red-700">{errors.status}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-open-at">Open date</Label>
                  <Input
                    id="listing-open-at"
                    type="datetime-local"
                    value={openAt}
                    onChange={(e) => setOpenAt(e.target.value)}
                    aria-invalid={Boolean(errors.openAt)}
                  />
                  {errors.openAt && (
                    <p className="text-xs text-red-700">{errors.openAt}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="listing-close-at">Close date</Label>
                  <Input
                    id="listing-close-at"
                    type="datetime-local"
                    value={closeAt}
                    onChange={(e) => setCloseAt(e.target.value)}
                    aria-invalid={Boolean(errors.closeAt)}
                  />
                  {errors.closeAt && (
                    <p className="text-xs text-red-700">{errors.closeAt}</p>
                  )}
                </div>
              </div>

              {errors.general && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
                  {errors.general}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={resetAndClose}
                  disabled={saving || publishing}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={publishListing}
                    disabled={saving || publishing || status === "open"}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {publishing ? "Publishing…" : "Publish"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={saving || publishing}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                  <Button onClick={saveListing} disabled={saving || publishing}>
                    <Pencil className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => {
          if (!v && !deleting) setDeleteConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role listing</DialogTitle>
            <DialogDescription>
              {listing
                ? `Delete "${listing.title}"? This cannot be undone.`
                : "Delete this listing? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteListing}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============ Applicant Row (HR) ============ */
function ApplicantRow({
  application,
  onStatusChange,
}: {
  application: JobApplication;
  onStatusChange: (
    nextStatus: ApplicationStatus,
    decisionNote?: string
  ) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null
  );
  const style = applicationStatusStyle(application.status);
  const terminal = isTerminalApplicationStatus(application.status);

  const allowed = application.allowedNextStatuses;
  const canApprove = allowed.includes("accepted");
  const canReject = allowed.includes("rejected");
  // Intermediate transitions belong in the dropdown (under_review, shortlisted).
  // Accept/Reject live on their own buttons that open the decision dialog.
  const intermediateOptions = allowed.filter(
    (s) => s !== "accepted" && s !== "rejected"
  );

  const commit = async (next: ApplicationStatus, note?: string) => {
    if (next === application.status || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onStatusChange(next, note);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application."
      );
      throw err;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-md">
        <div>
          <div className="text-[13px] font-medium">
            {application.applicantName ||
              `Applicant #${application.applicantId}`}
          </div>
          <div className="text-[11.5px] text-gray-500 mt-0.5">
            Applied {fmtPostedAgo(application.appliedAt)}
          </div>
          {application.coverNote && (
            <p className="text-xs mt-1.5 leading-relaxed">
              {application.coverNote}
            </p>
          )}
          {terminal && application.decidedAt && (
            <p className="text-[11.5px] text-gray-500 mt-1.5">
              Decided by{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {application.decidedByName || "—"}
              </span>{" "}
              · {formatDate(application.decidedAt)}
            </p>
          )}
          {application.decisionNote && (
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300 italic leading-relaxed">
              “{application.decisionNote}”
            </p>
          )}
          {error && (
            <p className="text-[11.5px] text-red-700 mt-1.5">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
          <Pill
            label={application.statusDisplay}
            bg={style.bg}
            dot={style.dot}
          />
          {!terminal && intermediateOptions.length > 0 && (
            <Select
              value={application.status}
              onValueChange={(v) => void commit(v as ApplicationStatus)}
              disabled={busy}
            >
              <SelectTrigger className="w-44 h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={application.status} disabled>
                  {application.statusDisplay}
                </SelectItem>
                {intermediateOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    Advance to {APPLICATION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!terminal && (canApprove || canReject) && (
            <div className="flex gap-1.5">
              {canApprove && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("accepted")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  aria-label="Approve application"
                >
                  <Check className="w-3 h-3" />
                  Approve
                </button>
              )}
              {canReject && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("rejected")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                  aria-label="Reject application"
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <DecisionDialog
        open={pendingStatus !== null}
        decisionStatus={pendingStatus}
        applicantName={application.applicantName}
        onClose={() => setPendingStatus(null)}
        onConfirm={async (note) => {
          if (pendingStatus === null) return;
          await commit(pendingStatus, note);
          setPendingStatus(null);
        }}
      />
    </>
  );
}

/* ============ Decision Dialog (approve / reject) ============ */
function DecisionDialog({
  open,
  decisionStatus,
  applicantName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  decisionStatus: ApplicationStatus | null;
  applicantName: string;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rejecting demands a reason; approving makes it optional.
  const noteRequired = decisionStatus === "rejected";
  const verb = decisionStatus === "accepted" ? "Approve" : "Reject";

  useEffect(() => {
    if (open) {
      setNote("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = note.trim();
    if (noteRequired && !trimmed) {
      setError("A reason is required to reject an application.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{verb} application</DialogTitle>
          <DialogDescription>
            {decisionStatus === "accepted"
              ? `Confirm approval for ${applicantName || "this applicant"}. The applicant will be notified.`
              : `Provide a short reason. ${applicantName || "The applicant"} will be notified.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">
              Decision note{noteRequired ? "" : " (optional)"}
            </Label>
            <Textarea
              id="decision-note"
              rows={4}
              placeholder={
                decisionStatus === "accepted"
                  ? "Offer details, next steps, sponsor…"
                  : "Why is this candidate not progressing?"
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={
                decisionStatus === "accepted" ? "primary" : "destructive"
              }
              onClick={submit}
              disabled={submitting}
            >
              {decisionStatus === "accepted" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              {submitting ? "Saving…" : `${verb} application`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Post Role Dialog ============ */
function PostRoleDialog({
  open,
  onOpenChange,
  departments,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departments: Department[];
  onCreated: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("__none");
  const [openAt, setOpenAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [closeAt, setCloseAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDepartmentId("__none");
    setSummary("");
    setRequirements("");
    setError(null);
  };

  const submit = async (asDraft: boolean) => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const description = [summary.trim(), requirements.trim()]
      .filter(Boolean)
      .join("\n\n");
    const payload: CreateListingPayload = {
      title: title.trim(),
      description,
      departmentId:
        departmentId && departmentId !== "__none" ? Number(departmentId) : null,
      openAt,
      closeAt,
      status: asDraft ? "draft" : "open",
    };
    setPosting(true);
    setError(null);
    try {
      await jobListingsApi.createListing(payload);
      reset();
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post role.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a new role</DialogTitle>
          <DialogDescription>
            Internal listings are visible to all employees and notify matched
            subscribers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="e.g. Senior Product Designer · Growth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => setDepartmentId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unspecified</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opens</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={openAt}
                onChange={setOpenAt}
                placeholder="Select open date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Closes</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={closeAt}
                onChange={setCloseAt}
                placeholder="Select close date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-summary">One-paragraph summary</Label>
            <Textarea
              id="post-summary"
              rows={3}
              placeholder="What's the scope of the role? What kind of person is going to thrive here?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-req">Requirements (one per line)</Label>
            <Textarea
              id="post-req"
              rows={4}
              placeholder={
                "3+ years of …\nTrack record on …\nOperating at P3 today or …"
              }
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={posting}
            >
              Cancel
            </Button>
============ Listing Edit Dialog (HR) ============ */
function ListingEditDialog({
  open,
  listing,
  departments,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  listing: JobListingDetail | null;
  departments: Department[];
  onOpenChange: (v: boolean) => void;
  onSaved: (
    listingId: number,
    action: "updated" | "published" | "deleted"
  ) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(LISTING_ROLE_NONE);
  const [openAt, setOpenAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [status, setStatus] = useState<JobListingStatus>("draft");
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !listing) return;
    setTitle(listing.title);
    setDescription(listing.description || "");
    setDepartmentId(
      listing.departmentId !== null
        ? String(listing.departmentId)
        : LISTING_ROLE_NONE
    );
    setOpenAt(formatDateTimeInput(listing.openAt));
    setCloseAt(formatDateTimeInput(listing.closeAt));
    setStatus(listing.status);
    setErrors({});
    setDeleteConfirmOpen(false);
    setDeleteError(null);
  }, [open, listing]);

  const resetAndClose = () => {
    if (saving || publishing || deleting) return;
    onOpenChange(false);
    setDeleteConfirmOpen(false);
    setDeleteError(null);
    setErrors({});
  };

  const validate = (): ListingFormErrors => {
    const next: ListingFormErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) next.title = "Title is required.";
    if (!openAt) next.openAt = "Open date is required.";
    if (!closeAt) next.closeAt = "Close date is required.";
    if (openAt && closeAt) {
      const start = new Date(openAt).getTime();
      const end = new Date(closeAt).getTime();
      if (Number.isNaN(start)) next.openAt = "Open date is invalid.";
      if (Number.isNaN(end)) next.closeAt = "Close date is invalid.";
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        next.closeAt = "Close date must be after the open date.";
      }
    }

    return next;
  };

  const saveListing = async () => {
    if (!listing) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setErrors({});
    try {
      await jobListingsApi.updateListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        departmentId:
          departmentId !== LISTING_ROLE_NONE ? Number(departmentId) : null,
        openAt: parseDateTimeInput(openAt),
        closeAt: parseDateTimeInput(closeAt),
        status,
      });
      await onSaved(listing.id, "updated");
      onOpenChange(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to update listing.");
      if (isFormErrors(message)) {
        setErrors(message);
      } else {
        setErrors({ general: message });
      }
    } finally {
      setSaving(false);
    }
  };

  const publishListing = async () => {
    if (!listing) return;
    setPublishing(true);
    setErrors({});
    try {
      await jobListingsApi.patchListing(listing.id, { status: "open" });
      await onSaved(listing.id, "published");
      onOpenChange(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to publish listing.");
      if (isFormErrors(message)) {
        setErrors(message);
      } else {
        setErrors({ general: message });
      }
    } finally {
      setPublishing(false);
    }
  };

  const deleteListing = async () => {
    if (!listing) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await jobListingsApi.deleteListing(listing.id);
      await onSaved(listing.id, "deleted");
      onOpenChange(false);
      setDeleteConfirmOpen(false);
    } catch (err) {
      const message = getListingActionError(err, "Failed to delete listing.");
      setDeleteError(
        typeof message === "string"
          ? message
          : message.general || "Failed to delete listing."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && listing !== null}
        onOpenChange={(v) => {
          if (!v) resetAndClose();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit role listing</DialogTitle>
            <DialogDescription>
              Update the role details, dates, and lifecycle status.
            </DialogDescription>
          </DialogHeader>

          {listing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-title">Title</Label>
                  <Input
                    id="listing-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-700">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="listing-description">Description</Label>
                  <Textarea
                    id="listing-description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-700">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LISTING_ROLE_NONE}>
                        Unspecified
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-xs text-red-700">
                      {errors.departmentId}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as JobListingStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["draft", "open", "closed", "cancelled"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {JOB_LISTING_STATUS_LABELS[value as JobListingStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-xs text-red-700">{errors.status}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-open-at">Open date</Label>
                  <Input
                    id="listing-open-at"
                    type="datetime-local"
                    value={openAt}
                    onChange={(e) => setOpenAt(e.target.value)}
                    aria-invalid={Boolean(errors.openAt)}
                  />
                  {errors.openAt && (
                    <p className="text-xs text-red-700">{errors.openAt}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="listing-close-at">Close date</Label>
                  <Input
                    id="listing-close-at"
                    type="datetime-local"
                    value={closeAt}
                    onChange={(e) => setCloseAt(e.target.value)}
                    aria-invalid={Boolean(errors.closeAt)}
                  />
                  {errors.closeAt && (
                    <p className="text-xs text-red-700">{errors.closeAt}</p>
                  )}
                </div>
              </div>

              {errors.general && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
                  {errors.general}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={resetAndClose}
                  disabled={saving || publishing}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={publishListing}
                    disabled={saving || publishing || status === "open"}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {publishing ? "Publishing…" : "Publish"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={saving || publishing}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                  <Button onClick={saveListing} disabled={saving || publishing}>
                    <Pencil className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => {
          if (!v && !deleting) setDeleteConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role listing</DialogTitle>
            <DialogDescription>
              {listing
                ? `Delete "${listing.title}"? This cannot be undone.`
                : "Delete this listing? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteListing}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============ Applicant Row (HR) ============ */
function ApplicantRow({
  application,
  onStatusChange,
}: {
  application: JobApplication;
  onStatusChange: (
    nextStatus: ApplicationStatus,
    decisionNote?: string
  ) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null
  );
  const style = applicationStatusStyle(application.status);
  const terminal = isTerminalApplicationStatus(application.status);

  const allowed = application.allowedNextStatuses;
  const canApprove = allowed.includes("accepted");
  const canReject = allowed.includes("rejected");
  // Intermediate transitions belong in the dropdown (under_review, shortlisted).
  // Accept/Reject live on their own buttons that open the decision dialog.
  const intermediateOptions = allowed.filter(
    (s) => s !== "accepted" && s !== "rejected"
  );

  const commit = async (next: ApplicationStatus, note?: string) => {
    if (next === application.status || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onStatusChange(next, note);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application."
      );
      throw err;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-md">
        <div>
          <div className="text-[13px] font-medium">
            {application.applicantName ||
              `Applicant #${application.applicantId}`}
          </div>
          <div className="text-[11.5px] text-gray-500 mt-0.5">
            Applied {fmtPostedAgo(application.appliedAt)}
          </div>
          {application.coverNote && (
            <p className="text-xs mt-1.5 leading-relaxed">
              {application.coverNote}
            </p>
          )}
          {terminal && application.decidedAt && (
            <p className="text-[11.5px] text-gray-500 mt-1.5">
              Decided by{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {application.decidedByName || "—"}
              </span>{" "}
              · {formatDate(application.decidedAt)}
            </p>
          )}
          {application.decisionNote && (
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300 italic leading-relaxed">
              “{application.decisionNote}”
            </p>
          )}
          {error && (
            <p className="text-[11.5px] text-red-700 mt-1.5">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
          <Pill
            label={application.statusDisplay}
            bg={style.bg}
            dot={style.dot}
          />
          {!terminal && intermediateOptions.length > 0 && (
            <Select
              value={application.status}
              onValueChange={(v) => void commit(v as ApplicationStatus)}
              disabled={busy}
            >
              <SelectTrigger className="w-44 h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={application.status} disabled>
                  {application.statusDisplay}
                </SelectItem>
                {intermediateOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    Advance to {APPLICATION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!terminal && (canApprove || canReject) && (
            <div className="flex gap-1.5">
              {canApprove && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("accepted")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  aria-label="Approve application"
                >
                  <Check className="w-3 h-3" />
                  Approve
                </button>
              )}
              {canReject && (
                <button
                  type="button"
                  onClick={() => setPendingStatus("rejected")}
                  disabled={busy}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11.5px] font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                  aria-label="Reject application"
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <DecisionDialog
        open={pendingStatus !== null}
        decisionStatus={pendingStatus}
        applicantName={application.applicantName}
        onClose={() => setPendingStatus(null)}
        onConfirm={async (note) => {
          if (pendingStatus === null) return;
          await commit(pendingStatus, note);
          setPendingStatus(null);
        }}
      />
    </>
  );
}

/* ============ Decision Dialog (approve / reject) ============ */
function DecisionDialog({
  open,
  decisionStatus,
  applicantName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  decisionStatus: ApplicationStatus | null;
  applicantName: string;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rejecting demands a reason; approving makes it optional.
  const noteRequired = decisionStatus === "rejected";
  const verb = decisionStatus === "accepted" ? "Approve" : "Reject";

  useEffect(() => {
    if (open) {
      setNote("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = note.trim();
    if (noteRequired && !trimmed) {
      setError("A reason is required to reject an application.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{verb} application</DialogTitle>
          <DialogDescription>
            {decisionStatus === "accepted"
              ? `Confirm approval for ${applicantName || "this applicant"}. The applicant will be notified.`
              : `Provide a short reason. ${applicantName || "The applicant"} will be notified.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">
              Decision note{noteRequired ? "" : " (optional)"}
            </Label>
            <Textarea
              id="decision-note"
              rows={4}
              placeholder={
                decisionStatus === "accepted"
                  ? "Offer details, next steps, sponsor…"
                  : "Why is this candidate not progressing?"
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={
                decisionStatus === "accepted" ? "primary" : "destructive"
              }
              onClick={submit}
              disabled={submitting}
            >
              {decisionStatus === "accepted" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              {submitting ? "Saving…" : `${verb} application`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Post Role Dialog ============ */
function PostRoleDialog({
  open,
  onOpenChange,
  departments,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departments: Department[];
  onCreated: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("__none");
  const [openAt, setOpenAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [closeAt, setCloseAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDepartmentId("__none");
    setSummary("");
    setRequirements("");
    setError(null);
  };

  const submit = async (asDraft: boolean) => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const description = [summary.trim(), requirements.trim()]
      .filter(Boolean)
      .join("\n\n");
    const payload: CreateListingPayload = {
      title: title.trim(),
      description,
      departmentId:
        departmentId && departmentId !== "__none" ? Number(departmentId) : null,
      openAt,
      closeAt,
      status: asDraft ? "draft" : "open",
    };
    setPosting(true);
    setError(null);
    try {
      await jobListingsApi.createListing(payload);
      reset();
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post role.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a new role</DialogTitle>
          <DialogDescription>
            Internal listings are visible to all employees and notify matched
            subscribers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="e.g. Senior Product Designer · Growth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => setDepartmentId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unspecified</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opens</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={openAt}
                onChange={setOpenAt}
                placeholder="Select open date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Closes</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={closeAt}
                onChange={setCloseAt}
                placeholder="Select close date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-summary">One-paragraph summary</Label>
            <Textarea
              id="post-summary"
              rows={3}
              placeholder="What's the scope of the role? What kind of person is going to thrive here?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-req">Requirements (one per line)</Label>
            <Textarea
              id="post-req"
              rows={4}
              placeholder={
                "3+ years of …\nTrack record on …\nOperating at P3 today or …"
              }
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={posting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => submit(true)}
              disabled={posting}
            >
              Save as draft
            </Button>
            <Button
              variant="primary"
              onClick={() => submit(false)}
              disabled={posting}
            >
              <Send className="w-3.5 h-3.5" />
              {posting ? "Posting…" : "Post role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Promotions Tab ============ */
function PromotionsTab({
  promotions,
  loading,
  error,
  isHRUser,
  onAdd,
  onEdit,
  onDelete,
}: {
  promotions: PromotionRecord[];
  loading: boolean;
  error: string | null;
  isHRUser: boolean;
  onAdd: () => void;
  onEdit: (p: PromotionRecord) => void;
  onDelete: (p: PromotionRecord) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        Loading promotion history…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SectionHead
          icon={<TrendingUp className="w-3 h-3" />}
          title={isHRUser ? "Promotion records" : "Your promotion history"}
          sub={
            isHRUser
              ? "Every recorded promotion across the organisation."
              : "Milestones in your career advancement."
          }
        />
        {isHRUser && (
          <Button variant="primary" onClick={onAdd}>
            <Plus className="w-3.5 h-3.5" />
            Add promotion
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {promotions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-12 px-6 text-center">
          <TrendingUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium mb-1">No promotions recorded</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {isHRUser
              ? "Record a promotion to start building employee career histories."
              : "Your promotion history will appear here once HR records one."}
          </p>
          {isHRUser && (
            <Button variant="outline" onClick={onAdd}>
              <Plus className="w-3.5 h-3.5" />
              Add promotion
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {promotions.map((p) => (
            <PromotionCard
              key={p.id}
              promotion={p}
              isHRUser={isHRUser}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PromotionCard({
  promotion,
  isHRUser,
  onEdit,
  onDelete,
}: {
  promotion: PromotionRecord;
  isHRUser: boolean;
  onEdit: (p: PromotionRecord) => void;
  onDelete: (p: PromotionRecord) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isHRUser && (
              <span className="text-[13.5px] font-semibold">
                {promotion.employeeName || `Employee #${promotion.employeeId}`}
              </span>
            )}
            <Pill
              label={formatDate(promotion.date)}
              bg="bg-emerald-50 text-emerald-700"
              dot="bg-emerald-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[12px] text-gray-700 dark:text-gray-200">
              {promotion.previousRoleName || "—"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded text-[12px] font-medium">
              {promotion.newRoleName || "—"}
            </span>
          </div>
          {(promotion.previousCpfLevel || promotion.newCpfLevel) && (
            <div className="text-[11.5px] text-gray-500 mt-1.5">
              CPF: {promotion.previousCpfLevel || "—"} →{" "}
              {promotion.newCpfLevel || "—"}
            </div>
          )}
          {promotion.notes && (
            <p className="text-xs mt-1.5 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {promotion.notes}
            </p>
          )}
        </div>
        {isHRUser && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(promotion)}
              className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 grid place-items-center"
              aria-label="Edit promotion"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(promotion)}
              className="w-7 h-7 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 grid place-items-center"
              aria-label="Delete promotion"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Promotion Dialog ============ */
const ROLE_NONE = "__none";

interface PromotionEmployeeOption {
  id: number;
  name: string;
  currentRoleId: number | null;
  currentRoleName: string;
}

function PromotionDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PromotionRecord | null;
  onSaved: () => void | Promise<void>;
}) {
  const [employees, setEmployees] = useState<PromotionEmployeeOption[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [refsLoading, setRefsLoading] = useState(false);

  const [employeeId, setEmployeeId] = useState<string>("");
  const [newRoleId, setNewRoleId] = useState<string>(ROLE_NONE);
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee =
    employees.find((e) => String(e.id) === employeeId) ?? null;

  // In create mode the "previous role" is always the employee's current
  // role (read-only). In edit mode we surface the historical previous role
  // that was captured on the record itself.
  const previousRoleId: number | null = editing
    ? (editing.previousRoleId ?? null)
    : (selectedEmployee?.currentRoleId ?? null);
  const previousRoleName: string = editing
    ? (editing.previousRoleName ?? "")
    : (selectedEmployee?.currentRoleName ?? "");

  const newRoleOptions = roles.filter((r) => r.id !== previousRoleId);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRefsLoading(true);
    Promise.all([
      employeeApi
        .listEmployees({ page_size: 200 })
        .then((res) =>
          res.results.map<PromotionEmployeeOption>((e) => ({
            id: e.id,
            name: `${e.first_name} ${e.last_name}`.trim() || `#${e.id}`,
            currentRoleId: e.role?.id ?? null,
            currentRoleName: e.role?.name ?? "",
          }))
        )
        .catch(() => [] as PromotionEmployeeOption[]),
      employeeApi.getRoles().catch(() => [] as { id: number; name: string }[]),
    ])
      .then(([emps, rls]) => {
        if (cancelled) return;
        setEmployees(emps);
        setRoles(rls);
      })
      .finally(() => {
        if (!cancelled) setRefsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEmployeeId(String(editing.employeeId));
      setNewRoleId(
        editing.newRoleId != null ? String(editing.newRoleId) : ROLE_NONE
      );
      setDate(editing.date);
      setNotes(editing.notes);
    } else {
      setEmployeeId("");
      setNewRoleId(ROLE_NONE);
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
    setError(null);
  }, [open, editing]);

  // If the picked new role happens to match the employee's current role
  // (e.g. user switched employees after picking), reset the selection so
  // the dropdown doesn't show a value that no longer exists in its options.
  useEffect(() => {
    if (newRoleId === ROLE_NONE) return;
    if (Number(newRoleId) === previousRoleId) {
      setNewRoleId(ROLE_NONE);
    }
  }, [newRoleId, previousRoleId]);

  const submit = async () => {
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }
    if (!date) {
      setError("Promotion date is required.");
      return;
    }
    if (newRoleId === ROLE_NONE) {
      setError("Select a new role for the promotion.");
      return;
    }
    const payload: CreatePromotionPayload = {
      employeeId: Number(employeeId),
      previousRoleId: previousRoleId,
      newRoleId: Number(newRoleId),
      date,
      notes: notes.trim(),
    };
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await promotionsApi.updatePromotion(editing.id, payload);
      } else {
        await promotionsApi.createPromotion(payload);
      }
      await onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save promotion."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit promotion record" : "Record a promotion"}
          </DialogTitle>
          <DialogDescription>
            Capture the role change, effective date, and any context worth
            keeping in the employee&apos;s career history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    refsLoading ? "Loading employees…" : "Select employee"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Previous role</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-700 dark:text-gray-200">
                {employeeId
                  ? previousRoleName || "No role on file"
                  : "Select an employee first"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New role</Label>
              <Select
                value={newRoleId}
                onValueChange={setNewRoleId}
                disabled={
                  !employeeId || refsLoading || newRoleOptions.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !employeeId
                        ? "Select an employee first"
                        : refsLoading
                          ? "Loading roles…"
                          : newRoleOptions.length === 0
                            ? "No other roles available"
                            : "Select new role"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {newRoleOptions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Effective date</Label>
            <DatePicker
              mode="single"
              size="compact"
              value={date}
              onChange={setDate}
              placeholder="Select effective date"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="promo-notes">Notes</Label>
            <Textarea
              id="promo-notes"
              rows={4}
              placeholder="Context about the promotion — scope change, performance, sponsor…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={saving}>
              <Check className="w-3.5 h-3.5" />
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Record promotion"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Career Progression (CPF) Tab ============ */
interface CPFEmployeeOption {
  id: number;
  name: string;
  cpfLevel: string;
  roleName: string;
}

function CPFProgressionTab({ isHRUser }: { isHRUser: boolean }) {
  const [employees, setEmployees] = useState<CPFEmployeeOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [progression, setProgression] = useState<CPFProgression | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);

  // HR picks whose timeline to view. The roster carries each employee's
  // current CPF level, so it is refreshed after every recorded change.
  const loadEmployees = useCallback(async () => {
    if (!isHRUser) return;
    try {
      const res = await employeeApi.listEmployees({ page_size: 200 });
      setEmployees(
        res.results.map((e) => ({
          id: e.id,
          name: `${e.first_name} ${e.last_name}`.trim() || `#${e.id}`,
          cpfLevel: e.cpf_level ?? "",
          roleName: e.role?.name ?? "",
        }))
      );
    } catch {
      setEmployees([]);
    }
  }, [isHRUser]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const load = useCallback(async () => {
    // HR must select an employee; everyone else gets their own timeline.
    if (isHRUser && !selectedEmployee) {
      setProgression(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cpfLevelChangesApi.getProgression(
        isHRUser ? Number(selectedEmployee) : undefined
      );
      setProgression(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load CPF progression."
      );
      setProgression(null);
    } finally {
      setLoading(false);
    }
  }, [isHRUser, selectedEmployee]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRecorded = async () => {
    setIsRecordDialogOpen(false);
    await Promise.all([load(), loadEmployees()]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SectionHead
          icon={<TrendingUp className="w-3 h-3" />}
          title={isHRUser ? "Career progression" : "Your career progression"}
          sub="CPF level advancement over time — recorded changes and review outcomes."
        />
        <div className="flex items-center gap-2">
          {isHRUser && (
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-56 h-9">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isHRUser && (
            <Button
              variant="primary"
              onClick={() => setIsRecordDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Record CPF change
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {isHRUser && !selectedEmployee ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-12 px-6 text-center">
          <Layers className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium mb-1">Pick an employee</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an employee above to view their CPF career progression
            timeline.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          Loading career progression…
        </div>
      ) : progression ? (
        <CPFProgressionView progression={progression} />
      ) : null}

      {isHRUser && (
        <CPFChangeDialog
          open={isRecordDialogOpen}
          onOpenChange={setIsRecordDialogOpen}
          employees={employees}
          defaultEmployeeId={selectedEmployee}
          onSaved={handleRecorded}
        />
      )}
    </div>
  );
}

function CPFProgressionView({ progression }: { progression: CPFProgression }) {
  const { timeline } = progression;
  return (
    <div className="space-y-4">
      {/* Current level summary */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 grid place-items-center shrink-0">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-gray-500">
            Current CPF level
          </div>
          <div className="text-lg font-semibold tracking-tight">
            {progression.currentLevel || "Not set"}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-gray-500">
            Timeline events
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {timeline.length}
          </div>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-12 px-6 text-center">
          <TrendingUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium mb-1">No progression yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            CPF level changes and review outcomes will appear here as a
            timeline.
          </p>
        </div>
      ) : (
        <ol className="relative pl-6">
          {/* connecting line */}
          <span className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-gray-200 dark:bg-gray-700" />
          {timeline.map((event, i) => (
            <CPFTimelineNode
              key={`${event.eventType}-${event.referenceId ?? "x"}-${i}`}
              event={event}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function CPFTimelineNode({ event }: { event: CPFProgressionEvent }) {
  return (
    <li className="relative pb-4 last:pb-0">
      {/* node dot */}
      <span className="absolute -left-[15px] top-2 w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-indigo-500" />
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              CPF_PROGRESSION_EVENT_TYPE_BADGE_COLORS[event.eventType]
            }`}
          >
            {CPF_PROGRESSION_EVENT_TYPE_LABELS[event.eventType]}
          </span>
          <span className="text-[11.5px] text-gray-500 tabular-nums">
            {formatDate(event.date)}
          </span>
          {event.cpfScore !== null && (
            <span className="ml-auto text-[11px] text-gray-500">
              CPF score{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {event.cpfScore}
              </span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[12px] text-gray-700 dark:text-gray-200">
            {event.previousLevel || "—"}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="inline-flex items-center px-2 py-0.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded text-[12px] font-medium">
            {event.newLevel || "—"}
          </span>
        </div>
        {event.referenceLabel && (
          <div className="text-[11.5px] text-gray-500 mt-1.5">
            {event.referenceLabel}
          </div>
        )}
        {event.notes && (
          <p className="text-xs mt-1.5 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {event.notes}
          </p>
        )}
      </div>
    </li>
  );
}

function CPFChangeDialog({
  open,
  onOpenChange,
  employees,
  defaultEmployeeId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employees: CPFEmployeeOption[];
  defaultEmployeeId: string;
  onSaved: () => void | Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [newLevel, setNewLevel] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [source, setSource] = useState<CPFChangeSource>("manual");
  const [cpfScore, setCpfScore] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [roleLevels, setRoleLevels] = useState<string[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEmp =
    employees.find((e) => String(e.id) === employeeId) ?? null;
  // Previous level is the employee's actual current CPF level — never typed.
  const previousLevel = selectedEmp?.cpfLevel ?? "";
  // The ladder is ordered; offer only levels above the current one.
  const currentIdx = roleLevels.indexOf(previousLevel);
  const nextLevels =
    currentIdx >= 0 ? roleLevels.slice(currentIdx + 1) : roleLevels;

  useEffect(() => {
    if (!open) return;
    setEmployeeId(defaultEmployeeId || "");
    setNewLevel("");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setSource("manual");
    setCpfScore("");
    setNotes("");
    setRoleLevels([]);
    setError(null);
  }, [open, defaultEmployeeId]);

  // Load the selected employee's role-specific CPF ladder.
  useEffect(() => {
    const emp = employees.find((e) => String(e.id) === employeeId);
    if (!open || !emp || !emp.roleName) {
      setRoleLevels([]);
      return;
    }
    let cancelled = false;
    setLevelsLoading(true);
    setNewLevel("");
    cpfLevelsApi
      .getCPFLevelsByRole(emp.roleName)
      .then((levels) => {
        if (!cancelled) setRoleLevels(levels);
      })
      .catch(() => {
        if (!cancelled) setRoleLevels([]);
      })
      .finally(() => {
        if (!cancelled) setLevelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, employeeId, employees]);

  const submit = async () => {
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }
    if (!newLevel) {
      setError("Select a new CPF level.");
      return;
    }
    if (!effectiveDate) {
      setError("Effective date is required.");
      return;
    }
    const score = cpfScore.trim() === "" ? null : Number(cpfScore);
    if (score !== null && (Number.isNaN(score) || score < 0 || score > 100)) {
      setError("CPF score must be a number between 0 and 100.");
      return;
    }
    const payload: CreateCPFLevelChangePayload = {
      employeeId: Number(employeeId),
      previousLevel,
      newLevel,
      effectiveDate,
      source,
      cpfScore: score,
      notes: notes.trim(),
    };
    setSaving(true);
    setError(null);
    try {
      await cpfLevelChangesApi.createChange(payload);
      await onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record CPF change."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record a CPF level change</DialogTitle>
          <DialogDescription>
            Capture a Career Progression Framework level change for an
            employee&apos;s longitudinal history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Previous level</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-700 dark:text-gray-200">
                {employeeId ? previousLevel || "Not set" : "—"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New level</Label>
              <Select
                value={newLevel}
                onValueChange={setNewLevel}
                disabled={
                  !employeeId || levelsLoading || nextLevels.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !employeeId
                        ? "Select an employee first"
                        : levelsLoading
                          ? "Loading levels…"
                          : nextLevels.length === 0
                            ? "No higher level available"
                            : "Select new level"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {nextLevels.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Effective date</Label>
              <DatePicker
                mode="single"
                size="compact"
                value={effectiveDate}
                onChange={setEffectiveDate}
                placeholder="Select effective date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                value={source}
                onValueChange={(v) => setSource(v as CPFChangeSource)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CPF_CHANGE_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CPF_CHANGE_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf-score">CPF score (0–100)</Label>
              <Input
                id="cpf-score"
                type="number"
                min={0}
                max={100}
                placeholder="Optional"
                value={cpfScore}
                onChange={(e) => setCpfScore(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpf-notes">Notes</Label>
            <Textarea
              id="cpf-notes"
              rows={3}
              placeholder="Context — review outcome, sponsor, rationale…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={saving}>
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Record change"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
