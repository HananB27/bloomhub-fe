"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { DatePicker } from "./DatePicker";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Plus,
  Edit,
  AlertCircle,
  Umbrella,
  Heart,
  Home,
  Baby,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { formatDate } from "@/utils";
import { format } from "date-fns";
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  TempoSyncStatus,
  TeamCalendarEvent,
  CreateLeaveRequestPayload,
  VacationCapabilities,
  VacationTeamMember,
} from "@/types/vacations";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_COLORS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_BADGE_COLORS,
  ALL_LEAVE_TYPES,
  DEFAULT_VACATION_CAPABILITIES,
} from "@/types/vacations";
import {
  fetchLeaveRequests,
  fetchLeaveBalances,
  fetchTeamCalendar,
  fetchVacationCapabilities,
  fetchVacationTeamMembers,
  createLeaveRequest,
  approveLeaveRequest,
  hrApproveLeaveRequest,
  rejectLeaveRequest,
  updateLeaveBalance,
} from "@/lib/api/vacations";

// Extend session type to include accessToken
interface ExtendedSession {
  accessToken?: string;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const getLeaveTypeIcon = (type: LeaveType) => {
  const iconProps = "h-4 w-4";
  switch (type) {
    case "vacation":
      return <Umbrella className={iconProps} />;
    case "sick":
      return <Heart className={iconProps} />;
    case "wfh":
      return <Home className={iconProps} />;
    case "personal":
      return <User className={iconProps} />;
    case "maternity":
    case "paternity":
      return <Baby className={iconProps} />;
    default:
      return <CalendarIcon className={iconProps} />;
  }
};

const LOW_BALANCE_THRESHOLD_DAYS = 2;

const getBalanceUsagePercent = (balance: LeaveBalance): number => {
  if (balance.allocated <= 0) return 0;
  return Math.min(100, Math.round((balance.used / balance.allocated) * 100));
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string): Date | undefined => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const isLowBalance = (balance: LeaveBalance): boolean =>
  balance.remaining <= LOW_BALANCE_THRESHOLD_DAYS;

const isPartiallyUsedBalance = (balance: LeaveBalance): boolean =>
  balance.used > 0 && balance.used < balance.allocated;

const getEmployeeInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

const TEMPO_SYNC_STATUS_LABELS: Record<TempoSyncStatus, string> = {
  synced: "Synced",
  failed: "Failed",
  pending: "Pending",
  skipped: "Skipped",
  deleted: "Deleted",
  not_started: "Not started",
};

const TEMPO_SYNC_STATUS_CLASSES: Record<TempoSyncStatus, string> = {
  synced: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  skipped: "bg-gray-100 text-gray-700 border-gray-200",
  deleted: "bg-gray-100 text-gray-700 border-gray-200",
  not_started: "bg-gray-50 text-gray-500 border-gray-200",
};

function TempoSyncBadge({ status }: { status?: TempoSyncStatus | null }) {
  if (!status) {
    return (
      <Badge className="border-gray-200 bg-gray-50 text-gray-500">
        Not started
      </Badge>
    );
  }

  return (
    <Badge className={TEMPO_SYNC_STATUS_CLASSES[status]}>
      {TEMPO_SYNC_STATUS_LABELS[status]}
    </Badge>
  );
}

interface VacationsModuleProps {
  addNotification?: (
    module: "vacations",
    type: "info" | "warning" | "success" | "alert",
    title: string,
    message: string
  ) => void;
}

interface EmployeeLeaveBalanceGroup {
  employeeId: string;
  employeeName: string;
  balances: LeaveBalance[];
}

export function VacationsModule({ addNotification }: VacationsModuleProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("request");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestFormError, setRequestFormError] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capabilities are server-derived from the user's permission bitmap.
  const [capabilities, setCapabilities] = useState<VacationCapabilities>(
    DEFAULT_VACATION_CAPABILITIES
  );
  const canApproveRequests = capabilities.canApproveRequests;
  const canHrApprove = capabilities.canHrApprove;
  const canAdjustBalances = capabilities.canAdjustBalances;
  const canConfigureLeaveTypes = capabilities.canConfigureLeaveTypes;
  const showAdminTabs = canAdjustBalances || canConfigureLeaveTypes;

  // Data states - initialize as empty, will be populated from API
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamCalendarEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<VacationTeamMember[]>([]);
  const [selectedPolicyEmployeeId, setSelectedPolicyEmployeeId] = useState<
    string | null
  >(null);
  const [policyEmployeeSearch, setPolicyEmployeeSearch] = useState("");
  const [policyLeaveTypeFilter, setPolicyLeaveTypeFilter] = useState<
    LeaveType | "all"
  >("all");
  const [policyBalanceFilter, setPolicyBalanceFilter] = useState<"all" | "low">(
    "all"
  );

  const [selectedStartDate, setSelectedStartDate] = useState<Date>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [reason, setReason] = useState("");
  const [coveringEmployee, setCoveringEmployee] = useState("");

  const [adminBalanceForm, setAdminBalanceForm] = useState({
    leaveType: "",
    newBalance: "",
    reason: "",
  });

  type CommentDialogKind = "lead" | "hr" | "reject";
  interface CommentDialogState {
    open: boolean;
    kind: CommentDialogKind;
    requestId: string;
    employeeName: string;
    comment: string;
    isSubmitting: boolean;
  }
  const [commentDialog, setCommentDialog] = useState<CommentDialogState>({
    open: false,
    kind: "lead",
    requestId: "",
    employeeName: "",
    comment: "",
    isSubmitting: false,
  });

  const COMMENT_DIALOG_COPY: Record<
    CommentDialogKind,
    {
      title: string;
      description: string;
      label: string;
      placeholder: string;
      confirmLabel: string;
      requireText: boolean;
    }
  > = {
    lead: {
      title: "Approve leave request",
      description: "Add optional approval comments before forwarding to HR.",
      label: "Approval comments",
      placeholder: "Optional comments...",
      confirmLabel: "Approve",
      requireText: false,
    },
    hr: {
      title: "Final approve leave request",
      description:
        "Add optional HR approval comments. This deducts the balance.",
      label: "HR approval comments",
      placeholder: "Optional comments...",
      confirmLabel: "Approve",
      requireText: false,
    },
    reject: {
      title: "Reject leave request",
      description: "Provide a reason — the employee will see this.",
      label: "Reason for rejection",
      placeholder: "Reason...",
      confirmLabel: "Reject",
      requireText: true,
    },
  };

  // Team calendar month navigation state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Get current user's employee ID from session
  const currentUserEmployeeId = (session as ExtendedSession)?.user?.id
    ? String((session as ExtendedSession)?.user?.id)
    : null;

  // The "My Leave Policies" card always shows the current user's balances.
  // The admin "Leave Policies" tab shows all balances (gated by capability).
  const myBalances = useMemo(
    () => leaveBalances.filter((b) => b.employeeId === currentUserEmployeeId),
    [currentUserEmployeeId, leaveBalances]
  );
  const myVisibleBalances = useMemo(
    () => myBalances.filter(isPartiallyUsedBalance),
    [myBalances]
  );
  const displayedBalances = canConfigureLeaveTypes ? leaveBalances : myBalances;
  const groupedDisplayedBalances = useMemo(() => {
    return Array.from(
      displayedBalances
        .reduce((groups, balance) => {
          const employeeGroup = groups.get(balance.employeeId) ?? {
            employeeId: balance.employeeId,
            employeeName:
              balance.employeeName?.trim() || `Employee ${balance.employeeId}`,
            balances: [] as LeaveBalance[],
          };

          employeeGroup.balances.push(balance);
          groups.set(balance.employeeId, employeeGroup);
          return groups;
        }, new Map<string, EmployeeLeaveBalanceGroup>())
        .values()
    ).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [displayedBalances]);
  const selectedPolicyEmployee = useMemo(
    () =>
      groupedDisplayedBalances.find(
        (group) => group.employeeId === selectedPolicyEmployeeId
      ) ?? null,
    [groupedDisplayedBalances, selectedPolicyEmployeeId]
  );
  const filteredPolicyEmployeeGroups = useMemo(() => {
    const normalizedSearch = policyEmployeeSearch.trim().toLowerCase();

    return groupedDisplayedBalances.filter((group) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.employeeName.toLowerCase().includes(normalizedSearch);
      const matchesLeaveType =
        policyLeaveTypeFilter === "all" ||
        group.balances.some(
          (balance) => balance.leaveType === policyLeaveTypeFilter
        );
      const matchesBalanceFilter =
        policyBalanceFilter === "all" ||
        group.balances.some((balance) => isLowBalance(balance));

      return matchesSearch && matchesLeaveType && matchesBalanceFilter;
    });
  }, [
    groupedDisplayedBalances,
    policyBalanceFilter,
    policyEmployeeSearch,
    policyLeaveTypeFilter,
  ]);

  // Get access token from session
  const getAccessToken = useCallback((): string | null => {
    const extSession = session as ExtendedSession;
    if (extSession?.accessToken) {
      return extSession.accessToken;
    }
    // Fallback: check localStorage
    if (typeof window !== "undefined") {
      const tokenKeys = ["access", "accessToken", "token", "authToken", "jwt"];
      for (const key of tokenKeys) {
        const token = window.localStorage.getItem(key);
        if (token) return token;
      }
    }
    return null;
  }, [session]);

  // Fetch all data from API
  const loadData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Not authenticated. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        requestsData,
        balancesData,
        calendarData,
        capabilitiesData,
        teamMembersData,
      ] = await Promise.all([
        fetchLeaveRequests(token),
        fetchLeaveBalances(token),
        fetchTeamCalendar(token),
        fetchVacationCapabilities(token),
        fetchVacationTeamMembers(token),
      ]);

      setLeaveRequests(requestsData);
      setLeaveBalances(balancesData);
      setTeamEvents(calendarData);
      setCapabilities(capabilitiesData);
      setTeamMembers(teamMembersData);
    } catch (err) {
      console.error("Failed to load vacation data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  // Load data on mount and when session changes
  useEffect(() => {
    if (sessionStatus === "loading") return;
    loadData();
  }, [sessionStatus, loadData]);

  useEffect(() => {
    if (activeTab === "policies" && !canConfigureLeaveTypes) {
      setActiveTab("request");
    }
    if (activeTab === "admin" && !canAdjustBalances) {
      setActiveTab("request");
    }
  }, [activeTab, canAdjustBalances, canConfigureLeaveTypes]);

  const calculateDays = (start?: Date, end?: Date): number => {
    if (!start || !end) return 0;
    return (
      Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  const handleSubmitRequest = async () => {
    if (!leaveType || !selectedStartDate || !selectedEndDate || !reason) {
      setRequestFormError("Please fill in all required fields.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setRequestFormError("Not authenticated. Please log in.");
      return;
    }

    setIsSubmitting(true);
    setRequestFormError(null);

    try {
      const payload: CreateLeaveRequestPayload = {
        leaveType: leaveType as LeaveType,
        startDate: formatLocalDate(selectedStartDate),
        endDate: formatLocalDate(selectedEndDate),
        reason,
        coveringEmployeeId: coveringEmployee || undefined,
      };

      const newRequest = await createLeaveRequest(payload, token);
      setLeaveRequests((prev) => [newRequest, ...prev]);

      // Reset form
      setLeaveType("");
      setSelectedStartDate(undefined);
      setSelectedEndDate(undefined);
      setReason("");
      setCoveringEmployee("");

      // Send notification
      if (addNotification) {
        addNotification(
          "vacations",
          "success",
          "Leave Request Submitted",
          `Your ${leaveType} request has been submitted successfully.`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit request";
      setRequestFormError(message);
      if (addNotification) {
        addNotification("vacations", "alert", "Request Failed", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCommentDialog = (kind: CommentDialogKind, id: string) => {
    const request = leaveRequests.find((r) => r.id === id);
    if (!request) return;
    setAdminActionError(null);
    setCommentDialog({
      open: true,
      kind,
      requestId: id,
      employeeName: request.employeeName,
      comment: "",
      isSubmitting: false,
    });
  };

  const closeCommentDialog = () => {
    setCommentDialog((prev) => ({ ...prev, open: false }));
  };

  const handleLeadApprove = (id: string) => openCommentDialog("lead", id);
  const handleHrApprove = (id: string) => openCommentDialog("hr", id);
  const handleReject = (id: string) => openCommentDialog("reject", id);

  const confirmCommentDialog = async () => {
    const { kind, requestId, comment, employeeName } = commentDialog;
    const trimmed = comment.trim();
    if (COMMENT_DIALOG_COPY[kind].requireText && !trimmed) {
      setAdminActionError("A reason is required to reject the request.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setAdminActionError("Not authenticated. Please log in.");
      return;
    }

    setCommentDialog((prev) => ({ ...prev, isSubmitting: true }));
    setAdminActionError(null);

    try {
      let updatedRequest;
      if (kind === "lead") {
        updatedRequest = await approveLeaveRequest(requestId, trimmed, token);
      } else if (kind === "hr") {
        updatedRequest = await hrApproveLeaveRequest(requestId, trimmed, token);
      } else {
        updatedRequest = await rejectLeaveRequest(requestId, trimmed, token);
      }

      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === requestId ? updatedRequest : r))
      );

      if (kind === "hr") {
        if (!teamEvents.find((e) => e.id === requestId)) {
          setTeamEvents((prev) => [
            ...prev,
            {
              id: requestId,
              employeeId: updatedRequest.employeeId,
              employeeName: updatedRequest.employeeName,
              leaveType: updatedRequest.leaveType,
              startDate: updatedRequest.startDate,
              endDate: updatedRequest.endDate,
              status: "approved",
            },
          ]);
        }
        const balancesData = await fetchLeaveBalances(token);
        setLeaveBalances(balancesData);
      }

      if (addNotification) {
        if (kind === "lead") {
          addNotification(
            "vacations",
            "success",
            "Request Lead-Approved",
            `Leave request for ${employeeName} has been approved by lead and is pending HR review.`
          );
        } else if (kind === "hr") {
          addNotification(
            "vacations",
            "success",
            "Request Fully Approved",
            `Leave request for ${employeeName} has been fully approved.`
          );
        } else {
          addNotification(
            "vacations",
            "success",
            "Request Rejected",
            `Leave request for ${employeeName} has been rejected.`
          );
        }
      }

      setCommentDialog((prev) => ({
        ...prev,
        open: false,
        isSubmitting: false,
      }));
    } catch (err) {
      const fallback =
        kind === "reject"
          ? "Failed to reject request"
          : kind === "hr"
            ? "Failed to HR-approve request"
            : "Failed to approve request";
      const message = err instanceof Error ? err.message : fallback;
      setAdminActionError(message);
      if (addNotification) {
        const title =
          kind === "reject"
            ? "Rejection Failed"
            : kind === "hr"
              ? "HR Approval Failed"
              : "Approval Failed";
        addNotification("vacations", "alert", title, message);
      }
      setCommentDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleUpdateBalance = async () => {
    if (
      !adminBalanceForm.leaveType ||
      !adminBalanceForm.newBalance ||
      !adminBalanceForm.reason
    ) {
      setAdminActionError("Please fill in all fields.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setAdminActionError("Not authenticated. Please log in.");
      return;
    }

    // Find the balance ID for the selected leave type (for current user)
    const balanceToUpdate = leaveBalances.find(
      (b) =>
        b.leaveType === adminBalanceForm.leaveType &&
        b.employeeId === currentUserEmployeeId
    );

    if (!balanceToUpdate) {
      setAdminActionError(
        `Balance for ${adminBalanceForm.leaveType} not found.`
      );
      return;
    }

    try {
      setAdminActionError(null);
      const newAllocated = parseInt(adminBalanceForm.newBalance);
      const updatedBalance = await updateLeaveBalance(
        balanceToUpdate.id,
        {
          allocated: newAllocated,
          reason: adminBalanceForm.reason,
        },
        token
      );

      setLeaveBalances((prev) =>
        prev.map((b) => (b.id === balanceToUpdate.id ? updatedBalance : b))
      );

      setAdminBalanceForm({ leaveType: "", newBalance: "", reason: "" });

      // Send success notification
      if (addNotification) {
        addNotification(
          "vacations",
          "success",
          "Balance Updated",
          `Leave balance for ${adminBalanceForm.leaveType} has been updated to ${newAllocated} days.`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update balance";
      setAdminActionError(message);
      if (addNotification) {
        addNotification("vacations", "alert", "Balance Update Failed", message);
      }
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    if (!status) {
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    return (
      <Badge
        className={
          LEAVE_STATUS_BADGE_COLORS[status] ?? "bg-gray-100 text-gray-800"
        }
      >
        {LEAVE_STATUS_LABELS[status] ?? status}
      </Badge>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vacation data...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && leaveBalances.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">
            Manage vacation requests, track leave balances, and view team
            availability
          </p>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-950">
            My Leave Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myVisibleBalances.length === 0 ? (
            <p className="text-sm text-gray-500">
              No leave types currently in use.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {myVisibleBalances.map((balance) => (
                <div
                  key={balance.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getLeaveTypeIcon(balance.leaveType)}
                      <h3 className="text-sm font-medium text-gray-900">
                        {LEAVE_TYPE_LABELS[balance.leaveType]}
                      </h3>
                    </div>
                    <span
                      className={`text-sm font-semibold ${isLowBalance(balance) ? "text-red-600" : "text-green-600"}`}
                    >
                      {balance.remaining}
                    </span>
                  </div>
                  <Progress
                    value={getBalanceUsagePercent(balance)}
                    className="mt-3 h-1.5"
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{balance.used} used</span>
                    <span>{balance.allocated} allocated</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList
          className={`grid w-full ${
            showAdminTabs
              ? canAdjustBalances && canConfigureLeaveTypes
                ? "grid-cols-4"
                : "grid-cols-3"
              : "grid-cols-2"
          }`}
        >
          <TabsTrigger value="request">Request Leave</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          {canConfigureLeaveTypes && (
            <TabsTrigger value="policies">Leave Policies</TabsTrigger>
          )}
          {canAdjustBalances && (
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="request" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Submit Leave Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Leave Type *</Label>
                      <Select
                        value={leaveType}
                        onValueChange={(v) => setLeaveType(v as LeaveType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_LEAVE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {LEAVE_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Covering Employee</Label>
                      <Select
                        value={coveringEmployee}
                        onValueChange={setCoveringEmployee}
                        disabled={teamMembers.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              teamMembers.length === 0
                                ? "No teammates available"
                                : "Select covering employee"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <DatePicker
                        key={`start-${selectedStartDate ? formatLocalDate(selectedStartDate) : "empty"}`}
                        mode="single"
                        value={
                          selectedStartDate
                            ? formatLocalDate(selectedStartDate)
                            : ""
                        }
                        onChange={(date) =>
                          setSelectedStartDate(parseLocalDate(date))
                        }
                        placeholder="Pick a date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <DatePicker
                        key={`end-${selectedEndDate ? formatLocalDate(selectedEndDate) : "empty"}`}
                        mode="single"
                        value={
                          selectedEndDate
                            ? formatLocalDate(selectedEndDate)
                            : ""
                        }
                        onChange={(date) =>
                          setSelectedEndDate(parseLocalDate(date))
                        }
                        placeholder="Pick a date"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Days</Label>
                    <Input
                      value={calculateDays(selectedStartDate, selectedEndDate)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Leave *</Label>
                    <Textarea
                      placeholder="Please provide details..."
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  {requestFormError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Unable to submit request</AlertTitle>
                      <AlertDescription>{requestFormError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSubmitRequest}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Total Requests
                    </span>
                    <span className="font-medium">{leaveRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-medium text-amber-600">
                      {
                        leaveRequests.filter((r) => r.status === "pending")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lead Approved</span>
                    <span className="font-medium text-blue-600">
                      {
                        leaveRequests.filter(
                          (r) => r.status === "lead_approved"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-medium text-green-600">
                      {
                        leaveRequests.filter((r) => r.status === "approved")
                          .length
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-950">
                    Recent Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaveRequests.slice(0, 5).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No leave requests yet.
                    </p>
                  ) : (
                    leaveRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.startDate)} to{" "}
                              {formatDate(request.endDate)} · {request.days}{" "}
                              days
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{LEAVE_TYPE_LABELS[request.leaveType]}</Badge>
                          <TempoSyncBadge status={request.tempo_sync_status} />
                          <span className="text-xs text-gray-500">
                            {request.tempo_synced_days ?? 0} synced ·{" "}
                            {request.tempo_failed_days ?? 0} failed ·{" "}
                            {request.tempo_sync_error_count ?? 0} errors
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Leave Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-32 text-center">
                    {format(calendarMonth, "MMMM yyyy")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCalendarMonth(new Date())}
                    className="ml-2 text-xs"
                  >
                    Today
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-sm font-medium text-gray-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="p-2 text-center">
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const firstDay = new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      1
                    );
                    const startOffset = firstDay.getDay(); // Day of week (0-6)
                    const today = new Date();
                    return Array.from({ length: 35 }, (_, i) => {
                      const date = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        i - startOffset + 1
                      );
                      const dayEvents = teamEvents.filter((event) => {
                        const start = new Date(event.startDate);
                        const end = new Date(event.endDate);

                        // Normalize all dates to midnight for accurate day comparison
                        const dateAtMidnight = new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate()
                        );
                        const startAtMidnight = new Date(
                          start.getFullYear(),
                          start.getMonth(),
                          start.getDate()
                        );
                        const endAtMidnight = new Date(
                          end.getFullYear(),
                          end.getMonth(),
                          end.getDate()
                        );

                        return (
                          dateAtMidnight >= startAtMidnight &&
                          dateAtMidnight <= endAtMidnight
                        );
                      });
                      const isCurrentMonth =
                        date.getMonth() === calendarMonth.getMonth();
                      const isToday =
                        date.toDateString() === today.toDateString();
                      return (
                        <div
                          key={i}
                          className={`min-h-24 p-1 border rounded ${
                            isToday
                              ? "border-blue-500 bg-blue-50"
                              : !isCurrentMonth
                                ? "bg-gray-50 border-gray-200"
                                : "border-gray-200"
                          }`}
                        >
                          <div
                            className={`text-sm mb-1 ${
                              isToday
                                ? "text-blue-600 font-semibold"
                                : !isCurrentMonth
                                  ? "text-gray-400"
                                  : "text-gray-600"
                            }`}
                          >
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded text-white ${LEAVE_TYPE_COLORS[event.leaveType]}`}
                                title={`${event.employeeName} - ${LEAVE_TYPE_LABELS[event.leaveType]}`}
                              >
                                {event.employeeName.split(" ")[0] || "Employee"}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canConfigureLeaveTypes && (
          <TabsContent value="policies" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-950">
                  Employee Leave Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
                  <div className="space-y-2">
                    <Label htmlFor="policy-employee-search">
                      Search employees
                    </Label>
                    <Input
                      id="policy-employee-search"
                      placeholder="Search by employee name"
                      value={policyEmployeeSearch}
                      onChange={(event) =>
                        setPolicyEmployeeSearch(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Leave type</Label>
                    <Select
                      value={policyLeaveTypeFilter}
                      onValueChange={(value) =>
                        setPolicyLeaveTypeFilter(value as LeaveType | "all")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All leave types</SelectItem>
                        {ALL_LEAVE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {LEAVE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <Select
                      value={policyBalanceFilter}
                      onValueChange={(value) =>
                        setPolicyBalanceFilter(value as "all" | "low")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All balances</SelectItem>
                        <SelectItem value="low">Low balances</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredPolicyEmployeeGroups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No employees match the selected filters.
                    </div>
                  ) : (
                    filteredPolicyEmployeeGroups.map((group) => {
                      const totalRemaining = group.balances.reduce(
                        (sum, balance) => sum + balance.remaining,
                        0
                      );
                      const totalAllocated = group.balances.reduce(
                        (sum, balance) => sum + balance.allocated,
                        0
                      );
                      const lowBalanceCount = group.balances.filter((balance) =>
                        isLowBalance(balance)
                      ).length;

                      const employeeAvatar = group.balances.find(
                        (b) => b.employeeAvatar
                      )?.employeeAvatar;

                      return (
                        <div
                          key={group.employeeId}
                          className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={employeeAvatar}
                                alt={group.employeeName}
                              />
                              <AvatarFallback className="text-xs">
                                {getEmployeeInitials(group.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="font-medium text-gray-900">
                                {group.employeeName}
                              </h2>
                              <p className="text-sm text-gray-500">
                                {group.balances.length} leave types ·{" "}
                                {totalRemaining}/{totalAllocated} days remaining
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {lowBalanceCount > 0 && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                {lowBalanceCount} low
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedPolicyEmployeeId(group.employeeId)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={selectedPolicyEmployee !== null}
              onOpenChange={(open) => {
                if (!open) setSelectedPolicyEmployeeId(null);
              }}
            >
              <DialogContent className="max-w-2xl grid-rows-[auto_minmax(0,1fr)]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPolicyEmployee?.employeeName ?? "Leave policies"}
                  </DialogTitle>
                  <DialogDescription>
                    Allocations, usage, and remaining days by leave type.
                  </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 space-y-3 overflow-y-auto pr-2">
                  {selectedPolicyEmployee?.balances.map((balance) => (
                    <div
                      key={balance.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {getLeaveTypeIcon(balance.leaveType)}
                          <h3 className="font-medium text-gray-900">
                            {LEAVE_TYPE_LABELS[balance.leaveType]}
                          </h3>
                        </div>
                        <span
                          className={`text-sm font-medium ${isLowBalance(balance) ? "text-red-600" : "text-green-600"}`}
                        >
                          {balance.remaining} remaining
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Allocated</p>
                          <p className="font-medium">
                            {balance.allocated} days
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Used</p>
                          <p className="font-medium">{balance.used} days</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Carryover</p>
                          <p className="font-medium">
                            {balance.carryOver} days
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={getBalanceUsagePercent(balance)}
                        className="mt-3 h-2"
                      />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        {canAdjustBalances && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Adjust Leave Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminActionError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action failed</AlertTitle>
                      <AlertDescription>{adminActionError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Leave Type *</Label>
                    <Select
                      value={adminBalanceForm.leaveType}
                      onValueChange={(v) =>
                        setAdminBalanceForm({
                          ...adminBalanceForm,
                          leaveType: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_LEAVE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {LEAVE_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>New Allocation (days) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 25"
                      value={adminBalanceForm.newBalance}
                      onChange={(e) =>
                        setAdminBalanceForm({
                          ...adminBalanceForm,
                          newBalance: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Change *</Label>
                    <Textarea
                      placeholder="e.g., Annual policy update, special allocation, correction..."
                      rows={3}
                      value={adminBalanceForm.reason}
                      onChange={(e) =>
                        setAdminBalanceForm({
                          ...adminBalanceForm,
                          reason: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button onClick={handleUpdateBalance} className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Update Balance
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Current Leave Allocations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaveBalances
                      .filter((b) => b.employeeId === currentUserEmployeeId)
                      .map((balance) => (
                        <div
                          key={balance.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {getLeaveTypeIcon(balance.leaveType)}
                            <span className="font-medium">
                              {LEAVE_TYPE_LABELS[balance.leaveType]}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {balance.allocated} days
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Recent Balance Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>Balance adjustment history will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {(canApproveRequests || canHrApprove) &&
        (() => {
          const pendingApprovalRequests = leaveRequests.filter((r) => {
            if (canApproveRequests && r.status === "pending") return true;
            if (canHrApprove && r.status === "lead_approved") return true;
            return false;
          });

          return (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminActionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Action failed</AlertTitle>
                    <AlertDescription>{adminActionError}</AlertDescription>
                  </Alert>
                )}

                {pendingApprovalRequests.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No requests pending your approval.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovalRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                {request.employeeAvatar && (
                                  <img
                                    src={request.employeeAvatar}
                                    alt={request.employeeName}
                                  />
                                )}
                                <AvatarFallback>
                                  {request.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium">
                                {request.employeeName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge>
                              {LEAVE_TYPE_LABELS[request.leaveType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDate(request.startDate)} to{" "}
                              {formatDate(request.endDate)}
                            </span>
                          </TableCell>
                          <TableCell>{request.days}</TableCell>
                          <TableCell className="max-w-sm">
                            <p className="whitespace-normal break-words text-sm text-gray-700">
                              {request.reason?.trim() || "No reason provided"}
                            </p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" &&
                              canApproveRequests && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleLeadApprove(request.id)
                                    }
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(request.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            {request.status === "lead_approved" &&
                              canHrApprove && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleHrApprove(request.id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(request.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          );
        })()}

      <Dialog
        open={commentDialog.open}
        onOpenChange={(open) => {
          if (!open && !commentDialog.isSubmitting) closeCommentDialog();
        }}
      >
        <DialogContent className="max-w-md min-h-0 gap-3 p-6">
          <DialogHeader className="gap-1">
            <DialogTitle>
              {COMMENT_DIALOG_COPY[commentDialog.kind].title}
            </DialogTitle>
            <DialogDescription>
              {COMMENT_DIALOG_COPY[commentDialog.kind].description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="vacation-comment">
              {COMMENT_DIALOG_COPY[commentDialog.kind].label}
              {COMMENT_DIALOG_COPY[commentDialog.kind].requireText && " *"}
            </Label>
            <Textarea
              id="vacation-comment"
              rows={3}
              placeholder={COMMENT_DIALOG_COPY[commentDialog.kind].placeholder}
              value={commentDialog.comment}
              onChange={(e) =>
                setCommentDialog((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              disabled={commentDialog.isSubmitting}
            />
            <p className="text-xs text-gray-500">
              For request from{" "}
              <span className="font-medium">{commentDialog.employeeName}</span>.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={closeCommentDialog}
              disabled={commentDialog.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={
                commentDialog.kind === "reject" ? "destructive" : "default"
              }
              onClick={confirmCommentDialog}
              disabled={commentDialog.isSubmitting}
            >
              {commentDialog.isSubmitting
                ? "Processing..."
                : COMMENT_DIALOG_COPY[commentDialog.kind].confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
