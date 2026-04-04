export type LeaveType =
  | "vacation"
  | "sick"
  | "wfh"
  | "personal"
  | "maternity"
  | "paternity"
  | "bereavement"
  | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  leaveType: LeaveType;
  startDate: string; // ISO date format
  endDate: string; // ISO date format
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedDate: string;
  coveringEmployeeId?: string;
  coveringEmployeeName?: string;
  approverComments?: string;
  rejectionReason?: string;
  approverId?: string;
  approverName?: string;
  approvedDate?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
  carryOver: number;
  lastUpdated: string;
}

export interface LeaveBalanceSummary {
  vacation: LeaveBalance;
  sick: LeaveBalance;
  wfh: LeaveBalance;
  personal: LeaveBalance;
  maternity: LeaveBalance;
  paternity: LeaveBalance;
  bereavement: LeaveBalance;
  unpaid: LeaveBalance;
}

export interface TeamCalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
}

export interface LeavePolicy {
  id: string;
  leaveType: LeaveType;
  allocatedDaysPerYear: number;
  carryOverDays: number;
  requiresApproval: boolean;
  requiresCoveringEmployee: boolean;
  minNoticeInDays: number;
}

export interface LeaveApprovalWorkflow {
  requestId: string;
  currentApproverId: string;
  approvalChain: string[]; // List of approver IDs in order
  currentApprovalStep: number;
  status: "pending" | "in_review" | "approved" | "rejected";
  comments: string[];
}

export interface CreateLeaveRequestPayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  coveringEmployeeId?: string;
}

export interface ApproveLeaveRequestPayload {
  requestId: string;
  status: "approved" | "rejected";
  comments?: string;
}

export interface UpdateLeaveBalancePayload {
  employeeId: string;
  leaveType: LeaveType;
  allocated?: number;
  used?: number;
  carryOver?: number;
  reason?: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: "Vacation",
  sick: "Sick Leave",
  wfh: "Work From Home",
  personal: "Personal",
  maternity: "Maternity",
  paternity: "Paternity",
  bereavement: "Bereavement",
  unpaid: "Unpaid Leave",
};

// All leave types as an array for iteration
export const ALL_LEAVE_TYPES: LeaveType[] = [
  "vacation",
  "sick",
  "wfh",
  "personal",
  "maternity",
  "paternity",
  "bereavement",
  "unpaid",
];

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  vacation: "bg-blue-500",
  sick: "bg-red-500",
  wfh: "bg-green-500",
  personal: "bg-purple-500",
  maternity: "bg-pink-500",
  paternity: "bg-indigo-500",
  bereavement: "bg-gray-500",
  unpaid: "bg-yellow-500",
};

export const LEAVE_TYPE_BADGE_COLORS: Record<LeaveType, string> = {
  vacation: "bg-blue-100 text-blue-800 border-blue-200",
  sick: "bg-red-100 text-red-800 border-red-200",
  wfh: "bg-green-100 text-green-800 border-green-200",
  personal: "bg-purple-100 text-purple-800 border-purple-200",
  maternity: "bg-pink-100 text-pink-800 border-pink-200",
  paternity: "bg-indigo-100 text-indigo-800 border-indigo-200",
  bereavement: "bg-gray-100 text-gray-800 border-gray-200",
  unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
};
