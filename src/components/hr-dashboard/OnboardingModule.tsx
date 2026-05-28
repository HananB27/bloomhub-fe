import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { employeeApi } from "@/lib/api/modules/employees";
import type { EmployeeProfileData } from "@/lib/api/modules/employees";
import {
  ChecklistTemplate,
  ChecklistTask,
  ChecklistTaskStatus,
  TaskTemplate,
  TemplateRole,
  TASK_STATUS_LABELS,
  TASK_STATUS_BADGE_COLORS,
  cloneTemplate,
  createChecklistInstance,
  createTemplate,
  deleteInstance,
  deleteTemplate,
  fetchEmployeeTasks,
  fetchInstances,
  fetchMyTasks,
  fetchTemplates,
  ChecklistInstance,
  updateTemplate,
  updateTaskStatus,
} from "@/lib/api/onboarding";

type TaskStatus = "todo" | "in-progress" | "done";
type TemplateType = "onboarding" | "offboarding";

function employeeDisplayName(emp: EmployeeProfileData): string {
  const full = `${emp.first_name} ${emp.last_name}`.trim();
  return full || emp.username || emp.email || `Employee #${emp.id}`;
}

function normalizeStatus(status: string): string {
  return status === "in_progress" ? "in-progress" : status;
}

function toApiStatus(status: TaskStatus | string): ChecklistTaskStatus {
  return (
    status === "in-progress" ? "in_progress" : status
  ) as ChecklistTaskStatus;
}

function getDueDateInfo(
  dueDate: string | null | undefined,
  status: string
): {
  isOverdue: boolean;
  isDueToday: boolean;
  daysOverdue: number;
  daysUntil: number | null;
} {
  if (!dueDate || status === "done") {
    return {
      isOverdue: false,
      isDueToday: false,
      daysOverdue: 0,
      daysUntil: null,
    };
  }
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return {
      isOverdue: false,
      isDueToday: false,
      daysOverdue: 0,
      daysUntil: null,
    };
  }
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    isOverdue: diffDays > 0,
    isDueToday: diffDays === 0,
    daysOverdue: Math.max(diffDays, 0),
    daysUntil: -diffDays,
  };
}

function formatDaysUntil(daysUntil: number | null): string {
  if (daysUntil === null) return "";
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  if (daysUntil === -1) return "1 day overdue";
  if (daysUntil > 0) return `${daysUntil} days left`;
  return `${Math.abs(daysUntil)} days overdue`;
}

type SortOrder =
  | "default"
  | "due_asc"
  | "due_desc"
  | "status_todo_first"
  | "status_done_first"
  | "overdue_only";

const STATUS_SORT_RANK: Record<string, number> = {
  todo: 0,
  "in-progress": 1,
  done: 2,
};

function applySortOrder(tasks: Task[], order: SortOrder): Task[] {
  if (order === "default") return tasks;
  if (order === "overdue_only") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((t) => {
      if (t.status === "done" || t.dueDate === "No due date") return false;
      const due = new Date(t.dueDate);
      if (Number.isNaN(due.getTime())) return false;
      due.setHours(0, 0, 0, 0);
      return due.getTime() < today.getTime();
    });
  }
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
    category: task.checklist_instance.template.role_responsible ?? "",
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
  const { isOverdue, isDueToday, daysOverdue, daysUntil } = getDueDateInfo(
    task.due_date,
    status
  );

  if (variant === "my-tasks") {
    return (
      <Card
        className={`border transition-all hover:shadow-sm ${
          isOverdue ? "border-l-4 border-l-red-500" : ""
        } ${status === "done" ? "bg-green-50/50" : ""}`}
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
              {isOverdue && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Overdue · {daysOverdue}d
                </Badge>
              )}
              <Badge
                className={TASK_STATUS_BADGE_COLORS[apiStatus]}
                variant="outline"
              >
                {TASK_STATUS_LABELS[apiStatus]}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {task.checklist_instance.template.role_responsible}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {(() => {
                      const u = task.checklist_instance.employee.user;
                      const full = `${u.first_name} ${u.last_name}`.trim();
                      return (
                        full ||
                        u.username ||
                        `#${task.checklist_instance.employee.id}`
                      )
                        .charAt(0)
                        .toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  For:{" "}
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const u = task.checklist_instance.employee.user;
                      const full = `${u.first_name} ${u.last_name}`.trim();
                      return (
                        full ||
                        u.username ||
                        `Employee #${task.checklist_instance.employee.id}`
                      );
                    })()}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {(() => {
                      if (!task.assigned_to) return "?";
                      const u = task.assigned_to.user;
                      const full = `${u.first_name} ${u.last_name}`.trim();
                      return (full || u.username || `#${task.assigned_to.id}`)
                        .charAt(0)
                        .toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  Assigned by:{" "}
                  <span className="font-medium text-gray-900">
                    {(() => {
                      if (!task.assigned_to) return "Unassigned";
                      const u = task.assigned_to.user;
                      const full = `${u.first_name} ${u.last_name}`.trim();
                      return (
                        full || u.username || `Employee #${task.assigned_to.id}`
                      );
                    })()}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar
                  className={`w-4 h-4 ${
                    isOverdue
                      ? "text-red-600"
                      : isDueToday
                        ? "text-amber-600"
                        : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isOverdue
                      ? "text-red-700 font-medium"
                      : isDueToday
                        ? "text-amber-700 font-medium"
                        : "text-gray-600"
                  }`}
                >
                  {task.due_date ?? "No due date"}
                </span>
                {daysUntil !== null && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      isOverdue
                        ? "bg-red-50 text-red-700"
                        : isDueToday
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {formatDaysUntil(daysUntil)}
                  </span>
                )}
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
    <Card
      className={`border ${isOverdue ? "border-l-4 border-l-red-500" : ""}`}
    >
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
              {task.due_date && (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar
                    className={`w-3 h-3 ${
                      isOverdue
                        ? "text-red-600"
                        : isDueToday
                          ? "text-amber-600"
                          : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isOverdue
                        ? "text-red-700 font-medium"
                        : isDueToday
                          ? "text-amber-700 font-medium"
                          : "text-gray-500"
                    }`}
                  >
                    {task.due_date}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOverdue && (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Overdue · {daysOverdue}d
              </Badge>
            )}
            <Badge
              className={TASK_STATUS_BADGE_COLORS[apiStatus]}
              variant="outline"
            >
              {TASK_STATUS_LABELS[apiStatus]}
            </Badge>
          </div>
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

interface OnboardingModuleProps {
  onNavigate?: (moduleId: string) => void;
}

export function OnboardingModule({
  onNavigate: _onNavigate,
}: OnboardingModuleProps = {}) {
  const { data: session } = useSession();
  const sessionUser = session?.user as
    | { is_staff?: boolean; role?: string; image?: string }
    | null
    | undefined;
  const rawAccessToken = (session as Record<string, unknown> | null)
    ?.accessToken;
  const accessToken =
    typeof rawAccessToken === "string" ? rawAccessToken : undefined;
  const isHrOrStaff =
    sessionUser?.is_staff === true || sessionUser?.role?.toLowerCase() === "hr";
  const isManager = sessionUser?.role?.toLowerCase() === "manager";
  const canAccessTracker = isHrOrStaff || isManager;
  const [activeTab, setActiveTab] = useState("tracker");
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("onboarding_tracker_employee")) ||
      ""
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateType>("onboarding");
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<
    "all" | string
  >("all");
  const [selectedChecklistFilter, setSelectedChecklistFilter] = useState<
    "all" | string
  >("all");
  const [myTasks, setMyTasks] = useState<ChecklistTask[]>([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const [myTasksError, setMyTasksError] = useState<string | null>(null);
  const [trackerInstances, setTrackerInstances] = useState<
    Array<{
      id: number;
      templateName: string;
      type: "onboarding" | "offboarding";
    }>
  >([]);
  const [confirmUnassignId, setConfirmUnassignId] = useState<number | null>(
    null
  );
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  // Template management state
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [allInstances, setAllInstances] = useState<ChecklistInstance[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ChecklistTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "onboarding" as "onboarding" | "offboarding",
    role_responsible: "HR" as TemplateRole,
    task_templates: [] as TaskTemplate[],
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignModalTemplate, setAssignModalTemplate] =
    useState<ChecklistTemplate | null>(null);
  const [assignTargetEmployee, setAssignTargetEmployee] = useState<
    string | null
  >(null);
  const [assignDueDate, setAssignDueDate] = useState<string>("");
  const [taskDueDates, setTaskDueDates] = useState<Record<number, string>>({});
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
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

  const _activeOnboardingCount = tasks.length;
  const _activeOffboardingCount = offboardingTasksState.length;
  const overdueTasksCount = allTasks.filter((task) => {
    const due = new Date(task.dueDate);
    return (
      !Number.isNaN(due.valueOf()) && due < new Date() && task.status !== "done"
    );
  }).length;
  const _averageCompletionPercent =
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

  const _handleAddComment = (taskId: number) => {
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

  const _getPriorityColor = (priority: string) => {
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
      const [templatesData, instancesData] = await Promise.all([
        fetchTemplates(accessToken),
        fetchInstances(accessToken).catch(() => []),
      ]);
      setTemplates(templatesData);
      setAllInstances(instancesData);
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
        role_responsible: "HR",
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
        },
      ],
    }));
    setNewTaskTitle("");
  };

  const handleRemoveTask = (index: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      task_templates: prev.task_templates
        .filter((_, i) => i !== index)
        .map((t, i) => ({ ...t, order: i + 1 })),
    }));
  };

  const handleAssignTemplate = async () => {
    if (!assignModalTemplate || !assignTargetEmployee) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      await createChecklistInstance(
        Number(assignTargetEmployee),
        assignModalTemplate.id,
        assignDueDate || null,
        taskDueDates,
        accessToken
      );
      setAssignModalTemplate(null);
      setAssignTargetEmployee(null);
      setAssignDueDate("");
      setTaskDueDates({});
      if (assignTargetEmployee && assignTargetEmployee === selectedEmployee) {
        void loadTrackerTasks(selectedEmployee);
      }
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign template."
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handleExportEmployeePdf = async () => {
    if (!selectedEmployeeProfile) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const empName = employeeDisplayName(selectedEmployeeProfile);
    const empId = selectedEmployeeProfile.id;
    const department = selectedEmployeeProfile.department?.trim() || "N/A";
    const role = selectedEmployeeProfile.role?.name?.trim() || "N/A";
    const email = selectedEmployeeProfile.email?.trim() || "N/A";
    const typeLabel =
      selectedTemplate === "onboarding" ? "Onboarding" : "Offboarding";

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${typeLabel} Report`, 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Employee: ${empName}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Value"]],
      body: [
        ["Name", empName],
        ["ID", String(empId)],
        ["Email", email],
        ["Department", department],
        ["Role", role],
      ],
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 },
    });

    const tasksStartY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 60;

    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(`${typeLabel} Tasks`, 14, tasksStartY + 12);

    autoTable(doc, {
      startY: tasksStartY + 16,
      head: [["Title", "Status", "Due Date", "Assignee", "Category"]],
      body:
        currentTasks.length === 0
          ? [["No tasks", "—", "—", "—", "—"]]
          : currentTasks.map((t) => [
              t.title || "N/A",
              t.status || "N/A",
              t.dueDate || "N/A",
              t.assignee || "N/A",
              t.category || "N/A",
            ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`${empName.replace(/\s+/g, "_")}_${selectedTemplate}.pdf`);
  };

  const handleExportEmployee = () => {
    if (!selectedEmployeeProfile) return;
    const empName = employeeDisplayName(selectedEmployeeProfile);
    const empId = selectedEmployeeProfile.id;
    const department = selectedEmployeeProfile.department;
    const role = selectedEmployeeProfile.role?.name;
    const email = selectedEmployeeProfile.email;
    const typeLabel =
      selectedTemplate === "onboarding" ? "Onboarding" : "Offboarding";

    const quote = (v: string | number | null | undefined) => {
      const raw = v === null || v === undefined ? "" : String(v).trim();
      const s = raw === "" ? "N/A" : raw;
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Employee Name",
      "Employee ID",
      "Email",
      "Department",
      "Role",
      "Type",
      "Task Title",
      "Status",
      "Due Date",
      "Assignee",
      "Category",
    ];

    const lines: string[] = [];
    lines.push("sep=,");
    lines.push(headers.map(quote).join(","));

    if (currentTasks.length === 0) {
      lines.push(
        [empName, empId, email, department, role, typeLabel, "", "", "", "", ""]
          .map(quote)
          .join(",")
      );
    } else {
      for (const t of currentTasks) {
        lines.push(
          [
            empName,
            empId,
            email,
            department,
            role,
            typeLabel,
            t.title,
            t.status,
            t.dueDate,
            t.assignee,
            t.category,
          ]
            .map(quote)
            .join(",")
        );
      }
    }

    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${empName.replace(/\s+/g, "_")}_${selectedTemplate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      role_responsible: template.role_responsible,
      task_templates: template.task_templates,
    });
    setShowTemplateForm(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "templates") {
      void loadTemplates();
    }
    if (value === "my-tasks") {
      void loadMyTasks();
    }
    if (value === "tracker" && selectedEmployee) {
      void loadTrackerTasks(selectedEmployee);
    }
  };

  const handleUnassignInstance = async (instanceId: number) => {
    try {
      await deleteInstance(instanceId, accessToken);
      await loadTrackerTasks(selectedEmployee);
    } catch {
      setTrackerError("Failed to remove assignment.");
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
    setTrackerInstances([]);
    try {
      const apiTasks = await fetchEmployeeTasks(
        Number(employeeId),
        accessToken
      );
      const onboarding: Task[] = [];
      const offboarding: Task[] = [];
      const instanceMap = new Map<
        number,
        { id: number; templateName: string; type: "onboarding" | "offboarding" }
      >();
      for (const t of apiTasks) {
        const mapped = mapChecklistTaskToTask(t);
        const inst = t.checklist_instance;
        if (!instanceMap.has(inst.id)) {
          instanceMap.set(inst.id, {
            id: inst.id,
            templateName: inst.template.name,
            type: inst.template.type,
          });
        }
        if (inst.template.type === "onboarding") {
          onboarding.push(mapped);
        } else {
          offboarding.push(mapped);
        }
      }
      setTasks(onboarding);
      setOffboardingTasksState(offboarding);
      setTrackerInstances(Array.from(instanceMap.values()));
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
    if (canAccessTracker) {
      void loadAllEmployees();
      if (selectedEmployee) {
        void loadTrackerTasks(selectedEmployee);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedEmployee) {
        localStorage.setItem("onboarding_tracker_employee", selectedEmployee);
      } else {
        localStorage.removeItem("onboarding_tracker_employee");
      }
    }
  }, [selectedEmployee]);

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
                          <ChevronDown className="w-3 h-3 ml-1" />
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
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioItem value="overdue_only">
                            Overdue tasks only
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!selectedEmployeeProfile}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportEmployee}>
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void handleExportEmployeePdf()}
                        >
                          Export as PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                                  {employeeDisplayName(emp)
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {employeeDisplayName(emp)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {emp.department ?? emp.employee_id}
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
                            ? employeeDisplayName(selectedEmployeeProfile)
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
                  {trackerInstances.length > 0 && (
                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Send className="w-4 h-4" />
                          Active Assignments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {trackerInstances.map((inst) => (
                          <div
                            key={inst.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {inst.templateName}
                                </p>
                                <Badge
                                  variant={
                                    inst.type === "onboarding"
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="mt-0.5 text-xs"
                                >
                                  {inst.type}
                                </Badge>
                              </div>
                              {confirmUnassignId === inst.id ? (
                                <div className="flex shrink-0 gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs px-2"
                                    onClick={() => setConfirmUnassignId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="text-xs px-2 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => {
                                      setConfirmUnassignId(null);
                                      void handleUnassignInstance(inst.id);
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0 text-red-600 hover:bg-red-50 hover:border-red-300"
                                  onClick={() => setConfirmUnassignId(inst.id)}
                                  aria-label={`Remove assignment: ${inst.templateName}`}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            {confirmUnassignId === inst.id && (
                              <p className="mt-2 text-xs text-red-600">
                                Are you sure you want to unassign this template?
                                All tasks will be deleted.
                              </p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
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
                                {employeeDisplayName(selectedEmployeeProfile)
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {employeeDisplayName(selectedEmployeeProfile)}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setProfileModalOpen(true)}
                            disabled={!selectedEmployeeProfile}
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Full Profile
                          </Button>
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
                    Tasks you supervise on behalf of other employees.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadMyTasks()}
                >
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
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
                    role_responsible: "HR",
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

                  <div className="space-y-2">
                    <Label>Responsible Team</Label>
                    <Select
                      value={templateForm.role_responsible}
                      onValueChange={(val: TemplateRole) =>
                        setTemplateForm((prev) => ({
                          ...prev,
                          role_responsible: val,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <Label>Tasks</Label>
                    {templateForm.task_templates.map((task, idx) => (
                      <div
                        key={task.id ?? `${task.order}-${task.title}`}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm"
                      >
                        <span>{task.title}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveTask(idx)}
                          aria-label="Remove task"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Task title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                      />
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
                      <Badge variant="outline">
                        {template.role_responsible}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setAssignModalTemplate(template);
                          setAssignTargetEmployee(null);
                          setAssignError(null);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
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
                  {(() => {
                    const assigned = allInstances.filter(
                      (i) => i.template?.id === template.id
                    );
                    return (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Assigned to ({assigned.length}):
                        </p>
                        {assigned.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            Not assigned to any employee
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assigned.map((inst) => {
                              const u = inst.employee.user;
                              const full =
                                `${u.first_name} ${u.last_name}`.trim();
                              const label =
                                full ||
                                u.username ||
                                `Employee #${inst.employee.id}`;
                              return (
                                <Badge
                                  key={inst.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="space-y-1">
                    {template.task_templates.map((task) => (
                      <div
                        key={`${template.id}-${task.title}-${task.order}`}
                        className="text-sm p-2 bg-gray-50 rounded"
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Assign to Employee Modal */}
            {assignModalTemplate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <Card className="w-full max-w-md mx-4">
                  <CardHeader>
                    <CardTitle>Assign Template to Employee</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {assignModalTemplate.name}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Employee</Label>
                      <Select
                        value={assignTargetEmployee ?? ""}
                        onValueChange={(val) => setAssignTargetEmployee(val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allEmployees.map((emp) => (
                            <SelectItem key={emp.id} value={String(emp.id)}>
                              {employeeDisplayName(emp)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date (all tasks)</Label>
                      <Input
                        type="date"
                        value={assignDueDate}
                        onChange={(e) => setAssignDueDate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Applied to every task unless overridden below.
                      </p>
                    </div>
                    {assignModalTemplate.task_templates.length > 0 && (
                      <div className="space-y-2">
                        <Label>Individual Task Due Dates (optional)</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {assignModalTemplate.task_templates.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="flex-1 text-gray-700 truncate">
                                {task.title}
                              </span>
                              <Input
                                type="date"
                                className="w-36 text-xs"
                                value={
                                  task.id !== undefined
                                    ? (taskDueDates[task.id] ?? "")
                                    : ""
                                }
                                onChange={(e) => {
                                  if (task.id === undefined) return;
                                  const val = e.target.value;
                                  setTaskDueDates((prev) => {
                                    const next = { ...prev };
                                    if (val) next[task.id!] = val;
                                    else delete next[task.id!];
                                    return next;
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {assignError && (
                      <p className="text-sm text-red-600">{assignError}</p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAssignModalTemplate(null);
                          setAssignDueDate("");
                          setTaskDueDates({});
                        }}
                        disabled={assignLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => void handleAssignTemplate()}
                        disabled={!assignTargetEmployee || assignLoading}
                      >
                        {assignLoading ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployeeProfile
                ? employeeDisplayName(selectedEmployeeProfile)
                : "Employee Profile"}
            </DialogTitle>
            <DialogDescription>
              Read-only profile snapshot for the selected employee.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployeeProfile && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[
                ["Employee ID", String(selectedEmployeeProfile.id)],
                ["Email", selectedEmployeeProfile.email],
                ["Phone", selectedEmployeeProfile.phone_number],
                ["Department", selectedEmployeeProfile.department],
                ["Role", selectedEmployeeProfile.role?.name],
                ["Start Date", selectedEmployeeProfile.start_date],
                ["Birth Date", selectedEmployeeProfile.birth_date],
                ["Address", selectedEmployeeProfile.address],
                [
                  "Employment Status",
                  selectedEmployeeProfile.employment_status,
                ],
                [
                  "Managers",
                  Array.isArray(selectedEmployeeProfile.manager_names)
                    ? selectedEmployeeProfile.manager_names.join(", ")
                    : selectedEmployeeProfile.manager_names,
                ],
              ].map(([label, value]) => (
                <div key={label as string} className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  <p className="text-sm text-gray-900">
                    {value && String(value).trim() ? String(value) : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
