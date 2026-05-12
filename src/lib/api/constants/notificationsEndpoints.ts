export const NOTIFICATIONS_API_BASE_PATH = "/api/notifications/";

export const NOTIFICATIONS_UNREAD_COUNT_PATH = `${NOTIFICATIONS_API_BASE_PATH}unread-count/`;
export const NOTIFICATIONS_MARK_ALL_READ_PATH = `${NOTIFICATIONS_API_BASE_PATH}mark-all-read/`;

export function notificationMarkReadPath(id: number | string): string {
  return `${NOTIFICATIONS_API_BASE_PATH}${id}/mark-read/`;
}
