import {
  ALL_DASHBOARD_PERSONAS,
  type DashboardKpi,
  type DashboardPersona,
  type EmployeeDashboardData,
  type HrDashboardData,
  type ManagerDashboardData,
} from "@/types/dashboard";

export const DASHBOARD_PERSONA_SUBTITLES: Record<DashboardPersona, string> = {
  hr: "Here's what's happening across Bloomteq today.",
  manager: "Here's where your team stands today.",
  employee: "Here's your day at a glance.",
};

export const DASHBOARD_PERSONA_CTA_LABELS: Record<DashboardPersona, string> = {
  hr: "Post announcement",
  manager: "Schedule review",
  employee: "Request time off",
};

export type DashboardPersonaCtaIcon = "megaphone" | "star" | "plane";

export const DASHBOARD_PERSONA_CTA_ICONS: Record<
  DashboardPersona,
  DashboardPersonaCtaIcon
> = {
  hr: "megaphone",
  manager: "star",
  employee: "plane",
};

export function resolveAllowedPersonas(options: {
  isAdmin: boolean;
  isManager: boolean;
}): DashboardPersona[] {
  return ALL_DASHBOARD_PERSONAS.filter((persona) => {
    if (persona === "hr") return options.isAdmin;
    if (persona === "manager") return options.isManager || options.isAdmin;
    return true;
  });
}

export function resolveDefaultPersona(options: {
  isAdmin: boolean;
  isManager: boolean;
}): DashboardPersona {
  if (options.isAdmin) return "hr";
  if (options.isManager) return "manager";
  return "employee";
}

export function buildHrKpis(data: HrDashboardData | null): DashboardKpi[] {
  return [
    {
      id: "hr-headcount",
      icon: "users",
      value: data?.headcount.total ?? 0,
      label: "Active headcount",
      sub:
        data && data.headcount.deltaThisMonth > 0
          ? { text: `+${data.headcount.deltaThisMonth} this month`, tone: "up" }
          : undefined,
    },
    {
      id: "hr-out-today",
      icon: "plane",
      value: data?.outToday.length ?? 0,
      label: "Out today",
    },
    {
      id: "hr-pending",
      icon: "inbox",
      value: data?.pendingApprovals.total ?? 0,
      label: "Pending approvals",
      tone: "warning",
      sub:
        data && data.pendingApprovals.total > 0
          ? { text: "Action needed", tone: "warning" }
          : undefined,
    },
    {
      id: "hr-onboarding",
      icon: "user-plus",
      value: data?.onboarding.length ?? 0,
      label: "On / offboarding",
    },
  ];
}

export function buildManagerKpis(
  data: ManagerDashboardData | null
): DashboardKpi[] {
  const pending = data?.teamPending.length ?? 0;
  return [
    {
      id: "mgr-team",
      icon: "users",
      value: data?.teamSize ?? 0,
      label: "Team members",
    },
    {
      id: "mgr-out",
      icon: "plane",
      value: data?.teamOut.length ?? 0,
      label: "Out today",
    },
    {
      id: "mgr-pending",
      icon: "inbox",
      value: pending,
      label: "Pending approvals",
      tone: "warning",
      sub: pending > 0 ? { text: "Action needed", tone: "warning" } : undefined,
    },
    {
      id: "mgr-reviews",
      icon: "star",
      value: data?.teamReviews.length ?? 0,
      label: "Reviews due",
    },
  ];
}

export function buildEmployeeKpis(
  data: EmployeeDashboardData | null
): DashboardKpi[] {
  const vacationLeft = data
    ? Math.max(data.balance.vacationTotal - data.balance.vacationUsed, 0)
    : 0;
  const trainingLeft = data
    ? Math.max(data.training.budgetTotal - data.training.budgetUsed, 0)
    : 0;
  const pending =
    data?.myRequests.filter((r) => r.status === "pending").length ?? 0;
  return [
    {
      id: "emp-vacation",
      icon: "plane",
      value: vacationLeft,
      label: "Vacation days left",
    },
    {
      id: "emp-hours",
      icon: "clock",
      value: data
        ? `${data.hoursThisWeek.logged}/${data.hoursThisWeek.expected}`
        : "0/0",
      label: "Hours this week",
    },
    {
      id: "emp-pending",
      icon: "inbox",
      value: pending,
      label: "Pending requests",
    },
    {
      id: "emp-training",
      icon: "dollar",
      value: `€${trainingLeft.toLocaleString("en-US")}`,
      label: "Training budget",
    },
  ];
}
