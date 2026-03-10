import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Plus,
  Edit,
  Download,
  Filter,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeAvatar: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  coveringEmployee?: string;
}

interface LeaveBalance {
  type: string;
  allocated: number;
  used: number;
  remaining: number;
  icon: string;
  color: string;
}

interface TeamCalendarEvent {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  color: string;
}

export function VacationsModule() {
  const [activeTab, setActiveTab] = useState("request");
  const [selectedStartDate, setSelectedStartDate] = useState<Date>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date>();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isHRUser] = useState(true); // Mock HR permission

  // Mock data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: "1",
      employeeName: "Sarah Johnson",
      employeeAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      leaveType: "Vacation",
      startDate: "2025-08-15",
      endDate: "2025-08-22",
      days: 6,
      reason: "Family vacation to Europe",
      status: "pending",
      submittedDate: "2025-08-01",
      coveringEmployee: "Alex Thompson",
    },
    {
      id: "2",
      employeeName: "Michael Chen",
      employeeAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      leaveType: "Sick Leave",
      startDate: "2025-08-10",
      endDate: "2025-08-12",
      days: 3,
      reason: "Medical appointment and recovery",
      status: "approved",
      submittedDate: "2025-08-08",
    },
    {
      id: "3",
      employeeName: "Emily Rodriguez",
      employeeAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      leaveType: "WFH",
      startDate: "2025-08-20",
      endDate: "2025-08-20",
      days: 1,
      reason: "Home maintenance",
      status: "pending",
      submittedDate: "2025-08-05",
    },
  ]);

  const leaveBalances: LeaveBalance[] = [
    {
      type: "Vacation",
      allocated: 25,
      used: 12,
      remaining: 13,
      icon: "🏖️",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      type: "Sick Leave",
      allocated: 10,
      used: 3,
      remaining: 7,
      icon: "🏥",
      color: "bg-red-100 text-red-800 border-red-200",
    },
    {
      type: "WFH",
      allocated: 12,
      used: 8,
      remaining: 4,
      icon: "🏠",
      color: "bg-green-100 text-green-800 border-green-200",
    },
  ];

  const teamCalendarEvents: TeamCalendarEvent[] = [
    {
      id: "1",
      employeeName: "Sarah Johnson",
      leaveType: "Vacation",
      startDate: "2025-08-15",
      endDate: "2025-08-22",
      color: "bg-blue-500",
    },
    {
      id: "2",
      employeeName: "Michael Chen",
      leaveType: "Sick Leave",
      startDate: "2025-08-10",
      endDate: "2025-08-12",
      color: "bg-red-500",
    },
    {
      id: "3",
      employeeName: "David Kim",
      leaveType: "WFH",
      startDate: "2025-08-18",
      endDate: "2025-08-19",
      color: "bg-green-500",
    },
  ];

  const handleApproval = (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    setLeaveRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  };

  const calculateDays = (start?: Date, end?: Date) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Vacation Data</DialogTitle>
                <DialogDescription>
                  Choose the format and date range for your export.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Include Data</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pending"
                        defaultChecked
                        className="rounded"
                      />
                      <Label htmlFor="pending" className="text-sm">
                        Pending requests
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="approved"
                        defaultChecked
                        className="rounded"
                      />
                      <Label htmlFor="approved" className="text-sm">
                        Approved requests
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="balances"
                        className="rounded"
                      />
                      <Label htmlFor="balances" className="text-sm">
                        Leave balances
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Filter Vacation Requests</DialogTitle>
                <DialogDescription>
                  Apply filters to narrow down the vacation requests displayed.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="wfh">Work From Home</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                      <SelectItem value="michael">Michael Chen</SelectItem>
                      <SelectItem value="emily">Emily Rodriguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input type="date" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Apply Filters
                </Button>
                <Button variant="outline">Clear All</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaveBalances.map((balance) => (
          <Card key={balance.type} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{balance.icon}</span>
                  <h3 className="font-semibold text-gray-900">
                    {balance.type}
                  </h3>
                </div>
                {isAdminMode && isHRUser && (
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
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

              {isAdminMode && isHRUser && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <Label className="text-xs">Override Balance</Label>
                    <Input placeholder="New balance" className="h-8 text-sm" />
                    <Input
                      placeholder="Reason for change"
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Update Balance
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request">Request Leave</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leave Request Form */}
            <div className="lg:col-span-2">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Submit Leave Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Leave Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vacation">🏖️ Vacation</SelectItem>
                          <SelectItem value="sick">🏥 Sick Leave</SelectItem>
                          <SelectItem value="wfh">🏠 Work From Home</SelectItem>
                          <SelectItem value="personal">👤 Personal</SelectItem>
                          <SelectItem value="maternity">
                            👶 Maternity
                          </SelectItem>
                          <SelectItem value="paternity">
                            👨‍👶 Paternity
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Covering Employee</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select covering employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alex">Alex Thompson</SelectItem>
                          <SelectItem value="michael">Michael Chen</SelectItem>
                          <SelectItem value="emily">Emily Rodriguez</SelectItem>
                          <SelectItem value="david">David Kim</SelectItem>
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
                      placeholder="Please provide details about your leave request..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Request
                    </Button>
                    <Button variant="outline">Save as Draft</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Requests
                      </span>
                      <span className="font-medium">
                        {leaveRequests.length}
                      </span>
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
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Team Availability
                      </span>
                      <span className="font-medium">85%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Leaves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaveRequests
                      .filter((req) => new Date(req.startDate) > new Date())
                      .slice(0, 3)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <Avatar className="w-8 h-8">
                            <img
                              src={request.employeeAvatar}
                              alt={request.employeeName}
                            />
                            <AvatarFallback>
                              {request.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.startDate)} -{" "}
                              {request.leaveType}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Team Calendar */}
            <div className="lg:col-span-3">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Team Leave Calendar</CardTitle>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Vacation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Sick Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>WFH</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
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
                        const date = new Date(2025, 7, i - 5); // August 2025
                        const dayEvents = teamCalendarEvents.filter((event) => {
                          const eventStart = new Date(event.startDate);
                          const eventEnd = new Date(event.endDate);
                          return date >= eventStart && date <= eventEnd;
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
                                  className={`text-xs p-1 rounded text-white ${event.color}`}
                                  title={`${event.employeeName} - ${event.leaveType}`}
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
            </div>

            {/* Calendar Sidebar */}
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Leaves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamCalendarEvents
                      .filter((event) => {
                        const today = new Date();
                        const eventStart = new Date(event.startDate);
                        const eventEnd = new Date(event.endDate);
                        return today >= eventStart && today <= eventEnd;
                      })
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${event.color}`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {event.leaveType}
                            </p>
                          </div>
                        </div>
                      ))}
                    {teamCalendarEvents.filter((event) => {
                      const today = new Date();
                      const eventStart = new Date(event.startDate);
                      const eventEnd = new Date(event.endDate);
                      return today >= eventStart && today <= eventEnd;
                    }).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No leaves today
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pending Approvals Table */}
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
                          <img
                            src={request.employeeAvatar}
                            alt={request.employeeName}
                          />
                          <AvatarFallback>
                            {request.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.employeeName}
                          </p>
                          {request.coveringEmployee && (
                            <p className="text-xs text-gray-500">
                              Cover: {request.coveringEmployee}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50">
                        {request.leaveType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(request.startDate)}</p>
                        <p className="text-gray-500">
                          to {formatDate(request.endDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell className="max-w-48">
                      <p
                        className="text-sm text-gray-600 truncate"
                        title={request.reason}
                      >
                        {request.reason}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproval(request.id, "approved")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleApproval(request.id, "rejected")
                            }
                            className="border-red-200 text-red-600 hover:bg-red-50"
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
