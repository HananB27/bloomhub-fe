import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  Calendar,
  Star,
  UserPlus,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle,
  Hand,
} from "lucide-react";
import { QuickActionButton } from "./QuickActionButton";
import { useSession } from "next-auth/react";

// Import all modules
// ... (rest of imports unchanged)
import { VacationsModule } from "./VacationsModule";
import ProfilesModule from "./ProfilesModule";
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
import { AdminModule } from "./AdminModule";
import type { AddNotification } from "./notifications";

interface DashboardViewProps {
  activeModule: string;
  addNotification?: AddNotification;
}

// Dashboard Overview Component
function DashboardOverview() {
  const { data: session } = useSession();
  const firstName = session?.user?.name
    ? session.user.name.split(" ")[0]
    : "John";

  const kpiData = [
    // ... (rest of kpiData unchanged)
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
    // ... (rest of recentActivity unchanged)
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
    // ... (rest of pendingTasks unchanged)
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
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40";
      case "medium":
        return "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40";
      case "low":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40";
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50";
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-200";
      case "medium":
        return "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200";
      case "low":
        return "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-200";
      default:
        return "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      {/* Welcome Section */}
      <div className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            <Hand className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Welcome back, {firstName}!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Here&apos;s what&apos;s happening with your team today. You have{" "}
            {pendingTasks.reduce((sum, task) => sum + task.count, 0)} pending
            tasks.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="border-gray-200 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
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
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {kpi.value}
                </h3>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {kpi.title}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 items-start gap-4 sm:grid-cols-3">
        {/* Recent Activity */}
        <div className="min-h-0 w-full">
          <Card className="flex h-full min-h-[280px] flex-col gap-0 border-gray-200">
            <CardHeader className="shrink-0 px-4 pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 shrink-0 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 px-4 pt-0">
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <img
                        src={activity.avatar}
                        alt={activity.user}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs">
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(activity.status)}`}
                        >
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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

        {/* Pending Tasks */}
        <div className="min-h-0 w-full">
          <Card className="flex h-full min-h-[280px] flex-col gap-0 border-gray-200">
            <CardHeader className="shrink-0 px-4 pb-2 pt-4">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-gray-600" />
                  Pending Tasks
                </div>
                <Badge className="bg-gray-600 text-white">
                  {pendingTasks.reduce((sum, task) => sum + task.count, 0)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-2 px-4 pt-0">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border p-2 ${getPriorityColor(task.priority)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs font-medium border-gray-300 bg-gray-200 text-gray-800 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
                    >
                      {task.count}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs capitalize ${getPriorityBadgeClass(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      •
                    </span>
                    <span className="truncate text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {task.module}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="min-h-0 w-full">
          <Card className="flex h-full min-h-[280px] flex-col gap-0 border-gray-200">
            <CardHeader className="shrink-0 px-4 pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 shrink-0 text-gray-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-start gap-1.5 px-4 pt-0">
              <QuickActionButton
                label="Add New Employee"
                icon={UserPlus}
                onClick={() => {}}
                variant="primary"
              />
              <QuickActionButton
                label="Send Announcement"
                icon={MessageSquare}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Schedule Review"
                icon={Calendar}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Generate Report"
                icon={FileText}
                onClick={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardView({
  activeModule,
  addNotification,
}: DashboardViewProps) {
  switch (activeModule) {
    case "dashboard":
      return <DashboardOverview />;
    case "vacations":
      return <VacationsModule addNotification={addNotification} />;
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
    case "admin":
      return <AdminModule />;
    default:
      return <DashboardOverview />;
  }
}
