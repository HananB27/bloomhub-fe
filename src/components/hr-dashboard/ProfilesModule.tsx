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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Edit,
  Plus,
  X,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Building,
  DollarSign,
  FileText,
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/utils";
import { useSession } from "next-auth/react";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";

interface Employee {
  id: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
    birthday: string;
    startDate: string;
  };
  professional: {
    role: string;
    cpfLevel: string;
    department: string;
    manager: string;
    employeeId: string;
  };
  techStack: string[];
  projects: Array<{
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate?: string;
    status: "current" | "completed" | "paused";
  }>;
  equipment: Array<{
    id: string;
    type: string;
    brand: string;
    model: string;
    serialNumber: string;
    assignedDate: string;
    condition: string;
  }>;
  salaryHistory: Array<{
    id: string;
    effectiveDate: string;
    amount: number;
    currency: string;
    notes: string;
    approvedBy: string;
  }>;
  documents: {
    cvUploaded: boolean;
    cvFileName?: string;
    agreementsSigned: string[];
  };
  avatar: string;
}

export function ProfilesModule() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const roleSource =
    (session?.user as { role?: string; career_level?: string } | undefined)
      ?.role ||
    (session?.user as { role?: string; career_level?: string } | undefined)
      ?.career_level;
  const isHRUser = isHrLikeRole(roleSource);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);
  const [newTechTag, setNewTechTag] = useState("");

  // Mock employee data
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "emp-001",
      personalInfo: {
        fullName: "Alex Thompson",
        email: "alex.thompson@bloomteq.com",
        phone: "+387 61 123 456",
        address: "Sarajevo, Bosnia and Herzegovina",
        emergencyContact: "Sarah Thompson",
        emergencyPhone: "+387 61 654 321",
        birthday: "1990-05-15",
        startDate: "2023-01-15",
      },
      professional: {
        role: "Senior Software Engineer",
        cpfLevel: "Senior (L4)",
        department: "Engineering",
        manager: "John Smith",
        employeeId: "BLQ-001",
      },
      techStack: [
        "React",
        "TypeScript",
        "Node.js",
        "PostgreSQL",
        "AWS",
        "Docker",
      ],
      projects: [
        {
          id: "proj-001",
          name: "HR Management System",
          role: "Lead Developer",
          startDate: "2024-06-01",
          status: "current",
        },
        {
          id: "proj-002",
          name: "Customer Portal Redesign",
          role: "Frontend Developer",
          startDate: "2024-01-15",
          endDate: "2024-05-30",
          status: "completed",
        },
      ],
      equipment: [
        {
          id: "eq-001",
          type: "Laptop",
          brand: "MacBook Pro",
          model: "14-inch M3",
          serialNumber: "MBP-2024-001",
          assignedDate: "2023-01-15",
          condition: "Excellent",
        },
        {
          id: "eq-002",
          type: "Monitor",
          brand: "Dell",
          model: 'UltraSharp 27"',
          serialNumber: "DELL-MON-001",
          assignedDate: "2023-01-15",
          condition: "Good",
        },
      ],
      salaryHistory: [
        {
          id: "sal-001",
          effectiveDate: "2024-01-01",
          amount: 2800,
          currency: "BAM",
          notes: "Annual performance review increase",
          approvedBy: "HR Director",
        },
        {
          id: "sal-002",
          effectiveDate: "2023-01-15",
          amount: 2500,
          currency: "BAM",
          notes: "Starting salary",
          approvedBy: "HR Director",
        },
      ],
      documents: {
        cvUploaded: true,
        cvFileName: "alex_thompson_cv.pdf",
        agreementsSigned: ["Employment Contract", "NDA", "Equipment Agreement"],
      },
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: "emp-002",
      personalInfo: {
        fullName: "Sarah Johnson",
        email: "sarah.johnson@bloomteq.com",
        phone: "+387 61 789 012",
        address: "Tuzla, Bosnia and Herzegovina",
        emergencyContact: "Michael Johnson",
        emergencyPhone: "+387 61 210 987",
        birthday: "1988-08-22",
        startDate: "2022-03-01",
      },
      professional: {
        role: "HR Director",
        cpfLevel: "Director (L6)",
        department: "Human Resources",
        manager: "CEO",
        employeeId: "BLQ-002",
      },
      techStack: ["HRIS", "Excel", "PowerBI", "Slack", "Workday"],
      projects: [
        {
          id: "proj-003",
          name: "Employee Onboarding Process",
          role: "Project Lead",
          startDate: "2024-03-01",
          status: "current",
        },
      ],
      equipment: [
        {
          id: "eq-003",
          type: "Laptop",
          brand: "MacBook Air",
          model: "13-inch M2",
          serialNumber: "MBA-2023-002",
          assignedDate: "2022-03-01",
          condition: "Good",
        },
      ],
      salaryHistory: [
        {
          id: "sal-003",
          effectiveDate: "2024-01-01",
          amount: 3500,
          currency: "BAM",
          notes: "Annual review + promotion to Director",
          approvedBy: "CEO",
        },
      ],
      documents: {
        cvUploaded: true,
        cvFileName: "sarah_johnson_cv.pdf",
        agreementsSigned: [
          "Employment Contract",
          "NDA",
          "Management Agreement",
        ],
      },
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
    },
  ]);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.personalInfo.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      emp.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.professional.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cpfLevels = [
    "Junior (L1)",
    "Mid-level (L2)",
    "Senior (L3)",
    "Senior+ (L4)",
    "Lead (L5)",
    "Director (L6)",
  ];

  const getEquipmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "laptop":
        return <Laptop className="w-4 h-4" />;
      case "monitor":
        return <Monitor className="w-4 h-4" />;
      case "keyboard":
        return <Keyboard className="w-4 h-4" />;
      case "mouse":
        return <Mouse className="w-4 h-4" />;
      case "headphones":
        return <Headphones className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const addTechTag = (employeeId: string) => {
    if (!newTechTag.trim()) return;

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, techStack: [...emp.techStack, newTechTag.trim()] }
          : emp
      )
    );
    setNewTechTag("");
  };

  const removeTechTag = (employeeId: string, tagToRemove: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? {
              ...emp,
              techStack: emp.techStack.filter((tag) => tag !== tagToRemove),
            }
          : emp
      )
    );
  };

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case "current":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Current
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Paused
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

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <Card
      className="border-gray-200 hover:shadow-md transition-all cursor-pointer"
      onClick={() => setSelectedEmployee(employee)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage
              src={employee.avatar}
              alt={employee.personalInfo.fullName}
            />
            <AvatarFallback>
              {employee.personalInfo.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">
              {employee.personalInfo.fullName}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {employee.professional.role}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {employee.personalInfo.email}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {employee.professional.department}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(employee.personalInfo.startDate)}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {employee.techStack.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {employee.techStack.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{employee.techStack.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                {employee.professional.cpfLevel}
              </Badge>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Profiles
          </h1>
          <p className="text-gray-600">
            Manage employee information, roles, and professional development
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Employee Data</DialogTitle>
                <DialogDescription>
                  Export employee profiles and information in various formats.
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

                <div className="space-y-2">
                  <Label>Include Data</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="personal"
                        defaultChecked
                        className="rounded"
                      />
                      <Label htmlFor="personal" className="text-sm">
                        Personal information
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="professional"
                        defaultChecked
                        className="rounded"
                      />
                      <Label htmlFor="professional" className="text-sm">
                        Professional details
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="projects"
                        className="rounded"
                      />
                      <Label htmlFor="projects" className="text-sm">
                        Project history
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="equipment"
                        className="rounded"
                      />
                      <Label htmlFor="equipment" className="text-sm">
                        Equipment assignments
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Employees</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      <SelectItem value="active">Active only</SelectItem>
                      <SelectItem value="department">By department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="primary" className="flex-1">
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
                <DialogTitle>Filter Employees</DialogTitle>
                <DialogDescription>
                  Apply filters to find specific employees quickly.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>CPF Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="junior">Junior (L1-L2)</SelectItem>
                      <SelectItem value="senior">Senior (L3-L4)</SelectItem>
                      <SelectItem value="lead">Lead (L5+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Technology</Label>
                  <Input placeholder="Search by technology..." />
                </div>

                <div className="space-y-2">
                  <Label>Start Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" placeholder="From" />
                    <Input type="date" placeholder="To" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="primary" className="flex-1">
                  Apply Filters
                </Button>
                <Button variant="outline">Clear All</Button>
              </div>
            </DialogContent>
          </Dialog>
          {isHRUser && (
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {!selectedEmployee ? (
        /* Employee Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      ) : (
        /* Employee Detail View */
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => setSelectedEmployee(null)}
            className="mb-4"
          >
            ← Back to Employees
          </Button>

          {/* Employee Header */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={selectedEmployee.avatar}
                      alt={selectedEmployee.personalInfo.fullName}
                    />
                    <AvatarFallback className="text-lg">
                      {selectedEmployee.personalInfo.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedEmployee.personalInfo.fullName}
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">
                      {selectedEmployee.professional.role}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Employee ID: {selectedEmployee.professional.employeeId}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {selectedEmployee.professional.department}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Started{" "}
                        {formatDate(selectedEmployee.personalInfo.startDate)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isHRUser && (
                    <Button
                      variant={isEditMode ? "primary" : "outline"}
                      onClick={() => setIsEditMode(!isEditMode)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditMode ? "Save Changes" : "Edit Profile"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Details Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="professional">Role & CPF</TabsTrigger>
              <TabsTrigger value="tech">Tech Stack</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="salary">Salary History</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={selectedEmployee.personalInfo.fullName}
                        readOnly={!isEditMode}
                        className={!isEditMode ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={selectedEmployee.personalInfo.email}
                        readOnly={!isEditMode}
                        className={!isEditMode ? "bg-gray-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={selectedEmployee.personalInfo.phone}
                        readOnly={!isEditMode}
                        className={!isEditMode ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <Input
                        type="date"
                        value={selectedEmployee.personalInfo.birthday}
                        readOnly={!isEditMode}
                        className={!isEditMode ? "bg-gray-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={selectedEmployee.personalInfo.address}
                      readOnly={!isEditMode}
                      className={!isEditMode ? "bg-gray-50" : ""}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Emergency Contact</Label>
                      <Input
                        value={selectedEmployee.personalInfo.emergencyContact}
                        readOnly={!isEditMode}
                        className={!isEditMode ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Phone</Label>
                      <Input
                        value={selectedEmployee.personalInfo.emergencyPhone}
                        readOnly={!isEditMode}
                        className={!isEditMode ? "bg-gray-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Documents</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.documents.cvUploaded && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <FileText className="w-3 h-3 mr-1" />
                          CV Uploaded ({selectedEmployee.documents.cvFileName})
                        </Badge>
                      )}
                      {selectedEmployee.documents.agreementsSigned.map(
                        (agreement) => (
                          <Badge
                            key={agreement}
                            className="bg-blue-100 text-blue-800 border-blue-200"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {agreement}
                          </Badge>
                        )
                      )}
                    </div>
                    {isEditMode && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Role & Career Progression Framework</CardTitle>
                  {!isHRUser && (
                    <p className="text-sm text-gray-500">Read-only view</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={selectedEmployee.professional.role}
                        readOnly={!isEditMode || !isHRUser}
                        className={!isEditMode || !isHRUser ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF Level</Label>
                      {isEditMode && isHRUser ? (
                        <Select
                          value={selectedEmployee.professional.cpfLevel}
                          onValueChange={(value) =>
                            setSelectedEmployee({
                              ...selectedEmployee,
                              professional: {
                                ...selectedEmployee.professional,
                                cpfLevel: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cpfLevels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={selectedEmployee.professional.cpfLevel}
                          readOnly
                          className="bg-gray-50"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input
                        value={selectedEmployee.professional.department}
                        readOnly={!isEditMode || !isHRUser}
                        className={!isEditMode || !isHRUser ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager</Label>
                      <Input
                        value={selectedEmployee.professional.manager}
                        readOnly={!isEditMode || !isHRUser}
                        className={!isEditMode || !isHRUser ? "bg-gray-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={selectedEmployee.personalInfo.startDate}
                      readOnly={!isEditMode || !isHRUser}
                      className={!isEditMode || !isHRUser ? "bg-gray-50" : ""}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tech" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Technology Stack</CardTitle>
                  <p className="text-sm text-gray-500">
                    Skills and technologies
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.techStack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {tech}
                        {isEditMode && (
                          <button
                            onClick={() =>
                              removeTechTag(selectedEmployee.id, tech)
                            }
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {isEditMode && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new technology..."
                        value={newTechTag}
                        onChange={(e) => setNewTechTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            addTechTag(selectedEmployee.id);
                          }
                        }}
                      />
                      <Button onClick={() => addTechTag(selectedEmployee.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Project History</CardTitle>
                  <p className="text-sm text-gray-500">
                    Current and past project assignments
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEmployee.projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell>{project.role}</TableCell>
                          <TableCell>{formatDate(project.startDate)}</TableCell>
                          <TableCell>
                            {project.endDate
                              ? formatDate(project.endDate)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {getProjectStatusBadge(project.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Equipment Assignment</CardTitle>
                  <p className="text-sm text-gray-500">
                    Company equipment with serial numbers
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Brand & Model</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Condition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEmployee.equipment.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEquipmentIcon(item.type)}
                              {item.type}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.brand} {item.model}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.serialNumber}
                          </TableCell>
                          <TableCell>{formatDate(item.assignedDate)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.condition === "Excellent"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }
                            >
                              {item.condition}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salary" className="space-y-6">
              {isHRUser ? (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      HR-Only: Salary History
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowSalaryHistory(!showSalaryHistory)
                          }
                        >
                          {showSalaryHistory ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showSalaryHistory ? (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="salary-history">
                          <AccordionTrigger className="text-left">
                            <div>
                              <p className="font-medium">
                                Salary History & Changes
                              </p>
                              <p className="text-sm text-gray-500">
                                Current:{" "}
                                {formatCurrency(
                                  selectedEmployee.salaryHistory[0]?.amount ||
                                    0,
                                  selectedEmployee.salaryHistory[0]?.currency ||
                                    "BAM",
                                  "de-DE"
                                )}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Effective Date</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Notes</TableHead>
                                  <TableHead>Approved By</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedEmployee.salaryHistory.map((entry) => (
                                  <TableRow key={entry.id}>
                                    <TableCell>
                                      {formatDate(entry.effectiveDate)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {formatCurrency(
                                        entry.amount,
                                        entry.currency,
                                        "de-DE"
                                      )}
                                    </TableCell>
                                    <TableCell>{entry.notes}</TableCell>
                                    <TableCell>{entry.approvedBy}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Click the eye icon to view salary information
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="p-8 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Access Restricted
                    </h3>
                    <p className="text-gray-500">
                      Salary information is only available to HR personnel.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
