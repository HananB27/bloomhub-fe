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

  // Mock employee data
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "ceo-001",
      name: "Sarah Johnson",
      role: "Chief Executive Officer",
      department: "Executive",
      email: "sarah.johnson@bloomteq.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      startDate: "2020-01-15",
      level: 1,
      skills: ["Leadership", "Strategy", "Business Development"],
      directReports: ["cto-001", "cfo-001", "chro-001"],
      isManager: true,
      status: "active",
    },
    {
      id: "cto-001",
      name: "Alex Thompson",
      role: "Chief Technology Officer",
      department: "Engineering",
      email: "alex.thompson@bloomteq.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      managerId: "ceo-001",
      startDate: "2020-03-01",
      level: 2,
      skills: ["Software Architecture", "Team Leadership", "DevOps"],
      directReports: ["eng-001", "eng-002", "eng-003"],
      isManager: true,
      status: "active",
    },
    {
      id: "cfo-001",
      name: "Michael Chen",
      role: "Chief Financial Officer",
      department: "Finance",
      email: "michael.chen@bloomteq.com",
      phone: "+1 (555) 345-6789",
      location: "New York, NY",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      managerId: "ceo-001",
      startDate: "2020-05-15",
      level: 2,
      skills: ["Financial Planning", "Budget Management", "Risk Analysis"],
      directReports: ["fin-001", "fin-002"],
      isManager: true,
      status: "active",
    },
    {
      id: "chro-001",
      name: "Emily Rodriguez",
      role: "Chief Human Resources Officer",
      department: "Human Resources",
      email: "emily.rodriguez@bloomteq.com",
      phone: "+1 (555) 456-7890",
      location: "Austin, TX",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      managerId: "ceo-001",
      startDate: "2020-02-20",
      level: 2,
      skills: ["Talent Management", "Organizational Development", "Culture"],
      directReports: ["hr-001", "hr-002"],
      isManager: true,
      status: "active",
    },
    {
      id: "eng-001",
      name: "David Kim",
      role: "Senior Engineering Manager",
      department: "Engineering",
      email: "david.kim@bloomteq.com",
      phone: "+1 (555) 567-8901",
      location: "Seattle, WA",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      managerId: "cto-001",
      startDate: "2021-01-10",
      level: 3,
      skills: ["Full Stack Development", "Team Management", "Agile"],
      directReports: ["eng-004", "eng-005", "eng-006"],
      isManager: true,
      status: "active",
    },
    {
      id: "eng-002",
      name: "Lisa Wong",
      role: "Product Engineering Manager",
      department: "Engineering",
      email: "lisa.wong@bloomteq.com",
      phone: "+1 (555) 678-9012",
      location: "San Francisco, CA",
      avatar:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      managerId: "cto-001",
      startDate: "2021-03-15",
      level: 3,
      skills: ["Product Development", "React", "Node.js"],
      directReports: ["eng-007", "eng-008"],
      isManager: true,
      status: "active",
    },
    {
      id: "eng-003",
      name: "James Wilson",
      role: "DevOps Manager",
      department: "Engineering",
      email: "james.wilson@bloomteq.com",
      phone: "+1 (555) 789-0123",
      location: "Remote",
      avatar:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      managerId: "cto-001",
      startDate: "2021-06-01",
      level: 3,
      skills: ["AWS", "Kubernetes", "CI/CD"],
      directReports: ["eng-009", "eng-010"],
      isManager: true,
      status: "remote",
    },
    {
      id: "fin-001",
      name: "Rachel Green",
      role: "Finance Manager",
      department: "Finance",
      email: "rachel.green@bloomteq.com",
      phone: "+1 (555) 890-1234",
      location: "New York, NY",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      managerId: "cfo-001",
      startDate: "2021-08-20",
      level: 3,
      skills: ["Financial Analysis", "Reporting", "Excel"],
      directReports: ["fin-003"],
      isManager: true,
      status: "active",
    },
    {
      id: "fin-002",
      name: "Robert Taylor",
      role: "Accounting Manager",
      department: "Finance",
      email: "robert.taylor@bloomteq.com",
      phone: "+1 (555) 901-2345",
      location: "New York, NY",
      avatar:
        "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
      managerId: "cfo-001",
      startDate: "2021-09-10",
      level: 3,
      skills: ["Accounting", "Compliance", "Auditing"],
      directReports: [],
      isManager: false,
      status: "active",
    },
    {
      id: "hr-001",
      name: "Maria Garcia",
      role: "HR Manager",
      department: "Human Resources",
      email: "maria.garcia@bloomteq.com",
      phone: "+1 (555) 012-3456",
      location: "Austin, TX",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      managerId: "chro-001",
      startDate: "2021-11-05",
      level: 3,
      skills: ["Recruitment", "Employee Relations", "Training"],
      directReports: ["hr-003"],
      isManager: true,
      status: "active",
    },
    {
      id: "hr-002",
      name: "Kevin Brown",
      role: "People Operations Manager",
      department: "Human Resources",
      email: "kevin.brown@bloomteq.com",
      phone: "+1 (555) 123-4567",
      location: "Remote",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      managerId: "chro-001",
      startDate: "2022-01-12",
      level: 3,
      skills: ["Operations", "Process Improvement", "Analytics"],
      directReports: [],
      isManager: false,
      status: "remote",
    },
    // Individual Contributors
    {
      id: "eng-004",
      name: "Anna Mitchell",
      role: "Senior Software Engineer",
      department: "Engineering",
      email: "anna.mitchell@bloomteq.com",
      phone: "+1 (555) 234-5678",
      location: "Seattle, WA",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      managerId: "eng-001",
      startDate: "2022-03-01",
      level: 4,
      skills: ["React", "TypeScript", "GraphQL"],
      directReports: [],
      isManager: false,
      status: "active",
    },
    {
      id: "eng-005",
      name: "Tom Anderson",
      role: "Software Engineer",
      department: "Engineering",
      email: "tom.anderson@bloomteq.com",
      phone: "+1 (555) 345-6789",
      location: "Seattle, WA",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      managerId: "eng-001",
      startDate: "2022-06-15",
      level: 4,
      skills: ["Python", "Django", "PostgreSQL"],
      directReports: [],
      isManager: false,
      status: "active",
    },
    {
      id: "eng-006",
      name: "Sophie Clark",
      role: "Junior Software Engineer",
      department: "Engineering",
      email: "sophie.clark@bloomteq.com",
      phone: "+1 (555) 456-7890",
      location: "Remote",
      avatar:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      managerId: "eng-001",
      startDate: "2023-01-20",
      level: 4,
      skills: ["JavaScript", "HTML/CSS", "Git"],
      directReports: [],
      isManager: false,
      status: "remote",
    },
  ]);

  // Mock department data
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: "executive",
      name: "Executive",
      color: "#8b5cf6",
      headId: "ceo-001",
      employeeCount: 1,
      isExpanded: true,
    },
    {
      id: "engineering",
      name: "Engineering",
      color: "#2563eb",
      headId: "cto-001",
      employeeCount: 9,
      isExpanded: true,
    },
    {
      id: "finance",
      name: "Finance",
      color: "#10b981",
      headId: "cfo-001",
      employeeCount: 3,
      isExpanded: true,
    },
    {
      id: "hr",
      name: "Human Resources",
      color: "#f59e0b",
      headId: "chro-001",
      employeeCount: 3,
      isExpanded: true,
    },
  ]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "onLeave":
        return "bg-amber-100 text-amber-800";
      case "remote":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "🟢";
      case "onLeave":
        return "🟡";
      case "remote":
        return "🔵";
      default:
        return "⚪";
    }
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

  const EmployeeCard = ({
    employee,
    isCompact = false,
  }: {
    employee: Employee;
    isCompact?: boolean;
  }) => {
    const department = getDepartmentByName(employee.department);
    const directReportCount = employee.directReports.length;

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            className={`relative bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
              isCompact ? "p-3 min-w-[200px]" : "p-4 min-w-[240px]"
            }`}
            style={{ borderColor: department?.color || "#e2e8f0" }}
            onClick={() => setSelectedEmployee(employee)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className={isCompact ? "w-10 h-10" : "w-12 h-12"}>
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600">
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
                    className={`font-medium text-gray-900 truncate ${isCompact ? "text-sm" : ""}`}
                  >
                    {employee.name}
                  </h4>
                  {employee.isManager && (
                    <Crown className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <p
                  className={`text-gray-600 truncate ${isCompact ? "text-xs" : "text-sm"}`}
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
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        {directReportCount} reports
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {employee.isManager && employee.directReports.length > 0 && (
              <div className="absolute -bottom-2 left-1/2 transform -trangray-x-1/2">
                <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                  <ChevronDown className="w-2 h-2 text-gray-600" />
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
                <h3 className="font-medium text-gray-900">{employee.name}</h3>
                <p className="text-gray-600">{employee.role}</p>
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
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employee.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employee.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Started {new Date(employee.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {employee.skills.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
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
  };

  const DepartmentNode = ({
    department,
    level,
  }: {
    department: Department;
    level: number;
  }) => {
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
            <EmployeeCard employee={employee} />

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
                              <EmployeeCard employee={subordinate} isCompact />
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Organization Chart
            </h1>
            <p className="text-gray-600 mt-1">
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
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {employees.length}
            </p>
            <p className="text-xs text-gray-500">Active workforce</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Departments</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {departments.length}
            </p>
            <p className="text-xs text-gray-500">Business units</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Managers</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {employees.filter((emp) => emp.isManager).length}
            </p>
            <p className="text-xs text-gray-500">Leadership roles</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Remote Workers</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {employees.filter((emp) => emp.status === "remote").length}
            </p>
            <p className="text-xs text-gray-500">Working remotely</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-gray-200">
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
                      <span className="text-sm text-gray-600 min-w-[4rem] text-center">
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
                      <Search className="absolute left-3 top-1/2 transform -trangray-y-1/2 w-4 h-4 text-gray-400" />
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
                    className="relative overflow-auto bg-gray-50 rounded-lg border border-gray-200 p-8 min-h-[600px]"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "top left",
                      minHeight: isFullscreen ? "80vh" : "600px",
                    }}
                  >
                    <div className="flex flex-col items-center space-y-8">
                      {/* CEO Level */}
                      <DepartmentNode department={departments[0]} level={1} />

                      {/* C-Level */}
                      <div className="flex items-start justify-center space-x-8">
                        {getEmployeesByLevel(2).map((cLevel) => {
                          const dept = getDepartmentByName(cLevel.department);
                          if (!dept || !dept.isExpanded) return null;

                          return (
                            <div
                              key={cLevel.id}
                              className="flex flex-col items-center space-y-4"
                            >
                              <EmployeeCard employee={cLevel} />

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
                                          <EmployeeCard
                                            employee={subordinate}
                                            isCompact
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
                                                      <EmployeeCard
                                                        key={icId}
                                                        employee={ic}
                                                        isCompact
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
                    <Search className="absolute left-3 top-1/2 transform -trangray-y-1/2 w-4 h-4 text-gray-400" />
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
                        className="border-gray-200 hover:shadow-sm transition-shadow"
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
                                <h3 className="font-medium text-gray-900">
                                  {employee.name}
                                </h3>
                                {employee.isManager && (
                                  <Crown className="w-3 h-3 text-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
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
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">
                                {employee.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">
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
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No employees found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search criteria.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teams" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
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
                          <Card key={department.id} className="border-gray-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{
                                      backgroundColor: department.color,
                                    }}
                                  ></div>
                                  <h3 className="font-medium text-gray-900">
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
                                    <p className="text-2xl font-bold text-gray-900">
                                      {deptEmployees.length}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Total
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                      {managers.length}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Managers
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                      {
                                        deptEmployees.filter(
                                          (emp) => emp.status === "remote"
                                        ).length
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Remote
                                    </p>
                                  </div>
                                </div>

                                {deptHead && (
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
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
                                      <p className="text-sm font-medium text-gray-900">
                                        {deptHead.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Department Head
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {department.isExpanded && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">
                                      Team Members
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {deptEmployees
                                        .slice(0, 6)
                                        .map((employee) => (
                                          <div
                                            key={employee.id}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
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
                                              <p className="text-xs font-medium text-gray-900 truncate">
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
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4" />
                Add Employee
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Building className="w-4 h-4" />
                Manage Departments
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Network className="w-4 h-4" />
                Export Org Chart
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="w-4 h-4" />
                Chart Settings
              </Button>
            </CardContent>
          </Card>

          {/* Department Legend */}
          <Card className="border-gray-200">
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
                    <span className="text-sm text-gray-700">{dept.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {dept.employeeCount}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Team Size:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(employees.length / departments.length)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Management Ratio:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(
                      (employees.filter((e) => e.isManager).length /
                        employees.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remote Workers:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(
                      (employees.filter((e) => e.status === "remote").length /
                        employees.length) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">
                      New hire: Sophie Clark
                    </p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">
                      Promotion: David Kim
                    </p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">
                      Department restructure
                    </p>
                    <p className="text-xs text-gray-500">2 weeks ago</p>
                  </div>
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
                  <h3 className="text-xl font-medium text-gray-900">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-gray-600">{selectedEmployee.role}</p>
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
                  <h4 className="font-medium text-gray-900">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {selectedEmployee.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {selectedEmployee.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {selectedEmployee.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Started {formatDate(selectedEmployee.startDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Reporting Structure
                  </h4>
                  <div className="space-y-3">
                    {selectedEmployee.managerId && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
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
                              <span className="text-gray-900">
                                {manager.name}
                              </span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {selectedEmployee.directReports.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
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
                                  <span className="text-gray-900 text-sm">
                                    {report.name}
                                  </span>
                                </div>
                              ) : null;
                            })}
                          {selectedEmployee.directReports.length > 3 && (
                            <p className="text-sm text-gray-500">
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
                    <h4 className="font-medium text-gray-900 mb-3">
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
                <Button className="bg-blue-600 hover:bg-blue-700">
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
