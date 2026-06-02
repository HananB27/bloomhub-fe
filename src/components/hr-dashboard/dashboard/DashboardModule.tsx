"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/hr-dashboard/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserRole } from "@/hooks/useUserRole";
import { getAccessToken } from "@/lib/api/tokens";
import {
  approveLeaveRequest,
  hrApproveLeaveRequest,
  rejectLeaveRequest,
} from "@/lib/api/vacations";
import type {
  EmployeeDashboardData,
  HrDashboardData,
  ManagerDashboardData,
  PendingLeaveItem,
} from "@/types/dashboard";
import { formatLongDate, greetingForHour } from "@/utils";
import { notifyApiError } from "@/utils/notificationHelpers";

import {
  buildEmployeeKpis,
  buildHrKpis,
  buildManagerKpis,
  DASHBOARD_PERSONA_SUBTITLES,
  resolveDefaultPersona,
} from "./dashboardModuleHelpers";
import {
  AnnouncementsWidget,
  ApprovalQueueWidget,
  CelebrationsWidget,
  HeadcountChartWidget,
  InitialsAvatar,
  KpiCard,
  MyProjectsWidget,
  MyTimeOffWidget,
  MyTrainingWidget,
  OnboardingTrackerWidget,
  OpenRolesWidget,
  OutTodayWidget,
  ReviewsDueWidget,
  TeamTimeWidget,
} from "./widgets";

interface DashboardModuleProps {
  onNavigate?: (moduleId: string) => void;
}

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="flex h-64 items-center justify-center text-gray-500"
    >
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      <span className="text-sm">Loading dashboard…</span>
    </div>
  );
}

function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center"
    >
      <AlertCircle className="h-6 w-6 text-rose-500" />
      <div>
        <div className="text-sm font-semibold text-rose-700">
          Couldn&apos;t load your dashboard
        </div>
        <div className="mt-1 text-xs text-rose-600">{message}</div>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

const EMPTY_HR: HrDashboardData = {
  headcount: { total: 0, byDepartment: [], deltaThisMonth: 0 },
  pendingApprovals: { items: [], total: 0 },
  outToday: [],
  onboarding: [],
  celebrations: [],
  announcements: [],
};

const EMPTY_MANAGER: ManagerDashboardData = {
  teamSize: 0,
  teamPending: [],
  teamOut: [],
  teamReviews: [],
  teamTime: [],
  celebrations: [],
  announcements: [],
};

const EMPTY_EMPLOYEE: EmployeeDashboardData = {
  balance: { vacationUsed: 0, vacationTotal: 0, sickUsed: 0, wfhUsed: 0 },
  myRequests: [],
  hoursThisWeek: { logged: 0, expected: 0 },
  projects: [],
  nextReview: null,
  training: { budgetTotal: 0, budgetUsed: 0, currency: "EUR", items: [] },
  openRoles: [],
  outToday: [],
  celebrations: [],
  announcements: [],
};

export function DashboardModule({ onNavigate }: DashboardModuleProps = {}) {
  const { data: session } = useSession();
  const {
    isAdmin,
    isManager,
    userId,
    profileId,
    assignedProjects,
    isLoading: isRoleLoading,
  } = useUserRole();
  const persona = useMemo(
    () => resolveDefaultPersona({ isAdmin, isManager }),
    [isAdmin, isManager]
  );

  const { hr, manager, employee, isLoading, error, refresh } = useDashboardData(
    {
      persona,
      userId,
      profileId,
      assignedProjects,
      ready: !isRoleLoading,
    }
  );

  useEffect(() => {
    if (error) notifyApiError(new Error(error));
  }, [error]);

  const firstName =
    session?.user?.name?.split(" ")[0] ||
    (session?.user?.email ? session.user.email.split("@")[0] : "there");

  const hrData = hr ?? EMPTY_HR;
  const managerData = manager ?? EMPTY_MANAGER;
  const employeeData = employee ?? EMPTY_EMPLOYEE;

  const kpis = useMemo(() => {
    if (persona === "hr") return buildHrKpis(hr);
    if (persona === "manager") return buildManagerKpis(manager);
    return buildEmployeeKpis(employee);
  }, [persona, hr, manager, employee]);

  const showSkeleton =
    (isLoading || isRoleLoading) && !hr && !manager && !employee;

  const handleApproveLeave = async (item: PendingLeaveItem) => {
    const token =
      getAccessToken() ??
      (session as { accessToken?: string } | null)?.accessToken ??
      null;
    if (!token) throw new Error("No access token");
    if (item.status === "lead_approved") {
      await hrApproveLeaveRequest(item.id, "", token);
    } else {
      await approveLeaveRequest(item.id, "", token);
    }
    refresh();
  };

  const handleDeclineLeave = async (item: PendingLeaveItem) => {
    const token =
      getAccessToken() ??
      (session as { accessToken?: string } | null)?.accessToken ??
      null;
    if (!token) throw new Error("No access token");
    await rejectLeaveRequest(item.id, "", token);
    refresh();
  };

  return (
    <div
      className="mx-auto w-full max-w-[1320px] px-1 pb-10"
      data-testid="dashboard-module"
      data-persona={persona}
    >
      <header className="mb-6 flex items-center gap-3.5">
        <InitialsAvatar
          name={session?.user?.name || firstName}
          size={46}
          className="border border-white shadow-sm"
        />
        <div>
          <h1 className="text-[27px] font-bold leading-[1.05] tracking-tight text-gray-900">
            {greetingForHour(new Date().getHours())}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-gray-500">
            {formatLongDate(new Date())} ·{" "}
            {DASHBOARD_PERSONA_SUBTITLES[persona]}
          </p>
        </div>
      </header>

      <div className="mb-[18px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      {showSkeleton ? (
        <DashboardSkeleton />
      ) : error && !hr && !manager && !employee ? (
        <DashboardErrorState message={error} onRetry={refresh} />
      ) : persona === "hr" ? (
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-[18px]">
            <ApprovalQueueWidget
              items={hrData.pendingApprovals.items}
              total={hrData.pendingApprovals.total}
              onApprove={handleApproveLeave}
              onDecline={handleDeclineLeave}
              onViewAll={() => onNavigate?.("vacations")}
            />
            <OnboardingTrackerWidget
              items={hrData.onboarding}
              onViewAll={() => onNavigate?.("onboarding")}
            />
            <HeadcountChartWidget
              total={hrData.headcount.total}
              rows={hrData.headcount.byDepartment}
              onViewAnalytics={() => onNavigate?.("analytics")}
            />
          </div>
          <div className="flex flex-col gap-[18px]">
            <OutTodayWidget items={hrData.outToday} />
            <CelebrationsWidget items={hrData.celebrations} />
            <AnnouncementsWidget
              items={hrData.announcements}
              onViewBoard={() => onNavigate?.("announcements")}
            />
          </div>
        </div>
      ) : persona === "manager" ? (
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-[18px]">
            <ApprovalQueueWidget
              items={managerData.teamPending}
              total={managerData.teamPending.length}
              onApprove={handleApproveLeave}
              onDecline={handleDeclineLeave}
              onViewAll={() => onNavigate?.("vacations")}
            />
            <ReviewsDueWidget items={managerData.teamReviews} />
            <TeamTimeWidget
              items={managerData.teamTime}
              onViewTimeTracking={() => onNavigate?.("timetracking")}
            />
          </div>
          <div className="flex flex-col gap-[18px]">
            <OutTodayWidget items={managerData.teamOut} />
            <CelebrationsWidget items={managerData.celebrations} />
            <AnnouncementsWidget
              items={managerData.announcements}
              onViewBoard={() => onNavigate?.("announcements")}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-[18px]">
            <MyTimeOffWidget
              balance={employeeData.balance}
              requests={employeeData.myRequests}
              onRequest={() => onNavigate?.("vacations")}
            />
            <MyProjectsWidget
              projects={employeeData.projects}
              onViewAll={() => onNavigate?.("projects")}
            />
            <MyTrainingWidget
              training={employeeData.training}
              onViewAll={() => onNavigate?.("training")}
            />
          </div>
          <div className="flex flex-col gap-[18px]">
            <OutTodayWidget items={employeeData.outToday} />
            <CelebrationsWidget items={employeeData.celebrations} />
            <OpenRolesWidget
              items={employeeData.openRoles}
              onViewBoard={() => onNavigate?.("mobility")}
            />
            <AnnouncementsWidget
              items={employeeData.announcements}
              onViewBoard={() => onNavigate?.("announcements")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
