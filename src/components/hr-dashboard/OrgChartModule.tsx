import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { QuickActionButton } from "./QuickActionButton";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Network,
  Search,
  Filter,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  User,
  Crown,
  Briefcase,
  GraduationCap,
  Award,
  Clock,
  Eye,
  Edit3,
  MoreHorizontal,
  Target,
  TrendingUp,
  Activity,
  Layers,
  UserPlus,
  Settings,
} from "lucide-react";
import { formatDate } from "@/utils";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  managerId?: string;
  startDate: string;
  level: number;
  skills: string[];
  directReports: string[];
  isManager: boolean;
  status: "active" | "onLeave" | "remote";
}

interface Department {
  id: string;
  name: string;
  color: string;
  headId: string;
  employeeCount: number;
  isExpanded: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "onLeave":
      return "bg-amber-100 text-amber-800";
    case "remote":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
  }
}

function getStatusIcon(status: string) {
  const classes = "inline-block w-2.5 h-2.5 rounded-full";
  switch (status) {
    case "active":
      return <span className={`${classes} bg-green-500`} title="Active" />;
    case "onLeave":
      return <span className={`${classes} bg-amber-500`} title="On leave" />;
    case "remote":
      return <span className={`${classes} bg-blue-500`} title="Remote" />;
    default:
      return <span className={`${classes} bg-gray-300`} title="Unknown" />;
  }
}

function OrgChartEmployeeCard({
  employee,
  isCompact = false,
  getDepartmentByName,
  onSelectEmployee,
}: {
  employee: Employee;
  isCompact?: boolean;
  getDepartmentByName: (name: string) => Department | undefined;
  onSelectEmployee: (employee: Employee) => void;
}) {
  const department = getDepartmentByName(employee.department);
  const directReportCount = employee.directReports.length;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={`relative bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
            isCompact ? "p-3 min-w-[200px]" : "p-4 min-w-[240px]"
          }`}
          style={{ borderColor: department?.color || "#e2e8f0" }}
          onClick={() => onSelectEmployee(employee)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className={isCompact ? "w-10 h-10" : "w-12 h-12"}>
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs"
                title={employee.status}
              >
                {getStatusIcon(employee.status)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className={`font-medium text-gray-900 dark:text-gray-100 truncate ${isCompact ? "text-sm" : ""}`}
                >
                  {employee.name}
                </h4>
                {employee.isManager && (
                  <Crown className="w-3 h-3 text-amber-500" />
                )}
              </div>
              <p
                className={`text-gray-600 dark:text-gray-400 truncate ${isCompact ? "text-xs" : "text-sm"}`}
              >
                {employee.role}
              </p>
              {!isCompact && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: department?.color,
                      color: department?.color,
                    }}
                  >
                    {employee.department}
                  </Badge>
                  {directReportCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-50 dark:bg-gray-900"
                    >
                      {directReportCount} reports
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {employee.isManager && employee.directReports.length > 0 && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                <ChevronDown className="w-2 h-2 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="w-80 p-4" side="right">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-16 h-16">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="object-cover"
              />
              <AvatarFallback>
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {employee.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {employee.role}
              </p>
              <Badge
                variant="outline"
                className={getStatusColor(employee.status)}
              >
                {employee.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {employee.department}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {employee.email}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {employee.phone}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {employee.location}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Started {new Date(employee.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {employee.skills.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-1">
                  {employee.skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {employee.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              View Profile
            </Button>
            <Button size="sm" variant="outline">
              <Mail className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function OrgChartDepartmentNode({
  department,
  level,
  employees,
  getDepartmentByName,
  onSelectEmployee,
}: {
  department: Department;
  level: number;
  employees: Employee[];
  getDepartmentByName: (name: string) => Department | undefined;
  onSelectEmployee: (employee: Employee) => void;
}) {
  const departmentEmployees = employees.filter(
    (emp) =>
      emp.department.toLowerCase() === department.name.toLowerCase() &&
      emp.level === level
  );

  if (departmentEmployees.length === 0) return null;

  return (
    <div className="flex flex-col items-center space-y-4">
      {departmentEmployees.map((employee) => (
        <div key={employee.id} className="flex flex-col items-center">
          <OrgChartEmployeeCard
            employee={employee}
            getDepartmentByName={getDepartmentByName}
            onSelectEmployee={onSelectEmployee}
          />

          {/* Connection lines and subordinates */}
          {employee.isManager &&
            employee.directReports.length > 0 &&
            department.isExpanded && (
              <div className="flex flex-col items-center mt-4">
                {/* Vertical line down */}
                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* Horizontal line and subordinates */}
                <div className="flex items-start">
                  <div className="flex flex-col space-y-4">
                    {employee.directReports.map((reportId, index) => {
                      const subordinate = employees.find(
                        (emp) => emp.id === reportId
                      );
                      if (!subordinate) return null;

                      return (
                        <div key={reportId} className="flex items-center">
                          {/* Horizontal line to subordinate */}
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className="relative">
                            {/* Vertical line connection */}
                            {index > 0 && (
                              <div className="absolute -left-8 -top-6 w-0.5 h-6 bg-gray-300"></div>
                            )}
                            <OrgChartEmployeeCard
                              employee={subordinate}
                              isCompact
                              getDepartmentByName={getDepartmentByName}
                              onSelectEmployee={onSelectEmployee}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

export function OrgChartModule() {
  const [activeTab, setActiveTab] = useState("chart");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // TODO: Implement - fetch employees from API and set via setEmployees(...)
  const [employees, setEmployees] = useState<Employee[]>([]);

  // TODO: Implement - fetch departments from API and set via setDepartments(...)
  const [departments, setDepartments] = useState<Department[]>([]);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" ||
      employee.department.toLowerCase() === departmentFilter.toLowerCase();

    return matchesSearch && matchesDepartment;
  });

  const getEmployeesByLevel = (level: number, managerId?: string) => {
    return employees.filter((emp) => {
      if (level === 1) return emp.level === 1;
      return emp.level === level && emp.managerId === managerId;
    });
  };

  const getDepartmentByName = (name: string) => {
    return departments.find(
      (dept) => dept.name.toLowerCase() === name.toLowerCase()
    );
  };

  const toggleDepartmentExpansion = (departmentId: string) => {
    setDepartments((prev) =>
      prev.map((dept) =>
        dept.id === departmentId
          ? { ...dept, isExpanded: !dept.isExpanded }
          : dept
      )
    );
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Organization Chart
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Interactive team structure and employee directory
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Network className="w-4 h-4 mr-2" />
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Employees
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {employees.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active workforce
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Departments
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {departments.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Business units
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Managers
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {employees.filter((emp) => emp.isManager).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leadership roles
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remote Workers
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {employees.filter((emp) => emp.status === "remote").length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Working remotely
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-gray-200 dark:border-gray-700">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="chart">Org Chart</TabsTrigger>
                    <TabsTrigger value="directory">Directory</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                  </TabsList>

                  {activeTab === "chart" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-16 text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetZoom}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <TabsContent value="chart" className="space-y-6 mt-0">
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interactive Org Chart */}
                  <div
                    ref={chartRef}
                    className="relative overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 min-h-[600px]"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "top left",
                      minHeight: isFullscreen ? "80vh" : "600px",
                    }}
                  >
                    <div className="flex flex-col items-center space-y-8">
                      {/* CEO Level - data: first department from API (departments[0]) */}
                      {departments.length > 0 && (
                        <OrgChartDepartmentNode
                          department={departments[0]}
                          level={1}
                          employees={employees}
                          getDepartmentByName={getDepartmentByName}
                          onSelectEmployee={setSelectedEmployee}
                        />
                      )}

                      {/* C-Level - data: employees with level 2 from API */}
                      <div className="flex items-start justify-center space-x-8">
                        {getEmployeesByLevel(2).map((cLevel) => {
                          const dept = getDepartmentByName(cLevel.department);
                          if (!dept || !dept.isExpanded) return null;

                          return (
                            <div
                              key={cLevel.id}
                              className="flex flex-col items-center space-y-4"
                            >
                              <OrgChartEmployeeCard
                                employee={cLevel}
                                getDepartmentByName={getDepartmentByName}
                                onSelectEmployee={setSelectedEmployee}
                              />

                              {/* Department subordinates */}
                              {cLevel.directReports.length > 0 && (
                                <div className="flex flex-col items-center space-y-4">
                                  <div className="w-0.5 h-6 bg-gray-300"></div>
                                  <div className="flex flex-wrap justify-center gap-6">
                                    {cLevel.directReports.map((reportId) => {
                                      const subordinate = employees.find(
                                        (emp) => emp.id === reportId
                                      );
                                      if (!subordinate) return null;

                                      return (
                                        <div
                                          key={reportId}
                                          className="flex flex-col items-center"
                                        >
                                          <OrgChartEmployeeCard
                                            employee={subordinate}
                                            isCompact
                                            getDepartmentByName={
                                              getDepartmentByName
                                            }
                                            onSelectEmployee={
                                              setSelectedEmployee
                                            }
                                          />

                                          {/* Individual contributors under managers */}
                                          {subordinate.directReports.length >
                                            0 && (
                                            <div className="flex flex-col items-center mt-4 space-y-2">
                                              <div className="w-0.5 h-4 bg-gray-300"></div>
                                              <div className="flex flex-wrap gap-2">
                                                {subordinate.directReports.map(
                                                  (icId) => {
                                                    const ic = employees.find(
                                                      (emp) => emp.id === icId
                                                    );
                                                    if (!ic) return null;
                                                    return (
                                                      <OrgChartEmployeeCard
                                                        key={icId}
                                                        employee={ic}
                                                        isCompact
                                                        getDepartmentByName={
                                                          getDepartmentByName
                                                        }
                                                        onSelectEmployee={
                                                          setSelectedEmployee
                                                        }
                                                      />
                                                    );
                                                  }
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="directory" className="space-y-6 mt-0">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Employee Directory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEmployees.map((employee) => (
                      <Card
                        key={employee.id}
                        className="border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <img
                                src={employee.avatar}
                                alt={employee.name}
                                className="object-cover"
                              />
                              <AvatarFallback>
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {employee.name}
                                </h3>
                                {employee.isManager && (
                                  <Crown className="w-3 h-3 text-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {employee.role}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {employee.department}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    getStatusColor(employee.status) + " text-xs"
                                  }
                                >
                                  {employee.status}
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <Separator className="my-3" />
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {employee.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {employee.location}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredEmployees.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No employees found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search criteria.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teams" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Department Overview
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {departments.map((department) => {
                        const deptEmployees = employees.filter(
                          (emp) =>
                            emp.department.toLowerCase() ===
                            department.name.toLowerCase()
                        );
                        const managers = deptEmployees.filter(
                          (emp) => emp.isManager
                        );
                        const deptHead = employees.find(
                          (emp) => emp.id === department.headId
                        );

                        return (
                          <Card
                            key={department.id}
                            className="border-gray-200 dark:border-gray-700"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{
                                      backgroundColor: department.color,
                                    }}
                                  ></div>
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    {department.name}
                                  </h3>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleDepartmentExpansion(department.id)
                                  }
                                >
                                  {department.isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                      {deptEmployees.length}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Total
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                      {managers.length}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Managers
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                      {
                                        deptEmployees.filter(
                                          (emp) => emp.status === "remote"
                                        ).length
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Remote
                                    </p>
                                  </div>
                                </div>

                                {deptHead && (
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <Avatar className="w-8 h-8">
                                      <img
                                        src={deptHead.avatar}
                                        alt={deptHead.name}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="text-xs">
                                        {deptHead.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {deptHead.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Department Head
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {department.isExpanded && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Team Members
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {deptEmployees
                                        .slice(0, 6)
                                        .map((employee) => (
                                          <div
                                            key={employee.id}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900 rounded"
                                          >
                                            <Avatar className="w-6 h-6">
                                              <img
                                                src={employee.avatar}
                                                alt={employee.name}
                                                className="object-cover"
                                              />
                                              <AvatarFallback className="text-xs">
                                                {employee.name
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {employee.name}
                                              </p>
                                            </div>
                                            {employee.isManager && (
                                              <Crown className="w-3 h-3 text-amber-500" />
                                            )}
                                          </div>
                                        ))}
                                      {deptEmployees.length > 6 && (
                                        <div className="col-span-2 text-center p-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                          >
                                            +{deptEmployees.length - 6} more
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                label="Add Employee"
                icon={UserPlus}
                onClick={() => {}}
                variant="primary"
              />
              <QuickActionButton
                label="Manage Departments"
                icon={Building}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Export Org Chart"
                icon={Network}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Chart Settings"
                icon={Settings}
                onClick={() => {}}
              />
            </CardContent>
          </Card>

          {/* Department Legend - data: departments from API (id, name, color, employeeCount) */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {dept.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {dept.employeeCount}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats - derived from employees/departments (data: same API as above) */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Team Size:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {departments.length > 0
                      ? Math.round(employees.length / departments.length)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Management Ratio:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {employees.length > 0
                      ? `${Math.round(
                          (employees.filter((e) => e.isManager).length /
                            employees.length) *
                            100
                        )}%`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Remote Workers:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {employees.length > 0
                      ? `${Math.round(
                          (employees.filter((e) => e.status === "remote")
                            .length /
                            employees.length) *
                            100
                        )}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates - data: feed from API (e.g. org changes, new hires, promotions) */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {/* TODO: Replace with API data - e.g. GET /api/org-chart/recent-updates */}
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  No recent updates. Load feed from API.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Employee Detail Dialog */}
      {selectedEmployee && (
        <Dialog
          open={!!selectedEmployee}
          onOpenChange={() => setSelectedEmployee(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Employee Profile</DialogTitle>
              <DialogDescription>
                Detailed information for {selectedEmployee.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {selectedEmployee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedEmployee.role}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getDepartmentByName(
                          selectedEmployee.department
                        )?.color,
                        color: getDepartmentByName(selectedEmployee.department)
                          ?.color,
                      }}
                    >
                      {selectedEmployee.department}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusColor(selectedEmployee.status)}
                    >
                      {selectedEmployee.status}
                    </Badge>
                    {selectedEmployee.isManager && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Manager
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedEmployee.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedEmployee.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedEmployee.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Started {formatDate(selectedEmployee.startDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Reporting Structure
                  </h4>
                  <div className="space-y-3">
                    {selectedEmployee.managerId && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Reports to:
                        </p>
                        {(() => {
                          const manager = employees.find(
                            (emp) => emp.id === selectedEmployee.managerId
                          );
                          return manager ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <img
                                  src={manager.avatar}
                                  alt={manager.name}
                                  className="object-cover"
                                />
                                <AvatarFallback className="text-xs">
                                  {manager.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-gray-900 dark:text-gray-100">
                                {manager.name}
                              </span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {selectedEmployee.directReports.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Direct Reports (
                          {selectedEmployee.directReports.length}):
                        </p>
                        <div className="space-y-1">
                          {selectedEmployee.directReports
                            .slice(0, 3)
                            .map((reportId) => {
                              const report = employees.find(
                                (emp) => emp.id === reportId
                              );
                              return report ? (
                                <div
                                  key={reportId}
                                  className="flex items-center gap-2"
                                >
                                  <Avatar className="w-6 h-6">
                                    <img
                                      src={report.avatar}
                                      alt={report.name}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="text-xs">
                                      {report.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-gray-900 dark:text-gray-100 text-sm">
                                    {report.name}
                                  </span>
                                </div>
                              ) : null;
                            })}
                          {selectedEmployee.directReports.length > 3 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              +{selectedEmployee.directReports.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedEmployee.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Skills & Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="primary">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
