import type { PerformanceReviewListItem, ReviewStatus } from "@/types/reviews";

export const REVIEW_STATUS_FILTER_ALL = "all" as const;
export type ReviewStatusFilter = ReviewStatus | typeof REVIEW_STATUS_FILTER_ALL;

export const REVIEW_STATUS_FILTER_OPTIONS: Array<{
  value: ReviewStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export interface ReviewBuckets {
  overdue: PerformanceReviewListItem[];
  thisWeek: PerformanceReviewListItem[];
  later: PerformanceReviewListItem[];
}

export interface ReviewStats {
  scheduled: number;
  inProgress: number;
  overdue: number;
  completedYtd: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function dueLabel(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 0) return `In ${n} days`;
  return `${Math.abs(n)} days overdue`;
}

export function isOverdue(item: PerformanceReviewListItem): boolean {
  if (item.status === "completed" || item.status === "cancelled") return false;
  return daysUntil(item.scheduledDate) < 0;
}

export function filterReviews(
  reviews: PerformanceReviewListItem[],
  search: string,
  status: ReviewStatusFilter
): PerformanceReviewListItem[] {
  const term = search.trim().toLowerCase();
  return reviews.filter((r) => {
    if (status !== REVIEW_STATUS_FILTER_ALL && r.status !== status)
      return false;
    if (!term) return true;
    return (
      r.employeeName.toLowerCase().includes(term) ||
      r.reviewerName.toLowerCase().includes(term)
    );
  });
}

export function bucketOpenReviews(
  reviews: PerformanceReviewListItem[]
): ReviewBuckets {
  const open = reviews.filter(
    (r) => r.status === "scheduled" || r.status === "in_progress"
  );
  const overdue: PerformanceReviewListItem[] = [];
  const thisWeek: PerformanceReviewListItem[] = [];
  const later: PerformanceReviewListItem[] = [];
  for (const r of open) {
    const n = daysUntil(r.scheduledDate);
    if (n < 0) overdue.push(r);
    else if (n <= 7) thisWeek.push(r);
    else later.push(r);
  }
  const byDate = (a: PerformanceReviewListItem, b: PerformanceReviewListItem) =>
    a.scheduledDate.localeCompare(b.scheduledDate);
  return {
    overdue: overdue.sort(byDate),
    thisWeek: thisWeek.sort(byDate),
    later: later.sort(byDate),
  };
}

export function computeReviewStats(
  reviews: PerformanceReviewListItem[]
): ReviewStats {
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);
  let scheduled = 0;
  let inProgress = 0;
  let overdue = 0;
  let completedYtd = 0;
  for (const r of reviews) {
    if (r.status === "scheduled") scheduled += 1;
    if (r.status === "in_progress") inProgress += 1;
    if (isOverdue(r)) overdue += 1;
    if (
      r.status === "completed" &&
      r.completedAt &&
      new Date(r.completedAt).getTime() >= yearStart.getTime()
    ) {
      completedYtd += 1;
    }
  }
  return { scheduled, inProgress, overdue, completedYtd };
}

export function sortHistory(
  reviews: PerformanceReviewListItem[]
): PerformanceReviewListItem[] {
  return [...reviews]
    .filter((r) => r.status === "completed" || r.status === "cancelled")
    .sort((a, b) => {
      const aDate = a.completedAt || a.scheduledDate;
      const bDate = b.completedAt || b.scheduledDate;
      return bDate.localeCompare(aDate);
    });
}

const PERSON_AVATAR_COLORS = [
  "#d97706",
  "#4f46e5",
  "#e11d48",
  "#0891b2",
  "#16a34a",
  "#7c3aed",
  "#db2777",
  "#0284c7",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return PERSON_AVATAR_COLORS[Math.abs(hash) % PERSON_AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
