import type { LeaveStatus, LeaveType } from "./vacations";

export type DashboardPersona = "hr" | "manager" | "employee";

export const DASHBOARD_PERSONA_LABELS: Record<DashboardPersona, string> = {
  hr: "HR Admin",
  manager: "Manager",
  employee: "Employee",
};

export const ALL_DASHBOARD_PERSONAS: DashboardPersona[] = [
  "hr",
  "manager",
  "employee",
];

export type DashboardKpiTone = "accent" | "warning";

export type DashboardKpiDeltaTone = "up" | "warning" | "flat";

export interface DashboardKpiDelta {
  text: string;
  tone: DashboardKpiDeltaTone;
}

export interface DashboardKpi {
  id: string;
  icon: "users" | "plane" | "inbox" | "star" | "user-plus" | "clock" | "dollar";
  value: string | number;
  label: string;
  tone?: DashboardKpiTone;
  sub?: DashboardKpiDelta;
}

export interface PendingLeaveItem {
  id: string;
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  submittedDate: string;
  /** Stage of the approval workflow this row is currently at. */
  status: LeaveStatus;
}

export interface OutTodayItem {
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  until: string;
}

export type CelebrationKind = "birthday" | "anniversary";

export interface CelebrationItem {
  employeeId: number;
  employeeName: string;
  kind: CelebrationKind;
  date: string;
  years?: number | null;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  authorName: string;
  tag: string;
  date: string;
}

export type OnboardingKind = "Onboarding" | "Offboarding";

export interface OnboardingItem {
  id: string | number;
  name: string;
  role: string;
  startDate?: string | null;
  endDate?: string | null;
  kind: OnboardingKind;
  done: number;
  total: number;
  owner: string;
}

export interface HeadcountRow {
  department: string;
  count: number;
}

export interface ReviewsDueItem {
  id: number | string;
  employeeId: number;
  employeeName: string;
  role: string;
  kind: string;
  dueDate: string;
}

export interface TeamTimeRow {
  employeeId: number;
  employeeName: string;
  logged: number;
  expected: number;
}

export interface MyLeaveBalance {
  vacationUsed: number;
  vacationTotal: number;
  sickUsed: number;
  wfhUsed: number;
}

export interface MyLeaveRequest {
  id: string | number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
}

export interface MyProjectRow {
  id: number;
  name: string;
  role: string;
  leadName: string;
  allocation: number;
}

export interface MyNextReview {
  kind: string;
  dueDate: string;
  reviewerName: string;
}

export interface MyTrainingItem {
  id: number | string;
  name: string;
  kind: string;
  status: "Completed" | "Requested" | "Pending";
  cost: number;
}

export interface MyTrainingBudget {
  budgetTotal: number;
  budgetUsed: number;
  currency: string;
  items: MyTrainingItem[];
}

export interface OpenRoleItem {
  id: number | string;
  title: string;
  department: string;
  level: string;
  matchStrength: "strong" | "stretch" | "match";
}

export const OPEN_ROLE_MATCH_LABELS: Record<
  OpenRoleItem["matchStrength"],
  string
> = {
  strong: "Strong match",
  stretch: "Stretch",
  match: "Match",
};

export interface HrDashboardData {
  headcount: {
    total: number;
    byDepartment: HeadcountRow[];
    deltaThisMonth: number;
  };
  pendingApprovals: {
    items: PendingLeaveItem[];
    total: number;
  };
  outToday: OutTodayItem[];
  onboarding: OnboardingItem[];
  celebrations: CelebrationItem[];
  announcements: AnnouncementItem[];
}

export interface ManagerDashboardData {
  teamSize: number;
  teamPending: PendingLeaveItem[];
  teamOut: OutTodayItem[];
  teamReviews: ReviewsDueItem[];
  teamTime: TeamTimeRow[];
  celebrations: CelebrationItem[];
  announcements: AnnouncementItem[];
}

export interface EmployeeDashboardData {
  balance: MyLeaveBalance;
  myRequests: MyLeaveRequest[];
  hoursThisWeek: { logged: number; expected: number };
  projects: MyProjectRow[];
  nextReview: MyNextReview | null;
  training: MyTrainingBudget;
  openRoles: OpenRoleItem[];
  outToday: OutTodayItem[];
  celebrations: CelebrationItem[];
  announcements: AnnouncementItem[];
}

export interface DashboardData {
  hr: HrDashboardData | null;
  manager: ManagerDashboardData | null;
  employee: EmployeeDashboardData | null;
}
