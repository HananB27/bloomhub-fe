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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Plus,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit3,
  Target,
  Award,
  Building,
  User,
  AlertCircle,
  FileText,
  Send,
  Save,
  Trash2,
} from "lucide-react";

type BonusStatus = "pending" | "approved" | "rejected" | "paid";
type BonusType =
  | "performance"
  | "retention"
  | "referral"
  | "project"
  | "annual"
  | "spot";

interface Bonus {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  type: BonusType;
  amount: number;
  reason: string;
  approver: string;
  requestDate: string;
  approvalDate?: string;
  payoutDate?: string;
  status: BonusStatus;
  fiscal_year: number;
  quarter: string;
}

interface PayoutData {
  month: string;
  totalPayout: number;
  bonusCount: number;
  avgBonus: number;
}

export function CompensationModule() {
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isHRUser] = useState(true); // Mock HR permission
  const [newBonus, setNewBonus] = useState({
    employeeId: "",
    type: "" as BonusType | "",
    amount: "",
    reason: "",
    approver: "",
  });

  const nextBonusIdRef = useRef(5);

  // Mock employee data
  const employees = [
    { id: "all", name: "All Employees", department: "", role: "" },
    {
      id: "sarah-johnson",
      name: "Sarah Johnson",
      department: "Engineering",
      role: "Senior Developer",
    },
    {
      id: "michael-chen",
      name: "Michael Chen",
      department: "Marketing",
      role: "Marketing Manager",
    },
    {
      id: "emily-rodriguez",
      name: "Emily Rodriguez",
      department: "Sales",
      role: "Sales Representative",
    },
    {
      id: "david-kim",
      name: "David Kim",
      department: "HR",
      role: "HR Specialist",
    },
    {
      id: "alex-thompson",
      name: "Alex Thompson",
      department: "Engineering",
      role: "Tech Lead",
    },
    {
      id: "lisa-wong",
      name: "Lisa Wong",
      department: "Finance",
      role: "Finance Manager",
    },
  ];

  // Mock bonus data
  const [bonuses, setBonuses] = useState<Bonus[]>([
    {
      id: 1,
      employeeId: "sarah-johnson",
      employeeName: "Sarah Johnson",
      department: "Engineering",
      type: "performance",
      amount: 5000,
      reason:
        "Exceptional performance in Q2, delivered 3 major projects ahead of schedule",
      approver: "Alex Thompson",
      requestDate: "2025-07-15",
      approvalDate: "2025-07-18",
      payoutDate: "2025-07-31",
      status: "paid",
      fiscal_year: 2025,
      quarter: "Q3",
    },
    {
      id: 2,
      employeeId: "michael-chen",
      employeeName: "Michael Chen",
      department: "Marketing",
      type: "project",
      amount: 3000,
      reason:
        "Successful launch of new product marketing campaign, exceeded KPI targets by 25%",
      approver: "David Kim",
      requestDate: "2025-07-20",
      approvalDate: "2025-07-22",
      payoutDate: "2025-08-15",
      status: "paid",
      fiscal_year: 2025,
      quarter: "Q3",
    },
    {
      id: 3,
      employeeId: "emily-rodriguez",
      employeeName: "Emily Rodriguez",
      department: "Sales",
      type: "performance",
      amount: 4500,
      reason: "Closed largest deal in company history, $2.5M ARR contract",
      approver: "David Kim",
      requestDate: "2025-08-01",
      approvalDate: "2025-08-03",
      status: "approved",
      fiscal_year: 2025,
      quarter: "Q3",
    },
    {
      id: 4,
      employeeId: "david-kim",
      employeeName: "David Kim",
      department: "HR",
      type: "retention",
      amount: 2500,
      reason:
        "5-year service milestone, exceptional employee engagement scores",
      approver: "Alex Thompson",
      requestDate: "2025-08-05",
      status: "pending",
      fiscal_year: 2025,
      quarter: "Q3",
    },
    {
      id: 5,
      employeeId: "lisa-wong",
      employeeName: "Lisa Wong",
      department: "Finance",
      type: "referral",
      amount: 1000,
      reason: "Successful referral hire: Alex Thompson",
      approver: "David Kim",
      requestDate: "2025-08-07",
      status: "pending",
      fiscal_year: 2025,
      quarter: "Q3",
    },
    {
      id: 6,
      employeeId: "alex-thompson",
      employeeName: "Alex Thompson",
      department: "Engineering",
      type: "spot",
      amount: 1500,
      reason:
        "Outstanding effort in resolving critical production issue over weekend",
      approver: "David Kim",
      requestDate: "2025-08-06",
      approvalDate: "2025-08-07",
      status: "approved",
      fiscal_year: 2025,
      quarter: "Q3",
    },
  ]);

  // Mock payout history data for chart
  const payoutHistory: PayoutData[] = [
    { month: "Jan 2025", totalPayout: 12500, bonusCount: 8, avgBonus: 1563 },
    { month: "Feb 2025", totalPayout: 8900, bonusCount: 6, avgBonus: 1483 },
    { month: "Mar 2025", totalPayout: 15600, bonusCount: 12, avgBonus: 1300 },
    { month: "Apr 2025", totalPayout: 11200, bonusCount: 7, avgBonus: 1600 },
    { month: "May 2025", totalPayout: 18900, bonusCount: 15, avgBonus: 1260 },
    { month: "Jun 2025", totalPayout: 22300, bonusCount: 18, avgBonus: 1239 },
    { month: "Jul 2025", totalPayout: 8000, bonusCount: 2, avgBonus: 4000 },
    { month: "Aug 2025", totalPayout: 0, bonusCount: 0, avgBonus: 0 },
  ];

  // Bonus type distribution for pie chart
  const bonusTypeData = [
    { name: "Performance", value: 45, count: 9, color: "#2563eb" },
    { name: "Project", value: 25, count: 5, color: "#10b981" },
    { name: "Retention", value: 15, count: 3, color: "#f59e0b" },
    { name: "Referral", value: 10, count: 2, color: "#ef4444" },
    { name: "Spot", value: 5, count: 1, color: "#8b5cf6" },
  ];

  const filteredBonuses =
    selectedEmployee === "all"
      ? bonuses
      : bonuses.filter((bonus) => bonus.employeeId === selectedEmployee);

  const totalPaidBonuses = bonuses
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalPendingBonuses = bonuses
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalApprovedBonuses = bonuses
    .filter((b) => b.status === "approved")
    .reduce((sum, b) => sum + b.amount, 0);

  const getStatusColor = (status: BonusStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: BonusStatus) => {
    switch (status) {
      case "paid":
        return CheckCircle;
      case "approved":
        return CheckCircle;
      case "pending":
        return Clock;
      case "rejected":
        return XCircle;
      default:
        return Clock;
    }
  };

  const getBonusTypeColor = (type: BonusType) => {
    switch (type) {
      case "performance":
        return "bg-blue-100 text-blue-800";
      case "project":
        return "bg-green-100 text-green-800";
      case "retention":
        return "bg-purple-100 text-purple-800";
      case "referral":
        return "bg-amber-100 text-amber-800";
      case "annual":
        return "bg-indigo-100 text-indigo-800";
      case "spot":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleAddBonus = () => {
    if (
      !newBonus.employeeId ||
      !newBonus.type ||
      !newBonus.amount ||
      !newBonus.reason ||
      !newBonus.approver
    ) {
      return;
    }

    const employee = employees.find((emp) => emp.id === newBonus.employeeId);
    if (!employee) return;

    const bonus: Bonus = {
      id: nextBonusIdRef.current++,
      employeeId: newBonus.employeeId,
      employeeName: employee.name,
      department: employee.department,
      type: newBonus.type as BonusType,
      amount: parseInt(newBonus.amount),
      reason: newBonus.reason,
      approver: newBonus.approver,
      requestDate: new Date().toISOString().split("T")[0],
      status: "pending",
      fiscal_year: 2025,
      quarter: "Q3",
    };

    setBonuses((prev) => [...prev, bonus]);
    setNewBonus({
      employeeId: "",
      type: "",
      amount: "",
      reason: "",
      approver: "",
    });
  };

  const handleUpdateBonusStatus = (bonusId: number, newStatus: BonusStatus) => {
    setBonuses((prev) =>
      prev.map((bonus) =>
        bonus.id === bonusId
          ? {
              ...bonus,
              status: newStatus,
              approvalDate:
                newStatus === "approved"
                  ? new Date().toISOString().split("T")[0]
                  : bonus.approvalDate,
              payoutDate:
                newStatus === "paid"
                  ? new Date().toISOString().split("T")[0]
                  : bonus.payoutDate,
            }
          : bonus
      )
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-blue-600">
            Total: ${payload[0].value?.toLocaleString()}
          </p>
          <p className="text-slate-600 text-sm">
            {payload[0].payload?.bonusCount} bonuses
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Compensation & Incentives
            </h1>
            <p className="text-slate-600 mt-1">
              Manage employee bonuses and compensation tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {isHRUser && (
              <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Bonus
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Total Paid YTD</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ${totalPaidBonuses.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              {bonuses.filter((b) => b.status === "paid").length} bonuses
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Pending Approval</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ${totalPendingBonuses.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              {bonuses.filter((b) => b.status === "pending").length} bonuses
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Approved</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ${totalApprovedBonuses.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              {bonuses.filter((b) => b.status === "approved").length} bonuses
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Avg Bonus</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              $
              {totalPaidBonuses > 0
                ? Math.round(
                    totalPaidBonuses /
                      bonuses.filter((b) => b.status === "paid").length
                  ).toLocaleString()
                : 0}
            </p>
            <p className="text-xs text-slate-500">Per employee</p>
          </div>
        </div>

        {/* Employee Filter */}
        <div className="mt-6 max-w-md">
          <Label htmlFor="employee-select">Filter by Employee</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      {employee.department && (
                        <p className="text-xs text-slate-500">
                          {employee.department}
                        </p>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  {isHRUser && <TabsTrigger value="manage">Manage</TabsTrigger>}
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="dashboard" className="space-y-6 mt-0">
                  {/* Payout History Chart */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Payout History Timeline
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          YTD
                        </Button>
                        <Button variant="outline" size="sm">
                          Q3
                        </Button>
                        <Button variant="outline" size="sm">
                          Q2
                        </Button>
                      </div>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={payoutHistory}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                            tickFormatter={(value) =>
                              `$${value.toLocaleString()}`
                            }
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="totalPayout"
                            stroke="#2563eb"
                            fill="rgba(37, 99, 235, 0.1)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Bonuses Summary */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      Recent Bonus Activity
                    </h3>
                    <div className="space-y-3">
                      {filteredBonuses.slice(0, 5).map((bonus) => {
                        const StatusIcon = getStatusIcon(bonus.status);
                        return (
                          <div
                            key={bonus.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {bonus.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {bonus.employeeName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={getBonusTypeColor(bonus.type)}
                                  >
                                    {bonus.type}
                                  </Badge>
                                  <span className="text-sm text-slate-500">
                                    ${bonus.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusIcon
                                className={`w-4 h-4 ${
                                  bonus.status === "paid"
                                    ? "text-green-600"
                                    : bonus.status === "approved"
                                      ? "text-blue-600"
                                      : bonus.status === "pending"
                                        ? "text-amber-600"
                                        : "text-red-600"
                                }`}
                              />
                              <Badge
                                variant="outline"
                                className={getStatusColor(bonus.status)}
                              >
                                {bonus.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bonuses" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Bonus Management
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          This Month
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    </div>

                    {/* Monthly Bonus Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Approver</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBonuses.map((bonus) => {
                            const StatusIcon = getStatusIcon(bonus.status);
                            return (
                              <TableRow key={bonus.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-xs">
                                        {bonus.employeeName
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {bonus.employeeName}
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        {bonus.department}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={getBonusTypeColor(bonus.type)}
                                  >
                                    {bonus.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  ${bonus.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon
                                      className={`w-4 h-4 ${
                                        bonus.status === "paid"
                                          ? "text-green-600"
                                          : bonus.status === "approved"
                                            ? "text-blue-600"
                                            : bonus.status === "pending"
                                              ? "text-amber-600"
                                              : "text-red-600"
                                      }`}
                                    />
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(bonus.status)}
                                    >
                                      {bonus.status}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>{bonus.approver}</TableCell>
                                <TableCell>{bonus.requestDate}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {isHRUser && bonus.status === "pending" && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleUpdateBonusStatus(
                                              bonus.id,
                                              "approved"
                                            )
                                          }
                                          className="text-green-600 hover:text-green-700"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleUpdateBonusStatus(
                                              bonus.id,
                                              "rejected"
                                            )
                                          }
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                    {isHRUser &&
                                      bonus.status === "approved" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleUpdateBonusStatus(
                                              bonus.id,
                                              "paid"
                                            )
                                          }
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          <DollarSign className="w-4 h-4" />
                                        </Button>
                                      )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Bonus Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-green-900">
                            Paid This Month
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          $
                          {filteredBonuses
                            .filter(
                              (b) =>
                                b.status === "paid" &&
                                b.payoutDate?.includes("2025-08")
                            )
                            .reduce((sum, b) => sum + b.amount, 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          {
                            filteredBonuses.filter(
                              (b) =>
                                b.status === "paid" &&
                                b.payoutDate?.includes("2025-08")
                            ).length
                          }{" "}
                          bonuses
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-900">
                            Pending
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">
                          $
                          {filteredBonuses
                            .filter((b) => b.status === "pending")
                            .reduce((sum, b) => sum + b.amount, 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-600">
                          {
                            filteredBonuses.filter(
                              (b) => b.status === "pending"
                            ).length
                          }{" "}
                          bonuses
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            YTD Average
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          $
                          {totalPaidBonuses > 0
                            ? Math.round(
                                totalPaidBonuses /
                                  bonuses.filter((b) => b.status === "paid")
                                    .length
                              ).toLocaleString()
                            : 0}
                        </p>
                        <p className="text-xs text-blue-600">per bonus</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    <h3 className="font-medium text-slate-900">
                      Compensation Analytics
                    </h3>

                    {/* Bonus Type Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-slate-900 mb-4">
                          Bonus Type Distribution
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={bonusTypeData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) =>
                                  `${name}: ${value}%`
                                }
                              >
                                {bonusTypeData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  `${value}%`,
                                  "Percentage",
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-slate-900 mb-4">
                          Monthly Bonus Count
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={payoutHistory}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                              />
                              <XAxis
                                dataKey="month"
                                stroke="#64748b"
                                fontSize={12}
                                tick={{ fill: "#64748b" }}
                              />
                              <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tick={{ fill: "#64748b" }}
                              />
                              <Tooltip
                                formatter={(value, name) => [
                                  value,
                                  name === "bonusCount" ? "Bonus Count" : name,
                                ]}
                                labelFormatter={(label) => `Month: ${label}`}
                              />
                              <Bar
                                dataKey="bonusCount"
                                fill="#2563eb"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Department Breakdown */}
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">
                        Department Bonus Breakdown
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          "Engineering",
                          "Marketing",
                          "Sales",
                          "HR",
                          "Finance",
                        ].map((dept) => {
                          const deptBonuses = bonuses.filter(
                            (b) => b.department === dept && b.status === "paid"
                          );
                          const deptTotal = deptBonuses.reduce(
                            (sum, b) => sum + b.amount,
                            0
                          );
                          const deptCount = deptBonuses.length;

                          return (
                            <div
                              key={dept}
                              className="border border-slate-200 rounded-lg p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="w-4 h-4 text-slate-500" />
                                <p className="font-medium text-slate-900">
                                  {dept}
                                </p>
                              </div>
                              <p className="text-2xl font-bold text-slate-700">
                                ${deptTotal.toLocaleString()}
                              </p>
                              <p className="text-sm text-slate-500">
                                {deptCount} bonuses • $
                                {deptCount > 0
                                  ? Math.round(
                                      deptTotal / deptCount
                                    ).toLocaleString()
                                  : 0}{" "}
                                avg
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {isHRUser && (
                  <TabsContent value="manage" className="space-y-6 mt-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900">
                          Add New Bonus
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-800 border-red-200"
                        >
                          HR Only
                        </Badge>
                      </div>

                      {/* Add Bonus Form */}
                      <Card className="border-slate-200">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Bonus Request Form
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="bonus-employee">Employee</Label>
                              <Select
                                value={newBonus.employeeId}
                                onValueChange={(value) =>
                                  setNewBonus((prev) => ({
                                    ...prev,
                                    employeeId: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees
                                    .filter((emp) => emp.id !== "all")
                                    .map((employee) => (
                                      <SelectItem
                                        key={employee.id}
                                        value={employee.id}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                              {employee.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-medium">
                                              {employee.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              {employee.department}
                                            </p>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bonus-type">Bonus Type</Label>
                              <Select
                                value={newBonus.type}
                                onValueChange={(value: BonusType) =>
                                  setNewBonus((prev) => ({
                                    ...prev,
                                    type: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bonus type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="performance">
                                    Performance Bonus
                                  </SelectItem>
                                  <SelectItem value="project">
                                    Project Completion
                                  </SelectItem>
                                  <SelectItem value="retention">
                                    Retention Bonus
                                  </SelectItem>
                                  <SelectItem value="referral">
                                    Referral Bonus
                                  </SelectItem>
                                  <SelectItem value="annual">
                                    Annual Bonus
                                  </SelectItem>
                                  <SelectItem value="spot">
                                    Spot Bonus
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bonus-amount">Amount ($)</Label>
                              <Input
                                id="bonus-amount"
                                type="number"
                                placeholder="5000"
                                value={newBonus.amount}
                                onChange={(e) =>
                                  setNewBonus((prev) => ({
                                    ...prev,
                                    amount: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bonus-approver">Approver</Label>
                              <Select
                                value={newBonus.approver}
                                onValueChange={(value) =>
                                  setNewBonus((prev) => ({
                                    ...prev,
                                    approver: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select approver" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="David Kim">
                                    David Kim (HR Director)
                                  </SelectItem>
                                  <SelectItem value="Alex Thompson">
                                    Alex Thompson (Tech Lead)
                                  </SelectItem>
                                  <SelectItem value="Lisa Wong">
                                    Lisa Wong (Finance Manager)
                                  </SelectItem>
                                  <SelectItem value="John Smith">
                                    John Smith (CEO)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bonus-reason">Reason</Label>
                            <Textarea
                              id="bonus-reason"
                              placeholder="Detailed reason for the bonus (e.g., exceptional performance, project completion, milestone achievement)..."
                              value={newBonus.reason}
                              onChange={(e) =>
                                setNewBonus((prev) => ({
                                  ...prev,
                                  reason: e.target.value,
                                }))
                              }
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddBonus}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={
                                !newBonus.employeeId ||
                                !newBonus.type ||
                                !newBonus.amount ||
                                !newBonus.reason ||
                                !newBonus.approver
                              }
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit for Approval
                            </Button>
                            <Button variant="outline">
                              <Save className="w-4 h-4 mr-2" />
                              Save Draft
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pending Approvals */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">
                          Pending Approvals
                        </h4>
                        <div className="space-y-3">
                          {bonuses
                            .filter((b) => b.status === "pending")
                            .map((bonus) => (
                              <Card
                                key={bonus.id}
                                className="border-amber-200 bg-amber-50"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Avatar className="w-8 h-8">
                                          <AvatarFallback className="text-xs">
                                            {bonus.employeeName
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-slate-900">
                                            {bonus.employeeName}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className={getBonusTypeColor(
                                                bonus.type
                                              )}
                                            >
                                              {bonus.type}
                                            </Badge>
                                            <span className="font-bold text-slate-900">
                                              ${bonus.amount.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-sm text-slate-600 mb-2">
                                        {bonus.reason}
                                      </p>
                                      <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span>Approver: {bonus.approver}</span>
                                        <span>
                                          Requested: {bonus.requestDate}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateBonusStatus(
                                            bonus.id,
                                            "approved"
                                          )
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateBonusStatus(
                                            bonus.id,
                                            "rejected"
                                          )
                                        }
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Summary */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">
                    Total Bonuses YTD:
                  </span>
                  <span className="font-medium">{bonuses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Paid:</span>
                  <span className="font-medium">
                    ${totalPaidBonuses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Pending Value:</span>
                  <span className="font-medium">
                    ${totalPendingBonuses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg Bonus:</span>
                  <span className="font-medium">
                    $
                    {totalPaidBonuses > 0
                      ? Math.round(
                          totalPaidBonuses /
                            bonuses.filter((b) => b.status === "paid").length
                        ).toLocaleString()
                      : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bonuses
                .filter((b) => b.status === "paid")
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((bonus, index) => (
                  <div
                    key={bonus.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">
                        #{index + 1}
                      </span>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {bonus.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {bonus.employeeName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bonus.department}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      ${bonus.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isHRUser && (
                <>
                  <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Bonus
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Review Approvals
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Review
              </Button>
            </CardContent>
          </Card>

          {/* Budget Alert */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Budget Status
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    ${totalPaidBonuses.toLocaleString()} paid out of estimated
                    $50,000 annual budget.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ${(50000 - totalPaidBonuses).toLocaleString()} remaining for
                    this year.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
