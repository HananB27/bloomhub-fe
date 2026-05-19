import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
import { Badge } from "./ui/badge";
import { QuickActionButton } from "./QuickActionButton";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Plus,
  Filter,
  Download,
  Search,
  Building,
  User,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Send,
  FileText,
  Briefcase,
  Star,
  Award,
  Clock,
} from "lucide-react";
import { formatDate } from "@/utils";
import { useSession } from "next-auth/react";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";
import { jobListingsApi } from "@/lib/api/modules/jobListings";
import { departmentsApi, type Department } from "@/lib/api/departments";
import type {
  ApplicationStatus,
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

function applicationStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "under_review":
      return "bg-amber-100 text-amber-800";
    case "shortlisted":
      return "bg-purple-100 text-purple-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "withdrawn":
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    default:
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
  }
}

function applicationStatusIcon(status: ApplicationStatus) {
  switch (status) {
    case "submitted":
      return Clock;
    case "under_review":
      return Eye;
    case "shortlisted":
      return Star;
    case "accepted":
      return CheckCircle;
    case "rejected":
      return XCircle;
    case "withdrawn":
      return AlertCircle;
    default:
      return Clock;
  }
}

export function MobilityModule() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("jobs");
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roleSource =
    (session?.user as { role?: string; career_level?: string } | undefined)
      ?.role ||
    (session?.user as { role?: string; career_level?: string } | undefined)
      ?.career_level;
  const isHRUser = isHrLikeRole(roleSource);

  // Debounce the search input → query.
  useEffect(() => {
    const handle = window.setTimeout(() => setSearchTerm(searchInput), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  // Load departments once (for the filter dropdown).
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

  // Load active listings with the current filter/search.
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

  // Load the current user's applications.
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

  const openApplyDialog = async (listing: JobListing) => {
    setDetailLoading(true);
    setSubmitError(null);
    setCoverNote("");
    try {
      const detail = await jobListingsApi.getListing(listing.id);
      setSelectedListing(detail);
      setIsApplicationDialogOpen(true);
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

  const closingSoonCount = listings.filter(
    (l) => daysUntil(l.closeAt) >= 0 && daysUntil(l.closeAt) <= 7
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Internal Mobility
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Browse internal openings and apply for your next role
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-w-[5.5rem]"
              title="Filter options"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[5.5rem]"
              title="Export data"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {isHRUser && (
              <Button
                variant="primary"
                size="sm"
                className="min-w-[5.5rem]"
                title="Post a new job"
              >
                <Plus className="mr-2 h-4 w-4" />
                Post Job
              </Button>
            )}
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open positions
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {listings.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {closingSoonCount} closing in &lt; 7d
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your applications
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {myApplications.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Across all roles
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Departments hiring
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {departmentBreakdown.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              With active roles
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                In progress
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {
                myApplications.filter(
                  (a) =>
                    a.status === "submitted" ||
                    a.status === "under_review" ||
                    a.status === "shortlisted"
                ).length
              }
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active loops
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 dark:border-gray-700">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="jobs">Job Board</TabsTrigger>
                  <TabsTrigger value="applications">
                    My Applications
                  </TabsTrigger>
                  <TabsTrigger value="history">Promotion History</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="jobs" className="space-y-6 mt-0">
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        placeholder="Search title or keywords..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger className="w-full md:w-56">
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEPARTMENT_FILTER_ALL}>
                          All departments
                        </SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Cards */}
                  {listingsError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                      {listingsError}
                    </div>
                  )}

                  {listingsLoading ? (
                    <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                      Loading roles...
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No positions found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search criteria or check back later
                        for new opportunities.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {listings.map((listing) => {
                        const days = daysUntil(listing.closeAt);
                        const closingSoon = days >= 0 && days <= 7;
                        const alreadyApplied = appliedListingIds.has(
                          listing.id
                        );
                        return (
                          <Card
                            key={listing.id}
                            className="border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3 mb-3">
                                    <Building className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
                                    <div>
                                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {listing.title}
                                      </h3>
                                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <span>
                                          {listing.departmentName || "—"}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Posted {formatDate(listing.openAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 mb-4">
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    >
                                      {listing.statusDisplay || "Open"}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                      <Users className="w-3 h-3" />
                                      <span>
                                        {listing.applicationCount} applicant
                                        {listing.applicationCount === 1
                                          ? ""
                                          : "s"}
                                      </span>
                                    </div>
                                    {alreadyApplied && (
                                      <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Applied
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                  <Button
                                    variant={
                                      alreadyApplied ? "outline" : "primary"
                                    }
                                    onClick={() => openApplyDialog(listing)}
                                    disabled={detailLoading}
                                  >
                                    {alreadyApplied
                                      ? "View Details"
                                      : "Apply Now"}
                                  </Button>
                                </div>
                              </div>

                              <Separator className="mb-3" />

                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>
                                  Closes {formatDate(listing.closeAt)}
                                </span>
                                <span
                                  className={
                                    closingSoon
                                      ? "font-medium text-amber-700 dark:text-amber-400"
                                      : ""
                                  }
                                >
                                  {days >= 0
                                    ? `${days}d left`
                                    : "Closing today"}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="applications" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Application Status
                    </h3>

                    {applicationsLoading ? (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        Loading your applications...
                      </div>
                    ) : myApplications.length > 0 ? (
                      <div className="space-y-3">
                        {myApplications.map((application) => {
                          const StatusIcon = applicationStatusIcon(
                            application.status
                          );
                          return (
                            <Card
                              key={application.id}
                              className="border-gray-200 dark:border-gray-700"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        {application.listingTitle}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className={applicationStatusColor(
                                          application.status
                                        )}
                                      >
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {application.statusDisplay}
                                      </Badge>
                                    </div>
                                    {application.coverNote && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {application.coverNote.slice(0, 200)}
                                        {application.coverNote.length > 200
                                          ? "…"
                                          : ""}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                      <span>
                                        Applied{" "}
                                        {formatDate(application.appliedAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No applications yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Browse open positions and apply to start your internal
                          mobility journey.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4 border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-600"
                          onClick={() => setActiveTab("jobs")}
                        >
                          Browse Jobs
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6 mt-0">
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No promotion history
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Promotion records will appear here as employees advance in
                      their careers.
                    </p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                label="Browse Jobs"
                icon={Search}
                onClick={() => setActiveTab("jobs")}
              />
              <QuickActionButton
                label="My Applications"
                icon={FileText}
                onClick={() => setActiveTab("applications")}
              />
              <QuickActionButton
                label="Career Interests"
                icon={User}
                onClick={() => {}}
              />
              {isHRUser && (
                <QuickActionButton
                  label="Post New Job"
                  icon={Plus}
                  onClick={() => {}}
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Open Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {departmentBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No open positions.
                </p>
              ) : (
                departmentBreakdown.map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {dept}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Career Growth Tip
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Update your skills profile regularly and set career goals to
                    receive personalized job recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application / Details Dialog */}
      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={(open) => {
          setIsApplicationDialogOpen(open);
          if (!open) {
            setSelectedListing(null);
            setSubmitError(null);
            setCoverNote("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedListing?.hasApplied
                ? selectedListing.title
                : `Apply for ${selectedListing?.title ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              {selectedListing?.hasApplied
                ? "You've already applied for this role. Details below."
                : "Submit your application for this internal position. Your information will be reviewed by the hiring manager."}
            </DialogDescription>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedListing.title}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{selectedListing.departmentName || "—"}</span>
                  <span>•</span>
                  <span>Closes {formatDate(selectedListing.closeAt)}</span>
                  <span>•</span>
                  <span>
                    {selectedListing.applicationCount} applicant
                    {selectedListing.applicationCount === 1 ? "" : "s"}
                  </span>
                </div>
                {selectedListing.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedListing.description}
                  </p>
                )}
              </div>

              {!selectedListing.hasApplied && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cover-letter">Cover note (optional)</Label>
                    <Textarea
                      id="cover-letter"
                      placeholder="Why are you interested in this role?"
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      rows={5}
                    />
                  </div>

                  {submitError && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {submitError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={submitApplication}
                      disabled={submitting}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? "Submitting…" : "Submit Application"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsApplicationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
