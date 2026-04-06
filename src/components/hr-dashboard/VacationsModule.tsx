"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
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
} from "lucide-react";
import { formatDate } from "@/utils";
import { format } from "date-fns";
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  TeamCalendarEvent,
  CreateLeaveRequestPayload,
} from "@/types/vacations";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_COLORS,
  ALL_LEAVE_TYPES,
} from "@/types/vacations";
import {
  fetchLeaveRequests,
  fetchLeaveBalances,
  fetchTeamCalendar,
  createLeaveRequest,
  approveLeaveRequest,
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
    is_staff?: boolean;
    is_superuser?: boolean;
  };
}

const EMPLOYEES = [
  {
    id: "emp1",
    name: "Alex Thompson",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "emp2",
    name: "Jessica Martinez",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "emp3",
    name: "David Kim",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "emp4",
    name: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

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

interface VacationsModuleProps {
  addNotification?: (
    module: "vacations",
    type: "info" | "warning" | "success" | "alert",
    title: string,
    message: string
  ) => void;
}

export function VacationsModule({ addNotification }: VacationsModuleProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("request");
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if user is HR admin from session
  const isHRUser =
    (session as ExtendedSession)?.user?.is_staff ||
    (session as ExtendedSession)?.user?.is_superuser ||
    true; // Fallback to true for now

  // Data states - initialize as empty, will be populated from API
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamCalendarEvent[]>([]);

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

  // Team calendar month navigation state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Get current user's employee ID from session
  const currentUserEmployeeId = (session as ExtendedSession)?.user?.id
    ? String((session as ExtendedSession)?.user?.id)
    : null;

  // Filter balances for current user (non-admin view) vs all balances (admin view)
  const displayedBalances = isAdminMode
    ? leaveBalances
    : leaveBalances.filter((b) => b.employeeId === currentUserEmployeeId);

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
      const [requestsData, balancesData, calendarData] = await Promise.all([
        fetchLeaveRequests(token),
        fetchLeaveBalances(token),
        fetchTeamCalendar(token),
      ]);

      setLeaveRequests(requestsData);
      setLeaveBalances(balancesData);
      setTeamEvents(calendarData);
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
      alert("Please fill in all required fields");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      // Notification removed - using global notification system
      return;
    }

    setIsSubmitting(true);

    try {
      // Format dates as local YYYY-MM-DD (avoid timezone conversion)
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

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
      console.error("Failed to submit leave request:", err);
      if (addNotification) {
        addNotification(
          "vacations",
          "alert",
          "Request Failed",
          err instanceof Error ? err.message : "Failed to submit request"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string, status: "approved" | "rejected") => {
    const request = leaveRequests.find((r) => r.id === id);
    if (!request) return;

    const token = getAccessToken();
    if (!token) {
      // Notification removed - using global notification system
      return;
    }

    try {
      let updatedRequest: LeaveRequest;

      if (status === "approved") {
        const comments = window.prompt("Add approval comments (optional):");
        updatedRequest = await approveLeaveRequest(id, comments || "", token);

        // Add to calendar if not already there
        if (!teamEvents.find((e) => e.id === id)) {
          setTeamEvents((prev) => [
            ...prev,
            {
              id,
              employeeId: request.employeeId,
              employeeName: request.employeeName,
              leaveType: request.leaveType,
              startDate: request.startDate,
              endDate: request.endDate,
              status: "approved",
            },
          ]);
        }
      } else {
        const reason = window.prompt("Reason for rejection:");
        if (!reason) return; // Cancelled

        updatedRequest = await rejectLeaveRequest(id, reason, token);
      }

      // Update the request in state with API response
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === id ? updatedRequest : r))
      );

      // Refresh balances since approval affects balance
      if (status === "approved") {
        const balancesData = await fetchLeaveBalances(token);
        setLeaveBalances(balancesData);
      }

      // Send success notification
      if (addNotification) {
        addNotification(
          "vacations",
          "success",
          `Request ${status === "approved" ? "Approved" : "Rejected"}`,
          `Leave request for ${request.employeeName} has been ${status}.`
        );
      }
    } catch (err) {
      console.error(`Failed to ${status} leave request:`, err);
      if (addNotification) {
        addNotification(
          "vacations",
          "alert",
          `Request ${status === "approved" ? "Approval" : "Rejection"} Failed`,
          err instanceof Error ? err.message : `Failed to ${status} request`
        );
      }
    }
  };

  const handleUpdateBalance = async () => {
    if (
      !adminBalanceForm.leaveType ||
      !adminBalanceForm.newBalance ||
      !adminBalanceForm.reason
    ) {
      alert("Please fill in all fields");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      // Notification removed - using global notification system
      return;
    }

    // Find the balance ID for the selected leave type (for current user)
    const balanceToUpdate = leaveBalances.find(
      (b) =>
        b.leaveType === adminBalanceForm.leaveType &&
        b.employeeId === currentUserEmployeeId
    );

    if (!balanceToUpdate) {
      alert(`Balance for ${adminBalanceForm.leaveType} not found`);
      return;
    }

    try {
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
      console.error("Failed to update balance:", err);
      if (addNotification) {
        addNotification(
          "vacations",
          "alert",
          "Balance Update Failed",
          err instanceof Error ? err.message : "Failed to update balance"
        );
      }
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const config = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    // Defensive check for undefined status
    if (!status) {
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    return (
      <Badge className={config[status] || config.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        <div className="flex gap-2">
          {isHRUser && (
            <div className="flex items-center gap-2">
              <Label htmlFor="admin-mode" className="text-sm">
                Admin Mode
              </Label>
              <Switch
                id="admin-mode"
                checked={isAdminMode}
                onCheckedChange={setIsAdminMode}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayedBalances.map((balance) => (
          <Card key={balance.id} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getLeaveTypeIcon(balance.leaveType)}
                  <h3 className="font-semibold text-gray-900">
                    {LEAVE_TYPE_LABELS[balance.leaveType]}
                  </h3>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used:</span>
                  <span className="font-medium">
                    {balance.used}/{balance.allocated} days
                  </span>
                </div>
                <Progress
                  value={(balance.used / balance.allocated) * 100}
                  className="h-2"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining:</span>
                  <span
                    className={`font-medium ${balance.remaining <= 2 ? "text-red-600" : "text-green-600"}`}
                  >
                    {balance.remaining} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request">Request Leave</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          {isAdminMode && isHRUser && (
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
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select covering employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEES.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedStartDate
                              ? format(selectedStartDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedStartDate}
                            onSelect={setSelectedStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedEndDate
                              ? format(selectedEndDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedEndDate}
                            onSelect={setSelectedEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
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

        {isAdminMode && isHRUser && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Adjust Leave Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

      {isHRUser && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
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
                {leaveRequests.map((request) => (
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
                        <p className="font-medium">{request.employeeName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{LEAVE_TYPE_LABELS[request.leaveType]}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(request.startDate)} to{" "}
                        {formatDate(request.endDate)}
                      </span>
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {request.reason}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApprove(request.id, "approved")
                            }
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleApprove(request.id, "rejected")
                            }
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
