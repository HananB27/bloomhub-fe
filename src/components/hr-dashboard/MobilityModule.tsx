import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
  Bookmark,
  Check,
  X,
  MapPin,
  Clock,
  ChevronRight,
  Award,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/utils";
import { useSession } from "next-auth/react";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";
import { jobListingsApi } from "@/lib/api/modules/jobListings";
import { departmentsApi, type Department } from "@/lib/api/departments";
import type {
  ApplicationStatus,
  CreateListingPayload,
  JobApplication,
  JobListing,
  JobListingDetail,
} from "@/types/jobListing";

const DEPARTMENT_FILTER_ALL = "all";

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((target - now) / 86400000);
}

function fmtPostedAgo(iso: string): string {
  const d = daysUntil(iso);
  if (d > -1) return "today";
  if (d > -7) return `${-d}d ago`;
  if (d > -30) return `${Math.round(-d / 7)}w ago`;
  return `${Math.round(-d / 30)}mo ago`;
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function applicationStatusStyle(status: ApplicationStatus): {
  bg: string;
  dot: string;
} {
  switch (status) {
    case "submitted":
      return { bg: "bg-gray-100 text-gray-700", dot: "bg-gray-500" };
    case "under_review":
      return { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-600" };
    case "shortlisted":
      return { bg: "bg-violet-50 text-violet-700", dot: "bg-violet-600" };
    case "accepted":
      return { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" };
    case "rejected":
      return { bg: "bg-red-50 text-red-700", dot: "bg-red-600" };
    case "withdrawn":
      return { bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    default:
      return { bg: "bg-gray-100 text-gray-700", dot: "bg-gray-500" };
  }
}

type ListingStatusTone = "open" | "closing-soon" | "filled" | "closed";

function listingTone(listing: JobListing): ListingStatusTone {
  if (listing.status === "closed" || listing.status === "cancelled")
    return "closed";
  const days = daysUntil(listing.closeAt);
  if (days < 0) return "closed";
  if (days <= 7) return "closing-soon";
  return "open";
}

function listingStatusPill(tone: ListingStatusTone): {
  label: string;
  bg: string;
  dot: string;
} {
  switch (tone) {
    case "closing-soon":
      return {
        label: "Closing soon",
        bg: "bg-amber-50 text-amber-700",
        dot: "bg-amber-600",
      };
    case "filled":
      return {
        label: "Filled",
        bg: "bg-blue-50 text-blue-700",
        dot: "bg-blue-600",
      };
    case "closed":
      return {
        label: "Closed",
        bg: "bg-red-50 text-red-700",
        dot: "bg-red-600",
      };
    default:
      return {
        label: "Open",
        bg: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-600",
      };
  }
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

type TabKey = "jobs" | "applications" | "history";

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

  const [selectedListing, setSelectedListing] =
    useState<JobListingDetail | null>(null);
  const [drawerTab, setDrawerTab] = useState<
    "overview" | "process" | "applicants"
  >("overview");
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
      const rows = await jobListingsApi.listActiveListings({
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

  const appliedListingIds = useMemo(
    () => new Set(myApplications.map((a) => a.listingId)),
    [myApplications]
  );

  const openRoleDrawer = async (listing: JobListing) => {
    setDetailLoading(true);
    setSubmitError(null);
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
      setSubmitError(
        err instanceof Error ? err.message : "Failed to load listing details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

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

  const departmentBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) {
      const name = listing.departmentName || "Unspecified";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [listings]);

  const visibleListings = isHRUser
    ? listings
    : listings.filter((l) => !appliedListingIds.has(l.id));

  const closingSoonCount = visibleListings.filter((l) => {
    const d = daysUntil(l.closeAt);
    return d >= 0 && d <= 7;
  }).length;

  const inProgressCount = myApplications.filter(
    (a) =>
      a.status === "submitted" ||
      a.status === "under_review" ||
      a.status === "shortlisted"
  ).length;

  const tabCounts = {
    jobs: visibleListings.length,
    applications: myApplications.length,
    history: myApplications.filter(
      (a) =>
        a.status === "accepted" ||
        a.status === "rejected" ||
        a.status === "withdrawn"
    ).length,
  };

  const handleListingCreated = async () => {
    setIsPostDialogOpen(false);
    await loadListings();
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
            <Button variant="outline">
              <Layers className="w-3.5 h-3.5" />
              CPF ladder
            </Button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
          <StripCell
            label="Open roles"
            value={visibleListings.length}
            trend={`${closingSoonCount} closing in < 7d`}
          />
          <StripCell
            label={isHRUser ? "Active applications" : "Your applications"}
            value={myApplications.length}
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
        </nav>
      </header>

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
          />
        )}
        {activeTab === "applications" && (
          <ApplicationsTab
            apps={myApplications}
            loading={applicationsLoading}
            onBrowse={() => setActiveTab("jobs")}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            apps={myApplications.filter(
              (a) =>
                a.status === "accepted" ||
                a.status === "rejected" ||
                a.status === "withdrawn"
            )}
          />
        )}
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
          coverNote={coverNote}
          setCoverNote={setCoverNote}
          submitting={submitting}
          submitError={submitError}
          onSubmit={submitApplication}
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
  count: number;
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
      <span
        className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
          active
            ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {count}
      </span>
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
          title={spotlight ? "All open roles" : "Currently hiring"}
          sub={`${rest.length} open · sorted by closing date`}
        />
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            Loading roles…
          </div>
        ) : rest.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-10 px-6 text-center text-sm text-gray-500">
            <p className="mb-3">No positions match your filters.</p>
            {isHRUser && (
              <Button variant="primary" onClick={onPost}>
                <Plus className="w-3.5 h-3.5" />
                Post a role
              </Button>
            )}
          </div>
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
      <h3 className="text-[13px] font-semibold flex items-center gap-1.5">
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
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Bookmark className="w-3 h-3" /> Save for later
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

/* ============ Applications Tab ============ */
function ApplicationsTab({
  apps,
  loading,
  onBrowse,
}: {
  apps: JobApplication[];
  loading: boolean;
  onBrowse: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        Loading your applications…
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
        <h3 className="text-base font-medium mb-1">No applications yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Browse open positions and apply to start your internal mobility
          journey.
        </p>
        <Button variant="outline" onClick={onBrowse}>
          Browse roles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionHead title="In progress" sub="Your active loops" />
        <AppList apps={active} empty="Nothing in flight." />
      </section>
      {closed.length > 0 && (
        <section>
          <SectionHead title="Closed" />
          <AppList apps={closed} />
        </section>
      )}
    </div>
  );
}

function AppList({ apps, empty }: { apps: JobApplication[]; empty?: string }) {
  if (apps.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg py-8 px-6 text-center text-sm text-gray-500">
        {empty || "No items."}
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_120px_140px_40px] md:grid-cols-[1.5fr_1fr_120px_140px_40px] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
        <div>Role</div>
        <div className="hidden md:block">Cover note</div>
        <div>Applied</div>
        <div>Status</div>
        <div />
      </div>
      {apps.map((a) => {
        const style = applicationStatusStyle(a.status);
        return (
          <div
            key={a.id}
            className="grid grid-cols-[1fr_120px_140px_40px] md:grid-cols-[1.5fr_1fr_120px_140px_40px] gap-4 px-4 py-3 items-center border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-sm hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <div>
              <div className="font-medium">{a.listingTitle}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                App #{a.id}
              </div>
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
            <div className="text-gray-400">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ History Tab ============ */
function HistoryTab({ apps }: { apps: JobApplication[] }) {
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
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold">
                    {a.listingTitle}
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
  coverNote,
  setCoverNote,
  submitting,
  submitError,
  onSubmit,
  onClose,
}: {
  listing: JobListingDetail;
  isHRUser: boolean;
  drawerTab: "overview" | "process" | "applicants";
  setDrawerTab: (k: "overview" | "process" | "applicants") => void;
  drawerApplications: JobApplication[];
  drawerAppsLoading: boolean;
  coverNote: string;
  setCoverNote: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
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
            <button className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 grid place-items-center">
              <Bookmark className="w-3.5 h-3.5" />
            </button>
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
              ["process", "Process"],
              isHRUser
                ? ["applicants", `Applicants · ${listing.applicationCount}`]
                : null,
            ].filter(Boolean) as Array<
              ["overview" | "process" | "applicants", string]
            >
          ).map(([k, l]) => (
            <button
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
          {drawerTab === "process" && (
            <section>
              <h4 className="text-[11.5px] uppercase tracking-[0.06em] font-semibold text-gray-500 mb-2.5">
                Hiring loop
              </h4>
              <ol className="flex flex-col gap-2">
                {[
                  "Manager screen (30m)",
                  "Cross-functional interview (45m)",
                  "Final loop",
                  "Offer & close",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-md text-sm"
                  >
                    <span className="w-5 h-5 grid place-items-center rounded-full bg-gray-900 text-white text-[11px] font-semibold dark:bg-gray-100 dark:text-gray-900">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
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
                  {drawerApplications.map((a) => {
                    const style = applicationStatusStyle(a.status);
                    return (
                      <div
                        key={a.id}
                        className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                      >
                        <div>
                          <div className="text-[13px] font-medium">
                            {a.applicantName || `Applicant #${a.applicantId}`}
                          </div>
                          <div className="text-[11.5px] text-gray-500 mt-0.5">
                            Applied {fmtPostedAgo(a.appliedAt)}
                          </div>
                          {a.coverNote && (
                            <p className="text-xs mt-1.5 leading-relaxed">
                              {a.coverNote}
                            </p>
                          )}
                        </div>
                        <Pill
                          label={a.statusDisplay}
                          bg={style.bg}
                          dot={style.dot}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Foot */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
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
          {isHRUser && (
            <Button variant="primary">
              <Send className="w-3.5 h-3.5" /> Notify shortlist
            </Button>
          )}
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
              <Label htmlFor="post-open">Opens</Label>
              <Input
                id="post-open"
                type="date"
                value={openAt}
                onChange={(e) => setOpenAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-close">Closes</Label>
              <Input
                id="post-close"
                type="date"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
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
