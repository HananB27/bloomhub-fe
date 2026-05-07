import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { QuickActionButton } from "./QuickActionButton";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  MapPin,
  Plus,
  Filter,
  Download,
  Upload,
  Search,
  Building,
  User,
  Calendar,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit3,
  Send,
  FileText,
  Briefcase,
  Star,
  Target,
  Award,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/utils";
import { useSession } from "next-auth/react";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";

type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected";
type JobType = "full-time" | "part-time" | "contract" | "internship";
type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: JobType;
  salaryRange: string;
  experienceLevel: ExperienceLevel;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  postedDate: string;
  applicationDeadline: string;
  hiringManager: string;
  applicantCount: number;
  isActive: boolean;
}

interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  applicantName: string;
  applicantId: string;
  appliedDate: string;
  status: ApplicationStatus;
  coverLetter: string;
  resumeFileName?: string;
  notes?: string;
}

interface PromotionHistory {
  id: number;
  employeeId: string;
  employeeName: string;
  fromRole: string;
  toRole: string;
  fromDepartment: string;
  toDepartment: string;
  promotionDate: string;
  salaryIncrease?: string;
  notes: string;
  approvedBy: string;
}

export function MobilityModule() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const roleSource =
    (session?.user as { role?: string; career_level?: string } | undefined)
      ?.role ||
    (session?.user as { role?: string; career_level?: string } | undefined)
      ?.career_level;
  const isHRUser = isHrLikeRole(roleSource);

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    coverLetter: "",
    resumeFile: null as File | null,
    additionalNotes: "",
  });

  // TODO: Implement - fetch job postings from API
  const [jobs, _setJobs] = useState<Job[]>([]);

  // TODO: Implement - fetch applications from API
  const [applications, setApplications] = useState<Application[]>([]);

  // TODO: Implement - fetch promotion history from API
  const promotionHistory: PromotionHistory[] = [];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || job.department === departmentFilter;
    return matchesSearch && matchesDepartment && job.isActive;
  });

  const departments = [...new Set(jobs.map((job) => job.department))];

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "reviewing":
        return "bg-amber-100 text-amber-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "offer":
        return "bg-green-100 text-green-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "applied":
        return Clock;
      case "reviewing":
        return Eye;
      case "interview":
        return Users;
      case "offer":
        return Star;
      case "accepted":
        return CheckCircle;
      case "rejected":
        return XCircle;
      default:
        return Clock;
    }
  };

  const getExperienceLevelColor = (level: ExperienceLevel) => {
    switch (level) {
      case "entry":
        return "bg-green-100 text-green-800";
      case "mid":
        return "bg-blue-100 text-blue-800";
      case "senior":
        return "bg-purple-100 text-purple-800";
      case "lead":
        return "bg-amber-100 text-amber-800";
      case "executive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const handleJobApplication = (job: Job) => {
    setSelectedJob(job);
    setIsApplicationDialogOpen(true);
  };

  const submitApplication = () => {
    if (!selectedJob || !applicationForm.coverLetter.trim()) return;

    const newApplication: Application = {
      id: Date.now(),
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      applicantName: "John Doe", // Current user
      applicantId: "john-doe",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "applied",
      coverLetter: applicationForm.coverLetter,
      resumeFileName: applicationForm.resumeFile?.name,
      notes: applicationForm.additionalNotes,
    };

    setApplications((prev) => [...prev, newApplication]);

    // Reset form and close dialog
    setApplicationForm({
      coverLetter: "",
      resumeFile: null,
      additionalNotes: "",
    });
    setIsApplicationDialogOpen(false);
    setSelectedJob(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setApplicationForm((prev) => ({ ...prev, resumeFile: file }));
    }
  };

  const updateApplicationStatus = (
    applicationId: number,
    newStatus: ApplicationStatus
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );
  };

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
              Explore career opportunities and track professional growth
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open Positions
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {jobs.filter((j) => j.isActive).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Across all departments
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Applications
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {applications.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This quarter
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Promotions YTD
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {promotionHistory.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Internal growth
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              73%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Internal hiring
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
                        placeholder="Search positions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Cards */}
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <Card
                        key={job.id}
                        className="border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-start gap-3 mb-3">
                                <Building className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {job.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>{job.department}</span>
                                    <span>•</span>
                                    <span>{job.location}</span>
                                    <span>•</span>
                                    <span>{job.salaryRange}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                {job.description}
                              </p>

                              <div className="flex items-center gap-3 mb-4">
                                <Badge
                                  variant="outline"
                                  className={getExperienceLevelColor(
                                    job.experienceLevel
                                  )}
                                >
                                  {job.experienceLevel} level
                                </Badge>
                                <Badge variant="outline">{job.type}</Badge>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Users className="w-3 h-3" />
                                  <span>{job.applicantCount} applicants</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Key Requirements:
                                  </p>
                                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {job.requirements
                                      .slice(0, 3)
                                      .map((req, index) => (
                                        <li
                                          key={index}
                                          className="flex items-start gap-2"
                                        >
                                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                          <span>{req}</span>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                variant="outline"
                                onClick={() => handleJobApplication(job)}
                                className="border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-600"
                              >
                                Apply Now
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>

                          <Separator className="mb-3" />

                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                              <span>Posted {formatDate(job.postedDate)}</span>
                              <span>•</span>
                              <span>
                                Deadline: {formatDate(job.applicationDeadline)}
                              </span>
                            </div>
                            <span>Hiring Manager: {job.hiringManager}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredJobs.length === 0 && (
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
                  )}
                </TabsContent>

                <TabsContent value="applications" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Application Status
                    </h3>

                    {applications.length > 0 ? (
                      <div className="space-y-3">
                        {applications.map((application) => {
                          const StatusIcon = getStatusIcon(application.status);

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
                                        {application.jobTitle}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className={getStatusColor(
                                          application.status
                                        )}
                                      >
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {application.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                      {application.coverLetter.slice(0, 150)}...
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                      <span>
                                        Applied:{" "}
                                        {formatDate(application.appliedDate)}
                                      </span>
                                      {application.resumeFileName && (
                                        <>
                                          <span>•</span>
                                          <span>
                                            Resume: {application.resumeFileName}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {isHRUser &&
                                      application.status === "applied" && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            updateApplicationStatus(
                                              application.id,
                                              "reviewing"
                                            )
                                          }
                                        >
                                          Review
                                        </Button>
                                      )}
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

                  {/* Application Statistics */}
                  {applications.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Application Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["applied", "reviewing", "interview", "offer"].map(
                          (status) => (
                            <div
                              key={status}
                              className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {
                                  applications.filter(
                                    (app) => app.status === status
                                  ).length
                                }
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {status}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Promotion Timeline
                    </h3>

                    <div className="space-y-4">
                      {promotionHistory.map((promotion, index) => (
                        <div key={promotion.id} className="relative">
                          {/* Timeline line */}
                          {index < promotionHistory.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                          )}

                          <Card className="border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Award className="w-5 h-5 text-blue-600" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        {promotion.employeeName}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                          {promotion.fromRole}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {promotion.toRole}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {formatDate(promotion.promotionDate)}
                                      </p>
                                      {promotion.salaryIncrease && (
                                        <p className="text-sm text-green-600">
                                          +{promotion.salaryIncrease} salary
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {promotion.notes}
                                  </p>

                                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Building className="w-3 h-3" />
                                      <span>
                                        {promotion.fromDepartment} →{" "}
                                        {promotion.toDepartment}
                                      </span>
                                    </div>
                                    <span>•</span>
                                    <span>
                                      Approved by {promotion.approvedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>

                    {promotionHistory.length === 0 && (
                      <div className="text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No promotion history
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Promotion records will appear here as employees
                          advance in their careers.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                label="Browse Jobs"
                icon={Search}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Update Resume"
                icon={FileText}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Career Interests"
                icon={User}
                onClick={() => {}}
              />
              {isHRUser && (
                <>
                  <QuickActionButton
                    label="Post New Job"
                    icon={Plus}
                    onClick={() => {}}
                  />
                  <QuickActionButton
                    label="Review Applications"
                    icon={Eye}
                    onClick={() => {}}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Open Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {departments.map((dept) => {
                const deptJobs = jobs.filter(
                  (job) => job.department === dept && job.isActive
                );
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {dept}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {deptJobs.length}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Career Growth Tips */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      New position posted
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Application submitted
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      1 day ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Promotion announced
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      3 days ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this internal position. Your
              information will be reviewed by the hiring manager.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Job Summary */}
            {selectedJob && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedJob.title}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{selectedJob.department}</span>
                  <span>•</span>
                  <span>{selectedJob.location}</span>
                  <span>•</span>
                  <span>{selectedJob.salaryRange}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedJob.description}
                </p>
              </div>
            )}

            {/* Application Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cover-letter">Cover Letter *</Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Explain why you're interested in this position and how your experience makes you a great fit..."
                  value={applicationForm.coverLetter}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      coverLetter: e.target.value,
                    }))
                  }
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume-upload">Resume Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {applicationForm.resumeFile
                        ? applicationForm.resumeFile.name
                        : "Click to upload your resume"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOC, or DOCX (max 10MB)
                    </p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional-notes">Additional Notes</Label>
                <Textarea
                  id="additional-notes"
                  placeholder="Any additional information you'd like to share..."
                  value={applicationForm.additionalNotes}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      additionalNotes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={submitApplication}
                disabled={!applicationForm.coverLetter.trim()}
                className="border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsApplicationDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
