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
import { QuickActionButton } from "./QuickActionButton";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import {
  GraduationCap,
  Calendar,
  DollarSign,
  Upload,
  Download,
  Plus,
  Filter,
  Users,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  FileText,
  Building,
  Clock,
  MapPin,
  X,
  Eye,
  Edit3,
  Save,
  User,
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  provider: string;
  type: "course" | "conference" | "certification" | "workshop";
  date: string;
  cost: number;
  status: "completed" | "in-progress" | "registered" | "planned";
  duration: string;
  location: string;
  description: string;
}

interface Certificate {
  id: number;
  title: string;
  provider: string;
  dateEarned: string;
  expiryDate: string;
  credentialId: string;
  thumbnail: string;
  category: string;
}

interface PeerSession {
  id: number;
  topic: string;
  presenter: string;
  date: string;
  attendees: string[];
  status: "scheduled" | "completed" | "cancelled";
  description: string;
  duration: string;
}

export function TrainingModule() {
  const [selectedEmployee, setSelectedEmployee] = useState("sarah-johnson");
  const [activeTab, setActiveTab] = useState("courses");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [newPeerSession, setNewPeerSession] = useState({
    topic: "",
    presenter: "",
    date: "",
    attendees: [] as string[],
    description: "",
    duration: "",
  });

  // Mock employee data
  const employees = [
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
  ];

  // Mock training courses data
  const courses: Course[] = [
    {
      id: 1,
      title: "Advanced React Development",
      provider: "React Training",
      type: "course",
      date: "Jul 15, 2025",
      cost: 1299,
      status: "completed",
      duration: "40 hours",
      location: "Online",
      description:
        "Comprehensive course covering advanced React patterns, hooks, and performance optimization",
    },
    {
      id: 2,
      title: "AWS Solutions Architect Conference",
      provider: "Amazon Web Services",
      type: "conference",
      date: "Sep 20, 2025",
      cost: 2500,
      status: "registered",
      duration: "3 days",
      location: "Las Vegas, NV",
      description: "Premier conference for cloud architects and developers",
    },
    {
      id: 3,
      title: "Certified Kubernetes Administrator",
      provider: "Linux Foundation",
      type: "certification",
      date: "Oct 15, 2025",
      cost: 375,
      status: "planned",
      duration: "Exam",
      location: "Testing Center",
      description:
        "Industry-recognized certification for Kubernetes administration",
    },
    {
      id: 4,
      title: "Leadership Fundamentals Workshop",
      provider: "Leadership Institute",
      type: "workshop",
      date: "Aug 30, 2025",
      cost: 800,
      status: "in-progress",
      duration: "2 days",
      location: "San Francisco, CA",
      description:
        "Hands-on workshop focusing on leadership skills and team management",
    },
  ];

  // Mock certificates data
  const certificates: Certificate[] = [
    {
      id: 1,
      title: "AWS Solutions Architect",
      provider: "Amazon Web Services",
      dateEarned: "Jun 15, 2025",
      expiryDate: "Jun 15, 2028",
      credentialId: "AWS-SAA-123456",
      thumbnail: "/api/placeholder/200/150",
      category: "Cloud Computing",
    },
    {
      id: 2,
      title: "React Developer Certification",
      provider: "React Training",
      dateEarned: "Jul 20, 2025",
      expiryDate: "Jul 20, 2027",
      credentialId: "REACT-DEV-789012",
      thumbnail: "/api/placeholder/200/150",
      category: "Frontend Development",
    },
    {
      id: 3,
      title: "Scrum Master Certified",
      provider: "Scrum Alliance",
      dateEarned: "Mar 10, 2025",
      expiryDate: "Mar 10, 2027",
      credentialId: "CSM-345678",
      thumbnail: "/api/placeholder/200/150",
      category: "Project Management",
    },
    {
      id: 4,
      title: "Docker Certified Associate",
      provider: "Docker Inc.",
      dateEarned: "May 5, 2025",
      expiryDate: "May 5, 2027",
      credentialId: "DCA-901234",
      thumbnail: "/api/placeholder/200/150",
      category: "DevOps",
    },
  ];

  // Mock peer learning sessions
  const [peerSessions, setPeerSessions] = useState<PeerSession[]>([
    {
      id: 1,
      topic: "Advanced TypeScript Patterns",
      presenter: "Sarah Johnson",
      date: "Aug 15, 2025",
      attendees: ["Michael Chen", "David Kim", "Emily Rodriguez"],
      status: "scheduled",
      description:
        "Deep dive into advanced TypeScript patterns and best practices",
      duration: "1 hour",
    },
    {
      id: 2,
      topic: "API Design Best Practices",
      presenter: "Alex Thompson",
      date: "Jul 20, 2025",
      attendees: ["Sarah Johnson", "Michael Chen", "Lisa Wong"],
      status: "completed",
      description: "Comprehensive overview of RESTful API design principles",
      duration: "1.5 hours",
    },
  ]);

  // Budget tracking data
  const budgetData = {
    allocated: 15000,
    spent: 8974,
    committed: 3675, // registered/planned courses
    remaining: 2351,
  };

  const budgetProgress = (budgetData.spent / budgetData.allocated) * 100;
  const commitmentProgress =
    ((budgetData.spent + budgetData.committed) / budgetData.allocated) * 100;

  const selectedEmployeeData = employees.find(
    (emp) => emp.id === selectedEmployee
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "registered":
        return "bg-purple-100 text-purple-800";
      case "planned":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "course":
        return "bg-blue-100 text-blue-800";
      case "conference":
        return "bg-purple-100 text-purple-800";
      case "certification":
        return "bg-green-100 text-green-800";
      case "workshop":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file) => file.name);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleAddPeerSession = () => {
    if (
      !newPeerSession.topic ||
      !newPeerSession.presenter ||
      !newPeerSession.date
    )
      return;

    const session: PeerSession = {
      id: Date.now(),
      ...newPeerSession,
      status: "scheduled",
    };

    setPeerSessions((prev) => [...prev, session]);
    setNewPeerSession({
      topic: "",
      presenter: "",
      date: "",
      attendees: [],
      description: "",
      duration: "",
    });
  };

  const addAttendee = (attendeeName: string) => {
    if (attendeeName && !newPeerSession.attendees.includes(attendeeName)) {
      setNewPeerSession((prev) => ({
        ...prev,
        attendees: [...prev.attendees, attendeeName],
      }));
    }
  };

  const removeAttendee = (attendeeName: string) => {
    setNewPeerSession((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((name) => name !== attendeeName),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Training & Development
            </h1>
            <p className="text-gray-600 mt-1">
              Manage employee training programs and certifications
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
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Training
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Completed Courses</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-xs text-gray-500">This year</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Certificates</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {certificates.length}
            </p>
            <p className="text-xs text-gray-500">Active certifications</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Budget Used</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(budgetProgress)}%
            </p>
            <p className="text-xs text-gray-500">
              ${budgetData.spent.toLocaleString()} spent
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Peer Sessions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {peerSessions.length}
            </p>
            <p className="text-xs text-gray-500">This quarter</p>
          </div>
        </div>

        {/* Employee Selector */}
        <div className="mt-6 max-w-md">
          <Label htmlFor="employee-select">Select Employee</Label>
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
                      <p className="text-xs text-gray-500">
                        {employee.department} - {employee.role}
                      </p>
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
          <Card className="border-gray-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="peer-learning">Peer Learning</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="courses" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Training History
                      </h3>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                      </Button>
                    </div>

                    {/* Course Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course/Conference</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses.map((course) => (
                            <TableRow key={course.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {course.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {course.duration} • {course.location}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{course.provider}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getTypeColor(course.type)}
                                >
                                  {course.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{course.date}</TableCell>
                              <TableCell>
                                ${course.cost.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(course.status)}
                                >
                                  {course.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Course Details Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-green-900">
                            Completed
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {
                            courses.filter((c) => c.status === "completed")
                              .length
                          }
                        </p>
                        <p className="text-xs text-green-600">courses</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            In Progress
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {
                            courses.filter((c) => c.status === "in-progress")
                              .length
                          }
                        </p>
                        <p className="text-xs text-blue-600">courses</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900">
                            Upcoming
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {
                            courses.filter(
                              (c) =>
                                c.status === "registered" ||
                                c.status === "planned"
                            ).length
                          }
                        </p>
                        <p className="text-xs text-purple-600">courses</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="certificates" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Certificate Collection
                      </h3>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="certificate-upload"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById("certificate-upload")
                              ?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Certificate
                        </Button>
                      </div>
                    </div>

                    {/* Certificate Thumbnail Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                        >
                          <div className="aspect-[4/3] bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                            <Award className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                              {cert.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {cert.provider}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {cert.category}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-500">
                              <p>Earned: {cert.dateEarned}</p>
                              <p>Expires: {cert.expiryDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Certificate Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Drag and drop certificate files here
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports PDF, JPG, PNG files up to 10MB
                      </p>
                    </div>

                    {/* Recently Uploaded */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">
                          Recently Uploaded
                        </h4>
                        {uploadedFiles.map((fileName, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {fileName}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setUploadedFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4 mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Training Budget Overview
                      </h3>
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Adjust Budget
                      </Button>
                    </div>

                    {/* Budget Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900">
                          Total Allocated
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          ${budgetData.allocated.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600">Annual budget</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-900">
                          Spent
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          ${budgetData.spent.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          {Math.round(budgetProgress)}% of budget
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-amber-900">
                          Committed
                        </p>
                        <p className="text-2xl font-bold text-amber-700">
                          ${budgetData.committed.toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-600">
                          Registered courses
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900">
                          Remaining
                        </p>
                        <p className="text-2xl font-bold text-gray-700">
                          ${budgetData.remaining.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Available to spend
                        </p>
                      </div>
                    </div>

                    {/* Budget Progress Bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Budget Utilization
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round(budgetProgress)}%
                          </span>
                        </div>
                        <Progress value={budgetProgress} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">
                          ${budgetData.spent.toLocaleString()} spent of $
                          {budgetData.allocated.toLocaleString()} allocated
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Including Commitments
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round(commitmentProgress)}%
                          </span>
                        </div>
                        <Progress value={commitmentProgress} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">
                          $
                          {(
                            budgetData.spent + budgetData.committed
                          ).toLocaleString()}{" "}
                          spent + committed
                        </p>
                      </div>
                    </div>

                    {/* Budget Breakdown by Category */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">
                        Spending by Category
                      </h4>
                      <div className="space-y-3">
                        {[
                          {
                            category: "Technical Courses",
                            amount: 4200,
                            percentage: 47,
                          },
                          {
                            category: "Conferences",
                            amount: 2500,
                            percentage: 28,
                          },
                          {
                            category: "Certifications",
                            amount: 1574,
                            percentage: 18,
                          },
                          {
                            category: "Leadership Training",
                            amount: 700,
                            percentage: 7,
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {item.category}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ${item.amount.toLocaleString()}
                                </span>
                              </div>
                              <Progress
                                value={item.percentage}
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="peer-learning" className="space-y-4 mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Peer Learning Sessions
                      </h3>
                    </div>

                    {/* New Session Form */}
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Schedule New Session
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="session-topic">Topic</Label>
                            <Input
                              id="session-topic"
                              placeholder="e.g., Advanced React Patterns"
                              value={newPeerSession.topic}
                              onChange={(e) =>
                                setNewPeerSession((prev) => ({
                                  ...prev,
                                  topic: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="session-presenter">Presenter</Label>
                            <Select
                              value={newPeerSession.presenter}
                              onValueChange={(value) =>
                                setNewPeerSession((prev) => ({
                                  ...prev,
                                  presenter: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select presenter" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((employee) => (
                                  <SelectItem
                                    key={employee.id}
                                    value={employee.name}
                                  >
                                    {employee.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="session-date">Date & Time</Label>
                            <Input
                              id="session-date"
                              type="datetime-local"
                              value={newPeerSession.date}
                              onChange={(e) =>
                                setNewPeerSession((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="session-duration">Duration</Label>
                            <Select
                              value={newPeerSession.duration}
                              onValueChange={(value) =>
                                setNewPeerSession((prev) => ({
                                  ...prev,
                                  duration: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30 minutes">
                                  30 minutes
                                </SelectItem>
                                <SelectItem value="1 hour">1 hour</SelectItem>
                                <SelectItem value="1.5 hours">
                                  1.5 hours
                                </SelectItem>
                                <SelectItem value="2 hours">2 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="session-description">
                            Description
                          </Label>
                          <Textarea
                            id="session-description"
                            placeholder="Brief description of the session content and objectives..."
                            value={newPeerSession.description}
                            onChange={(e) =>
                              setNewPeerSession((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>Attendees</Label>
                          <div className="flex gap-2 mb-2">
                            <Select
                              onValueChange={(value) => addAttendee(value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Add attendee" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees
                                  .filter(
                                    (emp) =>
                                      !newPeerSession.attendees.includes(
                                        emp.name
                                      )
                                  )
                                  .map((employee) => (
                                    <SelectItem
                                      key={employee.id}
                                      value={employee.name}
                                    >
                                      {employee.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {newPeerSession.attendees.map((attendee) => (
                              <Badge
                                key={attendee}
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {attendee}
                                <button
                                  onClick={() => removeAttendee(attendee)}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={handleAddPeerSession}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule Session
                          </Button>
                          <Button variant="outline">Save Draft</Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Sessions */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Upcoming & Recent Sessions
                      </h4>
                      {peerSessions.map((session) => (
                        <Card key={session.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {session.topic}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(session.status)}
                                  >
                                    {session.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  {session.description}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>Presenter: {session.presenter}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{session.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{session.duration}</span>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Attendees ({session.attendees.length}):
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {session.attendees.map((attendee) => (
                                      <Badge
                                        key={attendee}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {attendee}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Training Summary */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Training Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEmployeeData && (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedEmployeeData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedEmployeeData.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedEmployeeData.role}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedEmployeeData.department}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Courses:
                      </span>
                      <span className="text-sm font-medium">
                        {courses.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Certificates:
                      </span>
                      <span className="text-sm font-medium">
                        {certificates.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Investment:
                      </span>
                      <span className="text-sm font-medium">
                        ${budgetData.spent.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Sessions Led:
                      </span>
                      <span className="text-sm font-medium">
                        {
                          peerSessions.filter(
                            (s) => s.presenter === selectedEmployeeData.name
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                label="Enroll in Course"
                icon={Plus}
                onClick={() => {}}
                variant="primary"
              />
              <QuickActionButton
                label="Upload Certificate"
                icon={Upload}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Schedule Session"
                icon={Users}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Export Report"
                icon={Download}
                onClick={() => {}}
              />
            </CardContent>
          </Card>

          {/* Budget Alert */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Budget Alert
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    You&apos;ve used {Math.round(budgetProgress)}% of your
                    annual training budget.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    ${budgetData.remaining.toLocaleString()} remaining for this
                    year.
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
