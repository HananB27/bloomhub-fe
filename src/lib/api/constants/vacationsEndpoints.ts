export const LEAVE_POLICIES_PATH = "/api/leave-policies/";
export const LEAVE_BALANCES_PATH = "/api/leave-balances/";
export const LEAVE_REQUESTS_PATH = "/api/leave-requests/";
export const LEAVE_REQUESTS_PENDING_PATH = "/api/leave-requests/pending/";
export const LEAVE_REQUESTS_HR_PENDING_PATH = "/api/leave-requests/hr-pending/";
export const LEAVE_REQUESTS_TEAM_CALENDAR_PATH =
  "/api/leave-requests/team-calendar/";

export function leaveBalanceDetailPath(id: string): string {
  return `${LEAVE_BALANCES_PATH}${id}/`;
}

export function leaveBalanceAdjustPath(id: string): string {
  return `${LEAVE_BALANCES_PATH}${id}/adjust/`;
}

export function leaveRequestDetailPath(id: string): string {
  return `${LEAVE_REQUESTS_PATH}${id}/`;
}

export function leaveRequestApprovePath(id: string): string {
  return `${LEAVE_REQUESTS_PATH}${id}/approve/`;
}

export function leaveRequestHrApprovePath(id: string): string {
  return `${LEAVE_REQUESTS_PATH}${id}/hr-approve/`;
}

export function leaveRequestRejectPath(id: string): string {
  return `${LEAVE_REQUESTS_PATH}${id}/reject/`;
}

export function leaveRequestCancelPath(id: string): string {
  return `${LEAVE_REQUESTS_PATH}${id}/cancel/`;
}
