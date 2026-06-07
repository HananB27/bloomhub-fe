export {
  daysUntil,
  formatDate,
  formatDateRange,
  formatDateShort,
  formatDateWithWeekday,
  formatLongDate,
  formatPostedAgo,
  formatRelativeTimestamp,
  greetingForHour,
  isExpiringNext30Days,
} from "./date";
export { formatCurrency } from "./format";
export interface IAnalyticsService {
  fetchAnalytics(employeeId: string): Promise<unknown>;
}
