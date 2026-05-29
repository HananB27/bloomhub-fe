/**
 * Format a date string as a locale date (e.g. "Jan 15, 2025").
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string with weekday (e.g. "Mon, Jan 15").
 */
export function formatDateWithWeekday(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a timestamp as relative time (e.g. "Just now", "5m ago", "2h ago", "3d ago")
 * or as a locale date if older than 7 days.
 */
export function formatRelativeTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Return whether the given expiry date falls within the next 30 days.
 */
export function isExpiringNext30Days(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry >= new Date() && expiry <= thirtyDaysFromNow;
}

/**
 * Days from now until the given ISO date (positive = future, negative = past).
 */
export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((target - now) / 86400000);
}

/**
 * Format an ISO date relative to now, in "posted ago" style:
 * "today", "5d ago", "3w ago", "2mo ago". Days-based, no hour granularity.
 */
export function formatPostedAgo(iso: string): string {
  const d = daysUntil(iso);
  if (d > -1) return "today";
  if (d > -7) return `${-d}d ago`;
  if (d > -30) return `${Math.round(-d / 7)}w ago`;
  return `${Math.round(-d / 30)}mo ago`;
}

/**
 * Format an ISO date as a short month-day label (e.g. "Jan 15").
 */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
