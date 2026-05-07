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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Play,
  Plus,
  Filter,
  Download,
  User,
  FileText,
  Send,
  Edit3,
  Target,
  Trash2,
  Copy,
  CalendarClock,
} from "lucide-react";
import { employeeApi } from "@/lib/api/modules/employees";
import type { EmployeeProfileData } from "@/lib/api/modules/employees";
import {
  ChecklistTemplate,
  ChecklistTask,
  ChecklistTaskStatus,
  TaskTemplate,
  TASK_STATUS_LABELS,
  TASK_STATUS_BADGE_COLORS,
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  fetchEmployeeTasks,
  fetchMyTasks,
  fetchTemplates,
  updateTemplate,
  updateTaskStatus,
} from "@/lib/api/onboarding";

type TaskStatus = "todo" | "in-progress" | "done";
type TemplateType = "onboarding" | "offboarding";

function normalizeStatus(status: string): string {
  return status === "in_progress" ? "in-progress" : status;
}

function toApiStatus(status: TaskStatus | string): ChecklistTaskStatus {
  return (
    status === "in-progress" ? "in_progress" : status
  ) as ChecklistTaskStatus;
}

type SortOrder =
  | "default"
  | "due_asc"
  | "due_desc"
  | "status_todo_first"
  | "status_done_first";

const STATUS_SORT_RANK: Record<string, number> = {
  todo: 0,
  "in-progress": 1,
  done: 2,
};

function applySortOrder(tasks: Task[], order: SortOrder): Task[] {
  if (order === "default") return tasks;
  return [...tasks].sort((a, b) => {
    if (order === "due_asc" || order === "due_desc") {
      const aTime =
        a.dueDate === "No due date" ? Infinity : new Date(a.dueDate).getTime();
      const bTime =
        b.dueDate === "No due date" ? Infinity : new Date(b.dueDate).getTime();
      return order === "due_asc" ? aTime - bTime : bTime - aTime;
    }
    const aRank = STATUS_SORT_RANK[a.status] ?? 0;
    const bRank = STATUS_SORT_RANK[b.status] ?? 0;
    return order === "status_todo_first" ? aRank - bRank : bRank - aRank;
  });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusIconClass(status: string): string {
  if (status === "done") return "text-green-600";
  if (status === "in-progress") return "text-blue-600";
  return "text-gray-400";
}

interface TaskStatusIconProps {
  status: string;
  className: string;
}

function TaskStatusIcon({ status, className }: TaskStatusIconProps) {
  if (status === "done") return <CheckCircle className={className} />;
  if (status === "in-progress" || status === "in_progress")
    return <Play className={className} />;
  return <Circle className={className} />;
}

function mapChecklistTaskToTask(task: ChecklistTask): Task {
  const assigneeName = task.assigned_to
    ? `${task.assigned_to.user.first_name} ${task.assigned_to.user.last_name}`
    : "Unassigned";
  const assigneeAvatar = task.assigned_to
    ? `${task.assigned_to.user.first_name.charAt(0)}${task.assigned_to.user.last_name.charAt(0)}`
    : "UA";
  return {
    id: task.id,
    title: task.title,
    description: "",
    assignee: assigneeName,
    assigneeAvatar,
    dueDate: task.due_date ?? "No due date",
    status: normalizeStatus(task.status) as TaskStatus,
    category: task.task_template.role_responsible,
    priority: "medium",
    estimatedHours: 0,
    comments: [],
  };
}

type ChecklistTaskCardVariant = "my-tasks" | "employee-tasks";

interface ChecklistTaskCardProps {
  task: ChecklistTask;
  variant: ChecklistTaskCardVariant;
  onStatusChange?: (taskId: number, newStatus: ChecklistTaskStatus) => void;
}

function ChecklistTaskCard({
  task,
  variant,
  onStatusChange,
}: ChecklistTaskCardProps) {
  const status = normalizeStatus(task.status);
  const iconClassName = `w-5 h-5 mt-0.5 ${statusIconClass(status)}`;
  const apiStatus = task.status as ChecklistTaskStatus;

  if (variant === "my-tasks") {
    return (
      <Card
        className={`border transition-all hover:shadow-sm ${
          status === "done" ? "bg-green-50/50" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <TaskStatusIcon status={status} className={iconClassName} />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Checklist: {task.checklist_instance.template.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={TASK_STATUS_BADGE_COLORS[apiStatus]}
                variant="outline"
              >
                {TASK_STATUS_LABELS[apiStatus]}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {task.task_template.role_responsible}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
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
            {onStatusChange && (
              <Select
                value={apiStatus}
                onValueChange={(val: ChecklistTaskStatus) =>
                  onStatusChange(task.id, val)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-gray-400" />
                      To Do
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
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
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <TaskStatusIcon status={status} className={iconClassName} />
            <div>
              <h4 className="font-medium text-gray-900">{task.title}</h4>
              <p className="text-xs text-gray-500">
                {task.checklist_instance.employee.user.first_name}{" "}
                {task.checklist_instance.employee.user.last_name}
              </p>
            </div>
          </div>
          <Badge
            className={TASK_STATUS_BADGE_COLORS[apiStatus]}
            variant="outline"
          >
            {TASK_STATUS_LABELS[apiStatus]}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}

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
  const sessionUser = session?.user as
    | {
        accessToken?: string;
        is_staff?: boolean;
        role?: string;
        image?: string;
      }
    | null
    | undefined;
  const rawAccessToken = sessionUser?.accessToken;
  const accessToken =
    typeof rawAccessToken === "string" ? rawAccessToken : undefined;
  const isHrOrStaff =
    sessionUser?.is_staff === true || sessionUser?.role?.toLowerCase() === "hr";
  const isManager = sessionUser?.role?.toLowerCase() === "manager";
  const canAccessTracker = isHrOrStaff || isManager;
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
  const [selectedEmployeeForView, setSelectedEmployeeForView] =
    useState<string>("");
  const [myTasks, setMyTasks] = useState<ChecklistTask[]>([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const [myTasksError, setMyTasksError] = useState<string | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<ChecklistTask[]>([]);
  const [employeeTasksLoading, setEmployeeTasksLoading] = useState(false);
  const [employeeTasksError, setEmployeeTasksError] = useState<string | null>(
    null
  );
  const [employeeTasksLoaded, setEmployeeTasksLoaded] = useState(false);
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
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [offboardingTasksState, setOffboardingTasksState] = useState<Task[]>(
    []
  );
  const [allEmployees, setAllEmployees] = useState<EmployeeProfileData[]>([]);
  const [allEmployeesLoading, setAllEmployeesLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");

  const [tasks, setTasks] = useState<Task[]>([]);

  const selectedEmployeeProfile =
    allEmployees.find((e) => String(e.id) === selectedEmployee) ?? null;

  const currentTasks =
    selectedTemplate === "onboarding" ? tasks : offboardingTasksState;
  const sortedTasks = applySortOrder(currentTasks, sortOrder);

  const allTasks = [...tasks, ...offboardingTasksState];
  const completedTasks = currentTasks.filter(
    (task) => task.status === "done"
  ).length;
  const totalTasks = currentTasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeOnboardingCount = tasks.length;
  const activeOffboardingCount = offboardingTasksState.length;
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

  const handleTaskStatusChange = async (
    taskId: number,
    newStatus: TaskStatus
  ) => {
    const apiStatus = toApiStatus(newStatus);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    setOffboardingTasksState((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    try {
      await updateTaskStatus(taskId, apiStatus, accessToken);
    } catch {
      setTrackerError("Failed to update task status.");
      void loadTrackerTasks(selectedEmployee);
    }
  };

  const handleMyTaskStatusChange = async (
    taskId: number,
    newStatus: ChecklistTaskStatus
  ) => {
    setMyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await updateTaskStatus(taskId, newStatus, accessToken);
    } catch {
      void loadMyTasks();
    }
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
    if (value === "my-tasks" || value === "tracker") {
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

  const loadTrackerTasks = async (employeeId: string) => {
    if (!employeeId) return;
    setTrackerLoading(true);
    setTrackerError(null);
    setTasks([]);
    setOffboardingTasksState([]);
    try {
      const apiTasks = await fetchEmployeeTasks(
        Number(employeeId),
        accessToken
      );
      const onboarding: Task[] = [];
      const offboarding: Task[] = [];
      for (const t of apiTasks) {
        const mapped = mapChecklistTaskToTask(t);
        if (t.checklist_instance.template.type === "onboarding") {
          onboarding.push(mapped);
        } else {
          offboarding.push(mapped);
        }
      }
      setTasks(onboarding);
      setOffboardingTasksState(offboarding);
    } catch (error) {
      setTrackerError(
        error instanceof Error
          ? error.message
          : "Failed to load tasks for this employee."
      );
    } finally {
      setTrackerLoading(false);
    }
  };

  const loadAllEmployees = async () => {
    setAllEmployeesLoading(true);
    try {
      const { results } = await employeeApi.listEmployees({ is_active: true });
      setAllEmployees(results);
    } catch {
      // silently fail — tracker dropdown will show empty
    } finally {
      setAllEmployeesLoading(false);
    }
  };

  useEffect(() => {
    void loadMyTasks();
    if (canAccessTracker) void loadAllEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployeeTasks = async () => {
    const employeeId = parseInt(selectedEmployeeForView.trim(), 10);
    if (!selectedEmployeeForView.trim() || isNaN(employeeId) || employeeId < 1)
      return;
    setEmployeeTasksLoading(true);
    setEmployeeTasksError(null);
    setEmployeeTasksLoaded(false);
    try {
      const tasks = await fetchEmployeeTasks(employeeId, accessToken);
      setEmployeeTasks(tasks);
      setEmployeeTasksLoaded(true);
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="templates">Manage Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          {!canAccessTracker ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
              The Tracker is available to HR and Managers only.
            </div>
          ) : (
            <>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          Sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Sort tasks by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={sortOrder}
                          onValueChange={(v) => setSortOrder(v as SortOrder)}
                        >
                          <DropdownMenuRadioItem value="default">
                            Default order
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="due_asc">
                            Due date (earliest first)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="due_desc">
                            Due date (latest first)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="status_todo_first">
                            Completion % (ascending)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="status_done_first">
                            Completion % (descending)
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm">
                      <CalendarClock className="w-4 h-4 mr-2" />
                      Schedule Review
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Quick Stats — follow selected employee's task data */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Tasks Done</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {completedTasks}/{totalTasks}
                    </p>
                    <p className="text-xs text-gray-500">Completed tasks</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-gray-600">Progress</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {progressPercentage}%
                    </p>
                    <p className="text-xs text-gray-500">Completion rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-4 h-4 text-blue-500" />
                      <p className="text-sm text-gray-600">In Progress</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        currentTasks.filter((t) => t.status === "in-progress")
                          .length
                      }
                    </p>
                    <p className="text-xs text-gray-500">Active tasks</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-gray-600">Overdue</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {overdueTasksCount}
                    </p>
                    <p className="text-xs text-gray-500">Needs attention</p>
                  </div>
                </div>
              </div>

              {/* Employee + Template selectors */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={(empId) => {
                      setSelectedEmployee(empId);
                      void loadTrackerTasks(empId);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          allEmployeesLoading
                            ? "Loading employees…"
                            : "Choose an employee"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {allEmployees.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          {allEmployeesLoading
                            ? "Loading…"
                            : "No employees found"}
                        </SelectItem>
                      ) : (
                        allEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-6 h-6">
                                {emp.avatar ? (
                                  <AvatarImage src={emp.avatar} />
                                ) : null}
                                <AvatarFallback className="text-xs">
                                  {emp.first_name.charAt(0)}
                                  {emp.last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {emp.department}
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template Type</Label>
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

              {/* Main content — mt-6 separates it from selectors above */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                          {selectedEmployeeProfile
                            ? `${selectedEmployeeProfile.first_name} ${selectedEmployeeProfile.last_name}`
                            : "Selected Employee"}{" "}
                          —{" "}
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
                    {trackerLoading && (
                      <p className="text-gray-500 text-sm">
                        Loading tasks for this employee...
                      </p>
                    )}
                    {trackerError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {trackerError}
                      </div>
                    )}
                    {!trackerLoading && !selectedEmployee && (
                      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                        Select an employee above to view their checklist
                        progress.
                      </div>
                    )}
                    {!trackerLoading &&
                      selectedEmployee &&
                      currentTasks.length === 0 &&
                      !trackerError && (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                          No{" "}
                          {selectedTemplate === "onboarding"
                            ? "onboarding"
                            : "offboarding"}{" "}
                          tasks found for this employee.
                        </div>
                      )}
                    {sortedTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={`border transition-all hover:shadow-sm ${task.status === "done" ? "bg-green-50/50" : ""}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <TaskStatusIcon
                              status={task.status}
                              className={`w-5 h-5 mt-0.5 ${statusIconClass(task.status)}`}
                            />
                            <div className="flex-1">
                              <h3
                                className={`font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-gray-900"}`}
                              >
                                {task.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {task.category}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
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
                                  {task.dueDate === "No due date"
                                    ? "No due date"
                                    : formatDate(task.dueDate)}
                                </span>
                              </div>
                            </div>
                            <Select
                              value={task.status}
                              onValueChange={(status: TaskStatus) =>
                                void handleTaskStatusChange(task.id, status)
                              }
                            >
                              <SelectTrigger className="w-36">
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Employee Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedEmployeeProfile ? (
                        <>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-14 h-14">
                              {selectedEmployeeProfile.avatar ? (
                                <AvatarImage
                                  src={selectedEmployeeProfile.avatar}
                                />
                              ) : null}
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                                {selectedEmployeeProfile.first_name.charAt(0)}
                                {selectedEmployeeProfile.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {selectedEmployeeProfile.first_name}{" "}
                                {selectedEmployeeProfile.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedEmployeeProfile.role?.name ?? "—"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployeeProfile.department ?? "—"}
                              </p>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-3 text-sm">
                            {selectedEmployeeProfile.employee_id && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Employee ID
                                </span>
                                <span className="font-medium">
                                  {selectedEmployeeProfile.employee_id}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Start Date</span>
                              <span className="font-medium">
                                {formatDate(selectedEmployeeProfile.start_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status</span>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {selectedEmployeeProfile.employment_status ??
                                  "—"}
                              </Badge>
                            </div>
                            {selectedEmployeeProfile.career_level && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Career Level
                                </span>
                                <span className="font-medium">
                                  {selectedEmployeeProfile.career_level}
                                </span>
                              </div>
                            )}
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">
                                {progressPercentage}%
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center text-sm text-gray-500">
                          Select an employee to view their details.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
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
                    disabled={
                      !selectedEmployeeForView.trim() ||
                      isNaN(parseInt(selectedEmployeeForView.trim(), 10)) ||
                      parseInt(selectedEmployeeForView.trim(), 10) < 1
                    }
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
                  <Input
                    id="employee-view"
                    type="number"
                    min="1"
                    placeholder="Enter employee ID"
                    value={selectedEmployeeForView}
                    onChange={(e) => {
                      setSelectedEmployeeForView(e.target.value);
                      setEmployeeTasksLoaded(false);
                      setEmployeeTasks([]);
                    }}
                  />
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
                  filteredMyTasks.map((task) => (
                    <ChecklistTaskCard
                      key={task.id}
                      task={task}
                      variant="my-tasks"
                      onStatusChange={handleMyTaskStatusChange}
                    />
                  ))
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

            {!employeeTasksLoading && employeeTasksLoaded && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employee Tasks
                  </h3>
                  <Badge variant="outline">
                    {employeeTasks.length} tasks loaded
                  </Badge>
                </div>
                {employeeTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    No tasks found for this employee.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employeeTasks.map((task) => (
                      <ChecklistTaskCard
                        key={`employee-${task.id}`}
                        task={task}
                        variant="employee-tasks"
                      />
                    ))}
                  </div>
                )}
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
