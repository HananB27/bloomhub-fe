import { useState, useMemo } from "react";
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
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Clock,
  Plus,
  Save,
  Download,
  Filter,
  Calendar,
  Play,
  Pause,
  Square,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building,
  Target,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Timer,
  Activity,
  Users,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "rejected" | "draft";

interface TimeEntry {
  id: number;
  date: string;
  projectId: string;
  projectName: string;
  taskDescription: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: ApprovalStatus;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  color: string;
  isActive: boolean;
}

interface WeeklySummary {
  week: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: ApprovalStatus;
  projects: { [projectId: string]: number };
}

export function TimeTrackingModule() {
  const [activeTab, setActiveTab] = useState("timesheet");
  const [selectedWeek, setSelectedWeek] = useState(getWeekDates(new Date()));
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimer, setCurrentTimer] = useState({
    startTime: null as Date | null,
    projectId: "",
    taskDescription: "",
  });
  const [isManagerView] = useState(true); // Mock manager permission

  // New time entry form state
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    projectId: "",
    taskDescription: "",
    startTime: "",
    endTime: "",
    totalHours: 0,
  });

  // Mock projects data
  const projects: Project[] = [
    {
      id: "proj-1",
      name: "Bloomteq Website Redesign",
      client: "Internal",
      color: "#2563eb",
      isActive: true,
    },
    {
      id: "proj-2",
      name: "Client Dashboard",
      client: "TechCorp",
      color: "#10b981",
      isActive: true,
    },
    {
      id: "proj-3",
      name: "Mobile App Development",
      client: "StartupXYZ",
      color: "#f59e0b",
      isActive: true,
    },
    {
      id: "proj-4",
      name: "Data Analytics Platform",
      client: "DataCo",
      color: "#ef4444",
      isActive: true,
    },
    {
      id: "proj-5",
      name: "E-commerce Integration",
      client: "RetailPlus",
      color: "#8b5cf6",
      isActive: true,
    },
  ];

  // Mock time entries data
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: 1,
      date: "2025-08-05",
      projectId: "proj-1",
      projectName: "Bloomteq Website Redesign",
      taskDescription: "Frontend component development for user dashboard",
      startTime: "09:00",
      endTime: "12:00",
      totalHours: 3,
      status: "approved",
      submittedAt: "2025-08-05T17:00:00Z",
      approvedBy: "Sarah Johnson",
      approvedAt: "2025-08-06T09:00:00Z",
    },
    {
      id: 2,
      date: "2025-08-05",
      projectId: "proj-2",
      projectName: "Client Dashboard",
      taskDescription: "API integration for real-time data visualization",
      startTime: "13:00",
      endTime: "17:00",
      totalHours: 4,
      status: "approved",
      submittedAt: "2025-08-05T17:00:00Z",
      approvedBy: "Sarah Johnson",
      approvedAt: "2025-08-06T09:00:00Z",
    },
    {
      id: 3,
      date: "2025-08-06",
      projectId: "proj-1",
      projectName: "Bloomteq Website Redesign",
      taskDescription: "Code review and bug fixes for authentication module",
      startTime: "09:00",
      endTime: "11:30",
      totalHours: 2.5,
      status: "approved",
      submittedAt: "2025-08-06T17:00:00Z",
      approvedBy: "Sarah Johnson",
      approvedAt: "2025-08-07T09:00:00Z",
    },
    {
      id: 4,
      date: "2025-08-06",
      projectId: "proj-3",
      projectName: "Mobile App Development",
      taskDescription: "UI/UX implementation for user profile screens",
      startTime: "13:00",
      endTime: "18:00",
      totalHours: 5,
      status: "pending",
      submittedAt: "2025-08-06T18:00:00Z",
    },
    {
      id: 5,
      date: "2025-08-07",
      projectId: "proj-2",
      projectName: "Client Dashboard",
      taskDescription: "Database optimization and performance improvements",
      startTime: "09:00",
      endTime: "16:00",
      totalHours: 7,
      status: "pending",
      submittedAt: "2025-08-07T16:00:00Z",
    },
    {
      id: 6,
      date: "2025-08-08",
      projectId: "proj-4",
      projectName: "Data Analytics Platform",
      taskDescription: "Machine learning model integration and testing",
      startTime: "10:00",
      endTime: "15:00",
      totalHours: 5,
      status: "draft",
    },
  ]);

  // Helper functions
  function getWeekDates(date: Date) {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toISOString().split("T")[0]);
    }
    return week;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatWeekRange(weekDates: string[]) {
    const startDate = new Date(weekDates[0]);
    const endDate = new Date(weekDates[6]);
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  function calculateTotalHours(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;

    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    if (end <= start) return 0;

    const diff = end.getTime() - start.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }

  // Calculate weekly summary
  const weeklySummary = useMemo(() => {
    const weekEntries = timeEntries.filter((entry) =>
      selectedWeek.includes(entry.date)
    );
    const totalHours = weekEntries.reduce(
      (sum, entry) => sum + entry.totalHours,
      0
    );
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(totalHours - 40, 0);

    const projectHours: { [projectId: string]: number } = {};
    weekEntries.forEach((entry) => {
      projectHours[entry.projectId] =
        (projectHours[entry.projectId] || 0) + entry.totalHours;
    });

    const allApproved =
      weekEntries.length > 0 &&
      weekEntries.every((entry) => entry.status === "approved");
    const hasPending = weekEntries.some((entry) => entry.status === "pending");
    const hasDraft = weekEntries.some((entry) => entry.status === "draft");

    let status: ApprovalStatus = "draft";
    if (allApproved) status = "approved";
    else if (hasPending) status = "pending";

    return {
      week: formatWeekRange(selectedWeek),
      totalHours,
      regularHours,
      overtimeHours,
      status,
      projects: projectHours,
    };
  }, [timeEntries, selectedWeek]);

  // Time tracking chart data
  const chartData = selectedWeek.map((date) => ({
    date: formatDate(date),
    hours: timeEntries
      .filter((entry) => entry.date === date)
      .reduce((sum, entry) => sum + entry.totalHours, 0),
  }));

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "pending":
        return AlertCircle;
      case "rejected":
        return XCircle;
      default:
        return Clock;
    }
  };

  const addTimeEntry = () => {
    if (
      !newEntry.projectId ||
      !newEntry.taskDescription ||
      !newEntry.startTime ||
      !newEntry.endTime
    ) {
      return;
    }

    const totalHours = calculateTotalHours(
      newEntry.startTime,
      newEntry.endTime
    );
    const project = projects.find((p) => p.id === newEntry.projectId);

    const entry: TimeEntry = {
      id: Date.now(),
      date: newEntry.date,
      projectId: newEntry.projectId,
      projectName: project?.name || "",
      taskDescription: newEntry.taskDescription,
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      totalHours,
      status: "draft",
      submittedAt: new Date().toISOString(),
    };

    setTimeEntries((prev) => [...prev, entry]);

    // Reset form
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      projectId: "",
      taskDescription: "",
      startTime: "",
      endTime: "",
      totalHours: 0,
    });
  };

  const updateTimeEntry = (id: number, updates: Partial<TimeEntry>) => {
    setTimeEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const deleteTimeEntry = (id: number) => {
    setTimeEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const submitWeekForApproval = () => {
    const weekEntries = timeEntries.filter(
      (entry) => selectedWeek.includes(entry.date) && entry.status === "draft"
    );

    weekEntries.forEach((entry) => {
      updateTimeEntry(entry.id, {
        status: "pending",
        submittedAt: new Date().toISOString(),
      });
    });
  };

  const approveTimeEntry = (id: number) => {
    updateTimeEntry(id, {
      status: "approved",
      approvedBy: "Sarah Johnson",
      approvedAt: new Date().toISOString(),
    });
  };

  const rejectTimeEntry = (id: number, reason?: string) => {
    updateTimeEntry(id, {
      status: "rejected",
      notes: reason,
    });
  };

  const exportWeeklyReport = (format: "csv" | "pdf") => {
    const weekEntries = timeEntries.filter((entry) =>
      selectedWeek.includes(entry.date)
    );

    if (format === "csv") {
      // Generate CSV content
      const headers = [
        "Date",
        "Project",
        "Task Description",
        "Start Time",
        "End Time",
        "Total Hours",
        "Status",
      ];
      const csvContent = [
        headers.join(","),
        ...weekEntries.map((entry) =>
          [
            entry.date,
            `"${entry.projectName}"`,
            `"${entry.taskDescription}"`,
            entry.startTime,
            entry.endTime,
            entry.totalHours,
            entry.status,
          ].join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheet-${formatWeekRange(selectedWeek).replace(" - ", "-to-")}.csv`;
      a.click();
    } else {
      // Mock PDF export
      console.log("PDF export would generate a detailed timesheet report");
      alert(
        "PDF export functionality would be implemented with a PDF generation library"
      );
    }
  };

  const startTimer = () => {
    if (!currentTimer.projectId || !currentTimer.taskDescription) return;

    setCurrentTimer((prev) => ({ ...prev, startTime: new Date() }));
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (!currentTimer.startTime) return;

    const endTime = new Date();
    const duration =
      (endTime.getTime() - currentTimer.startTime.getTime()) / (1000 * 60 * 60);

    const project = projects.find((p) => p.id === currentTimer.projectId);
    const entry: TimeEntry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      projectId: currentTimer.projectId,
      projectName: project?.name || "",
      taskDescription: currentTimer.taskDescription,
      startTime: currentTimer.startTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      totalHours: Math.round(duration * 100) / 100,
      status: "draft",
    };

    setTimeEntries((prev) => [...prev, entry]);
    setIsTimerRunning(false);
    setCurrentTimer({ startTime: null, projectId: "", taskDescription: "" });
  };

  // Update total hours when start/end times change
  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    const updated = { ...newEntry, [field]: value };
    if (updated.startTime && updated.endTime) {
      updated.totalHours = calculateTotalHours(
        updated.startTime,
        updated.endTime
      );
    }
    setNewEntry(updated);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-blue-600">Hours: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
            <p className="text-slate-600 mt-1">
              Log hours, track projects, and manage timesheet approvals
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportWeeklyReport("csv")}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">This Week</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {weeklySummary.totalHours}h
            </p>
            <p className="text-xs text-slate-500">
              {weeklySummary.regularHours}h regular +{" "}
              {weeklySummary.overtimeHours}h overtime
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Weekly Goal</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {Math.round((weeklySummary.totalHours / 40) * 100)}%
            </p>
            <p className="text-xs text-slate-500">
              {weeklySummary.totalHours}/40 hours
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Active Projects</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {Object.keys(weeklySummary.projects).length}
            </p>
            <p className="text-xs text-slate-500">This week</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Approval Status</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getStatusColor(weeklySummary.status)}
              >
                {weeklySummary.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Weekly timesheet</p>
          </div>
        </div>

        {/* Week Selector */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prevWeek = new Date(selectedWeek[0]);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setSelectedWeek(getWeekDates(prevWeek));
              }}
            >
              Previous
            </Button>
            <div className="text-center">
              <p className="font-medium text-slate-900">
                {formatWeekRange(selectedWeek)}
              </p>
              <p className="text-sm text-slate-500">
                Week of {formatDate(selectedWeek[0])}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextWeek = new Date(selectedWeek[0]);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setSelectedWeek(getWeekDates(nextWeek));
              }}
            >
              Next
            </Button>
          </div>
          <Button
            onClick={() => setSelectedWeek(getWeekDates(new Date()))}
            variant="outline"
            size="sm"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timesheet">Daily Log</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                  {isManagerView && (
                    <TabsTrigger value="approvals">Approvals</TabsTrigger>
                  )}
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="timesheet" className="space-y-6 mt-0">
                  {/* Timer Widget */}
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${isTimerRunning ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
                          ></div>
                          <h4 className="font-medium text-slate-900">
                            {isTimerRunning ? "Timer Running" : "Quick Timer"}
                          </h4>
                        </div>
                        <div className="flex gap-2">
                          {!isTimerRunning ? (
                            <Button
                              size="sm"
                              onClick={startTimer}
                              disabled={
                                !currentTimer.projectId ||
                                !currentTimer.taskDescription
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={stopTimer}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Square className="w-4 h-4 mr-2" />
                              Stop
                            </Button>
                          )}
                        </div>
                      </div>

                      {!isTimerRunning && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <Select
                            value={currentTimer.projectId}
                            onValueChange={(value) =>
                              setCurrentTimer((prev) => ({
                                ...prev,
                                projectId: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects
                                .filter((p) => p.isActive)
                                .map((project) => (
                                  <SelectItem
                                    key={project.id}
                                    value={project.id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor: project.color,
                                        }}
                                      ></div>
                                      {project.name}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Task description"
                            value={currentTimer.taskDescription}
                            onChange={(e) =>
                              setCurrentTimer((prev) => ({
                                ...prev,
                                taskDescription: e.target.value,
                              }))
                            }
                            className="bg-white"
                          />
                        </div>
                      )}

                      {isTimerRunning && currentTimer.startTime && (
                        <div className="mt-4 text-center">
                          <p className="text-sm text-slate-600 mb-2">
                            Working on: {currentTimer.taskDescription}
                          </p>
                          <p className="text-lg font-mono">
                            Started at{" "}
                            {currentTimer.startTime.toTimeString().slice(0, 5)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add Time Entry Form */}
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Log Time Entry</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="entry-date">Date</Label>
                          <Input
                            id="entry-date"
                            type="date"
                            value={newEntry.date}
                            onChange={(e) =>
                              setNewEntry((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="entry-project">Project</Label>
                          <Select
                            value={newEntry.projectId}
                            onValueChange={(value) =>
                              setNewEntry((prev) => ({
                                ...prev,
                                projectId: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects
                                .filter((p) => p.isActive)
                                .map((project) => (
                                  <SelectItem
                                    key={project.id}
                                    value={project.id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor: project.color,
                                        }}
                                      ></div>
                                      <div>
                                        <p className="font-medium">
                                          {project.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {project.client}
                                        </p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Total Hours</Label>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-slate-900">
                              {newEntry.totalHours}h
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="task-description">
                          Task Description
                        </Label>
                        <Textarea
                          id="task-description"
                          placeholder="Describe what you worked on..."
                          value={newEntry.taskDescription}
                          onChange={(e) =>
                            setNewEntry((prev) => ({
                              ...prev,
                              taskDescription: e.target.value,
                            }))
                          }
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-time">Start Time</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={newEntry.startTime}
                            onChange={(e) =>
                              handleTimeChange("startTime", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-time">End Time</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={newEntry.endTime}
                            onChange={(e) =>
                              handleTimeChange("endTime", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={addTimeEntry}
                          disabled={
                            !newEntry.projectId ||
                            !newEntry.taskDescription ||
                            !newEntry.startTime ||
                            !newEntry.endTime
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Add Entry
                        </Button>
                        <Button variant="outline">Save Draft</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daily Time Entries */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      This Week's Entries
                    </h3>
                    <div className="space-y-3">
                      {selectedWeek.map((date) => {
                        const dayEntries = timeEntries.filter(
                          (entry) => entry.date === date
                        );
                        const dayTotal = dayEntries.reduce(
                          (sum, entry) => sum + entry.totalHours,
                          0
                        );

                        return (
                          <Card key={date} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <h4 className="font-medium text-slate-900">
                                      {formatDate(date)}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                      {date}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-slate-900">
                                    {dayTotal}h
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {dayEntries.length} entries
                                  </p>
                                </div>
                              </div>

                              {dayEntries.length > 0 ? (
                                <div className="space-y-2">
                                  {dayEntries.map((entry) => {
                                    const StatusIcon = getStatusIcon(
                                      entry.status
                                    );
                                    const project = projects.find(
                                      (p) => p.id === entry.projectId
                                    );

                                    return (
                                      <div
                                        key={entry.id}
                                        className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                                      >
                                        <div className="flex items-start gap-3 flex-1">
                                          <div
                                            className="w-3 h-3 rounded-full mt-1.5"
                                            style={{
                                              backgroundColor: project?.color,
                                            }}
                                          ></div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-medium text-slate-900">
                                                {entry.projectName}
                                              </p>
                                              <Badge
                                                variant="outline"
                                                className={getStatusColor(
                                                  entry.status
                                                )}
                                              >
                                                {entry.status}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">
                                              {entry.taskDescription}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                              <span>
                                                {entry.startTime} -{" "}
                                                {entry.endTime}
                                              </span>
                                              <span>{entry.totalHours}h</span>
                                              {entry.status === "approved" &&
                                                entry.approvedBy && (
                                                  <span>
                                                    Approved by{" "}
                                                    {entry.approvedBy}
                                                  </span>
                                                )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <StatusIcon
                                            className={`w-4 h-4 ${
                                              entry.status === "approved"
                                                ? "text-green-600"
                                                : entry.status === "pending"
                                                  ? "text-amber-600"
                                                  : entry.status === "rejected"
                                                    ? "text-red-600"
                                                    : "text-slate-400"
                                            }`}
                                          />
                                          {entry.status === "draft" && (
                                            <div className="flex gap-1">
                                              <Button variant="ghost" size="sm">
                                                <Edit3 className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  deleteTimeEntry(entry.id)
                                                }
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-500">
                                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">
                                    No time entries for this day
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="weekly" className="space-y-6 mt-0">
                  {/* Weekly Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Weekly Summary
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(weeklySummary.status)}
                        >
                          {weeklySummary.status}
                        </Badge>
                        {weeklySummary.status === "draft" &&
                          timeEntries.some(
                            (e) =>
                              selectedWeek.includes(e.date) &&
                              e.status === "draft"
                          ) && (
                            <Button
                              onClick={submitWeekForApproval}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Submit for Approval
                            </Button>
                          )}
                      </div>
                    </div>

                    <Card className="border-slate-200">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              {weeklySummary.totalHours}h
                            </div>
                            <p className="text-sm text-slate-600">
                              Total Hours
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                              {weeklySummary.regularHours}h
                            </div>
                            <p className="text-sm text-slate-600">
                              Regular Hours
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-amber-600 mb-1">
                              {weeklySummary.overtimeHours}h
                            </div>
                            <p className="text-sm text-slate-600">
                              Overtime Hours
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700 mb-3">
                            Hours by Project
                          </p>
                          {Object.entries(weeklySummary.projects).map(
                            ([projectId, hours]) => {
                              const project = projects.find(
                                (p) => p.id === projectId
                              );
                              const percentage =
                                (hours / weeklySummary.totalHours) * 100;

                              return (
                                <div
                                  key={projectId}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: project?.color,
                                      }}
                                    ></div>
                                    <span className="text-sm text-slate-700">
                                      {project?.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">
                                      {hours}h
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      ({Math.round(percentage)}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Chart */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">
                      Daily Hours Breakdown
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="hours"
                            fill="#2563eb"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Export Options */}
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Export Weekly Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Download your timesheet for the week of{" "}
                        {formatWeekRange(selectedWeek)}
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => exportWeeklyReport("csv")}
                          className="flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Export CSV
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => exportWeeklyReport("pdf")}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Export PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {isManagerView && (
                  <TabsContent value="approvals" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900">
                          Pending Approvals
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-800 border-red-200"
                        >
                          Manager Only
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {timeEntries
                          .filter((entry) => entry.status === "pending")
                          .map((entry) => {
                            const project = projects.find(
                              (p) => p.id === entry.projectId
                            );

                            return (
                              <Card
                                key={entry.id}
                                className="border-amber-200 bg-amber-50"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor: project?.color,
                                          }}
                                        ></div>
                                        <div>
                                          <h4 className="font-medium text-slate-900">
                                            {entry.projectName}
                                          </h4>
                                          <p className="text-sm text-slate-500">
                                            {formatDate(entry.date)} •{" "}
                                            {entry.totalHours}h
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-sm text-slate-600 mb-2">
                                        {entry.taskDescription}
                                      </p>
                                      <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span>
                                          {entry.startTime} - {entry.endTime}
                                        </span>
                                        <span>
                                          Submitted:{" "}
                                          {entry.submittedAt
                                            ? new Date(
                                                entry.submittedAt
                                              ).toLocaleDateString()
                                            : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          approveTimeEntry(entry.id)
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          rejectTimeEntry(entry.id)
                                        }
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>

                      {timeEntries.filter((entry) => entry.status === "pending")
                        .length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-900 mb-2">
                            All Caught Up!
                          </h3>
                          <p className="text-slate-600">
                            No pending time entries to review.
                          </p>
                        </div>
                      )}

                      {/* Recently Approved */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">
                          Recently Approved
                        </h4>
                        <div className="space-y-2">
                          {timeEntries
                            .filter((entry) => entry.status === "approved")
                            .slice(0, 5)
                            .map((entry) => {
                              const project = projects.find(
                                (p) => p.id === entry.projectId
                              );

                              return (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: project?.color,
                                      }}
                                    ></div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-900">
                                        {entry.projectName}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {formatDate(entry.date)} •{" "}
                                        {entry.totalHours}h
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-slate-500">
                                      {entry.approvedAt
                                        ? new Date(
                                            entry.approvedAt
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weekly Progress */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">
                    Weekly Goal (40h):
                  </span>
                  <span className="font-medium">
                    {Math.round((weeklySummary.totalHours / 40) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(weeklySummary.totalHours / 40) * 100}
                  className="h-3"
                />
                <p className="text-xs text-slate-500">
                  {weeklySummary.totalHours}/40 hours logged
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Regular Hours:</span>
                  <span className="font-medium">
                    {weeklySummary.regularHours}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">
                    Overtime Hours:
                  </span>
                  <span className="font-medium text-amber-600">
                    {weeklySummary.overtimeHours}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects
                .filter((p) => p.isActive)
                .slice(0, 5)
                .map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {project.client}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {weeklySummary.projects[project.id] || 0}h
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                <Timer className="w-4 h-4" />
                Start Timer
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => exportWeeklyReport("csv")}
              >
                <Download className="w-4 h-4" />
                Export Week
              </Button>
              {isManagerView && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Review Approvals
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card
            className={`border-slate-200 ${
              weeklySummary.status === "approved"
                ? "bg-green-50 border-green-200"
                : weeklySummary.status === "pending"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-slate-50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 mt-0.5 ${
                    weeklySummary.status === "approved"
                      ? "text-green-600"
                      : weeklySummary.status === "pending"
                        ? "text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {weeklySummary.status === "approved" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : weeklySummary.status === "pending" ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      weeklySummary.status === "approved"
                        ? "text-green-900"
                        : weeklySummary.status === "pending"
                          ? "text-amber-900"
                          : "text-slate-900"
                    }`}
                  >
                    {weeklySummary.status === "approved"
                      ? "Timesheet Approved"
                      : weeklySummary.status === "pending"
                        ? "Pending Approval"
                        : "Draft Status"}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      weeklySummary.status === "approved"
                        ? "text-green-700"
                        : weeklySummary.status === "pending"
                          ? "text-amber-700"
                          : "text-slate-600"
                    }`}
                  >
                    {weeklySummary.status === "approved"
                      ? "Your timesheet has been approved by your manager."
                      : weeklySummary.status === "pending"
                        ? "Your timesheet is awaiting manager approval."
                        : "Complete your entries and submit for approval."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
