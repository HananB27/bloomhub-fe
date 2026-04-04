import { useState } from "react";
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
import { QuickActionButton } from "./QuickActionButton";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import {
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  Circle,
  Play,
  Plus,
  Filter,
  Download,
  User,
  Building,
  FileText,
  Send,
  Edit3,
  AlertCircle,
  Users,
  Target,
  TrendingUp,
  Trash2,
  Copy,
} from "lucide-react";
import {
  ChecklistTemplate,
  TaskTemplate,
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  fetchTemplates,
  updateTemplate,
} from "@/lib/api/onboarding";

type TaskStatus = "todo" | "in-progress" | "done";
type TemplateType = "onboarding" | "offboarding";

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  assigneeAvatar: string;
  dueDate: string;
  status: TaskStatus;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  comments: Comment[];
}

interface Comment {
  id: number;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export function OnboardingModule() {
  const { data: session } = useSession();
  const sessionWithAccessToken = session as { accessToken?: string } | null | undefined;
  const rawAccessToken = sessionWithAccessToken?.accessToken;
  const accessToken =
    typeof rawAccessToken === "string" ? rawAccessToken : undefined;
  const [selectedEmployee, setSelectedEmployee] = useState("new-hire-1");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateType>("onboarding");
  const [newComment, setNewComment] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  // Template management state
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ChecklistTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "onboarding" as "onboarding" | "offboarding",
    task_templates: [] as TaskTemplate[],
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskRole, setNewTaskRole] = useState<"HR" | "IT" | "Manager">("HR");

  // Mock employee data
  const employees = [
    {
      id: "new-hire-1",
      name: "Alex Rivera",
      department: "Engineering",
      role: "Software Engineer",
      type: "onboarding",
      startDate: "Aug 15, 2025",
    },
    {
      id: "new-hire-2",
      name: "Maria Garcia",
      department: "Marketing",
      role: "Marketing Specialist",
      type: "onboarding",
      startDate: "Aug 20, 2025",
    },
    {
      id: "departing-1",
      name: "John Smith",
      department: "Sales",
      role: "Sales Manager",
      type: "offboarding",
      endDate: "Sep 15, 2025",
    },
    {
      id: "departing-2",
      name: "Lisa Chen",
      department: "HR",
      role: "HR Coordinator",
      type: "offboarding",
      endDate: "Aug 30, 2025",
    },
  ];

  // Mock task templates
  const [tasks, setTasks] = useState<Task[]>([
    // Onboarding tasks
    {
      id: 1,
      title: "Send welcome email and first-day information",
      description:
        "Send comprehensive welcome email with office location, parking info, dress code, and first-day agenda",
      assignee: "Sarah Johnson",
      assigneeAvatar: "SJ",
      dueDate: "Aug 12, 2025",
      status: "done",
      category: "Communication",
      priority: "high",
      estimatedHours: 1,
      comments: [
        {
          id: 1,
          author: "Sarah Johnson",
          authorAvatar: "SJ",
          content:
            "Welcome email sent with all details. Alex confirmed receipt.",
          timestamp: "2 days ago",
        },
      ],
    },
    {
      id: 2,
      title: "Prepare workspace and equipment",
      description:
        "Set up desk, provide laptop, monitor, keyboard, mouse, and any role-specific equipment",
      assignee: "IT Support",
      assigneeAvatar: "IT",
      dueDate: "Aug 14, 2025",
      status: "done",
      category: "IT Setup",
      priority: "high",
      estimatedHours: 3,
      comments: [
        {
          id: 2,
          author: "IT Support",
          authorAvatar: "IT",
          content: "MacBook Pro configured and ready. Desk setup complete.",
          timestamp: "1 day ago",
        },
      ],
    },
    {
      id: 3,
      title: "Create system accounts and access permissions",
      description:
        "Set up email, Slack, GitHub, project management tools, and necessary system access based on role",
      assignee: "IT Support",
      assigneeAvatar: "IT",
      dueDate: "Aug 15, 2025",
      status: "in-progress",
      category: "IT Setup",
      priority: "high",
      estimatedHours: 2,
      comments: [
        {
          id: 3,
          author: "IT Support",
          authorAvatar: "IT",
          content:
            "Email and Slack accounts created. Working on GitHub and project access.",
          timestamp: "4 hours ago",
        },
      ],
    },
    {
      id: 4,
      title: "Conduct HR orientation session",
      description:
        "Review company policies, benefits, compensation, code of conduct, and have employee sign necessary documents",
      assignee: "David Kim",
      assigneeAvatar: "DK",
      dueDate: "Aug 15, 2025",
      status: "todo",
      category: "HR",
      priority: "high",
      estimatedHours: 2,
      comments: [],
    },
    {
      id: 5,
      title: "Schedule team introductions",
      description:
        "Arrange meetings with immediate team members, key stakeholders, and cross-functional partners",
      assignee: "Alex Thompson",
      assigneeAvatar: "AT",
      dueDate: "Aug 16, 2025",
      status: "todo",
      category: "Team Integration",
      priority: "medium",
      estimatedHours: 1,
      comments: [],
    },
    {
      id: 6,
      title: "Assign onboarding buddy/mentor",
      description:
        "Pair new hire with experienced team member for guidance and support during first month",
      assignee: "Alex Thompson",
      assigneeAvatar: "AT",
      dueDate: "Aug 15, 2025",
      status: "todo",
      category: "Team Integration",
      priority: "medium",
      estimatedHours: 0.5,
      comments: [],
    },
    {
      id: 7,
      title: "Complete first project assignment",
      description:
        "Provide initial project or learning task to help new hire get familiar with codebase and processes",
      assignee: "Tech Lead",
      assigneeAvatar: "TL",
      dueDate: "Aug 22, 2025",
      status: "todo",
      category: "Training",
      priority: "medium",
      estimatedHours: 4,
      comments: [],
    },
  ]);

  const offboardingTasks: Task[] = [
    {
      id: 8,
      title: "Conduct exit interview",
      description:
        "Schedule and complete comprehensive exit interview to gather feedback and insights",
      assignee: "David Kim",
      assigneeAvatar: "DK",
      dueDate: "Sep 10, 2025",
      status: "todo",
      category: "HR",
      priority: "high",
      estimatedHours: 1,
      comments: [],
    },
    {
      id: 9,
      title: "Knowledge transfer sessions",
      description:
        "Organize sessions to transfer critical knowledge, processes, and project information to team",
      assignee: "John Smith",
      assigneeAvatar: "JS",
      dueDate: "Sep 8, 2025",
      status: "in-progress",
      category: "Knowledge Transfer",
      priority: "high",
      estimatedHours: 8,
      comments: [
        {
          id: 4,
          author: "John Smith",
          authorAvatar: "JS",
          content:
            "Started documenting key client relationships and ongoing projects.",
          timestamp: "1 day ago",
        },
      ],
    },
    {
      id: 10,
      title: "Revoke system access and collect equipment",
      description:
        "Disable all system accounts, collect laptop, badges, keys, and other company property",
      assignee: "IT Support",
      assigneeAvatar: "IT",
      dueDate: "Sep 15, 2025",
      status: "todo",
      category: "IT Security",
      priority: "high",
      estimatedHours: 2,
      comments: [],
    },
    {
      id: 11,
      title: "Process final payroll and benefits",
      description:
        "Calculate final salary, unused PTO, process COBRA paperwork, and handle 401k transfer",
      assignee: "Payroll Team",
      assigneeAvatar: "PT",
      dueDate: "Sep 20, 2025",
      status: "todo",
      category: "Payroll",
      priority: "high",
      estimatedHours: 3,
      comments: [],
    },
  ];

  const selectedEmployeeData = employees.find(
    (emp) => emp.id === selectedEmployee
  );
  const currentTasks =
    selectedTemplate === "onboarding"
      ? tasks.filter((task) => task.id <= 7)
      : offboardingTasks;

  const completedTasks = currentTasks.filter(
    (task) => task.status === "done"
  ).length;
  const totalTasks = currentTasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleTaskStatusChange = (taskId: number, newStatus: TaskStatus) => {
    if (selectedTemplate === "onboarding") {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    }
    // Handle offboarding tasks similarly
  };

  const handleAddComment = (taskId: number) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      author: "John Doe",
      authorAvatar: "JD",
      content: newComment,
      timestamp: "Just now",
    };

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, comment] }
          : task
      )
    );

    setNewComment("");
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return "text-green-600 bg-green-50 border-green-200";
      case "in-progress":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return CheckCircle;
      case "in-progress":
        return Play;
      default:
        return Circle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Load templates from API
  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const data = await fetchTemplates(accessToken);
      setTemplates(data);
    } catch {
      setTemplatesError("Failed to load templates. Are you logged in as HR?");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (editingTemplate) {
        const updated = await updateTemplate(
          editingTemplate.id,
          templateForm,
          accessToken
        );
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      } else {
        const created = await createTemplate(templateForm, accessToken);
        setTemplates((prev) => [...prev, created]);
      }
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: "",
        type: "onboarding",
        task_templates: [],
      });
    } catch {
      setTemplatesError("Failed to save template.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id, accessToken);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setTemplatesError("Failed to delete template.");
    }
  };

  const handleClone = async (id: number) => {
    try {
      const cloned = await cloneTemplate(id, accessToken);
      setTemplates((prev) => [...prev, cloned]);
    } catch {
      setTemplatesError("Failed to clone template.");
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setTemplateForm((prev) => ({
      ...prev,
      task_templates: [
        ...prev.task_templates,
        {
          title: newTaskTitle,
          order: prev.task_templates.length + 1,
          role_responsible: newTaskRole,
        },
      ],
    }));
    setNewTaskTitle("");
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      task_templates: template.task_templates,
    });
    setShowTemplateForm(true);
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="tracker"
        onValueChange={(val) => {
          if (val === "templates") loadTemplates();
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="templates">Manage Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Onboarding & Offboarding Tracker
                </h1>
                <p className="text-gray-600 mt-1">
                  Streamline the employee journey with structured checklists
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
                  New Process
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Active Onboarding</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-gray-500">New hires this month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserMinus className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Active Offboarding</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-500">Departures this month</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Avg Completion</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-gray-500">Task completion rate</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Overdue Tasks</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-xs text-gray-500">Needs attention</p>
              </div>
            </div>

            {/* Employee and Template Selector */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee-select">Select Employee</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
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
                              {employee.department} -{" "}
                              {employee.type === "onboarding"
                                ? `Starts ${employee.startDate}`
                                : `Ends ${employee.endDate}`}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-select">Template Type</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value: TemplateType) =>
                    setSelectedTemplate(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Onboarding Checklist
                      </div>
                    </SelectItem>
                    <SelectItem value="offboarding">
                      <div className="flex items-center gap-2">
                        <UserMinus className="w-4 h-4" />
                        Offboarding Checklist
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Task List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Overview */}
              <Card className="border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {selectedTemplate === "onboarding" ? (
                        <UserPlus className="w-5 h-5" />
                      ) : (
                        <UserMinus className="w-5 h-5" />
                      )}
                      {selectedEmployeeData?.name} -{" "}
                      {selectedTemplate === "onboarding"
                        ? "Onboarding"
                        : "Offboarding"}{" "}
                      Progress
                    </CardTitle>
                    <Badge variant="outline" className="font-medium">
                      {completedTasks}/{totalTasks} Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Overall Progress
                      </span>
                      <span className="text-sm font-medium">
                        {progressPercentage}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>
                          {
                            currentTasks.filter((t) => t.status === "done")
                              .length
                          }{" "}
                          Done
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-blue-600" />
                        <span>
                          {
                            currentTasks.filter(
                              (t) => t.status === "in-progress"
                            ).length
                          }{" "}
                          In Progress
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-gray-400" />
                        <span>
                          {
                            currentTasks.filter((t) => t.status === "todo")
                              .length
                          }{" "}
                          To Do
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task Cards */}
              <div className="space-y-4">
                {currentTasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status);
                  return (
                    <Card
                      key={task.id}
                      className={`border transition-all hover:shadow-sm ${task.status === "done" ? "bg-green-50/50" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <StatusIcon
                              className={`w-5 h-5 mt-0.5 ${
                                task.status === "done"
                                  ? "text-green-600"
                                  : task.status === "in-progress"
                                    ? "text-blue-600"
                                    : "text-gray-400"
                              }`}
                            />
                            <div className="flex-1">
                              <h3
                                className={`font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-gray-900"}`}
                              >
                                {task.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {task.description}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={getPriorityColor(task.priority)}
                            variant="outline"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {task.assigneeAvatar}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-600">
                                {task.assignee}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Due {task.dueDate}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {task.category}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={task.status}
                              onValueChange={(status: TaskStatus) =>
                                handleTaskStatusChange(task.id, status)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">
                                  <div className="flex items-center gap-2">
                                    <Circle className="w-4 h-4 text-gray-400" />
                                    To Do
                                  </div>
                                </SelectItem>
                                <SelectItem value="in-progress">
                                  <div className="flex items-center gap-2">
                                    <Play className="w-4 h-4 text-blue-600" />
                                    In Progress
                                  </div>
                                </SelectItem>
                                <SelectItem value="done">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Done
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                Comments ({task.comments.length})
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedTaskId(
                                  selectedTaskId === task.id ? null : task.id
                                )
                              }
                            >
                              {selectedTaskId === task.id ? "Hide" : "Show"}
                            </Button>
                          </div>

                          {selectedTaskId === task.id && (
                            <div className="space-y-3">
                              {/* Existing Comments */}
                              {task.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                  <Avatar className="w-7 h-7">
                                    <AvatarFallback className="text-xs">
                                      {comment.authorAvatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {comment.author}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {comment.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              {/* New Comment Form */}
                              <div className="flex gap-3">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="text-xs">
                                    JD
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <Textarea
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) =>
                                      setNewComment(e.target.value)
                                    }
                                    rows={2}
                                    className="text-sm"
                                  />
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddComment(task.id)}
                                      disabled={!newComment.trim()}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Comment
                                    </Button>
                                  </div>
                                </div>
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Employee Info */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Employee Details
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
                            Process Type:
                          </span>
                          <Badge
                            variant={
                              selectedEmployeeData.type === "onboarding"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {selectedEmployeeData.type === "onboarding"
                              ? "Onboarding"
                              : "Offboarding"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {selectedEmployeeData.type === "onboarding"
                              ? "Start Date:"
                              : "End Date:"}
                          </span>
                          <span className="text-sm font-medium">
                            {selectedEmployeeData.type === "onboarding"
                              ? selectedEmployeeData.startDate
                              : selectedEmployeeData.endDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Progress:
                          </span>
                          <span className="text-sm font-medium">
                            {progressPercentage}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Process Statistics */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Process Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">
                        {currentTasks.filter((t) => t.status === "done").length}
                      </p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">
                        {
                          currentTasks.filter((t) => t.status === "in-progress")
                            .length
                        }
                      </p>
                      <p className="text-xs text-blue-600">In Progress</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Estimated Hours:
                      </span>
                      <span className="text-sm font-medium">
                        {currentTasks.reduce(
                          (sum, task) => sum + task.estimatedHours,
                          0
                        )}
                        h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        High Priority:
                      </span>
                      <span className="text-sm font-medium">
                        {
                          currentTasks.filter((t) => t.priority === "high")
                            .length
                        }{" "}
                        tasks
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Comments:
                      </span>
                      <span className="text-sm font-medium">
                        {currentTasks.reduce(
                          (sum, task) => sum + task.comments.length,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <QuickActionButton
                    label="Add Task"
                    icon={Plus}
                    onClick={() => {}}
                    variant="primary"
                  />
                  <QuickActionButton
                    label="Edit Template"
                    icon={Edit3}
                    onClick={() => {}}
                  />
                  <QuickActionButton
                    label="Schedule Review"
                    icon={Calendar}
                    onClick={() => {}}
                  />
                  <QuickActionButton
                    label="Export Report"
                    icon={Download}
                    onClick={() => {}}
                  />
                </CardContent>
              </Card>

              {/* Overdue Alert */}
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Attention Required
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        1 task is overdue and needs immediate attention.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Checklist Templates
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({
                    name: "",
                    type: "onboarding",
                    task_templates: [],
                  });
                  setShowTemplateForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            {templatesError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {templatesError}
              </div>
            )}

            {templatesLoading && (
              <p className="text-gray-500 text-sm">Loading templates...</p>
            )}

            {/* Template Form */}
            {showTemplateForm && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>
                    {editingTemplate ? "Edit Template" : "New Template"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) =>
                        setTemplateForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Standard IT Onboarding"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={templateForm.type}
                      onValueChange={(val: "onboarding" | "offboarding") =>
                        setTemplateForm((prev) => ({ ...prev, type: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="offboarding">Offboarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <Label>Tasks</Label>
                    {templateForm.task_templates.map((task) => (
                      <div
                        key={task.id ?? `${task.order}-${task.title}`}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm"
                      >
                        <span>{task.title}</span>
                        <Badge variant="outline">{task.role_responsible}</Badge>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Task title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                      <Select
                        value={newTaskRole}
                        onValueChange={(val: "HR" | "IT" | "Manager") =>
                          setNewTaskRole(val)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddTask}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateOrUpdate}>
                      {editingTemplate ? "Save Changes" : "Create Template"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Template List */}
            {templates.map((template) => (
              <Card key={template.id} className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <Badge
                        variant={
                          template.type === "onboarding"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {template.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClone(template.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-2">
                    {template.task_templates.length} tasks
                  </p>
                  <div className="space-y-1">
                    {template.task_templates.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                      >
                        <span>{task.title}</span>
                        <Badge variant="outline">{task.role_responsible}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {!templatesLoading &&
              templates.length === 0 &&
              !showTemplateForm && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No templates yet. Create your first template!</p>
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
