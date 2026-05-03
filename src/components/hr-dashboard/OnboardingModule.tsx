import { useEffect, useState } from "react";
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
  Target,
  TrendingUp,
  Trash2,
  Copy,
} from "lucide-react";
import {
  ChecklistTemplate,
  ChecklistTask,
  TaskTemplate,
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  fetchEmployeeTasks,
  fetchMyTasks,
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

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  type: "onboarding" | "offboarding";
  startDate?: string;
  endDate?: string;
}

export function OnboardingModule() {
  const { data: session } = useSession();
  const sessionWithAccessToken = session as
    | { accessToken?: string }
    | null
    | undefined;
  const rawAccessToken = sessionWithAccessToken?.accessToken;
  const accessToken =
    typeof rawAccessToken === "string" ? rawAccessToken : undefined;
  const [activeTab, setActiveTab] = useState("tracker");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateType>("onboarding");
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<
    "all" | string
  >("all");
  const [selectedChecklistFilter, setSelectedChecklistFilter] = useState<
    "all" | string
  >("all");
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<
    "all" | string
  >("all");
  const [myTasks, setMyTasks] = useState<ChecklistTask[]>([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const [myTasksError, setMyTasksError] = useState<string | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<ChecklistTask[]>([]);
  const [employeeTasksLoading, setEmployeeTasksLoading] = useState(false);
  const [employeeTasksError, setEmployeeTasksError] = useState<string | null>(
    null
  );
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

  const employees: Employee[] = [];

  const [tasks, setTasks] = useState<Task[]>([]);

  const offboardingTasks: Task[] = [];

  const selectedEmployeeData = employees.find(
    (emp) => emp.id === selectedEmployee
  );
  const currentTasks =
    selectedTemplate === "onboarding"
      ? tasks.filter((task) => task.id <= 7)
      : offboardingTasks;

  const allTasks = [...tasks, ...offboardingTasks];
  const completedTasks = currentTasks.filter(
    (task) => task.status === "done"
  ).length;
  const totalTasks = currentTasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeOnboardingCount = tasks.length;
  const activeOffboardingCount = offboardingTasks.length;
  const overdueTasksCount = allTasks.filter((task) => {
    const due = new Date(task.dueDate);
    return (
      !Number.isNaN(due.valueOf()) && due < new Date() && task.status !== "done"
    );
  }).length;
  const averageCompletionPercent =
    allTasks.length > 0
      ? Math.round(
          (allTasks.filter((task) => task.status === "done").length /
            allTasks.length) *
            100
        )
      : 0;

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
      author: "You",
      authorAvatar: "Y",
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

  const _getStatusColor = (status: TaskStatus | "in_progress") => {
    switch (status) {
      case "done":
        return "text-green-600 bg-green-50 border-green-200";
      case "in-progress":
      case "in_progress":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: TaskStatus | "in_progress") => {
    switch (status) {
      case "done":
        return CheckCircle;
      case "in-progress":
      case "in_progress":
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "templates") {
      loadTemplates();
    }
    if (value === "my-tasks") {
      loadMyTasks();
    }
  };

  const loadMyTasks = async () => {
    setMyTasksLoading(true);
    setMyTasksError(null);
    try {
      const tasks = await fetchMyTasks(accessToken);
      setMyTasks(tasks);
    } catch (error) {
      setMyTasksError(
        error instanceof Error
          ? error.message
          : "Failed to load assigned tasks."
      );
    } finally {
      setMyTasksLoading(false);
    }
  };

  const loadEmployeeTasks = async () => {
    if (selectedEmployeeForView === "all") return;
    setEmployeeTasksLoading(true);
    setEmployeeTasksError(null);
    try {
      const tasks = await fetchEmployeeTasks(
        selectedEmployeeForView,
        accessToken
      );
      setEmployeeTasks(tasks);
    } catch (error) {
      setEmployeeTasksError(
        error instanceof Error
          ? error.message
          : "Failed to load employee tasks."
      );
      setEmployeeTasks([]);
    } finally {
      setEmployeeTasksLoading(false);
    }
  };

  const employeeOptions = Array.from(
    new Map(
      myTasks.map((task) => [
        task.checklist_instance.employee.id,
        task.checklist_instance.employee,
      ])
    ).values()
  );

  const checklistOptions = Array.from(
    new Set(myTasks.map((task) => task.checklist_instance.template.name))
  );

  const filteredMyTasks = myTasks.filter((task) => {
    const matchesEmployee =
      selectedEmployeeFilter === "all" ||
      String(task.checklist_instance.employee.id) === selectedEmployeeFilter;
    const matchesChecklist =
      selectedChecklistFilter === "all" ||
      task.checklist_instance.template.name === selectedChecklistFilter;
    return matchesEmployee && matchesChecklist;
  });

  const normalizeStatus = (status: string) =>
    status === "in_progress" ? "in-progress" : status;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
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
                <p className="text-2xl font-bold text-gray-900">
                  {activeOnboardingCount}
                </p>
                <p className="text-xs text-gray-500">Onboarding tasks</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserMinus className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Active Offboarding</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {activeOffboardingCount}
                </p>
                <p className="text-xs text-gray-500">Offboarding tasks</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Avg Completion</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {averageCompletionPercent}%
                </p>
                <p className="text-xs text-gray-500">Task completion rate</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">Overdue Tasks</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {overdueTasksCount}
                </p>
                <p className="text-xs text-gray-500">Needs attention</p>
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      {selectedEmployeeData?.name ?? "Selected Employee"} -{" "}
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
                  {selectedEmployeeData ? (
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
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No employee selected yet. Choose an employee once real
                      data is available.
                    </div>
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-tasks">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
                  <p className="text-gray-600 mt-1">
                    View checklist tasks assigned to you and filter by employee
                    or checklist.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button variant="outline" size="sm" onClick={loadMyTasks}>
                    Refresh
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={loadEmployeeTasks}
                    disabled={selectedEmployeeForView === "all"}
                  >
                    Load Employee Tasks
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="employee-filter">Filter by employee</Label>
                  <Select
                    value={selectedEmployeeFilter}
                    onValueChange={setSelectedEmployeeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      {employeeOptions.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={String(employee.id)}
                        >
                          {employee.user.first_name} {employee.user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checklist-filter">Filter by checklist</Label>
                  <Select
                    value={selectedChecklistFilter}
                    onValueChange={setSelectedChecklistFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All checklists</SelectItem>
                      {checklistOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-view">Employee task view</Label>
                  <Select
                    value={selectedEmployeeForView}
                    onValueChange={setSelectedEmployeeForView}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Choose employee</SelectItem>
                      {employeeOptions.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={String(employee.id)}
                        >
                          {employee.user.first_name} {employee.user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {myTasksError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {myTasksError}
              </div>
            )}

            {myTasksLoading ? (
              <p className="text-gray-500">Loading your tasks...</p>
            ) : (
              <div className="space-y-4">
                {filteredMyTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    No tasks assigned to you match the selected filters.
                  </div>
                ) : (
                  filteredMyTasks.map((task) => {
                    const status = normalizeStatus(task.status);
                    const StatusIcon = getStatusIcon(status as TaskStatus);
                    return (
                      <Card
                        key={task.id}
                        className={`border transition-all hover:shadow-sm ${
                          status === "done" ? "bg-green-50/50" : ""
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <StatusIcon
                                className={`w-5 h-5 mt-0.5 ${
                                  status === "done"
                                    ? "text-green-600"
                                    : status === "in-progress"
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                }`}
                              />
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                  {task.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Checklist:{" "}
                                  {task.checklist_instance.template.name}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-sm">
                              {task.task_template.role_responsible}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {task.assigned_to
                                      ? `${task.assigned_to.user.first_name.charAt(0)}${task.assigned_to.user.last_name.charAt(0)}`
                                      : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">
                                  {task.assigned_to
                                    ? `${task.assigned_to.user.first_name} ${task.assigned_to.user.last_name}`
                                    : "Unassigned"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {task.due_date ?? "No due date"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {employeeTasksError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {employeeTasksError}
              </div>
            )}

            {employeeTasksLoading && (
              <p className="text-gray-500">Loading employee tasks...</p>
            )}

            {employeeTasks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employee Tasks
                  </h3>
                  <Badge variant="outline">
                    {employeeTasks.length} tasks loaded
                  </Badge>
                </div>
                <div className="space-y-4">
                  {employeeTasks.map((task) => {
                    const status = normalizeStatus(task.status);
                    const StatusIcon = getStatusIcon(status as TaskStatus);
                    return (
                      <Card key={`employee-${task.id}`} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <StatusIcon
                                className={`w-5 h-5 mt-0.5 ${
                                  status === "done"
                                    ? "text-green-600"
                                    : status === "in-progress"
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                }`}
                              />
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {task.title}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {
                                    task.checklist_instance.employee.user
                                      .first_name
                                  }{" "}
                                  {
                                    task.checklist_instance.employee.user
                                      .last_name
                                  }
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
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
                        aria-label="Add task"
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
                        aria-label="Edit template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClone(template.id)}
                        aria-label="Clone template"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        aria-label="Delete template"
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
                    {template.task_templates.map((task) => (
                      <div
                        key={`${template.id}-${task.title}-${task.role_responsible}`}
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
