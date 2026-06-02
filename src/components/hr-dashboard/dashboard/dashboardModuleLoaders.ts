import { announcementApi } from "@/lib/api/announcements";
import { celebrationsApi } from "@/lib/api/celebrations";
import { leaveAnalyticsApi } from "@/lib/api/modules/leave-analytics";
import { trainingBudgetsApi } from "@/lib/api/modules/training-budgets";
import {
  fetchLeaveBalances,
  fetchLeaveRequests,
  fetchPendingApprovals,
  fetchVacationTeamMembers,
} from "@/lib/api/vacations";
import { fetchPerformanceReviews } from "@/lib/api/reviews";
import { fetchTrainingEntries } from "@/lib/api/training";
import { jobListingsApi } from "@/lib/api/modules/jobListings";
import { fetchInstances } from "@/lib/api/onboarding";
import { timeTrackingApi } from "@/lib/api/timeTracking";
import type {
  AnnouncementItem,
  CelebrationItem,
  EmployeeDashboardData,
  HeadcountRow,
  HrDashboardData,
  ManagerDashboardData,
  MyLeaveRequest,
  MyProjectRow,
  MyTrainingItem,
  OnboardingItem,
  OnboardingKind,
  OpenRoleItem,
  OutTodayItem,
  PendingLeaveItem,
  ReviewsDueItem,
  TeamTimeRow,
} from "@/types/dashboard";
import type { LeaveStatus, LeaveType } from "@/types/vacations";

const OUT_TODAY_WINDOW_DAYS = 14;
const APPROVAL_QUEUE_LIMIT = 5;
const ONBOARDING_LIMIT = 6;
const REVIEWS_LIMIT = 6;
const MY_REQUESTS_LIMIT = 4;
const OPEN_ROLES_LIMIT = 5;
const PROJECTS_LIMIT = 5;
const ANNOUNCEMENTS_LIMIT = 5;
const CELEBRATIONS_LIMIT = 6;

export interface DashboardCtxProject {
  projectId: number;
  projectName: string;
  role: string | null;
  allocationPercentage: number;
}

export interface DashboardCtx {
  /** UserProfile pk used by employee-scoped endpoints. */
  profileId: number | null;
  /** Auth User.pk (matches review.reviewer_id, etc.). */
  userId: number | null;
  /** Bearer token for legacy `accessToken` APIs. */
  accessToken: string | null;
  /** Pre-resolved assignments (avoids N+1 listAssignments calls). */
  assignedProjects?: DashboardCtxProject[];
  /** Anchor date (defaults to today). */
  today?: Date;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function _toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function _availabilityWindow(today: Date): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + OUT_TODAY_WINDOW_DAYS - 1);
  return { startDate: _toISODate(start), endDate: _toISODate(end) };
}

function _weekStart(today: Date): string {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = (day + 6) % 7; // monday-anchor
  d.setDate(d.getDate() - offset);
  return _toISODate(d);
}

async function _loadAnnouncements(
  signal?: AbortSignal
): Promise<AnnouncementItem[]> {
  try {
    const { results } = await announcementApi.list(
      { ordering: "-published_at" },
      { signal }
    );
    return results.slice(0, ANNOUNCEMENTS_LIMIT).map((a) => ({
      id: a.id,
      title: a.title,
      body: "",
      authorName: a.author_name,
      tag: a.type,
      date: a.published_at || a.created_at,
    }));
  } catch {
    return [];
  }
}

async function _loadCelebrations(
  signal?: AbortSignal
): Promise<CelebrationItem[]> {
  try {
    const rows = await celebrationsApi.upcoming(
      { days: 30, type: "all" },
      { signal }
    );
    return rows.slice(0, CELEBRATIONS_LIMIT).map((c) => ({
      employeeId: c.employee.id,
      employeeName: c.employee.full_name,
      kind: c.event_type,
      date: c.event_date,
      years: c.anniversary_years,
    }));
  } catch {
    return [];
  }
}

async function _loadOutToday(
  today: Date,
  teamIds?: Set<number>
): Promise<OutTodayItem[]> {
  try {
    const { startDate, endDate } = _availabilityWindow(today);
    const payload = await leaveAnalyticsApi.availability({
      startDate,
      endDate,
    });
    const isoToday = startDate;
    const items: OutTodayItem[] = [];
    for (const emp of payload.employees) {
      if (teamIds && !teamIds.has(emp.employeeId)) continue;
      const entry = emp.entries.find(
        (e) => e.windowStart <= isoToday && e.windowEnd >= isoToday
      );
      if (!entry) continue;
      items.push({
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        leaveType: entry.leaveType as LeaveType,
        until: entry.endDate,
      });
    }
    return items;
  } catch {
    return [];
  }
}

async function _loadHeadcount(year: number): Promise<{
  total: number;
  byDepartment: HeadcountRow[];
}> {
  try {
    const rows = await leaveAnalyticsApi.departments({ year });
    const byDepartment = rows
      .map((r) => ({ department: r.department, count: r.headcount }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
    const total = byDepartment.reduce((sum, r) => sum + r.count, 0);
    return { total, byDepartment };
  } catch {
    return { total: 0, byDepartment: [] };
  }
}

async function _loadHrPendingRequests(
  accessToken: string | null
): Promise<{ items: PendingLeaveItem[]; total: number }> {
  if (!accessToken) return { items: [], total: 0 };
  try {
    // Pull every request HR can see, filter to the two pending stages.
    // `hr-pending` only returns LEAD_APPROVED rows; the dashboard queue should
    // also surface freshly-submitted PENDING rows so the count matches what
    // appears in the Vacations module.
    const rows = await fetchLeaveRequests(accessToken);
    const pending = rows.filter(
      (r) => r.status === "pending" || r.status === "lead_approved"
    );
    pending.sort((a, b) => (a.submittedDate < b.submittedDate ? 1 : -1));
    return {
      items: pending.slice(0, APPROVAL_QUEUE_LIMIT).map(_toPendingLeaveItem),
      total: pending.length,
    };
  } catch {
    return { items: [], total: 0 };
  }
}

function _toPendingLeaveItem(r: {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  submittedDate: string;
  status: LeaveStatus;
}): PendingLeaveItem {
  return {
    id: r.id,
    employeeId: Number(r.employeeId),
    employeeName: r.employeeName,
    leaveType: r.leaveType,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    reason: r.reason,
    submittedDate: r.submittedDate,
    status: r.status,
  };
}

async function _loadManagerApprovalQueueItems(
  accessToken: string | null
): Promise<PendingLeaveItem[]> {
  if (!accessToken) return [];
  try {
    const rows = await fetchPendingApprovals(accessToken);
    return rows.slice(0, APPROVAL_QUEUE_LIMIT).map(_toPendingLeaveItem);
  } catch {
    return [];
  }
}

async function _loadOnboarding(
  accessToken: string | null
): Promise<OnboardingItem[]> {
  if (!accessToken) return [];
  try {
    const instances = await fetchInstances(accessToken);
    return instances.slice(0, ONBOARDING_LIMIT).map((inst) => {
      const employee = inst.employee;
      const name =
        [employee.user?.first_name, employee.user?.last_name]
          .filter(Boolean)
          .join(" ") ||
        employee.user?.username ||
        "Unknown";
      const kind: OnboardingKind =
        inst.template.type === "offboarding" ? "Offboarding" : "Onboarding";
      const total = inst.template.task_templates?.length ?? 0;
      return {
        id: inst.id,
        name,
        role: employee.department || inst.template.role_responsible,
        startDate: kind === "Onboarding" ? inst.due_date : null,
        endDate: kind === "Offboarding" ? inst.due_date : null,
        kind,
        done: 0,
        total,
        owner: inst.template.role_responsible,
      };
    });
  } catch {
    return [];
  }
}

async function _loadTeam(
  accessToken: string | null
): Promise<{ ids: Set<number>; size: number }> {
  if (!accessToken) return { ids: new Set(), size: 0 };
  try {
    const members = await fetchVacationTeamMembers(accessToken);
    const ids = new Set(members.map((m) => Number(m.id)));
    return { ids, size: ids.size };
  } catch {
    return { ids: new Set(), size: 0 };
  }
}

async function _loadReviewsDue(
  accessToken: string | null,
  userId: number | null
): Promise<ReviewsDueItem[]> {
  if (!accessToken) return [];
  try {
    const rows = await fetchPerformanceReviews(accessToken);
    return rows
      .filter((r) => {
        if (userId != null && r.reviewerId != null) {
          return Number(r.reviewerId) === userId;
        }
        return true;
      })
      .filter((r) => r.status !== "completed" && r.status !== "cancelled")
      .sort((a, b) => (a.scheduledDate < b.scheduledDate ? -1 : 1))
      .slice(0, REVIEWS_LIMIT)
      .map((r) => ({
        id: r.id,
        employeeId: Number(r.employeeId),
        employeeName: r.employeeName,
        role: r.reviewType,
        kind: r.reviewType,
        dueDate: r.scheduledDate,
      }));
  } catch {
    return [];
  }
}

async function _loadTeamTime(
  teamIds: Set<number>,
  today: Date
): Promise<TeamTimeRow[]> {
  try {
    const weekStart = _weekStart(today);
    const payload = await timeTrackingApi.getWeeklyDashboard({
      week_start: weekStart,
    });
    return payload.employees
      .filter((e) => teamIds.size === 0 || teamIds.has(e.employee_id))
      .slice(0, 6)
      .map((e) => ({
        employeeId: e.employee_id,
        employeeName: e.employee_name,
        logged: Number(e.total_hours) || 0,
        expected: 40,
      }));
  } catch {
    return [];
  }
}

async function _loadMyBalance(
  accessToken: string | null,
  profileId: number | null
) {
  if (!accessToken || profileId == null) {
    return { vacationUsed: 0, vacationTotal: 0, sickUsed: 0, wfhUsed: 0 };
  }
  try {
    const balances = await fetchLeaveBalances(accessToken);
    const mine = balances.filter((b) => Number(b.employeeId) === profileId);
    const pick = (type: LeaveType) => mine.find((b) => b.leaveType === type);
    const vac = pick("vacation");
    const sick = pick("sick");
    const wfh = pick("wfh");
    return {
      vacationUsed: vac?.used ?? 0,
      vacationTotal: vac?.allocated ?? 0,
      sickUsed: sick?.used ?? 0,
      wfhUsed: wfh?.used ?? 0,
    };
  } catch {
    return { vacationUsed: 0, vacationTotal: 0, sickUsed: 0, wfhUsed: 0 };
  }
}

async function _loadMyRequests(
  accessToken: string | null,
  profileId: number | null
): Promise<MyLeaveRequest[]> {
  if (!accessToken || profileId == null) return [];
  try {
    const all = await fetchLeaveRequests(accessToken);
    return all
      .filter((r) => Number(r.employeeId) === profileId)
      .filter((r) => r.status === "pending" || r.status === "approved")
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
      .slice(0, MY_REQUESTS_LIMIT)
      .map((r) => ({
        id: r.id,
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        days: r.days,
        status: r.status as LeaveStatus,
      }));
  } catch {
    return [];
  }
}

async function _loadMyHours(
  profileId: number | null,
  today: Date
): Promise<{ logged: number; expected: number }> {
  if (profileId == null) return { logged: 0, expected: 40 };
  try {
    const weekStart = _weekStart(today);
    const payload = await timeTrackingApi.getWeeklyDashboard({
      week_start: weekStart,
      employee_id: profileId,
    });
    const mine = payload.employees.find((e) => e.employee_id === profileId);
    return { logged: Number(mine?.total_hours ?? 0), expected: 40 };
  } catch {
    return { logged: 0, expected: 40 };
  }
}

function _loadMyProjects(
  assignedProjects: DashboardCtxProject[] | undefined
): MyProjectRow[] {
  if (!assignedProjects || assignedProjects.length === 0) return [];
  return assignedProjects.slice(0, PROJECTS_LIMIT).map((p) => ({
    id: p.projectId,
    name: p.projectName,
    role: p.role || "Contributor",
    leadName: "—",
    allocation: p.allocationPercentage,
  }));
}

async function _loadMyNextReview(
  accessToken: string | null,
  profileId: number | null
) {
  if (!accessToken || profileId == null) return null;
  try {
    const all = await fetchPerformanceReviews(accessToken);
    const upcoming = all
      .filter((r) => Number(r.employeeId) === profileId)
      .filter((r) => r.status !== "completed" && r.status !== "cancelled")
      .sort((a, b) => (a.scheduledDate < b.scheduledDate ? -1 : 1));
    const next = upcoming[0];
    if (!next) return null;
    return {
      kind: next.reviewType,
      dueDate: next.scheduledDate,
      reviewerName: next.reviewerName || "—",
    };
  } catch {
    return null;
  }
}

async function _loadMyTraining(
  accessToken: string | null,
  profileId: number | null
) {
  const fallback = {
    budgetTotal: 0,
    budgetUsed: 0,
    currency: "EUR",
    items: [] as MyTrainingItem[],
  };
  if (profileId == null) return fallback;
  try {
    const budget = await trainingBudgetsApi.me();
    let items: MyTrainingItem[] = [];
    if (accessToken) {
      try {
        const entries = await fetchTrainingEntries(accessToken, {
          employeeId: profileId,
        });
        items = entries.slice(0, 4).map((e) => ({
          id: e.id,
          name: e.courseTitle,
          kind: e.trainingTypeDisplay || e.trainingType,
          status:
            e.status === "completed"
              ? "Completed"
              : e.status === "planned"
                ? "Requested"
                : "Pending",
          cost: Number(e.cost) || 0,
        }));
      } catch {
        items = [];
      }
    }
    return {
      budgetTotal: budget.allocatedBudget,
      budgetUsed: budget.usedBudget,
      currency: "EUR",
      items,
    };
  } catch {
    return fallback;
  }
}

async function _loadOpenRoles(): Promise<OpenRoleItem[]> {
  try {
    const listings = await jobListingsApi.listActiveListings();
    return listings.slice(0, OPEN_ROLES_LIMIT).map((r) => ({
      id: r.id,
      title: r.title,
      department: r.departmentName || "—",
      level: "—",
      matchStrength: "match",
    }));
  } catch {
    return [];
  }
}

// ── Per-persona orchestrators ───────────────────────────────────────────────

export async function loadHrDashboard(
  ctx: DashboardCtx,
  signal?: AbortSignal
): Promise<HrDashboardData> {
  const today = ctx.today ?? new Date();
  const year = today.getFullYear();
  const [
    headcount,
    pending,
    onboarding,
    outToday,
    announcements,
    celebrations,
  ] = await Promise.all([
    _loadHeadcount(year),
    _loadHrPendingRequests(ctx.accessToken),
    _loadOnboarding(ctx.accessToken),
    _loadOutToday(today),
    _loadAnnouncements(signal),
    _loadCelebrations(signal),
  ]);

  return {
    headcount: { ...headcount, deltaThisMonth: 0 },
    pendingApprovals: {
      items: pending.items,
      total: pending.total,
    },
    outToday,
    onboarding,
    celebrations,
    announcements,
  };
}

export async function loadManagerDashboard(
  ctx: DashboardCtx,
  signal?: AbortSignal
): Promise<ManagerDashboardData> {
  const today = ctx.today ?? new Date();
  const team = await _loadTeam(ctx.accessToken);
  const [pending, reviews, teamTime, teamOut, celebrations, announcements] =
    await Promise.all([
      _loadManagerApprovalQueueItems(ctx.accessToken),
      _loadReviewsDue(ctx.accessToken, ctx.userId),
      _loadTeamTime(team.ids, today),
      _loadOutToday(today, team.ids),
      _loadCelebrations(signal),
      _loadAnnouncements(signal),
    ]);

  return {
    teamSize: team.size,
    teamPending: pending,
    teamOut,
    teamReviews: reviews,
    teamTime,
    celebrations,
    announcements,
  };
}

export async function loadEmployeeDashboard(
  ctx: DashboardCtx,
  signal?: AbortSignal
): Promise<EmployeeDashboardData> {
  const today = ctx.today ?? new Date();
  const projects = _loadMyProjects(ctx.assignedProjects);
  const [
    balance,
    myRequests,
    hoursThisWeek,
    nextReview,
    training,
    openRoles,
    outToday,
    celebrations,
    announcements,
  ] = await Promise.all([
    _loadMyBalance(ctx.accessToken, ctx.profileId),
    _loadMyRequests(ctx.accessToken, ctx.profileId),
    _loadMyHours(ctx.profileId, today),
    _loadMyNextReview(ctx.accessToken, ctx.profileId),
    _loadMyTraining(ctx.accessToken, ctx.profileId),
    _loadOpenRoles(),
    _loadOutToday(today),
    _loadCelebrations(signal),
    _loadAnnouncements(signal),
  ]);

  return {
    balance,
    myRequests,
    hoursThisWeek,
    projects,
    nextReview,
    training,
    openRoles,
    outToday,
    celebrations,
    announcements,
  };
}
