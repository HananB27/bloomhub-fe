import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  UserPlus,
  MessageSquare,
  FileText,
  Activity,
  DollarSign,
  MapPin,
  BarChart3,
  Plus,
} from "lucide-react";

// Import all modules
import { VacationsModule } from "./VacationsModule";
import { ProfilesModule } from "./ProfilesModule";
import { ReviewsModule } from "./ReviewsModule";
import { OnboardingModule } from "./OnboardingModule";
import { TrainingModule } from "./TrainingModule";
import { CompensationModule } from "./CompensationModule";
import { FeedbackModule } from "./FeedbackModule";
import { TimeTrackingModule } from "./TimeTrackingModule";
import { MobilityModule } from "./MobilityModule";
import { DocumentsModule } from "./DocumentsModule";
import { AssetsModule } from "./AssetsModule";
import { OrgChartModule } from "./OrgChartModule";
import { AnalyticsModule } from "./AnalyticsModule";
import { AnnouncementsModule } from "./AnnouncementsModule";

interface DashboardViewProps {
  activeModule: string;
}

// Dashboard Overview Component
function DashboardOverview() {
  const kpiData = [
    {
      title: "Total Employees",
      value: "147",
      change: "+5.2%",
      trend: "up",
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Active Leaves",
      value: "23",
      change: "-2.1%",
      trend: "down",
      icon: Calendar,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Pending Reviews",
      value: "12",
      change: "+8.3%",
      trend: "up",
      icon: Star,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Open Positions",
      value: "8",
      change: "+12.5%",
      trend: "up",
      icon: UserPlus,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: "Sarah Johnson",
      action: "submitted vacation request",
      time: "2 hours ago",
      status: "pending",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 2,
      user: "Alex Thompson",
      action: "completed performance review",
      time: "4 hours ago",
      status: "completed",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      user: "Michael Chen",
      action: "enrolled in leadership training",
      time: "6 hours ago",
      status: "active",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const pendingTasks = [
    {
      id: 1,
      title: "Approve vacation requests",
      count: 5,
      priority: "high",
      module: "vacations",
    },
    {
      id: 2,
      title: "Review timesheet submissions",
      count: 7,
      priority: "medium",
      module: "timetracking",
    },
    {
      id: 3,
      title: "Complete onboarding tasks",
      count: 3,
      priority: "high",
      module: "onboarding",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "active":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-amber-200 bg-amber-50";
      case "low":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-gray-800 to-gray-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, John! 👋</h1>
            <p className="text-gray-200">
              Here&apos;s what&apos;s happening with your team today. You have{" "}
              {pendingTasks.reduce((sum, task) => sum + task.count, 0)} pending
              tasks.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button className="bg-white text-gray-800 hover:bg-gray-100">
              <Plus className="w-4 h-4 mr-2" />
              Quick Action
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="border-gray-200 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      kpi.trend === "up"
                        ? "text-green-700 border-green-200 bg-green-50"
                        : "text-red-700 border-red-200 bg-red-50"
                    }
                  >
                    {kpi.change}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {kpi.value}
                  </h3>
                  <p className="text-sm text-gray-600">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <img
                        src={activity.avatar}
                        alt={activity.user}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(activity.status)}`}
                        >
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  Pending Tasks
                </div>
                <Badge className="bg-gray-600 text-white">
                  {pendingTasks.reduce((sum, task) => sum + task.count, 0)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 border rounded-lg ${getPriorityColor(task.priority)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {task.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {task.count}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {task.module}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700">
                <UserPlus className="w-4 h-4" />
                Add New Employee
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-gray-200 hover:bg-gray-50"
              >
                <MessageSquare className="w-4 h-4" />
                Send Announcement
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-gray-200 hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4" />
                Schedule Review
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-gray-200 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardView({ activeModule }: DashboardViewProps) {
  switch (activeModule) {
    case "dashboard":
      return <DashboardOverview />;
    case "vacations":
      return <VacationsModule />;
    case "profiles":
      return <ProfilesModule />;
    case "reviews":
      return <ReviewsModule />;
    case "onboarding":
      return <OnboardingModule />;
    case "training":
      return <TrainingModule />;
    case "compensation":
      return <CompensationModule />;
    case "feedback":
      return <FeedbackModule />;
    case "timetracking":
      return <TimeTrackingModule />;
    case "mobility":
      return <MobilityModule />;
    case "documents":
      return <DocumentsModule />;
    case "assets":
      return <AssetsModule />;
    case "orgchart":
      return <OrgChartModule />;
    case "analytics":
      return <AnalyticsModule />;
    case "announcements":
      return <AnnouncementsModule />;
    default:
      return <DashboardOverview />;
  }
}
