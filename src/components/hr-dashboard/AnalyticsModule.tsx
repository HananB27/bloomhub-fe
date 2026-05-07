import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { QuickActionButton } from "./QuickActionButton";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
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
  PieChart,
  Pie,
  Cell,
  type TooltipProps,
} from "recharts";
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Check,
  X,
  CircleDot,
  HelpCircle,
  Clock,
  MapPin,
  Building,
  User,
  FileSpreadsheet,
  FileText,
  Eye,
  Settings,
  ChevronDown,
  Activity,
  Zap,
  Target,
  Award,
  Briefcase,
  Home,
  Plane,
  Heart,
  Wrench,
  GraduationCap,
  Baby,
} from "lucide-react";
import { formatDate } from "@/utils";
import type { LucideIcon } from "lucide-react";

type LeaveType =
  | "vacation"
  | "sick"
  | "personal"
  | "maternity"
  | "paternity"
  | "bereavement"
  | "training"
  | "other";

interface LeaveRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

interface EmployeeAvailability {
  employeeId: string;
  employeeName: string;
  department: string;
  avatar: string;
  availability: { [date: string]: "available" | "leave" | "partial" };
}

interface DepartmentStats {
  department: string;
  totalEmployees: number;
  onLeave: number;
  availabilityRate: number;
  averageLeaveDays: number;
}

type LeaveTrendPoint = {
  month: string;
  total: number;
  vacation: number;
  sick: number;
  personal: number;
  maternity: number;
  other: number;
};

type RechartsTooltipProps = TooltipProps<number, string>;

function AnalyticsTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg">
        <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        {payload.map((entry, index) => {
          if (!entry) return null;
          const color = entry.color ?? "#0f172a";
          const name = entry.name ?? "";
          const value = entry.value ?? 0;
          return (
            <p key={index} style={{ color }} className="text-sm">
              {name}: {value} days
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}

export function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState("12months");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState("all");

  // TODO: Implement - fetch leave records from API
  const leaveRecords: LeaveRecord[] = [];

  // TODO: Implement - fetch employee availability from API
  const employeeAvailability: EmployeeAvailability[] = [];

  const departments = [
    "Engineering",
    "Human Resources",
    "Finance",
    "Marketing",
    "Operations",
  ];

  const leaveTypes: {
    value: LeaveType;
    label: string;
    icon: LucideIcon;
    color: string;
  }[] = [
    { value: "vacation", label: "Vacation", icon: Plane, color: "#2563eb" },
    { value: "sick", label: "Sick Leave", icon: Heart, color: "#ef4444" },
    { value: "personal", label: "Personal", icon: User, color: "#10b981" },
    { value: "maternity", label: "Maternity", icon: Baby, color: "#f59e0b" },
    { value: "paternity", label: "Paternity", icon: Home, color: "#8b5cf6" },
    {
      value: "bereavement",
      label: "Bereavement",
      icon: Heart,
      color: "#6b7280",
    },
    {
      value: "training",
      label: "Training",
      icon: GraduationCap,
      color: "#06b6d4",
    },
    { value: "other", label: "Other", icon: Briefcase, color: "#64748b" },
  ];

  // Calculate trends data
  const trendsData = useMemo<LeaveTrendPoint[]>(() => {
    const monthlyData: {
      month: string;
      total: number;
      vacation: number;
      sick: number;
      personal: number;
      maternity: number;
      other: number;
    }[] = [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    months.forEach((month, index) => {
      const monthRecords = leaveRecords.filter((record) => {
        const recordMonth = new Date(record.startDate).getMonth();
        return recordMonth === index;
      });

      const leaveTypeBreakdown: { [key: string]: number } = {};
      leaveTypes.forEach((type) => {
        leaveTypeBreakdown[type.value] = monthRecords
          .filter((record) => record.leaveType === type.value)
          .reduce((sum, record) => sum + record.days, 0);
      });

      monthlyData.push({
        month,
        total: monthRecords.reduce((sum, record) => sum + record.days, 0),
        vacation: leaveTypeBreakdown.vacation || 0,
        sick: leaveTypeBreakdown.sick || 0,
        personal: leaveTypeBreakdown.personal || 0,
        maternity: leaveTypeBreakdown.maternity || 0,
        other:
          (leaveTypeBreakdown.paternity || 0) +
          (leaveTypeBreakdown.bereavement || 0) +
          (leaveTypeBreakdown.training || 0) +
          (leaveTypeBreakdown.other || 0),
      });
    });

    return monthlyData;
  }, [leaveRecords]);

  // Calculate department stats
  const departmentStats = useMemo(() => {
    const stats: DepartmentStats[] = departments.map((dept) => {
      const deptRecords = leaveRecords.filter(
        (record) => record.department === dept
      );
      const deptEmployees = employeeAvailability.filter(
        (emp) => emp.department === dept
      );
      const onLeave = deptEmployees.filter((emp) =>
        Object.values(emp.availability).some((status) => status === "leave")
      ).length;

      return {
        department: dept,
        totalEmployees: deptEmployees.length,
        onLeave,
        availabilityRate:
          ((deptEmployees.length - onLeave) / deptEmployees.length) * 100,
        averageLeaveDays:
          deptRecords.length > 0
            ? deptRecords.reduce((sum, record) => sum + record.days, 0) /
              deptRecords.length
            : 0,
      };
    });

    return stats;
  }, [leaveRecords, employeeAvailability, departments]);

  // Leave type distribution for pie chart
  const leaveTypeDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    leaveRecords.forEach((record) => {
      distribution[record.leaveType] =
        (distribution[record.leaveType] || 0) + record.days;
    });

    return leaveTypes
      .map((type) => ({
        name: type.label,
        value: distribution[type.value] || 0,
        color: type.color,
      }))
      .filter((item) => item.value > 0);
  }, [leaveRecords, leaveTypes]);

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100";
      case "leave":
        return "bg-red-200";
      case "partial":
        return "bg-amber-200";
      default:
        return "bg-gray-100 dark:bg-gray-700";
    }
  };

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Check className="h-4 w-4" />;
      case "leave":
        return <X className="h-4 w-4" />;
      case "partial":
        return <CircleDot className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const exportData = (format: "csv" | "pdf") => {
    if (format === "csv") {
      const csvHeaders = [
        "Employee",
        "Department",
        "Leave Type",
        "Start Date",
        "End Date",
        "Days",
        "Status",
      ];
      const csvData = leaveRecords.map((record) => [
        record.employeeName,
        record.department,
        record.leaveType,
        record.startDate,
        record.endDate,
        record.days.toString(),
        record.status,
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leave-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } else {
      // TODO: Implement PDF export with a PDF generation library
      alert(
        "PDF export functionality would be implemented with a PDF generation library"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Leave Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Insights into leave patterns, trends, and team availability
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedTimeRange}
              onValueChange={setSelectedTimeRange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="12months">12 Months</SelectItem>
                <SelectItem value="2years">2 Years</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData("csv")}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData("pdf")}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Leave Days
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {leaveRecords.reduce((sum, record) => sum + record.days, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This year
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Employees on Leave
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {
                employeeAvailability.filter((emp) =>
                  Object.values(emp.availability).some(
                    (status) => status === "leave"
                  )
                ).length
              }
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Currently
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Leave
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(
                leaveRecords.reduce((sum, record) => sum + record.days, 0) /
                  leaveRecords.length
              ) || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Days per employee
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Team Availability
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(
                ((employeeAvailability.length -
                  employeeAvailability.filter((emp) =>
                    Object.values(emp.availability).some(
                      (status) => status === "leave"
                    )
                  ).length) /
                  employeeAvailability.length) *
                  100
              )}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Currently available
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-gray-200 dark:border-gray-700">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="heatmap">Team Heatmap</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* Leave Trends Chart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Leave Trends by Month
                      </h3>
                      <Select
                        value={selectedLeaveType}
                        onValueChange={setSelectedLeaveType}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Leave Types</SelectItem>
                          {leaveTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={trendsData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <Tooltip content={<AnalyticsTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="vacation"
                            stackId="1"
                            stroke="#2563eb"
                            fill="#2563eb"
                            fillOpacity={0.6}
                            name="Vacation"
                          />
                          <Area
                            type="monotone"
                            dataKey="sick"
                            stackId="1"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                            name="Sick Leave"
                          />
                          <Area
                            type="monotone"
                            dataKey="personal"
                            stackId="1"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.6}
                            name="Personal"
                          />
                          <Area
                            type="monotone"
                            dataKey="maternity"
                            stackId="1"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.6}
                            name="Maternity"
                          />
                          <Area
                            type="monotone"
                            dataKey="other"
                            stackId="1"
                            stroke="#64748b"
                            fill="#64748b"
                            fillOpacity={0.6}
                            name="Other"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <Separator />

                  {/* Department Overview */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Department Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departmentStats.map((dept) => (
                        <Card
                          key={dept.department}
                          className="border-gray-200 dark:border-gray-700"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {dept.department}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={
                                    dept.availabilityRate >= 90
                                      ? "bg-green-100 text-green-800"
                                      : dept.availabilityRate >= 75
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                  }
                                >
                                  {Math.round(dept.availabilityRate)}%
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Available:
                                  </span>
                                  <span className="font-medium">
                                    {dept.totalEmployees - dept.onLeave}/
                                    {dept.totalEmployees}
                                  </span>
                                </div>
                                <Progress
                                  value={dept.availabilityRate}
                                  className="h-2"
                                />
                              </div>

                              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Avg Leave Days:
                                  </span>
                                  <span className="font-medium">
                                    {Math.round(dept.averageLeaveDays)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6 mt-0">
                  {/* Detailed Trends Analysis */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Leave Patterns & Trends
                      </h3>
                      <div className="flex gap-2">
                        <Select
                          value={selectedDepartment}
                          onValueChange={setSelectedDepartment}
                        >
                          <SelectTrigger className="w-40">
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
                    </div>

                    {/* Monthly Trends Line Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendsData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <Tooltip content={<AnalyticsTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                            name="Total Leave Days"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Leave Type Distribution */}
                      <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Leave Type Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={leaveTypeDistribution}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="value"
                                  label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                  {leaveTypeDistribution.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Insights */}
                      <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Key Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Peak Leave Season
                                </p>
                                <p className="text-xs text-blue-700">
                                  Summer months show highest leave requests
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-900">
                                  Resource Planning
                                </p>
                                <p className="text-xs text-amber-700">
                                  Engineering team has lowest availability rate
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  Healthy Balance
                                </p>
                                <p className="text-xs text-green-700">
                                  Average leave usage within normal range
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="heatmap" className="space-y-6 mt-0">
                  {/* Team Availability Heatmap */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Team Availability Heatmap
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-green-100 rounded-sm"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Available
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-amber-200 rounded-sm"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Partial
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            On Leave
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Heatmap Calendar */}
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Calendar Header */}
                          <div className="grid grid-cols-8 gap-2">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 p-2">
                              Employee
                            </div>
                            {[
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ].map((day) => (
                              <div
                                key={day}
                                className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center p-2"
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Employee Rows */}
                          {employeeAvailability.map((employee) => (
                            <div
                              key={employee.employeeId}
                              className="grid grid-cols-8 gap-2 items-center"
                            >
                              <div className="flex items-center gap-2 p-2">
                                <Avatar className="w-6 h-6">
                                  <img
                                    src={employee.avatar}
                                    alt={employee.employeeName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="text-xs">
                                    {employee.employeeName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {employee.employeeName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {employee.department}
                                  </p>
                                </div>
                              </div>

                              {[
                                "2025-08-01",
                                "2025-08-02",
                                "2025-08-05",
                                "2025-08-06",
                                "2025-08-07",
                                "2025-08-08",
                                "2025-08-09",
                              ].map((date) => {
                                const status =
                                  employee.availability[date] || "available";
                                return (
                                  <div
                                    key={date}
                                    className={`w-full h-12 rounded-md flex items-center justify-center text-sm font-medium cursor-pointer hover:opacity-80 ${getAvailabilityColor(status)}`}
                                    title={`${employee.employeeName}: ${status} on ${formatDate(date)}`}
                                  >
                                    {getAvailabilityIcon(status)}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Department Availability Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {departmentStats.map((dept) => (
                        <Card
                          key={dept.department}
                          className="border-gray-200 dark:border-gray-700"
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              {dept.department}
                            </h4>
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {dept.totalEmployees - dept.onLeave}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                of {dept.totalEmployees} available
                              </div>
                              <Progress
                                value={dept.availabilityRate}
                                className="h-2 mt-2"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6 mt-0">
                  {/* Reports Section */}
                  <div className="space-y-6">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Generate Reports
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quick Export Options */}
                      <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Quick Exports
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            onClick={() => exportData("csv")}
                            className="w-full justify-start gap-2"
                            variant="outline"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Leave Data (CSV)
                          </Button>
                          <Button
                            onClick={() => exportData("pdf")}
                            className="w-full justify-start gap-2"
                            variant="outline"
                          >
                            <FileText className="w-4 h-4" />
                            Generate Analytics Report (PDF)
                          </Button>
                          <Button
                            className="w-full justify-start gap-2"
                            variant="outline"
                          >
                            <Calendar className="w-4 h-4" />
                            Export Team Calendar
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Custom Report Builder */}
                      <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Custom Report
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="date" defaultValue="2025-01-01" />
                              <Input type="date" defaultValue="2025-12-31" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Department</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="All Departments" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All Departments
                                </SelectItem>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Leave Types</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="All Leave Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All Leave Types
                                </SelectItem>
                                {leaveTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button variant="primary" className="w-full">
                            Generate Custom Report
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Reports */}
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Recent Reports
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            {
                              name: "Q3 Leave Analytics",
                              date: "2025-07-31",
                              type: "PDF",
                              size: "2.1 MB",
                            },
                            {
                              name: "July Team Availability",
                              date: "2025-07-28",
                              type: "CSV",
                              size: "156 KB",
                            },
                            {
                              name: "Engineering Leave Trends",
                              date: "2025-07-25",
                              type: "PDF",
                              size: "1.8 MB",
                            },
                          ].map((report, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  {report.type === "PDF" ? (
                                    <FileText className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {report.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(report.date)} • {report.size}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
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
                label="Generate Report"
                icon={BarChart3}
                onClick={() => {}}
                variant="primary"
              />
              <QuickActionButton
                label="Export Data"
                icon={Download}
                onClick={() => exportData("csv")}
              />
              <QuickActionButton
                label="View Calendar"
                icon={Calendar}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Analytics Settings"
                icon={Settings}
                onClick={() => {}}
              />
            </CardContent>
          </Card>

          {/* Leave Type Legend */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Leave Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaveTypes.slice(0, 6).map((type) => {
                const Icon = type.icon;
                const count = leaveRecords.filter(
                  (record) => record.leaveType === type.value
                ).length;
                return (
                  <div
                    key={type.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {type.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Most Used Leave:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Vacation
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Peak Month:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    August
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Approval Rate:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    98%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Planning Alert
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    High leave concentration in August. Consider resource
                    planning.
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
