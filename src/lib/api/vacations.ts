import { getApiBaseUrl } from "../config";
import type {
  CreateLeaveRequestPayload,
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  TeamCalendarEvent,
  UpdateLeaveBalancePayload,
} from "@/types/vacations";

const API_BASE_URL = getApiBaseUrl();

// ============================================
// TRANSFORMATION UTILITIES (snake_case <-> camelCase)
// ============================================

interface ApiLeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_avatar: string | null;
  leave_type: string;
  leave_type_display: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
  status_display: string;
  covering_employee_id: number | null;
  covering_employee_name: string | null;
  submitted_date: string;
  approver_id: number | null;
  approver_name: string | null;
  approved_date: string | null;
  approval_comments: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

interface ApiLeaveBalance {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type: string;
  leave_type_display: string;
  allocated: number;
  used: number;
  remaining: number;
  carryover: number;
  year: number;
  last_updated: string;
}

interface ApiLeavePolicy {
  id: number;
  leave_type: string;
  leave_type_display: string;
  allocated_days_per_year: number;
  max_carryover_days: number;
  requires_approval: boolean;
  requires_covering_employee: boolean;
  min_notice_in_days: number;
  max_consecutive_days: number | null;
  is_active: boolean;
}

interface ApiTeamCalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Transform API response to frontend LeaveRequest format
 */
function transformLeaveRequest(api: ApiLeaveRequest): LeaveRequest {
  return {
    id: String(api.id),
    employeeId: String(api.employee_id),
    employeeName: api.employee_name || "Unknown",
    employeeAvatar: api.employee_avatar || undefined,
    leaveType: api.leave_type as LeaveType,
    startDate: api.start_date,
    endDate: api.end_date,
    days: api.days,
    reason: api.reason,
    status: api.status as "pending" | "approved" | "rejected" | "cancelled",
    submittedDate: api.submitted_date,
    coveringEmployeeId: api.covering_employee_id
      ? String(api.covering_employee_id)
      : undefined,
    coveringEmployeeName: api.covering_employee_name || undefined,
    approverComments: api.approval_comments || undefined,
    rejectionReason: api.rejection_reason || undefined,
    approverId: api.approver_id ? String(api.approver_id) : undefined,
    approverName: api.approver_name || undefined,
    approvedDate: api.approved_date || undefined,
  };
}

/**
 * Transform API response to frontend LeaveBalance format
 */
function transformLeaveBalance(api: ApiLeaveBalance): LeaveBalance {
  return {
    id: String(api.id),
    employeeId: String(api.employee_id),
    leaveType: api.leave_type as LeaveType,
    allocated: api.allocated,
    used: api.used,
    remaining: api.remaining,
    carryOver: api.carryover,
    lastUpdated: api.last_updated,
  };
}

/**
 * Transform API response to frontend LeavePolicy format
 */
function transformLeavePolicy(api: ApiLeavePolicy): LeavePolicy {
  return {
    id: String(api.id),
    leaveType: api.leave_type as LeaveType,
    allocatedDaysPerYear: api.allocated_days_per_year,
    carryOverDays: api.max_carryover_days,
    requiresApproval: api.requires_approval,
    requiresCoveringEmployee: api.requires_covering_employee,
    minNoticeInDays: api.min_notice_in_days,
  };
}

/**
 * Transform API response to frontend TeamCalendarEvent format
 */
function transformTeamCalendarEvent(
  api: ApiTeamCalendarEvent
): TeamCalendarEvent {
  return {
    id: api.id,
    employeeId: api.employeeId,
    employeeName: api.employeeName || "Unknown",
    leaveType: api.leaveType as LeaveType,
    startDate: api.startDate,
    endDate: api.endDate,
    status: api.status as "pending" | "approved" | "rejected" | "cancelled",
  };
}

/**
 * Fetch leave policies
 */
export const fetchLeavePolicies = async (
  accessToken: string
): Promise<LeavePolicy[]> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-policies/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch leave policies");
  }

  const data: ApiLeavePolicy[] = await response.json();
  return data.map(transformLeavePolicy);
};

/**
 * Fetch leave balances for the authenticated user
 */
export const fetchLeaveBalances = async (
  accessToken: string
): Promise<LeaveBalance[]> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-balances/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch leave balances");
  }

  const data: ApiLeaveBalance[] = await response.json();
  return data.map(transformLeaveBalance);
};

/**
 * Fetch a specific leave balance
 */
export const fetchLeaveBalance = async (
  id: string,
  accessToken: string
): Promise<LeaveBalance> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-balances/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 404) {
      throw new Error("Leave balance not found");
    }
    throw new Error("Failed to fetch leave balance");
  }

  const data: ApiLeaveBalance = await response.json();
  return transformLeaveBalance(data);
};

/**
 * Update leave balance (admin only)
 */
export const updateLeaveBalance = async (
  id: string,
  payload: Pick<UpdateLeaveBalancePayload, "allocated" | "reason">,
  accessToken: string
): Promise<LeaveBalance> => {
  const response = await fetch(
    `${API_BASE_URL}/api/leave-balances/${id}/adjust/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        allocated: payload.allocated,
        reason: payload.reason,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: Only HR admins can adjust balances");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update leave balance");
  }

  const data: ApiLeaveBalance = await response.json();
  return transformLeaveBalance(data);
};

/**
 * Fetch all leave requests (user's own + team if manager)
 */
export const fetchLeaveRequests = async (
  accessToken: string
): Promise<LeaveRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-requests/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch leave requests");
  }

  const data: ApiLeaveRequest[] = await response.json();
  return data.map(transformLeaveRequest);
};

/**
 * Fetch a specific leave request
 */
export const fetchLeaveRequest = async (
  id: string,
  accessToken: string
): Promise<LeaveRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-requests/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 404) {
      throw new Error("Leave request not found");
    }
    throw new Error("Failed to fetch leave request");
  }

  const data: ApiLeaveRequest = await response.json();
  return transformLeaveRequest(data);
};

/**
 * Create a new leave request
 */
export const createLeaveRequest = async (
  payload: CreateLeaveRequestPayload,
  accessToken: string
): Promise<LeaveRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-requests/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      leave_type: payload.leaveType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      reason: payload.reason,
      covering_employee_id: payload.coveringEmployeeId || null,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    const error = await response.json().catch(() => ({}));
    // Extract validation errors
    if (error.non_field_errors) {
      throw new Error(error.non_field_errors[0]);
    }
    if (error.start_date) {
      throw new Error(error.start_date[0]);
    }
    if (error.end_date) {
      throw new Error(error.end_date[0]);
    }
    if (error.error) {
      throw new Error(error.error);
    }
    throw new Error("Failed to create leave request");
  }

  const data: ApiLeaveRequest = await response.json();
  return transformLeaveRequest(data);
};

/**
 * Approve a leave request (manager/HR only)
 */
export const approveLeaveRequest = async (
  id: string,
  comments: string,
  accessToken: string
): Promise<LeaveRequest> => {
  const response = await fetch(
    `${API_BASE_URL}/api/leave-requests/${id}/approve/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ comments }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: Only managers can approve requests");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to approve leave request");
  }

  const data: ApiLeaveRequest = await response.json();
  return transformLeaveRequest(data);
};

/**
 * Reject a leave request (manager/HR only)
 */
export const rejectLeaveRequest = async (
  id: string,
  reason: string,
  accessToken: string
): Promise<LeaveRequest> => {
  const response = await fetch(
    `${API_BASE_URL}/api/leave-requests/${id}/reject/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: Only managers can reject requests");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to reject leave request");
  }

  const data: ApiLeaveRequest = await response.json();
  return transformLeaveRequest(data);
};

/**
 * Cancel own leave request
 */
export const cancelLeaveRequest = async (
  id: string,
  accessToken: string
): Promise<LeaveRequest> => {
  const response = await fetch(
    `${API_BASE_URL}/api/leave-requests/${id}/cancel/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: You can only cancel your own requests");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to cancel leave request");
  }

  const data: ApiLeaveRequest = await response.json();
  return transformLeaveRequest(data);
};

/**
 * Fetch pending leave requests for approval (manager/HR only)
 */
export const fetchPendingApprovals = async (
  accessToken: string
): Promise<LeaveRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/leave-requests/pending/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: Only managers can view pending approvals");
    }
    throw new Error("Failed to fetch pending approvals");
  }

  const data: ApiLeaveRequest[] = await response.json();
  return data.map(transformLeaveRequest);
};

/**
 * Fetch team calendar events (approved leaves)
 */
export const fetchTeamCalendar = async (
  accessToken: string,
  startDate?: string,
  endDate?: string
): Promise<TeamCalendarEvent[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const url = `${API_BASE_URL}/api/leave-requests/team-calendar/${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch team calendar");
  }

  const data: ApiTeamCalendarEvent[] = await response.json();
  return data.map(transformTeamCalendarEvent);
};
