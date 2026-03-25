"use client";

import { useRef, useState } from "react";
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
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  Umbrella,
  Heart,
  Home,
  Baby,
  User,
} from "lucide-react";
import { formatDate } from "@/utils";
import { format } from "date-fns";
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  TeamCalendarEvent,
} from "@/types/vacations";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from "@/types/vacations";

interface Notification {
  id: string;
  type: "approval" | "rejection" | "admin";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
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

export function VacationsModule() {
  const [activeTab, setActiveTab] = useState("request");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isHRUser] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const nextNotificationIdRef = useRef(1);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: "1",
      employeeId: "emp1",
      employeeName: "Sarah Johnson",
      employeeAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      leaveType: "vacation",
      startDate: "2025-08-15",
      endDate: "2025-08-22",
      days: 6,
      reason: "Family vacation to Europe",
      status: "pending",
      submittedDate: "2025-08-01",
      coveringEmployeeName: "Alex Thompson",
    },
    {
      id: "2",
      employeeId: "emp2",
      employeeName: "Michael Chen",
      employeeAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      leaveType: "sick",
      startDate: "2025-08-10",
      endDate: "2025-08-12",
      days: 3,
      reason: "Medical appointment and recovery",
      status: "approved",
      submittedDate: "2025-08-08",
    },
    {
      id: "3",
      employeeId: "emp3",
      employeeName: "Emily Rodriguez",
      employeeAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      leaveType: "wfh",
      startDate: "2025-08-20",
      endDate: "2025-08-20",
      days: 1,
      reason: "Home maintenance",
      status: "pending",
      submittedDate: "2025-08-05",
    },
  ]);

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([
    {
      id: "bal1",
      employeeId: "current",
      leaveType: "vacation",
      allocated: 25,
      used: 12,
      remaining: 13,
      carryOver: 0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "bal2",
      employeeId: "current",
      leaveType: "sick",
      allocated: 10,
      used: 3,
      remaining: 7,
      carryOver: 0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "bal3",
      employeeId: "current",
      leaveType: "wfh",
      allocated: 12,
      used: 8,
      remaining: 4,
      carryOver: 0,
      lastUpdated: new Date().toISOString(),
    },
  ]);

  const [teamEvents, setTeamEvents] = useState<TeamCalendarEvent[]>([
    {
      id: "1",
      employeeId: "emp1",
      employeeName: "Sarah Johnson",
      leaveType: "vacation",
      startDate: "2025-08-15",
      endDate: "2025-08-22",
      status: "approved",
    },
    {
      id: "2",
      employeeId: "emp2",
      employeeName: "Michael Chen",
      leaveType: "sick",
      startDate: "2025-08-10",
      endDate: "2025-08-12",
      status: "approved",
    },
    {
      id: "3",
      employeeId: "emp4",
      employeeName: "David Kim",
      leaveType: "wfh",
      startDate: "2025-08-18",
      endDate: "2025-08-19",
      status: "approved",
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const calculateDays = (start?: Date, end?: Date): number => {
    if (!start || !end) return 0;
    return (
      Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  const addNotification = (
    type: Notification["type"],
    title: string,
    message: string
  ) => {
    const notificationId = `notif-${nextNotificationIdRef.current}`;
    nextNotificationIdRef.current += 1;

    const notification: Notification = {
      id: notificationId,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleSubmitRequest = () => {
    if (!leaveType || !selectedStartDate || !selectedEndDate || !reason) {
      alert("Please fill in all required fields");
      return;
    }

    const newRequest: LeaveRequest = {
      id: String(leaveRequests.length + 1),
      employeeId: "current",
      employeeName: "You",
      leaveType: leaveType,
      startDate: selectedStartDate.toISOString().split("T")[0],
      endDate: selectedEndDate.toISOString().split("T")[0],
      days: calculateDays(selectedStartDate, selectedEndDate),
      reason,
      status: "pending",
      submittedDate: new Date().toISOString().split("T")[0],
    };

    setLeaveRequests([...leaveRequests, newRequest]);
    addNotification(
      "approval",
      "Request Submitted",
      `Your ${LEAVE_TYPE_LABELS[leaveType]} request has been submitted for approval.`
    );

    setLeaveType("");
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setReason("");
    setCoveringEmployee("");
  };

  const handleApprove = (id: string, status: "approved" | "rejected") => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    const request = leaveRequests.find((r) => r.id === id);
    if (!request) return;

    if (status === "approved") {
      if (!teamEvents.find((e) => e.id === id)) {
        setTeamEvents([
          ...teamEvents,
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
      addNotification(
        "approval",
        "Request Approved",
        `${request.employeeName}'s ${LEAVE_TYPE_LABELS[request.leaveType]} request has been approved.`
      );
    } else {
      addNotification(
        "rejection",
        "Request Rejected",
        `${request.employeeName}'s ${LEAVE_TYPE_LABELS[request.leaveType]} request has been rejected.`
      );
    }
  };

  const handleUpdateBalance = () => {
    if (
      !adminBalanceForm.leaveType ||
      !adminBalanceForm.newBalance ||
      !adminBalanceForm.reason
    ) {
      alert("Please fill in all fields");
      return;
    }

    const newBalance = parseInt(adminBalanceForm.newBalance);
    setLeaveBalances((prev) =>
      prev.map((balance) =>
        balance.leaveType === adminBalanceForm.leaveType
          ? {
              ...balance,
              allocated: newBalance,
              lastUpdated: new Date().toISOString(),
            }
          : balance
      )
    );

    addNotification(
      "admin",
      "Balance Updated",
      `${LEAVE_TYPE_LABELS[adminBalanceForm.leaveType as LeaveType]} allocation changed to ${newBalance} days. Reason: ${adminBalanceForm.reason}`
    );

    setAdminBalanceForm({ leaveType: "", newBalance: "", reason: "" });
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const config = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <Badge className={config[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

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
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${!notif.read ? "bg-blue-50" : ""}`}
                        onClick={() => markNotificationRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          {notif.type === "approval" && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          )}
                          {notif.type === "rejection" && (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          {notif.type === "admin" && (
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {notif.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notif.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

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
        {leaveBalances.map((balance) => (
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
                          {(
                            [
                              "vacation",
                              "sick",
                              "wfh",
                              "personal",
                              "maternity",
                              "paternity",
                            ] as LeaveType[]
                          ).map((t) => (
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

                  <Button onClick={handleSubmitRequest} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Request
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
              <CardTitle>Team Leave Calendar</CardTitle>
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
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date(2025, 7, i - 5);
                    const dayEvents = teamEvents.filter((event) => {
                      const start = new Date(event.startDate);
                      const end = new Date(event.endDate);
                      return date >= start && date <= end;
                    });
                    return (
                      <div
                        key={i}
                        className="min-h-24 p-1 border border-gray-200 rounded"
                      >
                        <div className="text-sm text-gray-600 mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded text-white ${LEAVE_TYPE_COLORS[event.leaveType]}`}
                            >
                              {event.employeeName.split(" ")[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
                        {(
                          [
                            "vacation",
                            "sick",
                            "wfh",
                            "personal",
                            "maternity",
                            "paternity",
                          ] as LeaveType[]
                        ).map((t) => (
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
                    {leaveBalances.map((balance) => (
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
                <div className="space-y-3 text-sm">
                  {notifications
                    .filter((n) => n.type === "admin")
                    .slice(0, 5)
                    .map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-start justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {notif.title}
                          </p>
                          <p className="text-gray-600">{notif.message}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {notif.timestamp.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  {notifications.filter((n) => n.type === "admin").length ===
                    0 && (
                    <p className="text-center text-gray-500">
                      No adjustments made yet
                    </p>
                  )}
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
