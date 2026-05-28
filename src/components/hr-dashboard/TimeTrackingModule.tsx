import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  timeTrackingApi,
  type ActiveAllocations,
  type JiraAssignedIssuesImportResult,
  type JiraImportCommitResult,
  type JiraImportFilters,
  type JiraImportPreview,
  type JiraIssueMapping,
  type JiraMappingPayload,
  type JiraMappings,
  type JiraProjectDiscoveryResult,
  type JiraProjectDiscoveryRow,
  type JiraProjectMapping,
  type JiraSettings,
  type JiraUserMapping,
  type PlannedVsActualResponse,
  type TempoAccountMapping,
  type TempoMappingPayload,
  type TempoProjectDiscoveryResult,
  type TempoProjectDiscoveryRow,
  type TempoImportCommitResult,
  type TempoImportFilters,
  type TempoImportPreview,
  type TempoMappings,
  type TempoProjectMapping,
  type TempoSettings,
  type TempoTeamMapping,
  type TempoUserMapping,
  type TimeImportBatch,
  type TimeImportRow,
  type TimesheetExportFilters,
  type TimeEntry,
  type TimeEntrySourceType,
  type TimeEntryStatus,
  type TimeTask,
  type WeeklyProjectSummary,
  type WeeklySummary,
  type WeeklyDashboard,
} from "@/lib/api/timeTracking";
import {
  employeeApi,
  type EmployeeProfileData,
} from "@/lib/api/modules/employees";
import { projectApi, type Project } from "@/lib/api/modules/projects";
import { formatDateWithWeekday } from "@/utils";
import { DatePicker } from "./DatePicker";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

type EntryForm = {
  id?: number;
  project_id: string;
  task_id: string;
  work_date: string;
  hours: string;
  notes: string;
};

type TaskForm = {
  id?: number;
  project_id: string;
  name: string;
  description: string;
  jira_issue_key: string;
  jira_project_key: string;
  is_active: boolean;
};

type JiraSettingsForm = {
  base_url: string;
  auth_email: string;
  api_token: string;
  enabled: boolean;
};

type JiraUserMappingForm = {
  id?: number;
  jira_account_id: string;
  jira_display_name: string;
  employee_id: string;
  is_active: boolean;
};

type JiraProjectMappingForm = {
  id?: number;
  jira_project_key: string;
  jira_project_name: string;
  project_id: string;
  is_active: boolean;
};

type JiraIssueMappingForm = {
  id?: number;
  jira_issue_key: string;
  jira_issue_id: string;
  task_id: string;
  is_active: boolean;
};

type JiraImportFilterForm = {
  date_from: string;
  date_to: string;
  employee_id: string;
  project_id: string;
  jira_project_key: string;
  jira_issue_key: string;
  worklog_id: string;
};

type JiraAssignedIssuesForm = {
  employee_id: string;
  max_results: string;
};

type JiraDiscoveryForm = {
  base_url: string;
  auth_email: string;
  api_token: string;
  date_from: string;
  date_to: string;
  limit: string;
};

type TempoSettingsForm = {
  base_url: string;
  api_token: string;
  enabled: boolean;
};

type TempoMappingForm = {
  id?: number;
  mapping_type: "user" | "account" | "project" | "team";
  tempo_user_id: string;
  tempo_display_name: string;
  tempo_account_id: string;
  tempo_account_key: string;
  tempo_account_name: string;
  tempo_project_id: string;
  tempo_project_key: string;
  tempo_project_name: string;
  tempo_team_id: string;
  tempo_team_name: string;
  employee_id: string;
  project_id: string;
  is_active: boolean;
};

type TempoDiscoveryForm = {
  base_url: string;
  api_token: string;
  date_from: string;
  date_to: string;
  limit: string;
};

type TempoImportFilterForm = {
  date_from: string;
  date_to: string;
  employee_id: string;
  tempo_team_id: string;
  tempo_account_id: string;
  tempo_account_key: string;
  tempo_project_id: string;
  project_id: string;
  jira_issue_key: string;
  worklog_id: string;
};

type DocumentColumnMappingForm = {
  employee: string;
  date: string;
  project: string;
  hours: string;
  task: string;
  jira_issue: string;
  notes: string;
};

type ReportFilters = {
  week_start: string;
  date_from: string;
  date_to: string;
  employee_id: string;
  project_id: string;
  source_type: "all" | TimeEntrySourceType;
  status: "all" | TimeEntryStatus;
  export_format: "csv" | "xlsx";
};

type ImportHistoryFilterForm = {
  source_type: "all" | "document_import" | "jira" | "tempo";
  status:
    | "all"
    | "uploaded"
    | "needs_mapping"
    | "previewed"
    | "partially_committed"
    | "committed"
    | "failed";
  uploaded_by: string;
  date_from: string;
  date_to: string;
};

type SourceReviewFilterForm = {
  date_from: string;
  date_to: string;
  employee_id: string;
  project_id: string;
  source_type: "all" | "jira" | "tempo" | "document_import";
  status: "all" | TimeEntryStatus;
};

type CalendarDialogTarget =
  | {
      mode: "create";
      date: string;
      startTime: string;
    }
  | {
      mode: "entry";
      entry: TimeEntry;
      date: string;
      startTime: string;
    };

const DOCUMENT_MAPPING_FIELDS: Array<{
  key: keyof DocumentColumnMappingForm;
  label: string;
  required: boolean;
}> = [
  { key: "employee", label: "Employee", required: true },
  { key: "date", label: "Date", required: true },
  { key: "project", label: "Project", required: true },
  { key: "hours", label: "Hours", required: true },
  { key: "task", label: "Task", required: false },
  { key: "jira_issue", label: "Jira Issue", required: false },
  { key: "notes", label: "Notes", required: false },
];

const DOCUMENT_MAPPING_HEADER_ALIASES: Record<
  keyof DocumentColumnMappingForm,
  string[]
> = {
  employee: ["employee", "employee_name", "employee_full_name", "employee_id"],
  date: ["date", "work_date", "entry_date"],
  project: ["project", "project_name", "project_id"],
  hours: ["hours", "duration", "time_spent"],
  task: ["task", "task_name", "task_id"],
  jira_issue: ["jira_issue_key", "jira_issue", "issue_key", "jira"],
  notes: ["notes", "note", "comment", "description"],
};

const SOURCE_LABELS: Record<TimeEntrySourceType, string> = {
  manual: "Manual",
  jira: "Jira",
  tempo: "Tempo",
  document_import: "DocumentImport",
};

const STATUS_LABELS: Record<TimeEntryStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 18;
const CALENDAR_SLOT_MINUTES = 30;
const CALENDAR_SLOT_HEIGHT = 48;

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date): string {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day + (day === 0 ? -6 : 1));
  return isoDate(next);
}

function addDays(value: string, days: number): string {
  const next = new Date(`${value}T00:00:00`);
  next.setDate(next.getDate() + days);
  return isoDate(next);
}

function getWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function calendarTimeSlots(): string[] {
  const slotCount =
    ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / CALENDAR_SLOT_MINUTES +
    1;
  return Array.from({ length: slotCount }, (_, index) => {
    const totalMinutes =
      CALENDAR_START_HOUR * 60 + index * CALENDAR_SLOT_MINUTES;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  });
}

function displayCalendarTime(value: string): string {
  const [hours = "0", minutes = "0"] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) {
    return value;
  }
  const date = new Date(2026, 0, 1, parsedHours, parsedMinutes);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function minutesFromCalendarStart(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return (Number(hours) - CALENDAR_START_HOUR) * 60 + Number(minutes || 0);
}

function persistableStartTime(value: string): string {
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function entryCalendarStartTime(entry: TimeEntry): string | null {
  if (!entry.start_time) return null;
  const match = entry.start_time.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

function defaultEntryStartTime(index: number): string {
  const maxIndex =
    ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / CALENDAR_SLOT_MINUTES -
    1;
  return calendarTimeSlots()[Math.min(index, maxIndex)] || "08:00";
}

function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  return `${new Date(`${weekStart}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${new Date(`${end}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function decimalHours(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0.00";
  return parsed.toFixed(2);
}

function employeeDisplayName(employee: EmployeeProfileData): string {
  const fullName = `${employee.first_name} ${employee.last_name}`.trim();
  return (
    fullName || employee.username || employee.email || `Employee ${employee.id}`
  );
}

function summaryStatusMessage(message: string): {
  tone: "error" | "warning" | "empty";
  title: string;
} {
  const normalized = message.toLowerCase();
  if (normalized.includes("permission")) {
    return {
      tone: "warning",
      title: "Summary permission required",
    };
  }
  if (
    normalized.includes("not found") ||
    normalized.includes("profile not found")
  ) {
    return {
      tone: "empty",
      title: "Summary unavailable",
    };
  }
  return {
    tone: "error",
    title: "Summary error",
  };
}

function isManagerLike(value?: string | null): boolean {
  const role = (value || "").toLowerCase();
  return ["admin", "super_admin", "staff", "hr", "manager", "lead"].some(
    (part) => role.includes(part)
  );
}

function varianceClass(value: string): string {
  const numericValue = Number(value);
  if (numericValue > 0) return "text-red-700 dark:text-red-300";
  if (numericValue < 0) return "text-amber-700 dark:text-amber-300";
  return "text-gray-700 dark:text-gray-200";
}

function allocationStatusClass(
  status: WeeklyProjectSummary["allocation_status"]
) {
  return status === "unallocated"
    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    : "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200";
}

function timeEntryAllocationStatus(
  entry: TimeEntry
): "allocated" | "unallocated" | null {
  return entry.allocation_context?.allocation_status ?? null;
}

function activeAssignmentContext(
  allocations: ActiveAllocations | null,
  projectId: string
) {
  if (!allocations || !projectId) return null;
  return (
    allocations.assignments.find(
      (assignment) => assignment.project_id === Number(projectId)
    ) ?? null
  );
}

function jiraSettingsToForm(settings: JiraSettings | null): JiraSettingsForm {
  if (!settings) return EMPTY_JIRA_SETTINGS_FORM;
  return {
    base_url: settings.base_url || "",
    auth_email: settings.auth_email || "",
    api_token: "",
    enabled: settings.enabled,
  };
}

function jiraImportFiltersPayload(
  filters: JiraImportFilterForm
): JiraImportFilters {
  return {
    date_from: filters.date_from,
    date_to: filters.date_to,
    employee_id: filters.employee_id ? Number(filters.employee_id) : undefined,
    project_id: filters.project_id ? Number(filters.project_id) : undefined,
    jira_project_key: filters.jira_project_key.trim() || undefined,
    jira_issue_key: filters.jira_issue_key.trim() || undefined,
    worklog_id: filters.worklog_id.trim() || undefined,
  };
}

function jiraAssignedIssuesPayload(
  form: JiraAssignedIssuesForm,
  dryRun: boolean
) {
  return {
    employee_id: Number(form.employee_id),
    max_results: Number(form.max_results) || 1000,
    dry_run: dryRun,
  };
}

function jiraIssueUrl(baseUrl: string | undefined, issueKey: string): string {
  const normalizedBase = (baseUrl || "").trim().replace(/\/+$/, "");
  const normalizedIssue = issueKey.trim();
  if (!normalizedBase || !normalizedIssue) return "";
  return `${normalizedBase}/browse/${encodeURIComponent(normalizedIssue)}`;
}

function jiraDiscoveryPayload(form: JiraDiscoveryForm) {
  const limit = Number(form.limit);
  return {
    ...(form.base_url.trim() ? { base_url: form.base_url.trim() } : {}),
    ...(form.auth_email.trim() ? { auth_email: form.auth_email.trim() } : {}),
    ...(form.api_token.trim() ? { api_token: form.api_token.trim() } : {}),
    ...(form.date_from ? { date_from: form.date_from } : {}),
    ...(form.date_to ? { date_to: form.date_to } : {}),
    ...(Number.isFinite(limit) && limit > 0 ? { limit } : {}),
  };
}

function tempoSettingsToForm(
  settings: TempoSettings | null
): TempoSettingsForm {
  if (!settings) return EMPTY_TEMPO_SETTINGS_FORM;
  return {
    base_url: settings.base_url || "https://api.tempo.io/4",
    api_token: "",
    enabled: settings.enabled,
  };
}

function tempoImportFiltersPayload(
  filters: TempoImportFilterForm
): TempoImportFilters {
  return {
    date_from: filters.date_from,
    date_to: filters.date_to,
    employee_id: filters.employee_id ? Number(filters.employee_id) : undefined,
    tempo_team_id: filters.tempo_team_id.trim() || undefined,
    tempo_account_id: filters.tempo_account_id.trim() || undefined,
    tempo_account_key: filters.tempo_account_key.trim() || undefined,
    tempo_project_id: filters.tempo_project_id.trim() || undefined,
    project_id: filters.project_id ? Number(filters.project_id) : undefined,
    jira_issue_key: filters.jira_issue_key.trim() || undefined,
    worklog_id: filters.worklog_id.trim() || undefined,
  };
}

function tempoDiscoveryPayload(form: TempoDiscoveryForm) {
  const limit = Number(form.limit);
  return {
    base_url: form.base_url.trim(),
    ...(form.api_token.trim() ? { api_token: form.api_token.trim() } : {}),
    ...(form.date_from ? { date_from: form.date_from } : {}),
    ...(form.date_to ? { date_to: form.date_to } : {}),
    ...(Number.isFinite(limit) && limit > 0 ? { limit } : {}),
  };
}

function metadataValue(
  metadata: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }
  return null;
}

function documentMappingFromBatch(
  batch: TimeImportBatch | null
): DocumentColumnMappingForm {
  if (!batch) return EMPTY_DOCUMENT_MAPPING_FORM;
  const headers = batch.detected_columns.headers ?? [];
  const source = {
    ...(batch.detected_columns.mapping ?? {}),
    ...batch.column_mapping,
  };
  return {
    employee: source.employee || inferDocumentHeader(headers, "employee"),
    date: source.date || inferDocumentHeader(headers, "date"),
    project: source.project || inferDocumentHeader(headers, "project"),
    hours: source.hours || inferDocumentHeader(headers, "hours"),
    task: source.task || inferDocumentHeader(headers, "task"),
    jira_issue:
      source.jira_issue ||
      source.jira_issue_key ||
      inferDocumentHeader(headers, "jira_issue"),
    notes: source.notes || inferDocumentHeader(headers, "notes"),
  };
}

function normalizeDocumentHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function inferDocumentHeader(
  headers: string[],
  field: keyof DocumentColumnMappingForm
): string {
  const aliases = DOCUMENT_MAPPING_HEADER_ALIASES[field];
  for (const alias of aliases) {
    const match = headers.find(
      (header) => normalizeDocumentHeader(header) === alias
    );
    if (match) return match;
  }
  return "";
}

function missingRequiredDocumentFields(
  form: DocumentColumnMappingForm
): Array<keyof DocumentColumnMappingForm> {
  return DOCUMENT_MAPPING_FIELDS.filter(
    (field) => field.required && !form[field.key]
  ).map((field) => field.key);
}

function documentMappingPayload(form: DocumentColumnMappingForm) {
  return {
    column_mapping: {
      employee: form.employee,
      employee_id: form.employee,
      date: form.date,
      work_date: form.date,
      project: form.project,
      project_id: form.project,
      hours: form.hours,
      ...(form.task ? { task: form.task, task_id: form.task } : {}),
      ...(form.jira_issue
        ? { jira_issue: form.jira_issue, jira_issue_key: form.jira_issue }
        : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    },
  };
}

function reportNumber(value: string | undefined): string {
  return decimalHours(value ?? "0");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function rawDocumentValue(
  batch: TimeImportBatch,
  row: TimeImportBatch["rows"][number],
  field: keyof DocumentColumnMappingForm,
  form?: DocumentColumnMappingForm
): string {
  const header =
    form?.[field] ||
    batch.column_mapping[field] ||
    batch.detected_columns.mapping?.[field];
  const value =
    (header ? row.raw_data[header] : undefined) || row.raw_data[field];
  return value === undefined || value === null || value === ""
    ? "--"
    : String(value);
}

function sourceChangeFlag(entry: TimeEntry): string {
  const value = entry.source_metadata?.source_change_flag;
  return typeof value === "string" && value ? value : "review_required";
}

function sourcePendingUpdate(entry: TimeEntry): Record<string, unknown> {
  const value = entry.source_metadata?.source_pending_update;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function statusClass(status: TimeEntryStatus): string {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-800";
    case "submitted":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-gray-200 bg-gray-50 text-gray-800";
  }
}

function sourceClass(source: TimeEntrySourceType): string {
  switch (source) {
    case "jira":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "tempo":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "document_import":
      return "border-slate-200 bg-slate-50 text-slate-800";
    default:
      return "border-gray-200 bg-white text-gray-800";
  }
}

function sourceStripeClass(source: TimeEntrySourceType): string {
  switch (source) {
    case "jira":
      return "bg-blue-600";
    case "tempo":
      return "bg-violet-600";
    case "document_import":
      return "bg-amber-600";
    default:
      return "bg-gray-500";
  }
}

function calendarEventClass(entry: TimeEntry, readOnly: boolean): string {
  if (entry.status === "rejected") {
    return "border-red-200 bg-red-50 text-red-950";
  }
  if (readOnly) {
    return "border-gray-200 bg-white text-gray-950";
  }
  return "border-gray-200 bg-white text-gray-950";
}

function canEditGridEntry(entry: TimeEntry): boolean {
  return (
    entry.source_type === "manual" &&
    (entry.status === "draft" || entry.status === "rejected")
  );
}

function canDeleteGridEntry(entry: TimeEntry): boolean {
  return entry.status === "draft" || entry.status === "rejected";
}

function emptyEntryForm(date: string): EntryForm {
  return {
    project_id: "",
    task_id: "none",
    work_date: date,
    hours: "",
    notes: "",
  };
}

const EMPTY_TASK_FORM: TaskForm = {
  project_id: "",
  name: "",
  description: "",
  jira_issue_key: "",
  jira_project_key: "",
  is_active: true,
};

const EMPTY_JIRA_SETTINGS_FORM: JiraSettingsForm = {
  base_url: "",
  auth_email: "",
  api_token: "",
  enabled: false,
};

const EMPTY_JIRA_USER_MAPPING_FORM: JiraUserMappingForm = {
  jira_account_id: "",
  jira_display_name: "",
  employee_id: "",
  is_active: true,
};

const EMPTY_JIRA_PROJECT_MAPPING_FORM: JiraProjectMappingForm = {
  jira_project_key: "",
  jira_project_name: "",
  project_id: "",
  is_active: true,
};

const EMPTY_JIRA_ISSUE_MAPPING_FORM: JiraIssueMappingForm = {
  jira_issue_key: "",
  jira_issue_id: "",
  task_id: "",
  is_active: true,
};

const EMPTY_JIRA_DISCOVERY_FORM: JiraDiscoveryForm = {
  base_url: "",
  auth_email: "",
  api_token: "",
  date_from: "",
  date_to: "",
  limit: "1000",
};

const EMPTY_JIRA_ASSIGNED_ISSUES_FORM: JiraAssignedIssuesForm = {
  employee_id: "",
  max_results: "1000",
};

const EMPTY_TEMPO_SETTINGS_FORM: TempoSettingsForm = {
  base_url: "https://api.tempo.io/4",
  api_token: "",
  enabled: false,
};

const EMPTY_TEMPO_MAPPING_FORM: TempoMappingForm = {
  mapping_type: "user",
  tempo_user_id: "",
  tempo_display_name: "",
  tempo_account_id: "",
  tempo_account_key: "",
  tempo_account_name: "",
  tempo_project_id: "",
  tempo_project_key: "",
  tempo_project_name: "",
  tempo_team_id: "",
  tempo_team_name: "",
  employee_id: "",
  project_id: "",
  is_active: true,
};

const EMPTY_TEMPO_DISCOVERY_FORM: TempoDiscoveryForm = {
  base_url: "https://api.tempo.io/4",
  api_token: "",
  date_from: "",
  date_to: "",
  limit: "100",
};

const EMPTY_DOCUMENT_MAPPING_FORM: DocumentColumnMappingForm = {
  employee: "",
  date: "",
  project: "",
  hours: "",
  task: "",
  jira_issue: "",
  notes: "",
};

export function TimeTrackingModule() {
  const { data: session } = useSession();
  const sessionUser = session?.user as
    | {
        role?: string | null;
        career_level?: string | null;
        permissions?: string[];
        is_staff?: boolean;
        is_superuser?: boolean;
      }
    | undefined;
  const canManageTime =
    sessionUser?.is_staff === true ||
    sessionUser?.is_superuser === true ||
    sessionUser?.permissions?.includes(
      "Time Tracking.approve_team_timesheets"
    ) ||
    isManagerLike(sessionUser?.role || sessionUser?.career_level);
  const canViewOtherTimesheets =
    canManageTime ||
    sessionUser?.permissions?.includes("Time Tracking.view_team_timesheets") ||
    sessionUser?.permissions?.includes("Time Tracking.view_dept_timesheets");

  const [activeTab, setActiveTab] = useState("week");
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [tasks, setTasks] = useState<TimeTask[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(
    null
  );
  const [activeAllocations, setActiveAllocations] =
    useState<ActiveAllocations | null>(null);
  const [activeAllocationsError, setActiveAllocationsError] = useState<
    string | null
  >(null);
  const [isActiveAllocationsLoading, setIsActiveAllocationsLoading] =
    useState(false);
  const [approvalEntries, setApprovalEntries] = useState<TimeEntry[]>([]);
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<number[]>([]);
  const [isApprovalActionLoading, setIsApprovalActionLoading] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [approvalFilters, setApprovalFilters] = useState({
    date_from: weekStart,
    date_to: addDays(weekStart, 6),
    employee: "",
    project: "all",
    source_type: "all",
    status: "submitted",
  });
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    week_start: weekStart,
    date_from: weekStart,
    date_to: addDays(weekStart, 6),
    employee_id: "",
    project_id: "all",
    source_type: "all",
    status: "all",
    export_format: "csv",
  });
  const [entryForm, setEntryForm] = useState<EntryForm>(
    emptyEntryForm(isoDate(new Date()))
  );
  const [calendarDialogTarget, setCalendarDialogTarget] =
    useState<CalendarDialogTarget | null>(null);
  const [entryStartTimes, setEntryStartTimes] = useState<
    Record<number, string>
  >({});
  const [taskForm, setTaskForm] = useState<TaskForm>(EMPTY_TASK_FORM);
  const [rejectTarget, setRejectTarget] = useState<TimeEntry | null>(null);
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [jiraSettings, setJiraSettings] = useState<JiraSettings | null>(null);
  const [jiraSettingsForm, setJiraSettingsForm] = useState<JiraSettingsForm>(
    EMPTY_JIRA_SETTINGS_FORM
  );
  const [jiraMappings, setJiraMappings] = useState<JiraMappings>({
    users: [],
    projects: [],
    issues: [],
  });
  const [jiraDiscoveryForm, setJiraDiscoveryForm] = useState<JiraDiscoveryForm>(
    EMPTY_JIRA_DISCOVERY_FORM
  );
  const [jiraDiscovery, setJiraDiscovery] =
    useState<JiraProjectDiscoveryResult | null>(null);
  const [jiraUserForm, setJiraUserForm] = useState<JiraUserMappingForm>(
    EMPTY_JIRA_USER_MAPPING_FORM
  );
  const [jiraProjectForm, setJiraProjectForm] =
    useState<JiraProjectMappingForm>(EMPTY_JIRA_PROJECT_MAPPING_FORM);
  const [jiraIssueForm, setJiraIssueForm] = useState<JiraIssueMappingForm>(
    EMPTY_JIRA_ISSUE_MAPPING_FORM
  );
  const [jiraImportFilters, setJiraImportFilters] =
    useState<JiraImportFilterForm>({
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
      employee_id: "",
      project_id: "",
      jira_project_key: "",
      jira_issue_key: "",
      worklog_id: "",
    });
  const [jiraPreview, setJiraPreview] = useState<JiraImportPreview | null>(
    null
  );
  const [jiraCommitResult, setJiraCommitResult] =
    useState<JiraImportCommitResult | null>(null);
  const [jiraAssignedIssuesForm, setJiraAssignedIssuesForm] =
    useState<JiraAssignedIssuesForm>(EMPTY_JIRA_ASSIGNED_ISSUES_FORM);
  const [jiraAssignedIssuesResult, setJiraAssignedIssuesResult] =
    useState<JiraAssignedIssuesImportResult | null>(null);
  const [jiraError, setJiraError] = useState<string | null>(null);
  const [jiraMessage, setJiraMessage] = useState<string | null>(null);
  const [isJiraLoading, setIsJiraLoading] = useState(false);
  const [isJiraSaving, setIsJiraSaving] = useState(false);
  const [tempoSettings, setTempoSettings] = useState<TempoSettings | null>(
    null
  );
  const [tempoSettingsForm, setTempoSettingsForm] = useState<TempoSettingsForm>(
    EMPTY_TEMPO_SETTINGS_FORM
  );
  const [tempoMappings, setTempoMappings] = useState<TempoMappings>({
    users: [],
    accounts: [],
    projects: [],
    teams: [],
  });
  const [tempoMappingForm, setTempoMappingForm] = useState<TempoMappingForm>(
    EMPTY_TEMPO_MAPPING_FORM
  );
  const [tempoDiscoveryForm, setTempoDiscoveryForm] =
    useState<TempoDiscoveryForm>(EMPTY_TEMPO_DISCOVERY_FORM);
  const [tempoDiscovery, setTempoDiscovery] =
    useState<TempoProjectDiscoveryResult | null>(null);
  const [tempoImportFilters, setTempoImportFilters] =
    useState<TempoImportFilterForm>({
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
      employee_id: "",
      tempo_team_id: "",
      tempo_account_id: "",
      tempo_account_key: "",
      tempo_project_id: "",
      project_id: "",
      jira_issue_key: "",
      worklog_id: "",
    });
  const [tempoPreview, setTempoPreview] = useState<TempoImportPreview | null>(
    null
  );
  const [tempoCommitResult, setTempoCommitResult] =
    useState<TempoImportCommitResult | null>(null);
  const [tempoError, setTempoError] = useState<string | null>(null);
  const [tempoMessage, setTempoMessage] = useState<string | null>(null);
  const [isTempoLoading, setIsTempoLoading] = useState(false);
  const [isTempoSaving, setIsTempoSaving] = useState(false);
  const [documentBatch, setDocumentBatch] = useState<TimeImportBatch | null>(
    null
  );
  const [documentMappingForm, setDocumentMappingForm] =
    useState<DocumentColumnMappingForm>(EMPTY_DOCUMENT_MAPPING_FORM);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [isDocumentSaving, setIsDocumentSaving] = useState(false);
  const [weeklyDashboard, setWeeklyDashboard] =
    useState<WeeklyDashboard | null>(null);
  const [plannedVsActual, setPlannedVsActual] =
    useState<PlannedVsActualResponse | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportsMessage, setReportsMessage] = useState<string | null>(null);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [importHistoryFilters, setImportHistoryFilters] =
    useState<ImportHistoryFilterForm>({
      source_type: "all",
      status: "all",
      uploaded_by: "",
      date_from: "",
      date_to: "",
    });
  const [importBatches, setImportBatches] = useState<TimeImportBatch[]>([]);
  const [selectedImportBatch, setSelectedImportBatch] =
    useState<TimeImportBatch | null>(null);
  const [selectedImportRow, setSelectedImportRow] =
    useState<TimeImportRow | null>(null);
  const [sourceReviewFilters, setSourceReviewFilters] =
    useState<SourceReviewFilterForm>({
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
      employee_id: "",
      project_id: "all",
      source_type: "all",
      status: "all",
    });
  const [sourceReviewEntries, setSourceReviewEntries] = useState<TimeEntry[]>(
    []
  );
  const [selectedSourceReviewEntry, setSelectedSourceReviewEntry] =
    useState<TimeEntry | null>(null);
  const [sourceReviewNote, setSourceReviewNote] = useState("");
  const [observabilityError, setObservabilityError] = useState<string | null>(
    null
  );
  const [observabilityMessage, setObservabilityMessage] = useState<
    string | null
  >(null);
  const [isObservabilityLoading, setIsObservabilityLoading] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weeklyTotal = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0),
    [entries]
  );
  const selectedEmployeeNumber = selectedEmployeeId
    ? Number(selectedEmployeeId)
    : undefined;
  const projectSummaryById = useMemo(() => {
    const summaries = new Map<number, WeeklyProjectSummary>();
    weeklySummary?.projects.forEach((project) => {
      summaries.set(project.project_id, project);
    });
    return summaries;
  }, [weeklySummary]);
  const orderedProjects = useMemo(() => {
    return [...projects].sort((left, right) => {
      const leftSummary = projectSummaryById.get(left.id);
      const rightSummary = projectSummaryById.get(right.id);
      const leftRank =
        leftSummary?.allocation_status === "allocated"
          ? 0
          : leftSummary
            ? 1
            : 2;
      const rightRank =
        rightSummary?.allocation_status === "allocated"
          ? 0
          : rightSummary
            ? 1
            : 2;

      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.name.localeCompare(right.name);
    });
  }, [projectSummaryById, projects]);
  const activeAllocationProjectIds = useMemo(
    () =>
      new Set(
        activeAllocations?.assignments.map(
          (assignment) => assignment.project_id
        )
      ),
    [activeAllocations]
  );
  const allocatedProjectOptions = useMemo(
    () =>
      activeAllocations?.assignments.map((assignment) => ({
        id: assignment.project_id,
        name: assignment.project_name,
        allocation: assignment,
      })) ?? [],
    [activeAllocations]
  );
  const unallocatedProjectOptions = useMemo(
    () =>
      orderedProjects.filter(
        (project) => !activeAllocationProjectIds.has(project.id)
      ),
    [activeAllocationProjectIds, orderedProjects]
  );
  const selectedActiveAssignment = useMemo(
    () => activeAssignmentContext(activeAllocations, entryForm.project_id),
    [activeAllocations, entryForm.project_id]
  );
  const selectedEntryAllocationContext =
    calendarDialogTarget?.mode === "entry"
      ? calendarDialogTarget.entry.allocation_context
      : null;

  const loadProjects = useCallback(async () => {
    const response = await projectApi.list({
      page_size: 200,
      status: "active",
    });
    setProjects(response.results);
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!canViewOtherTimesheets) return;

    try {
      const response = await employeeApi.listEmployees({
        page_size: 200,
        is_active: true,
      });
      setEmployees(response.results);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load employees."));
    }
  }, [canViewOtherTimesheets]);

  const loadWeek = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await timeTrackingApi.listEntries({
        date_from: weekStart,
        date_to: addDays(weekStart, 6),
        employee: selectedEmployeeNumber,
      });
      setEntries(payload);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load weekly timesheet."));
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployeeNumber, weekStart]);

  const loadWeeklySummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const payload = await timeTrackingApi.getWeeklySummary({
        week_start: weekStart,
        employee_id: selectedEmployeeNumber,
      });
      setWeeklySummary(payload);
    } catch (loadError) {
      setWeeklySummary(null);
      setSummaryError(
        getErrorMessage(loadError, "Failed to load weekly allocation summary.")
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }, [selectedEmployeeNumber, weekStart]);

  const loadActiveAllocations = useCallback(async () => {
    if (!calendarDialogTarget) return;

    setIsActiveAllocationsLoading(true);
    setActiveAllocationsError(null);

    try {
      const payload = await timeTrackingApi.getActiveAllocations({
        work_date: entryForm.work_date,
        employee_id: selectedEmployeeNumber,
      });
      setActiveAllocations(payload);
    } catch (loadError) {
      setActiveAllocations(null);
      setActiveAllocationsError(
        getErrorMessage(loadError, "Failed to load active allocations.")
      );
    } finally {
      setIsActiveAllocationsLoading(false);
    }
  }, [calendarDialogTarget, entryForm.work_date, selectedEmployeeNumber]);

  const loadTasks = useCallback(async () => {
    try {
      setTasks(
        await timeTrackingApi.listTasks({
          search: taskSearch || undefined,
        })
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load time tasks."));
    }
  }, [taskSearch]);

  const loadApprovalQueue = useCallback(async () => {
    if (!canManageTime) return;

    try {
      setApprovalEntries(
        await timeTrackingApi.getApprovalQueue({
          date_from: approvalFilters.date_from,
          date_to: approvalFilters.date_to,
          employee: approvalFilters.employee
            ? Number(approvalFilters.employee)
            : undefined,
          project:
            approvalFilters.project !== "all"
              ? Number(approvalFilters.project)
              : undefined,
          source_type:
            approvalFilters.source_type !== "all"
              ? (approvalFilters.source_type as TimeEntrySourceType)
              : undefined,
          status:
            approvalFilters.status !== "all"
              ? (approvalFilters.status as TimeEntryStatus)
              : undefined,
        })
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load approval queue."));
    }
  }, [approvalFilters, canManageTime]);

  const loadJiraIntegration = useCallback(async () => {
    if (!canManageTime) return;

    setIsJiraLoading(true);
    setJiraError(null);
    try {
      const [settings, mappings] = await Promise.all([
        timeTrackingApi.getJiraSettings(),
        timeTrackingApi.getJiraMappings(),
      ]);
      setJiraSettings(settings);
      setJiraSettingsForm(jiraSettingsToForm(settings));
      setJiraDiscoveryForm((prev) => ({
        ...prev,
        base_url: settings.base_url || prev.base_url,
        auth_email: settings.auth_email || prev.auth_email,
      }));
      setJiraMappings(mappings);
    } catch (loadError) {
      setJiraError(
        getErrorMessage(loadError, "Failed to load Jira integration.")
      );
    } finally {
      setIsJiraLoading(false);
    }
  }, [canManageTime]);

  const loadTempoIntegration = useCallback(async () => {
    if (!canManageTime) return;
    setIsTempoLoading(true);
    setTempoError(null);
    try {
      const [settings, mappings] = await Promise.all([
        timeTrackingApi.getTempoSettings(),
        timeTrackingApi.getTempoMappings(),
      ]);
      setTempoSettings(settings);
      setTempoSettingsForm(tempoSettingsToForm(settings));
      setTempoDiscoveryForm((prev) => ({
        ...prev,
        base_url: settings.base_url || prev.base_url,
      }));
      setTempoMappings(mappings);
    } catch (loadError) {
      setTempoError(
        getErrorMessage(loadError, "Failed to load Tempo integration.")
      );
    } finally {
      setIsTempoLoading(false);
    }
  }, [canManageTime]);

  const loadReports = useCallback(async () => {
    setIsReportsLoading(true);
    setReportsError(null);
    setReportsMessage(null);
    try {
      const employeeId = reportFilters.employee_id
        ? Number(reportFilters.employee_id)
        : undefined;
      const projectId =
        reportFilters.project_id !== "all"
          ? Number(reportFilters.project_id)
          : undefined;
      const [dashboard, planned] = await Promise.all([
        timeTrackingApi.getWeeklyDashboard({
          week_start: reportFilters.week_start,
          employee_id: employeeId,
        }),
        timeTrackingApi.getPlannedVsActual({
          week_start: reportFilters.week_start,
          date_from: reportFilters.date_from || undefined,
          date_to: reportFilters.date_to || undefined,
          employee_id: employeeId,
          project_id: projectId,
        }),
      ]);
      setWeeklyDashboard(dashboard);
      setPlannedVsActual(planned);
    } catch (loadError) {
      setReportsError(getErrorMessage(loadError, "Failed to load reports."));
    } finally {
      setIsReportsLoading(false);
    }
  }, [reportFilters]);

  const loadObservability = useCallback(async () => {
    if (!canManageTime) return;
    setIsObservabilityLoading(true);
    setObservabilityError(null);
    setObservabilityMessage(null);
    try {
      const [batches, reviewEntries] = await Promise.all([
        timeTrackingApi.listImportBatches({
          source_type:
            importHistoryFilters.source_type !== "all"
              ? importHistoryFilters.source_type
              : undefined,
          status:
            importHistoryFilters.status !== "all"
              ? importHistoryFilters.status
              : undefined,
          uploaded_by: importHistoryFilters.uploaded_by
            ? Number(importHistoryFilters.uploaded_by)
            : undefined,
          date_from: importHistoryFilters.date_from || undefined,
          date_to: importHistoryFilters.date_to || undefined,
        }),
        timeTrackingApi.getSourceChangeReview({
          date_from: sourceReviewFilters.date_from || undefined,
          date_to: sourceReviewFilters.date_to || undefined,
          employee_id: sourceReviewFilters.employee_id
            ? Number(sourceReviewFilters.employee_id)
            : undefined,
          project_id:
            sourceReviewFilters.project_id !== "all"
              ? Number(sourceReviewFilters.project_id)
              : undefined,
          source_type:
            sourceReviewFilters.source_type !== "all"
              ? sourceReviewFilters.source_type
              : undefined,
          status:
            sourceReviewFilters.status !== "all"
              ? sourceReviewFilters.status
              : undefined,
        }),
      ]);
      setImportBatches(batches);
      setSourceReviewEntries(reviewEntries);
    } catch (loadError) {
      setObservabilityError(
        getErrorMessage(loadError, "Failed to load import review data.")
      );
    } finally {
      setIsObservabilityLoading(false);
    }
  }, [canManageTime, importHistoryFilters, sourceReviewFilters]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  useEffect(() => {
    void loadWeeklySummary();
  }, [loadWeeklySummary]);

  useEffect(() => {
    if (!calendarDialogTarget) {
      setActiveAllocations(null);
      setActiveAllocationsError(null);
      return;
    }
    void loadActiveAllocations();
  }, [calendarDialogTarget, loadActiveAllocations]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    void loadApprovalQueue();
  }, [loadApprovalQueue]);

  useEffect(() => {
    if (activeTab === "jira") void loadJiraIntegration();
  }, [activeTab, loadJiraIntegration]);

  useEffect(() => {
    if (activeTab === "tempo") void loadTempoIntegration();
  }, [activeTab, loadTempoIntegration]);

  useEffect(() => {
    if (activeTab === "reports") void loadReports();
  }, [activeTab, loadReports]);

  useEffect(() => {
    if (activeTab === "observability") void loadObservability();
  }, [activeTab, loadObservability]);

  useEffect(() => {
    setSelectedApprovalIds((current) =>
      current.filter((id) => approvalEntries.some((entry) => entry.id === id))
    );
  }, [approvalEntries]);

  useEffect(() => {
    setApprovalFilters((prev) => ({
      ...prev,
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
    }));
    setReportFilters((prev) => ({
      ...prev,
      week_start: weekStart,
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
    }));
    setSourceReviewFilters((prev) => ({
      ...prev,
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
    }));
    setJiraImportFilters((prev) => ({
      ...prev,
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
    }));
    setTempoImportFilters((prev) => ({
      ...prev,
      date_from: weekStart,
      date_to: addDays(weekStart, 6),
    }));
  }, [weekStart]);

  const timesheetWeekDays = useMemo(
    () =>
      weekDays.filter((day) => {
        const weekday = new Date(`${day}T00:00:00`).getDay();
        return weekday >= 1 && weekday <= 5;
      }),
    [weekDays]
  );

  const dayTotals = useMemo(
    () =>
      Object.fromEntries(
        timesheetWeekDays.map((day) => [
          day,
          entries
            .filter((entry) => entry.work_date === day)
            .reduce((sum, entry) => sum + Number(entry.hours || 0), 0),
        ])
      ),
    [entries, timesheetWeekDays]
  );

  const calendarSlots = useMemo(() => calendarTimeSlots(), []);

  const entriesByDay = useMemo(() => {
    const grouped = new Map<string, TimeEntry[]>(
      timesheetWeekDays.map((day) => [day, []])
    );
    entries.forEach((entry) => {
      grouped.get(entry.work_date)?.push(entry);
    });
    return grouped;
  }, [entries, timesheetWeekDays]);

  const timesheetTotal = useMemo(
    () =>
      timesheetWeekDays.reduce(
        (sum, day) => sum + Number(dayTotals[day] || 0),
        0
      ),
    [dayTotals, timesheetWeekDays]
  );

  const isCalendarTargetEditable =
    calendarDialogTarget?.mode === "create" ||
    (calendarDialogTarget?.mode === "entry" &&
      canEditGridEntry(calendarDialogTarget.entry));
  const canDeleteCalendarTarget =
    calendarDialogTarget?.mode === "entry" &&
    canDeleteGridEntry(calendarDialogTarget.entry);

  const openCalendarSlot = (date: string, startTime: string) => {
    setEntryForm({
      project_id: "",
      task_id: "none",
      work_date: date,
      hours: "1.00",
      notes: "",
    });
    setCalendarDialogTarget({ mode: "create", date, startTime });
  };

  const openCalendarEntry = (
    entry: TimeEntry,
    startTime: string,
    event?: { stopPropagation: () => void }
  ) => {
    event?.stopPropagation();
    setEntryForm({
      id: entry.id,
      project_id: String(entry.project_id),
      task_id: entry.task_id ? String(entry.task_id) : "none",
      work_date: entry.work_date,
      hours: decimalHours(entry.hours),
      notes: entry.notes || "",
    });
    setCalendarDialogTarget({
      mode: "entry",
      entry,
      date: entry.work_date,
      startTime,
    });
  };

  const saveCalendarEntry = async () => {
    if (!calendarDialogTarget) return;
    if (!entryForm.project_id) {
      setError("Project is required.");
      return;
    }

    const trimmedHours = entryForm.hours.trim();
    const parsedHours = trimmedHours ? Number(trimmedHours) : 0;
    if (
      !Number.isFinite(parsedHours) ||
      parsedHours < 0.25 ||
      parsedHours > 24
    ) {
      setError("Duration must be between 0.25 and 24 hours.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      const taskId =
        entryForm.task_id && entryForm.task_id !== "none"
          ? Number(entryForm.task_id)
          : null;
      const payload = {
        project_id: Number(entryForm.project_id),
        task_id: taskId,
        work_date: entryForm.work_date,
        start_time: persistableStartTime(calendarDialogTarget.startTime),
        hours: decimalHours(String(parsedHours)),
        notes: entryForm.notes,
        employee_id: selectedEmployeeNumber,
      };
      const saved =
        calendarDialogTarget.mode === "entry"
          ? await timeTrackingApi.updateEntry(
              calendarDialogTarget.entry.id,
              payload
            )
          : await timeTrackingApi.createEntry(payload);

      setEntryStartTimes((current) => ({
        ...current,
        [saved.id]: calendarDialogTarget.startTime,
      }));

      if (saved.duplicate_of !== null) {
        setDuplicateWarning(
          `Possible duplicate of entry #${saved.duplicate_of}.`
        );
      }

      setCalendarDialogTarget(null);
      await loadWeek();
      await loadWeeklySummary();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save time entry."));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCalendarEntry = async () => {
    if (calendarDialogTarget?.mode !== "entry") return;
    if (!canDeleteGridEntry(calendarDialogTarget.entry)) return;

    setIsSaving(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      await timeTrackingApi.deleteEntry(calendarDialogTarget.entry.id);
      setEntryStartTimes((current) => {
        const next = { ...current };
        delete next[calendarDialogTarget.entry.id];
        return next;
      });
      setCalendarDialogTarget(null);
      await loadWeek();
      await loadWeeklySummary();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to delete time entry."));
    } finally {
      setIsSaving(false);
    }
  };

  const submitWeek = async () => {
    setError(null);

    try {
      const updated = await timeTrackingApi.submitWeek({
        week_start: weekStart,
        employee_id: selectedEmployeeNumber,
      });
      setEntries(updated);
      await loadWeek();
      await loadWeeklySummary();
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Failed to submit week."));
    }
  };

  const saveTask = async () => {
    if (!taskForm.project_id || !taskForm.name.trim()) {
      setError("Project and task name are required.");
      return;
    }

    const payload = {
      project_id: Number(taskForm.project_id),
      name: taskForm.name.trim(),
      description: taskForm.description,
      jira_issue_key: taskForm.jira_issue_key,
      jira_project_key: taskForm.jira_project_key,
      is_active: taskForm.is_active,
    };

    try {
      if (taskForm.id) {
        await timeTrackingApi.updateTask(taskForm.id, payload);
      } else {
        await timeTrackingApi.createTask(payload);
      }
      setTaskForm(EMPTY_TASK_FORM);
      await loadTasks();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save task."));
    }
  };

  const editTask = (task: TimeTask) => {
    setTaskForm({
      id: task.id,
      project_id: String(task.project_id),
      name: task.name,
      description: task.description || "",
      jira_issue_key: task.jira_issue_key || "",
      jira_project_key: task.jira_project_key || "",
      is_active: task.is_active,
    });
  };

  const deleteTask = async (task: TimeTask) => {
    try {
      await timeTrackingApi.deleteTask(task.id);
      await loadTasks();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Failed to delete task."));
    }
  };

  const approveEntry = async (entry: TimeEntry) => {
    setIsApprovalActionLoading(true);
    try {
      await timeTrackingApi.approveEntry(entry.id);
      await loadApprovalQueue();
      await loadWeek();
      await loadWeeklySummary();
    } catch (approveError) {
      setError(getErrorMessage(approveError, "Failed to approve entry."));
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  const approveSelectedEntries = async () => {
    if (selectedApprovalIds.length === 0) {
      setError("Select at least one entry.");
      return;
    }

    setIsApprovalActionLoading(true);
    setError(null);

    try {
      for (const id of selectedApprovalIds) {
        await timeTrackingApi.approveEntry(id);
      }
      setSelectedApprovalIds([]);
      await loadApprovalQueue();
      await loadWeek();
      await loadWeeklySummary();
    } catch (approveError) {
      setError(
        getErrorMessage(approveError, "Failed to bulk approve entries.")
      );
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  const rejectEntry = async () => {
    const ids = rejectTarget ? [rejectTarget.id] : selectedApprovalIds;

    if (ids.length === 0) {
      setError("Select at least one entry.");
      return;
    }

    if (!rejectReason.trim()) {
      setError("Reject reason is required.");
      return;
    }

    setIsApprovalActionLoading(true);
    setError(null);

    try {
      for (const id of ids) {
        await timeTrackingApi.rejectEntry(id, rejectReason.trim());
      }
      setRejectTarget(null);
      setIsBulkRejectOpen(false);
      setSelectedApprovalIds([]);
      setRejectReason("");
      await loadApprovalQueue();
      await loadWeek();
      await loadWeeklySummary();
    } catch (rejectError) {
      setError(getErrorMessage(rejectError, "Failed to reject entry."));
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  const saveJiraSettings = async () => {
    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const payload = {
        base_url: jiraSettingsForm.base_url.trim(),
        auth_email: jiraSettingsForm.auth_email.trim(),
        enabled: jiraSettingsForm.enabled,
        ...(jiraSettingsForm.api_token.trim()
          ? { api_token: jiraSettingsForm.api_token.trim() }
          : {}),
      };
      const settings = await timeTrackingApi.updateJiraSettings(payload);
      setJiraSettings(settings);
      setJiraSettingsForm(jiraSettingsToForm(settings));
      setJiraMessage("Jira settings saved.");
    } catch (saveError) {
      setJiraError(getErrorMessage(saveError, "Failed to save Jira settings."));
    } finally {
      setIsJiraSaving(false);
    }
  };

  const testJiraConnection = async () => {
    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const savedSettings = await timeTrackingApi.updateJiraSettings({
        base_url: jiraSettingsForm.base_url.trim(),
        auth_email: jiraSettingsForm.auth_email.trim(),
        ...(jiraSettingsForm.api_token.trim()
          ? { api_token: jiraSettingsForm.api_token.trim() }
          : {}),
        enabled: jiraSettingsForm.enabled,
      });
      setJiraSettings(savedSettings);
      setJiraSettingsForm(jiraSettingsToForm(savedSettings));

      const settings = await timeTrackingApi.testJiraConnection();
      setJiraSettings(settings);
      setJiraSettingsForm(jiraSettingsToForm(settings));
      setJiraMessage(settings.last_test_message || "Jira connection tested.");
    } catch (testError) {
      setJiraError(
        getErrorMessage(testError, "Failed to test Jira connection.")
      );
      await loadJiraIntegration();
    } finally {
      setIsJiraSaving(false);
    }
  };

  const saveJiraUserMapping = async () => {
    if (!jiraUserForm.jira_account_id.trim() || !jiraUserForm.employee_id) {
      setJiraError("Jira account ID and employee are required.");
      return;
    }

    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const payload = {
        mapping_type: "user" as const,
        id: jiraUserForm.id,
        jira_account_id: jiraUserForm.jira_account_id.trim(),
        jira_display_name: jiraUserForm.jira_display_name.trim(),
        employee_id: Number(jiraUserForm.employee_id),
        is_active: jiraUserForm.is_active,
      };
      if (jiraUserForm.id) {
        await timeTrackingApi.updateJiraMapping(payload);
      } else {
        await timeTrackingApi.createJiraMapping(payload);
      }
      const mappings = await timeTrackingApi.getJiraMappings();
      setJiraMappings(mappings);
      setJiraUserForm(EMPTY_JIRA_USER_MAPPING_FORM);
      setJiraMessage("User mapping saved.");
    } catch (saveError) {
      setJiraError(getErrorMessage(saveError, "Failed to save user mapping."));
    } finally {
      setIsJiraSaving(false);
    }
  };

  const saveJiraProjectMapping = async () => {
    if (
      !jiraProjectForm.jira_project_key.trim() ||
      !jiraProjectForm.project_id
    ) {
      setJiraError("Jira project key and BloomHub project are required.");
      return;
    }

    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const payload = {
        mapping_type: "project" as const,
        id: jiraProjectForm.id,
        jira_project_key: jiraProjectForm.jira_project_key.trim(),
        jira_project_name: jiraProjectForm.jira_project_name.trim(),
        project_id: Number(jiraProjectForm.project_id),
        is_active: jiraProjectForm.is_active,
      };
      if (jiraProjectForm.id) {
        await timeTrackingApi.updateJiraMapping(payload);
      } else {
        await timeTrackingApi.createJiraMapping(payload);
      }
      const mappings = await timeTrackingApi.getJiraMappings();
      setJiraMappings(mappings);
      setJiraProjectForm(EMPTY_JIRA_PROJECT_MAPPING_FORM);
      setJiraMessage("Project mapping saved.");
    } catch (saveError) {
      setJiraError(
        getErrorMessage(saveError, "Failed to save project mapping.")
      );
    } finally {
      setIsJiraSaving(false);
    }
  };

  const saveJiraIssueMapping = async () => {
    if (!jiraIssueForm.jira_issue_key.trim() || !jiraIssueForm.task_id) {
      setJiraError("Jira issue key and BloomHub task are required.");
      return;
    }

    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const payload = {
        mapping_type: "issue" as const,
        id: jiraIssueForm.id,
        jira_issue_key: jiraIssueForm.jira_issue_key.trim(),
        jira_issue_id: jiraIssueForm.jira_issue_id.trim(),
        task_id: Number(jiraIssueForm.task_id),
        is_active: jiraIssueForm.is_active,
      };
      if (jiraIssueForm.id) {
        await timeTrackingApi.updateJiraMapping(payload);
      } else {
        await timeTrackingApi.createJiraMapping(payload);
      }
      const mappings = await timeTrackingApi.getJiraMappings();
      setJiraMappings(mappings);
      setJiraIssueForm(EMPTY_JIRA_ISSUE_MAPPING_FORM);
      setJiraMessage("Issue mapping saved.");
    } catch (saveError) {
      setJiraError(getErrorMessage(saveError, "Failed to save issue mapping."));
    } finally {
      setIsJiraSaving(false);
    }
  };

  const discoverJiraProjects = async () => {
    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const discovery = await timeTrackingApi.discoverJiraProjects(
        jiraDiscoveryPayload(jiraDiscoveryForm)
      );
      setJiraDiscovery(discovery);
      setJiraMessage(
        `Discovery loaded with ${
          discovery.users.length +
          discovery.projects.length +
          discovery.issues.length
        } rows.`
      );
    } catch (discoveryError) {
      setJiraError(
        getErrorMessage(discoveryError, "Failed to discover Jira projects.")
      );
    } finally {
      setIsJiraSaving(false);
    }
  };

  const saveJiraDiscoveryMapping = async (
    type: "user" | "project" | "issue",
    row: JiraProjectDiscoveryRow,
    targetId: number
  ) => {
    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const payload = jiraDiscoveryMappingPayload(type, row, targetId);
      if (payload.id) {
        await timeTrackingApi.updateJiraMapping(payload);
      } else {
        await timeTrackingApi.createJiraMapping(payload);
      }
      setJiraMappings(await timeTrackingApi.getJiraMappings());
      setJiraMessage("Jira mapping created or updated.");
    } catch (saveError) {
      setJiraError(
        getErrorMessage(saveError, "Failed to save Jira discovery mapping.")
      );
    } finally {
      setIsJiraSaving(false);
    }
  };

  const previewJiraImport = async () => {
    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);
    setJiraCommitResult(null);

    try {
      const preview = await timeTrackingApi.previewJiraImport(
        jiraImportFiltersPayload(jiraImportFilters)
      );
      setJiraPreview(preview);
      setJiraMessage(`Preview loaded with ${preview.row_count} rows.`);
    } catch (previewError) {
      setJiraError(
        getErrorMessage(previewError, "Failed to preview Jira import.")
      );
    } finally {
      setIsJiraSaving(false);
    }
  };

  const commitJiraImport = async () => {
    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const result = await timeTrackingApi.commitJiraImport(
        jiraImportFiltersPayload(jiraImportFilters)
      );
      setJiraCommitResult(result);
      setJiraPreview(result.preview);
      setJiraMessage("Jira import committed.");
      await loadWeek();
      await loadWeeklySummary();
      await loadApprovalQueue();
    } catch (commitError) {
      setJiraError(
        getErrorMessage(commitError, "Failed to commit Jira import.")
      );
    } finally {
      setIsJiraSaving(false);
    }
  };

  const saveTempoSettings = async () => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    try {
      const settings = await timeTrackingApi.updateTempoSettings({
        base_url: tempoSettingsForm.base_url.trim(),
        enabled: tempoSettingsForm.enabled,
        ...(tempoSettingsForm.api_token.trim()
          ? { api_token: tempoSettingsForm.api_token.trim() }
          : {}),
      });
      setTempoSettings(settings);
      setTempoSettingsForm(tempoSettingsToForm(settings));
      setTempoMessage("Tempo settings saved.");
    } catch (saveError) {
      setTempoError(
        getErrorMessage(saveError, "Failed to save Tempo settings.")
      );
    } finally {
      setIsTempoSaving(false);
    }
  };

  const testTempoConnection = async () => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    try {
      const settings = await timeTrackingApi.testTempoConnection({
        base_url: tempoSettingsForm.base_url.trim(),
        ...(tempoSettingsForm.api_token.trim()
          ? { api_token: tempoSettingsForm.api_token.trim() }
          : {}),
        enabled: tempoSettingsForm.enabled,
      });
      setTempoSettings(settings);
      setTempoSettingsForm(tempoSettingsToForm(settings));
      setTempoMessage(settings.last_test_message || "Tempo connection tested.");
    } catch (testError) {
      setTempoError(
        getErrorMessage(testError, "Failed to test Tempo connection.")
      );
      await loadTempoIntegration();
    } finally {
      setIsTempoSaving(false);
    }
  };

  const saveTempoMapping = async () => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    try {
      const basePayload = {
        id: tempoMappingForm.id,
        is_active: tempoMappingForm.is_active,
      };
      const payload =
        tempoMappingForm.mapping_type === "user"
          ? {
              ...basePayload,
              mapping_type: "user" as const,
              tempo_user_id: tempoMappingForm.tempo_user_id.trim(),
              tempo_display_name: tempoMappingForm.tempo_display_name.trim(),
              employee_id: tempoMappingForm.employee_id
                ? Number(tempoMappingForm.employee_id)
                : undefined,
            }
          : tempoMappingForm.mapping_type === "account"
            ? {
                ...basePayload,
                mapping_type: "account" as const,
                tempo_account_id: tempoMappingForm.tempo_account_id.trim(),
                tempo_account_key: tempoMappingForm.tempo_account_key.trim(),
                tempo_account_name: tempoMappingForm.tempo_account_name.trim(),
                project_id: tempoMappingForm.project_id
                  ? Number(tempoMappingForm.project_id)
                  : undefined,
              }
            : tempoMappingForm.mapping_type === "project"
              ? {
                  ...basePayload,
                  mapping_type: "project" as const,
                  tempo_project_id: tempoMappingForm.tempo_project_id.trim(),
                  tempo_project_key: tempoMappingForm.tempo_project_key.trim(),
                  tempo_project_name:
                    tempoMappingForm.tempo_project_name.trim(),
                  project_id: tempoMappingForm.project_id
                    ? Number(tempoMappingForm.project_id)
                    : undefined,
                }
              : {
                  ...basePayload,
                  mapping_type: "team" as const,
                  tempo_team_id: tempoMappingForm.tempo_team_id.trim(),
                  tempo_team_name: tempoMappingForm.tempo_team_name.trim(),
                  project_id: tempoMappingForm.project_id
                    ? Number(tempoMappingForm.project_id)
                    : undefined,
                };

      if (tempoMappingForm.id) {
        await timeTrackingApi.updateTempoMapping(payload);
      } else {
        await timeTrackingApi.createTempoMapping(payload);
      }
      setTempoMappings(await timeTrackingApi.getTempoMappings());
      setTempoMappingForm(EMPTY_TEMPO_MAPPING_FORM);
      setTempoMessage("Tempo mapping saved.");
    } catch (saveError) {
      setTempoError(
        getErrorMessage(saveError, "Failed to save Tempo mapping.")
      );
    } finally {
      setIsTempoSaving(false);
    }
  };

  const discoverTempoProjects = async () => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    try {
      const discovery = await timeTrackingApi.discoverTempoProjects(
        tempoDiscoveryPayload(tempoDiscoveryForm)
      );
      setTempoDiscovery(discovery);
      setTempoMessage(
        `Discovery loaded with ${
          discovery.accounts.length +
          discovery.projects.length +
          discovery.teams.length
        } rows.`
      );
    } catch (discoveryError) {
      setTempoError(
        getErrorMessage(discoveryError, "Failed to discover Tempo projects.")
      );
    } finally {
      setIsTempoSaving(false);
    }
  };

  const saveTempoDiscoveryMapping = async (
    type: "account" | "project" | "team",
    row: TempoProjectDiscoveryRow,
    projectId: number
  ) => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    try {
      const payload = tempoDiscoveryMappingPayload(type, row, projectId);
      await timeTrackingApi.createTempoMapping(payload);
      setTempoMappings(await timeTrackingApi.getTempoMappings());
      setTempoMessage("Tempo mapping created or updated.");
    } catch (saveError) {
      setTempoError(
        getErrorMessage(saveError, "Failed to save Tempo discovery mapping.")
      );
    } finally {
      setIsTempoSaving(false);
    }
  };

  const runJiraAssignedIssuesImport = async (dryRun: boolean) => {
    if (!jiraAssignedIssuesForm.employee_id) {
      setJiraError("Employee is required.");
      return;
    }

    const maxResults = Number(jiraAssignedIssuesForm.max_results);
    if (!Number.isFinite(maxResults) || maxResults < 1 || maxResults > 1000) {
      setJiraError("Max results must be between 1 and 1000.");
      return;
    }

    setIsJiraSaving(true);
    setJiraError(null);
    setJiraMessage(null);

    try {
      const result = await timeTrackingApi.importJiraAssignedIssues(
        jiraAssignedIssuesPayload(jiraAssignedIssuesForm, dryRun)
      );
      setJiraAssignedIssuesResult(result);
      setJiraMessage(
        dryRun
          ? `Dry run loaded with ${result.row_count} assigned issues.`
          : `Imported ${result.row_count} assigned issues.`
      );
      if (!dryRun) {
        await loadJiraIntegration();
        await loadProjects();
        await loadTasks();
      }
    } catch (importError) {
      setJiraError(
        getErrorMessage(importError, "Failed to import assigned Jira issues.")
      );
    } finally {
      setIsJiraSaving(false);
    }
  };

  const previewTempoImport = async () => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    setTempoCommitResult(null);
    try {
      const preview = await timeTrackingApi.previewTempoImport(
        tempoImportFiltersPayload(tempoImportFilters)
      );
      setTempoPreview(preview);
      setTempoMessage(`Preview loaded with ${preview.row_count} rows.`);
    } catch (previewError) {
      setTempoError(
        getErrorMessage(previewError, "Failed to preview Tempo import.")
      );
    } finally {
      setIsTempoSaving(false);
    }
  };

  const commitTempoImport = async () => {
    setIsTempoSaving(true);
    setTempoError(null);
    setTempoMessage(null);
    try {
      const result = await timeTrackingApi.commitTempoImport(
        tempoImportFiltersPayload(tempoImportFilters)
      );
      setTempoCommitResult(result);
      setTempoPreview(result.preview);
      setTempoMessage("Tempo import committed.");
      await loadWeek();
      await loadWeeklySummary();
      await loadApprovalQueue();
    } catch (commitError) {
      setTempoError(
        getErrorMessage(commitError, "Failed to commit Tempo import.")
      );
    } finally {
      setIsTempoSaving(false);
    }
  };

  const uploadDocumentImport = async (file: File) => {
    setIsDocumentSaving(true);
    setDocumentError(null);
    setDocumentMessage(null);
    try {
      const batch = await timeTrackingApi.uploadDocumentImport(file);
      setDocumentBatch(batch);
      setDocumentMappingForm(documentMappingFromBatch(batch));
      setDocumentMessage(`Uploaded ${batch.file_name}.`);
    } catch (uploadError) {
      setDocumentError(
        getErrorMessage(uploadError, "Failed to upload document.")
      );
    } finally {
      setIsDocumentSaving(false);
    }
  };

  const saveDocumentMapping = async (batchId: number, showMessage: boolean) => {
    const missingFields = missingRequiredDocumentFields(documentMappingForm);
    if (missingFields.length > 0) {
      throw new Error(
        `Map required columns before continuing: ${missingFields.join(", ")}.`
      );
    }
    const batch = await timeTrackingApi.mapDocumentColumns(
      batchId,
      documentMappingPayload(documentMappingForm)
    );
    setDocumentBatch(batch);
    setDocumentMappingForm(documentMappingFromBatch(batch));
    if (showMessage) {
      setDocumentMessage("Column mapping saved.");
    }
    return batch;
  };

  const mapDocumentColumns = async () => {
    if (!documentBatch) return;
    setIsDocumentSaving(true);
    setDocumentError(null);
    setDocumentMessage(null);
    try {
      await saveDocumentMapping(documentBatch.id, true);
    } catch (mapError) {
      setDocumentError(
        getErrorMessage(mapError, "Failed to map document columns.")
      );
    } finally {
      setIsDocumentSaving(false);
    }
  };

  const previewDocumentImport = async () => {
    if (!documentBatch) return;
    setIsDocumentSaving(true);
    setDocumentError(null);
    setDocumentMessage(null);
    try {
      const mappedBatch = await saveDocumentMapping(documentBatch.id, false);
      const batch = await timeTrackingApi.previewDocumentImport(mappedBatch.id);
      setDocumentBatch(batch);
      setDocumentMappingForm(documentMappingFromBatch(batch));
      setDocumentMessage("Document preview refreshed.");
    } catch (previewError) {
      setDocumentError(
        getErrorMessage(previewError, "Failed to preview document import.")
      );
    } finally {
      setIsDocumentSaving(false);
    }
  };

  const commitDocumentImport = async () => {
    if (!documentBatch) return;
    setIsDocumentSaving(true);
    setDocumentError(null);
    setDocumentMessage(null);
    try {
      const mappedBatch = await saveDocumentMapping(documentBatch.id, false);
      const batch = await timeTrackingApi.commitDocumentImport(mappedBatch.id);
      setDocumentBatch(batch);
      setDocumentMappingForm(documentMappingFromBatch(batch));
      setDocumentMessage(
        `Committed ${batch.committed_rows} rows. ${batch.skipped_rows} skipped, ${batch.error_rows} errors.`
      );
      await loadWeek();
      await loadWeeklySummary();
      await loadApprovalQueue();
    } catch (commitError) {
      setDocumentError(
        getErrorMessage(commitError, "Failed to commit document import.")
      );
    } finally {
      setIsDocumentSaving(false);
    }
  };

  const exportTimesheets = async () => {
    setIsReportsLoading(true);
    setReportsError(null);
    setReportsMessage(null);
    try {
      const filters: TimesheetExportFilters = {
        format: reportFilters.export_format,
        date_from: reportFilters.date_from || undefined,
        date_to: reportFilters.date_to || undefined,
        employee: reportFilters.employee_id
          ? Number(reportFilters.employee_id)
          : undefined,
        project:
          reportFilters.project_id !== "all"
            ? Number(reportFilters.project_id)
            : undefined,
        source_type:
          reportFilters.source_type !== "all"
            ? reportFilters.source_type
            : undefined,
        status:
          reportFilters.status !== "all" ? reportFilters.status : undefined,
      };
      const result = await timeTrackingApi.exportTimesheets(filters);
      downloadBlob(result.blob, result.filename);
      setReportsMessage(`Export downloaded: ${result.filename}`);
    } catch (exportError) {
      setReportsError(
        getErrorMessage(exportError, "Failed to export timesheets.")
      );
    } finally {
      setIsReportsLoading(false);
    }
  };

  const openImportBatch = async (batchId: number) => {
    setIsObservabilityLoading(true);
    setObservabilityError(null);
    setSelectedImportRow(null);
    try {
      setSelectedImportBatch(await timeTrackingApi.getImportBatch(batchId));
    } catch (detailError) {
      setObservabilityError(
        getErrorMessage(detailError, "Failed to load import batch.")
      );
    } finally {
      setIsObservabilityLoading(false);
    }
  };

  const resolveSourceChange = async (
    action: "accept_current" | "apply_source" | "leave_flagged"
  ) => {
    if (!selectedSourceReviewEntry) return;
    if (
      action === "apply_source" &&
      selectedSourceReviewEntry.status === "approved"
    ) {
      setObservabilityError("Approved entries cannot apply source updates.");
      return;
    }
    setIsObservabilityLoading(true);
    setObservabilityError(null);
    setObservabilityMessage(null);
    try {
      const updated = await timeTrackingApi.resolveSourceChange(
        selectedSourceReviewEntry.id,
        { action, note: sourceReviewNote.trim() || undefined }
      );
      setSelectedSourceReviewEntry(updated);
      setSourceReviewNote("");
      setObservabilityMessage("Source change resolved.");
      await loadObservability();
      await loadWeek();
      await loadWeeklySummary();
    } catch (resolveError) {
      setObservabilityError(
        getErrorMessage(resolveError, "Failed to resolve source change.")
      );
    } finally {
      setIsObservabilityLoading(false);
    }
  };

  return (
    <div className="-m-4 min-h-screen bg-[#f7f7f6] p-4 sm:-m-6 sm:p-6">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.025em] text-gray-950">
                Time Tracking
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Log work, review imported Jira and Tempo time, and approve
                weekly submissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canViewOtherTimesheets && (
                <Select
                  value={selectedEmployeeId || "own"}
                  onValueChange={(value) =>
                    setSelectedEmployeeId(value === "own" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-9 w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">My timesheet</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employeeDisplayName(employee)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-gray-300 bg-white text-gray-800"
                onClick={() => {
                  const previous = new Date(`${weekStart}T00:00:00`);
                  previous.setDate(previous.getDate() - 7);
                  setWeekStart(isoDate(previous));
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-gray-300 bg-white text-gray-800"
                onClick={() => {
                  const next = new Date(`${weekStart}T00:00:00`);
                  next.setDate(next.getDate() + 7);
                  setWeekStart(isoDate(next));
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                className="h-9 rounded-lg bg-gray-950 text-white hover:bg-black"
                onClick={submitWeek}
              >
                Submit week
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <SummaryCard
              icon={Clock}
              label="Planned"
              value={`${decimalHours(weeklySummary?.planned_hours ?? "0")}h`}
              detail={
                weeklySummary
                  ? `${weeklySummary.employee_name} · ${weeklySummary.week_start} to ${weeklySummary.week_end}`
                  : formatWeekRange(weekStart)
              }
            />
            <SummaryCard
              icon={Calendar}
              label="Actual"
              value={`${decimalHours(
                weeklySummary?.actual_hours ?? String(weeklyTotal)
              )}h`}
              detail={`${entries.length} entries loaded`}
            />
            <SummaryCard
              icon={CheckCircle}
              label="Remaining"
              value={`${decimalHours(
                weeklySummary?.remaining_capacity_hours ?? "0"
              )}h`}
              detail={`${decimalHours(
                weeklySummary?.weekly_capacity_hours ?? "40"
              )}h weekly capacity`}
            />
            <SummaryCard
              icon={AlertCircle}
              label="Unallocated"
              value={`${decimalHours(
                weeklySummary?.unallocated_capacity_hours ?? "0"
              )}h`}
              detail="Capacity without allocation"
            />
            <SummaryCard
              icon={CheckCircle}
              label="Submitted"
              value={String(
                entries.filter((entry) => entry.status === "submitted").length
              )}
              detail="Awaiting approval"
            />
          </div>

          <WeekStrip
            weekStart={weekStart}
            weekDays={timesheetWeekDays}
            dayTotals={dayTotals}
            onPrevious={() => {
              const previous = new Date(`${weekStart}T00:00:00`);
              previous.setDate(previous.getDate() - 7);
              setWeekStart(isoDate(previous));
            }}
            onNext={() => {
              const next = new Date(`${weekStart}T00:00:00`);
              next.setDate(next.getDate() + 7);
              setWeekStart(isoDate(next));
            }}
            onToday={() => setWeekStart(getWeekStart(new Date()))}
            onPickWeek={(value) => setWeekStart(getWeekStart(new Date(value)))}
          />

          <WeeklySummaryPanel
            summary={weeklySummary}
            error={summaryError}
            isLoading={isSummaryLoading}
          />
        </div>

        {(error || duplicateWarning) && (
          <div className="space-y-2">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {duplicateWarning && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {duplicateWarning}
              </div>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className={`h-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm ${canManageTime ? "grid w-full grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8" : "grid w-full grid-cols-2 gap-1"}`}
          >
            <TabsTrigger className="rounded-lg" value="week">
              Weekly Timesheet
            </TabsTrigger>
            <TabsTrigger className="rounded-lg" value="reports">
              Reports
            </TabsTrigger>
            {canManageTime && (
              <TabsTrigger className="rounded-lg" value="tasks">
                Tasks
              </TabsTrigger>
            )}
            {canManageTime && (
              <TabsTrigger className="rounded-lg" value="jira">
                Jira
              </TabsTrigger>
            )}
            {canManageTime && (
              <TabsTrigger className="rounded-lg" value="tempo">
                Tempo
              </TabsTrigger>
            )}
            {canManageTime && (
              <TabsTrigger className="rounded-lg" value="documents">
                Documents
              </TabsTrigger>
            )}
            {canManageTime && (
              <TabsTrigger className="rounded-lg" value="observability">
                Imports
              </TabsTrigger>
            )}
            {canManageTime && (
              <TabsTrigger className="rounded-lg" value="approvals">
                Approvals
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="week" className="mt-4 space-y-4">
            <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-white px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-950">
                      Weekly Timesheet
                    </CardTitle>
                    <p className="mt-1 text-xs text-gray-500">
                      Click a time slot to add work. Imported entries stay
                      read-only, but draft imports can be deleted.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg border-gray-200 bg-white text-gray-800"
                      onClick={() => {
                        void loadWeek();
                        void loadWeeklySummary();
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button
                      variant="primary"
                      className="h-8 rounded-lg bg-gray-950 text-white hover:bg-black"
                      onClick={submitWeek}
                    >
                      Submit week
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <p className="p-5 text-sm text-gray-600">
                    Loading entries...
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[740px]">
                      <div className="grid grid-cols-[72px_repeat(5,minmax(140px,1fr))] border-b border-gray-200 bg-[#fafaf9]">
                        <div className="border-r border-gray-200 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                          Time
                        </div>
                        {timesheetWeekDays.map((day) => (
                          <div
                            key={day}
                            className="border-r border-gray-200 px-3 py-3 last:border-r-0"
                          >
                            <div className="text-[13px] font-semibold text-gray-950">
                              {new Date(`${day}T00:00:00`).toLocaleDateString(
                                "en-US",
                                { weekday: "short" }
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-gray-500">
                              {new Date(`${day}T00:00:00`).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </div>
                            <div className="mt-1 font-mono text-xs font-semibold text-gray-800">
                              {decimalHours(String(dayTotals[day] || 0))}h
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-[72px_repeat(5,minmax(140px,1fr))]">
                        <div className="border-r border-gray-200 bg-[#fafaf9]">
                          {calendarSlots.map((slot) => (
                            <div
                              key={slot}
                              className="border-b border-gray-200 px-2 pt-1 font-mono text-[10px] text-gray-500"
                              style={{ height: CALENDAR_SLOT_HEIGHT }}
                            >
                              {slot.endsWith(":00")
                                ? displayCalendarTime(slot)
                                : ""}
                            </div>
                          ))}
                        </div>
                        {timesheetWeekDays.map((day) => {
                          const dayEntries = entriesByDay.get(day) || [];
                          return (
                            <div
                              key={day}
                              className="relative border-r border-gray-200 bg-white last:border-r-0"
                            >
                              {calendarSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  aria-label={`${day} ${displayCalendarTime(
                                    slot
                                  )} slot`}
                                  className="block w-full border-b border-gray-100 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                  style={{ height: CALENDAR_SLOT_HEIGHT }}
                                  onClick={() => openCalendarSlot(day, slot)}
                                />
                              ))}
                              {dayEntries.map((entry, index) => {
                                const entryHours = Number(entry.hours || 0);
                                const startTime =
                                  entryStartTimes[entry.id] ||
                                  entryCalendarStartTime(entry) ||
                                  defaultEntryStartTime(index);
                                const top =
                                  (minutesFromCalendarStart(startTime) /
                                    CALENDAR_SLOT_MINUTES) *
                                  CALENDAR_SLOT_HEIGHT;
                                const height = Math.max(
                                  28,
                                  entryHours *
                                    (60 / CALENDAR_SLOT_MINUTES) *
                                    CALENDAR_SLOT_HEIGHT
                                );
                                const readOnly = !canEditGridEntry(entry);
                                const showStatusBadges =
                                  readOnly || entry.status === "rejected";
                                const allocationStatus =
                                  timeEntryAllocationStatus(entry);
                                const isCompact = entryHours <= 0.5;
                                const badges = showStatusBadges ? (
                                  <>
                                    {readOnly && (
                                      <SourceBadge source={entry.source_type} />
                                    )}
                                    <StatusBadge status={entry.status} />
                                  </>
                                ) : null;

                                return (
                                  <button
                                    key={entry.id}
                                    type="button"
                                    className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border py-1 pl-3 pr-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${calendarEventClass(
                                      entry,
                                      readOnly
                                    )}`}
                                    style={{ top, height }}
                                    onClick={(event) =>
                                      openCalendarEntry(entry, startTime, event)
                                    }
                                  >
                                    <span
                                      className={`absolute bottom-1 left-1 top-1 w-1 rounded-full ${sourceStripeClass(
                                        entry.source_type
                                      )}`}
                                    />
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate font-medium">
                                        {entry.project_name}
                                      </span>
                                      <span className="font-mono font-semibold">
                                        {entry.hours}h
                                      </span>
                                    </div>
                                    {isCompact ? (
                                      <div className="mt-0.5 flex min-w-0 items-center gap-1">
                                        <span className="min-w-0 flex-1 truncate">
                                          {entry.task_name || "No task"}
                                        </span>
                                        {showStatusBadges && (
                                          <span className="flex shrink-0 gap-1">
                                            {badges}
                                          </span>
                                        )}
                                        {allocationStatus && (
                                          <Badge
                                            variant="outline"
                                            className={allocationStatusClass(
                                              allocationStatus
                                            )}
                                          >
                                            {allocationStatus}
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <>
                                        <div className="truncate">
                                          {entry.task_name || "No task"}
                                        </div>
                                        {(showStatusBadges ||
                                          allocationStatus) && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {badges}
                                            {allocationStatus && (
                                              <Badge
                                                variant="outline"
                                                className={allocationStatusClass(
                                                  allocationStatus
                                                )}
                                              >
                                                {allocationStatus}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-200 bg-[#fafaf9] px-4 py-3 text-right font-mono text-sm font-semibold text-gray-950">
                        Week total {decimalHours(String(timesheetTotal))}h
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <TimeTrackingReportsPanel
              filters={reportFilters}
              setFilters={setReportFilters}
              dashboard={weeklyDashboard}
              planned={plannedVsActual}
              employees={employees}
              projects={projects}
              error={reportsError}
              message={reportsMessage}
              isLoading={isReportsLoading}
              canViewOtherTimesheets={Boolean(canViewOtherTimesheets)}
              onLoad={loadReports}
              onExport={exportTimesheets}
            />
          </TabsContent>

          {canManageTime && (
            <TabsContent value="tasks" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Project">
                      <Select
                        value={taskForm.project_id}
                        onValueChange={(value) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            project_id: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={String(project.id)}
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Name">
                      <Input
                        value={taskForm.name}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Active">
                      <div className="flex h-10 items-center gap-2">
                        <Checkbox
                          checked={taskForm.is_active}
                          onCheckedChange={(checked) =>
                            setTaskForm((prev) => ({
                              ...prev,
                              is_active: checked === true,
                            }))
                          }
                        />
                        <span className="text-sm">Available in selectors</span>
                      </div>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Jira Project Key">
                      <Input
                        value={taskForm.jira_project_key}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            jira_project_key: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Jira Issue Key">
                      <Input
                        value={taskForm.jira_issue_key}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            jira_issue_key: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Description">
                    <Textarea
                      rows={2}
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={saveTask}>
                      {taskForm.id ? "Update task" : "Create task"}
                    </Button>
                    {taskForm.id && (
                      <Button
                        variant="outline"
                        onClick={() => setTaskForm(EMPTY_TASK_FORM)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Tasks</CardTitle>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={taskSearch}
                        onChange={(event) => setTaskSearch(event.target.value)}
                        placeholder="Search tasks"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Jira</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <p className="font-medium">{task.name}</p>
                            <p className="text-xs text-gray-500">
                              {task.description || "No description"}
                            </p>
                          </TableCell>
                          <TableCell>{task.project_name}</TableCell>
                          <TableCell>
                            {[task.jira_project_key, task.jira_issue_key]
                              .filter(Boolean)
                              .join(" / ") || "--"}
                          </TableCell>
                          <TableCell>{task.is_active ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editTask(task)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => void deleteTask(task)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canManageTime && (
            <TabsContent value="observability" className="mt-4">
              <ImportObservabilityPanel
                importFilters={importHistoryFilters}
                setImportFilters={setImportHistoryFilters}
                batches={importBatches}
                selectedBatch={selectedImportBatch}
                selectedRow={selectedImportRow}
                setSelectedRow={setSelectedImportRow}
                reviewFilters={sourceReviewFilters}
                setReviewFilters={setSourceReviewFilters}
                reviewEntries={sourceReviewEntries}
                selectedEntry={selectedSourceReviewEntry}
                setSelectedEntry={setSelectedSourceReviewEntry}
                note={sourceReviewNote}
                setNote={setSourceReviewNote}
                employees={employees}
                projects={projects}
                error={observabilityError}
                message={observabilityMessage}
                isLoading={isObservabilityLoading}
                onLoad={loadObservability}
                onOpenBatch={openImportBatch}
                onResolve={resolveSourceChange}
              />
            </TabsContent>
          )}

          {canManageTime && (
            <TabsContent value="documents" className="mt-4">
              <DocumentImportPanel
                batch={documentBatch}
                mappingForm={documentMappingForm}
                setMappingForm={setDocumentMappingForm}
                error={documentError}
                message={documentMessage}
                isSaving={isDocumentSaving}
                onUpload={uploadDocumentImport}
                onMapColumns={mapDocumentColumns}
                onPreview={previewDocumentImport}
                onCommit={commitDocumentImport}
                onRefreshEntries={() => {
                  void loadWeek();
                  void loadWeeklySummary();
                }}
              />
            </TabsContent>
          )}

          {canManageTime && (
            <TabsContent value="tempo" className="mt-4">
              <TempoIntegrationPanel
                settings={tempoSettings}
                settingsForm={tempoSettingsForm}
                setSettingsForm={setTempoSettingsForm}
                mappings={tempoMappings}
                mappingForm={tempoMappingForm}
                setMappingForm={setTempoMappingForm}
                discoveryForm={tempoDiscoveryForm}
                setDiscoveryForm={setTempoDiscoveryForm}
                discovery={tempoDiscovery}
                importFilters={tempoImportFilters}
                setImportFilters={setTempoImportFilters}
                preview={tempoPreview}
                commitResult={tempoCommitResult}
                employees={employees}
                projects={projects}
                error={tempoError}
                message={tempoMessage}
                isLoading={isTempoLoading}
                isSaving={isTempoSaving}
                onSaveSettings={saveTempoSettings}
                onTestConnection={testTempoConnection}
                onSaveMapping={saveTempoMapping}
                onDiscover={discoverTempoProjects}
                onSaveDiscoveryMapping={saveTempoDiscoveryMapping}
                onPreview={previewTempoImport}
                onCommit={commitTempoImport}
                onRefresh={() => void loadTempoIntegration()}
                onRefreshEntries={() => {
                  void loadWeek();
                  void loadWeeklySummary();
                }}
              />
            </TabsContent>
          )}

          {canManageTime && (
            <TabsContent value="jira" className="mt-4">
              <JiraIntegrationPanel
                settings={jiraSettings}
                settingsForm={jiraSettingsForm}
                setSettingsForm={setJiraSettingsForm}
                mappings={jiraMappings}
                userForm={jiraUserForm}
                setUserForm={setJiraUserForm}
                projectForm={jiraProjectForm}
                setProjectForm={setJiraProjectForm}
                issueForm={jiraIssueForm}
                setIssueForm={setJiraIssueForm}
                discoveryForm={jiraDiscoveryForm}
                setDiscoveryForm={setJiraDiscoveryForm}
                discovery={jiraDiscovery}
                importFilters={jiraImportFilters}
                setImportFilters={setJiraImportFilters}
                preview={jiraPreview}
                commitResult={jiraCommitResult}
                assignedIssuesForm={jiraAssignedIssuesForm}
                setAssignedIssuesForm={setJiraAssignedIssuesForm}
                assignedIssuesResult={jiraAssignedIssuesResult}
                employees={employees}
                projects={projects}
                tasks={tasks}
                error={jiraError}
                message={jiraMessage}
                isLoading={isJiraLoading}
                isSaving={isJiraSaving}
                onSaveSettings={saveJiraSettings}
                onTestConnection={testJiraConnection}
                onSaveUserMapping={saveJiraUserMapping}
                onSaveProjectMapping={saveJiraProjectMapping}
                onSaveIssueMapping={saveJiraIssueMapping}
                onDiscover={discoverJiraProjects}
                onSaveDiscoveryMapping={saveJiraDiscoveryMapping}
                onPreview={previewJiraImport}
                onCommit={commitJiraImport}
                onRunAssignedIssuesImport={runJiraAssignedIssuesImport}
                onRefresh={() => void loadJiraIntegration()}
                onRefreshEntries={() => {
                  void loadWeek();
                  void loadWeeklySummary();
                }}
              />
            </TabsContent>
          )}

          {canManageTime && (
            <TabsContent value="approvals" className="mt-4 space-y-4">
              <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm">
                <CardHeader className="border-b border-gray-200 bg-white px-5 py-4">
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-950">
                      Approval Queue
                    </CardTitle>
                    <p className="mt-1 text-xs text-gray-500">
                      Review submitted timesheets and resolve source quality
                      issues before approval.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                    <Field label="From">
                      <DatePicker
                        mode="single"
                        value={approvalFilters.date_from}
                        onChange={(value) =>
                          setApprovalFilters((prev) => ({
                            ...prev,
                            date_from: value,
                          }))
                        }
                        placeholder="From date"
                      />
                    </Field>
                    <Field label="To">
                      <DatePicker
                        mode="single"
                        value={approvalFilters.date_to}
                        onChange={(value) =>
                          setApprovalFilters((prev) => ({
                            ...prev,
                            date_to: value,
                          }))
                        }
                        placeholder="To date"
                      />
                    </Field>
                    <Field label="Employee ID">
                      <Input
                        value={approvalFilters.employee}
                        onChange={(event) =>
                          setApprovalFilters((prev) => ({
                            ...prev,
                            employee: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Project">
                      <Select
                        value={approvalFilters.project}
                        onValueChange={(value) =>
                          setApprovalFilters((prev) => ({
                            ...prev,
                            project: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All projects</SelectItem>
                          {projects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={String(project.id)}
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Source">
                      <Select
                        value={approvalFilters.source_type}
                        onValueChange={(value) =>
                          setApprovalFilters((prev) => ({
                            ...prev,
                            source_type: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sources</SelectItem>
                          {Object.entries(SOURCE_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Status">
                      <Select
                        value={approvalFilters.status}
                        onValueChange={(value) =>
                          setApprovalFilters((prev) => ({
                            ...prev,
                            status: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {Object.entries(STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#fafaf9] px-3 py-2">
                    <p className="text-sm text-gray-600">
                      {selectedApprovalIds.length} selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-lg bg-green-600 text-white hover:bg-green-700"
                        onClick={() => void approveSelectedEntries()}
                        disabled={
                          isApprovalActionLoading ||
                          selectedApprovalIds.length === 0
                        }
                      >
                        Bulk approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setRejectTarget(null);
                          setRejectReason("");
                          setIsBulkRejectOpen(true);
                        }}
                        disabled={
                          isApprovalActionLoading ||
                          selectedApprovalIds.length === 0
                        }
                      >
                        Bulk reject
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#fafaf9]">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={
                                approvalEntries.length > 0 &&
                                selectedApprovalIds.length ===
                                  approvalEntries.length
                              }
                              onCheckedChange={(checked) =>
                                setSelectedApprovalIds(
                                  checked === true
                                    ? approvalEntries.map((entry) => entry.id)
                                    : []
                                )
                              }
                              aria-label="Select all approval entries"
                            />
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Employee
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Project / Task
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Date
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Hours
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Source
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvalEntries.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className="hover:bg-[#fafaf9]"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedApprovalIds.includes(entry.id)}
                                onCheckedChange={(checked) =>
                                  setSelectedApprovalIds((current) =>
                                    checked === true
                                      ? Array.from(
                                          new Set([...current, entry.id])
                                        )
                                      : current.filter((id) => id !== entry.id)
                                  )
                                }
                                aria-label={`Select entry ${entry.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-950">
                              {entry.employee_name}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-gray-950">
                                {entry.project_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry.task_name || "No task"}
                              </p>
                              {entry.duplicate_of !== null && (
                                <p className="mt-1 text-xs text-amber-700">
                                  Possible duplicate of entry #
                                  {entry.duplicate_of}.
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-700">
                              {entry.work_date}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-gray-950">
                              {entry.hours}h
                            </TableCell>
                            <TableCell>
                              <SourceBadge source={entry.source_type} />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="rounded-lg bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => void approveEntry(entry)}
                                  disabled={isApprovalActionLoading}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-lg"
                                  onClick={() => {
                                    setIsBulkRejectOpen(false);
                                    setRejectReason("");
                                    setRejectTarget(entry);
                                  }}
                                  disabled={isApprovalActionLoading}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {approvalEntries.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500">
                      No submitted entries match filters.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <Dialog
          open={Boolean(calendarDialogTarget)}
          onOpenChange={(open) => {
            if (!open) setCalendarDialogTarget(null);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {calendarDialogTarget?.mode === "entry"
                  ? calendarDialogTarget.entry.project_name
                  : "New time entry"}
              </DialogTitle>
              <DialogDescription>
                {calendarDialogTarget
                  ? `${formatDateWithWeekday(
                      calendarDialogTarget.date
                    )} at ${displayCalendarTime(calendarDialogTarget.startTime)}`
                  : "Select a calendar slot to add time."}
              </DialogDescription>
            </DialogHeader>
            {calendarDialogTarget && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Detail
                    label="Date"
                    value={formatDateWithWeekday(calendarDialogTarget.date)}
                  />
                  <Detail
                    label="Start"
                    value={displayCalendarTime(calendarDialogTarget.startTime)}
                  />
                </div>
                {calendarDialogTarget.mode === "entry" && (
                  <div className="flex flex-wrap gap-2">
                    <SourceBadge
                      source={calendarDialogTarget.entry.source_type}
                    />
                    <StatusBadge status={calendarDialogTarget.entry.status} />
                    {calendarDialogTarget.entry.source_external_id && (
                      <Badge variant="outline">
                        {calendarDialogTarget.entry.source_external_id}
                      </Badge>
                    )}
                  </div>
                )}
                {calendarDialogTarget.mode === "entry" &&
                  calendarDialogTarget.entry.rejection_reason && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {calendarDialogTarget.entry.rejection_reason}
                    </div>
                  )}
                <Field label="Project">
                  <Select
                    value={entryForm.project_id}
                    disabled={!isCalendarTargetEditable || isSaving}
                    onValueChange={(value) =>
                      setEntryForm((prev) => ({
                        ...prev,
                        project_id: value,
                        task_id: "none",
                      }))
                    }
                  >
                    <SelectTrigger aria-label="Entry project">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {allocatedProjectOptions.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                      {unallocatedProjectOptions.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <AllocationContextPanel
                  assignment={selectedActiveAssignment}
                  entryContext={selectedEntryAllocationContext}
                  isLoading={isActiveAllocationsLoading}
                  error={activeAllocationsError}
                  hasProject={Boolean(entryForm.project_id)}
                  remainingPercentage={
                    activeAllocations?.remaining_allocation_percentage
                  }
                  remainingHours={
                    activeAllocations?.remaining_weekly_allocation_hours
                  }
                />
                <Field label="Task">
                  <Select
                    value={entryForm.task_id}
                    disabled={!isCalendarTargetEditable || isSaving}
                    onValueChange={(value) =>
                      setEntryForm((prev) => ({ ...prev, task_id: value }))
                    }
                  >
                    <SelectTrigger aria-label="Entry task">
                      <SelectValue placeholder="Task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No task</SelectItem>
                      {tasks
                        .filter(
                          (task) =>
                            !entryForm.project_id ||
                            task.project_id === Number(entryForm.project_id)
                        )
                        .map((task) => (
                          <SelectItem key={task.id} value={String(task.id)}>
                            {task.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Duration hours">
                  <Input
                    aria-label="Duration hours"
                    type="number"
                    min="0.25"
                    max="24"
                    step="0.25"
                    value={entryForm.hours}
                    disabled={!isCalendarTargetEditable || isSaving}
                    onChange={(event) =>
                      setEntryForm((prev) => ({
                        ...prev,
                        hours: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Notes">
                  <Textarea
                    rows={3}
                    value={entryForm.notes}
                    disabled={!isCalendarTargetEditable || isSaving}
                    onChange={(event) =>
                      setEntryForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                  />
                </Field>
                {calendarDialogTarget.mode === "entry" &&
                  !isCalendarTargetEditable && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      Imported entries are read-only but can be deleted while
                      draft or rejected. Submitted and approved entries are
                      locked.
                    </div>
                  )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCalendarDialogTarget(null)}
              >
                Close
              </Button>
              {canDeleteCalendarTarget && (
                <Button
                  variant="destructive"
                  disabled={isSaving}
                  onClick={() => void deleteCalendarEntry()}
                >
                  Delete
                </Button>
              )}
              {isCalendarTargetEditable && (
                <Button
                  variant="primary"
                  disabled={isSaving}
                  onClick={() => void saveCalendarEntry()}
                >
                  Save
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(rejectTarget) || isBulkRejectOpen}
          onOpenChange={(open) => {
            if (!open) {
              setRejectTarget(null);
              setIsBulkRejectOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isBulkRejectOpen
                  ? `Reject ${selectedApprovalIds.length} entries`
                  : "Reject time entry"}
              </DialogTitle>
              <DialogDescription>
                Rejection reason is required and shown on rejected entries.
              </DialogDescription>
            </DialogHeader>
            <Field label="Reason">
              <Textarea
                rows={3}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectTarget(null);
                  setIsBulkRejectOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={rejectEntry}
                disabled={isApprovalActionLoading}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function JiraIntegrationPanel({
  settings,
  settingsForm,
  setSettingsForm,
  mappings,
  userForm,
  setUserForm,
  projectForm,
  setProjectForm,
  issueForm,
  setIssueForm,
  discoveryForm,
  setDiscoveryForm,
  discovery,
  importFilters,
  setImportFilters,
  preview,
  commitResult,
  assignedIssuesForm,
  setAssignedIssuesForm,
  assignedIssuesResult,
  employees,
  projects,
  tasks,
  error,
  message,
  isLoading,
  isSaving,
  onSaveSettings,
  onTestConnection,
  onSaveUserMapping,
  onSaveProjectMapping,
  onSaveIssueMapping,
  onDiscover,
  onSaveDiscoveryMapping,
  onPreview,
  onCommit,
  onRunAssignedIssuesImport,
  onRefresh,
  onRefreshEntries,
}: {
  settings: JiraSettings | null;
  settingsForm: JiraSettingsForm;
  setSettingsForm: Dispatch<SetStateAction<JiraSettingsForm>>;
  mappings: JiraMappings;
  userForm: JiraUserMappingForm;
  setUserForm: Dispatch<SetStateAction<JiraUserMappingForm>>;
  projectForm: JiraProjectMappingForm;
  setProjectForm: Dispatch<SetStateAction<JiraProjectMappingForm>>;
  issueForm: JiraIssueMappingForm;
  setIssueForm: Dispatch<SetStateAction<JiraIssueMappingForm>>;
  discoveryForm: JiraDiscoveryForm;
  setDiscoveryForm: Dispatch<SetStateAction<JiraDiscoveryForm>>;
  discovery: JiraProjectDiscoveryResult | null;
  importFilters: JiraImportFilterForm;
  setImportFilters: Dispatch<SetStateAction<JiraImportFilterForm>>;
  preview: JiraImportPreview | null;
  commitResult: JiraImportCommitResult | null;
  assignedIssuesForm: JiraAssignedIssuesForm;
  setAssignedIssuesForm: Dispatch<SetStateAction<JiraAssignedIssuesForm>>;
  assignedIssuesResult: JiraAssignedIssuesImportResult | null;
  employees: EmployeeProfileData[];
  projects: Project[];
  tasks: TimeTask[];
  error: string | null;
  message: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onSaveSettings: () => void;
  onTestConnection: () => void;
  onSaveUserMapping: () => void;
  onSaveProjectMapping: () => void;
  onSaveIssueMapping: () => void;
  onDiscover: () => void;
  onSaveDiscoveryMapping: (
    type: "user" | "project" | "issue",
    row: JiraProjectDiscoveryRow,
    targetId: number
  ) => void;
  onPreview: () => void;
  onCommit: () => void;
  onRunAssignedIssuesImport: (dryRun: boolean) => void;
  onRefresh: () => void;
  onRefreshEntries: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Jira Integration
          </h2>
          <p className="text-sm text-gray-500">
            Configure Jira imports, maintain mappings, and commit worklogs into
            Time Tracking.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Base URL">
              <Input
                value={settingsForm.base_url}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    base_url: event.target.value,
                  }))
                }
                placeholder="https://company.atlassian.net"
              />
            </Field>
            <Field label="Auth Email">
              <Input
                type="email"
                value={settingsForm.auth_email}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    auth_email: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="API Token">
              <Input
                type="password"
                value={settingsForm.api_token}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    api_token: event.target.value,
                  }))
                }
                placeholder={
                  settings?.has_api_token ? "Token saved" : "Paste token"
                }
              />
            </Field>
            <Field label="Enabled">
              <div className="flex h-10 items-center gap-2">
                <Checkbox
                  checked={settingsForm.enabled}
                  onCheckedChange={(checked) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      enabled: checked === true,
                    }))
                  }
                />
                <span className="text-sm">Allow Jira imports</span>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm md:grid-cols-4">
            <Detail
              label="Token"
              value={settings?.has_api_token ? "Saved" : "Not saved"}
            />
            <Detail
              label="Last Test"
              value={settings?.last_test_status || "--"}
            />
            <Detail
              label="Message"
              value={settings?.last_test_message || "--"}
            />
            <Detail label="Tested At" value={settings?.last_test_at || "--"} />
          </div>
          {settings?.last_test_metadata &&
            Object.keys(settings.last_test_metadata).length > 0 && (
              <Detail
                label="Last Test Metadata"
                value={JSON.stringify(settings.last_test_metadata, null, 2)}
              />
            )}

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={onSaveSettings}
              disabled={isSaving}
            >
              Save settings
            </Button>
            <Button
              variant="outline"
              onClick={onTestConnection}
              disabled={isSaving}
            >
              Test connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="assigned-issues">Assigned Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <JiraUserMappingsPanel
            mappings={mappings.users}
            form={userForm}
            setForm={setUserForm}
            employees={employees}
            isSaving={isSaving}
            onSave={onSaveUserMapping}
          />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <JiraProjectMappingsPanel
            mappings={mappings.projects}
            form={projectForm}
            setForm={setProjectForm}
            projects={projects}
            isSaving={isSaving}
            onSave={onSaveProjectMapping}
          />
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          <JiraIssueMappingsPanel
            mappings={mappings.issues}
            form={issueForm}
            setForm={setIssueForm}
            tasks={tasks}
            jiraBaseUrl={settings?.base_url}
            isSaving={isSaving}
            onSave={onSaveIssueMapping}
          />
        </TabsContent>

        <TabsContent value="discovery" className="mt-4">
          <JiraProjectDiscoveryPanel
            form={discoveryForm}
            setForm={setDiscoveryForm}
            discovery={discovery}
            mappings={mappings}
            employees={employees}
            projects={projects}
            tasks={tasks}
            jiraBaseUrl={settings?.base_url}
            isSaving={isSaving}
            onDiscover={onDiscover}
            onSaveMapping={onSaveDiscoveryMapping}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <JiraImportPanel
            filters={importFilters}
            setFilters={setImportFilters}
            preview={preview}
            commitResult={commitResult}
            jiraBaseUrl={settings?.base_url}
            employees={employees}
            projects={projects}
            isSaving={isSaving}
            onPreview={onPreview}
            onCommit={onCommit}
            onRefreshEntries={onRefreshEntries}
          />
        </TabsContent>

        <TabsContent value="assigned-issues" className="mt-4">
          <JiraAssignedIssuesImportPanel
            form={assignedIssuesForm}
            setForm={setAssignedIssuesForm}
            result={assignedIssuesResult}
            jiraBaseUrl={settings?.base_url}
            employees={employees}
            isSaving={isSaving}
            onRun={onRunAssignedIssuesImport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JiraProjectDiscoveryPanel({
  form,
  setForm,
  discovery,
  mappings,
  employees,
  projects,
  tasks,
  jiraBaseUrl,
  isSaving,
  onDiscover,
  onSaveMapping,
}: {
  form: JiraDiscoveryForm;
  setForm: Dispatch<SetStateAction<JiraDiscoveryForm>>;
  discovery: JiraProjectDiscoveryResult | null;
  mappings: JiraMappings;
  employees: EmployeeProfileData[];
  projects: Project[];
  tasks: TimeTask[];
  jiraBaseUrl?: string;
  isSaving: boolean;
  onDiscover: () => void;
  onSaveMapping: (
    type: "user" | "project" | "issue",
    row: JiraProjectDiscoveryRow,
    targetId: number
  ) => void;
}) {
  const [manualTargetIds, setManualTargetIds] = useState<
    Record<string, string>
  >({});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Jira Project Discovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <Field label="Base URL">
              <Input
                value={form.base_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, base_url: event.target.value }))
                }
                placeholder="Use saved URL if blank"
              />
            </Field>
            <Field label="Auth Email">
              <Input
                type="email"
                value={form.auth_email}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    auth_email: event.target.value,
                  }))
                }
                placeholder="Use saved email if blank"
              />
            </Field>
            <Field label="API Token">
              <Input
                type="password"
                value={form.api_token}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    api_token: event.target.value,
                  }))
                }
                placeholder="Use saved token if blank"
              />
            </Field>
            <Field label="Date From">
              <DatePicker
                mode="single"
                value={form.date_from}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, date_from: value }))
                }
                placeholder="From date"
              />
            </Field>
            <Field label="Date To">
              <DatePicker
                mode="single"
                value={form.date_to}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, date_to: value }))
                }
                placeholder="To date"
              />
            </Field>
            <Field label="Limit">
              <Input
                type="number"
                min="1"
                value={form.limit}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, limit: event.target.value }))
                }
              />
            </Field>
          </div>
          <Button variant="primary" onClick={onDiscover} disabled={isSaving}>
            <Search className="mr-2 h-4 w-4" />
            Discover
          </Button>
        </CardContent>
      </Card>

      {discovery ? (
        <>
          <JiraDiscoveryCounts counts={discovery.counts} />
          <JiraDiscoveryTable
            title="Users"
            type="user"
            rows={discovery.users}
            mappings={mappings}
            targets={employees}
            manualTargetIds={manualTargetIds}
            setManualTargetIds={setManualTargetIds}
            isSaving={isSaving}
            onSaveMapping={onSaveMapping}
          />
          <JiraDiscoveryTable
            title="Projects"
            type="project"
            rows={discovery.projects}
            mappings={mappings}
            targets={projects}
            manualTargetIds={manualTargetIds}
            setManualTargetIds={setManualTargetIds}
            isSaving={isSaving}
            onSaveMapping={onSaveMapping}
          />
          <JiraDiscoveryTable
            title="Issues"
            type="issue"
            rows={discovery.issues}
            mappings={mappings}
            targets={tasks}
            jiraBaseUrl={jiraBaseUrl}
            manualTargetIds={manualTargetIds}
            setManualTargetIds={setManualTargetIds}
            isSaving={isSaving}
            onSaveMapping={onSaveMapping}
          />
        </>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-gray-500">
            Run discovery to load Jira users, projects, and issues.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JiraDiscoveryCounts({ counts }: { counts?: Record<string, number> }) {
  if (!counts || Object.keys(counts).length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Object.entries(counts).map(([label, value]) => (
        <DocumentSummaryMini
          key={label}
          label={label.replaceAll("_", " ")}
          value={value}
        />
      ))}
    </div>
  );
}

function JiraDiscoveryTable({
  title,
  type,
  rows,
  mappings,
  targets,
  jiraBaseUrl,
  manualTargetIds,
  setManualTargetIds,
  isSaving,
  onSaveMapping,
}: {
  title: string;
  type: "user" | "project" | "issue";
  rows: JiraProjectDiscoveryRow[];
  mappings: JiraMappings;
  targets: Array<EmployeeProfileData | Project | TimeTask>;
  jiraBaseUrl?: string;
  manualTargetIds: Record<string, string>;
  setManualTargetIds: Dispatch<SetStateAction<Record<string, string>>>;
  isSaving: boolean;
  onSaveMapping: (
    type: "user" | "project" | "issue",
    row: JiraProjectDiscoveryRow,
    targetId: number
  ) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jira</TableHead>
              <TableHead>Suggested BloomHub Target</TableHead>
              <TableHead>Mapping Status</TableHead>
              <TableHead>Manual Target</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-gray-500">
                  No {title.toLowerCase()} discovered.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const rowKey = jiraDiscoveryRowKey(type, row, index);
                const suggestedTargetId = jiraDiscoverySuggestedTargetId(
                  type,
                  row
                );
                const manualTargetId = manualTargetIds[rowKey] || "";
                const selectedTargetId = manualTargetId
                  ? Number(manualTargetId)
                  : suggestedTargetId;
                const mappingStatus = jiraDiscoveryMappingStatus(
                  type,
                  row,
                  mappings
                );
                const primaryLabel = jiraDiscoveryPrimaryLabel(type, row);
                const issueUrl =
                  type === "issue"
                    ? jiraIssueUrl(jiraBaseUrl, primaryLabel)
                    : "";

                return (
                  <TableRow key={rowKey}>
                    <TableCell>
                      {type === "issue" ? (
                        <JiraIssueLink
                          issueKey={primaryLabel}
                          issueUrl={issueUrl}
                        />
                      ) : (
                        <p className="font-medium">{primaryLabel}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {jiraDiscoverySecondaryLabel(type, row)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{jiraDiscoverySuggestedTargetName(type, row)}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {jiraDiscoveryConfidence(row)}
                      </p>
                    </TableCell>
                    <TableCell>{mappingStatus}</TableCell>
                    <TableCell>
                      <Select
                        value={manualTargetId}
                        onValueChange={(value) =>
                          setManualTargetIds((prev) => ({
                            ...prev,
                            [rowKey]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent>
                          {targets.map((target) => (
                            <SelectItem
                              key={target.id}
                              value={String(target.id)}
                            >
                              {jiraDiscoveryTargetLabel(type, target)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving || !selectedTargetId}
                        onClick={() => {
                          if (selectedTargetId) {
                            onSaveMapping(type, row, selectedTargetId);
                          }
                        }}
                      >
                        {mappingStatus === "Unmapped" ? "Create" : "Update"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function jiraDiscoveryValue(
  row: JiraProjectDiscoveryRow,
  keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function jiraDiscoveryMappingId(
  row: JiraProjectDiscoveryRow
): number | undefined {
  return typeof row.existing_mapping_id === "number"
    ? row.existing_mapping_id
    : undefined;
}

function jiraDiscoveryPrimaryLabel(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow
): string {
  if (type === "user") {
    return (
      jiraDiscoveryValue(row, [
        "jira_display_name",
        "display_name",
        "displayName",
        "name",
        "email",
      ]) || "--"
    );
  }
  if (type === "project") {
    return jiraDiscoveryValue(row, ["jira_project_key", "project_key", "key"]);
  }
  return jiraDiscoveryValue(row, ["jira_issue_key", "issue_key", "key"]);
}

function jiraDiscoverySecondaryLabel(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow
): string {
  if (type === "user") {
    return jiraDiscoveryValue(row, [
      "jira_account_id",
      "account_id",
      "accountId",
      "email",
      "id",
    ]);
  }
  if (type === "project") {
    return jiraDiscoveryValue(row, [
      "jira_project_name",
      "project_name",
      "name",
    ]);
  }
  return jiraDiscoveryValue(row, [
    "summary",
    "jira_issue_id",
    "issue_id",
    "id",
  ]);
}

function jiraDiscoveryRowKey(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow,
  index: number
): string {
  return `${type}-${jiraDiscoveryPrimaryLabel(type, row) || jiraDiscoverySecondaryLabel(type, row) || index}`;
}

function jiraDiscoverySuggestedTargetId(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow
): number | null {
  if (type === "user") {
    return row.employee_id ?? row.suggested_employee_id ?? null;
  }
  if (type === "project") {
    return row.project_id ?? row.suggested_project_id ?? null;
  }
  return row.task_id ?? row.suggested_task_id ?? null;
}

function jiraDiscoverySuggestedTargetName(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow
): string {
  if (type === "user") {
    return row.suggested_employee_name || row.existing_employee_name || "--";
  }
  if (type === "project") {
    return row.suggested_project_name || row.existing_project_name || "--";
  }
  return row.suggested_task_name || row.existing_task_name || "--";
}

function jiraDiscoveryConfidence(row: JiraProjectDiscoveryRow): string {
  if (row.confidence === null || row.confidence === undefined) return "--";
  if (typeof row.confidence === "number") {
    return row.confidence <= 1
      ? `${Math.round(row.confidence * 100)}%`
      : `${Math.round(row.confidence)}%`;
  }
  return row.confidence;
}

function jiraDiscoveryMappingStatus(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow,
  mappings: JiraMappings
): string {
  if (row.existing_mapping_status) return row.existing_mapping_status;
  const primary = jiraDiscoveryPrimaryLabel(type, row);
  const secondary = jiraDiscoverySecondaryLabel(type, row);

  if (type === "user") {
    const existing = mappings.users.find(
      (mapping) =>
        mapping.jira_account_id === secondary ||
        mapping.jira_display_name === primary
    );
    if (!existing) return "Unmapped";
    return `Mapped to ${existing.employee_name}${existing.is_active ? "" : " (inactive)"}`;
  }

  if (type === "project") {
    const existing = mappings.projects.find(
      (mapping) =>
        mapping.jira_project_key === primary ||
        mapping.jira_project_name === secondary
    );
    if (!existing) return "Unmapped";
    return `Mapped to ${existing.project_name}${existing.is_active ? "" : " (inactive)"}`;
  }

  const existing = mappings.issues.find(
    (mapping) =>
      mapping.jira_issue_key === primary || mapping.jira_issue_id === secondary
  );
  if (!existing) return "Unmapped";
  return `Mapped to ${existing.task_name}${existing.is_active ? "" : " (inactive)"}`;
}

function jiraDiscoveryTargetLabel(
  type: "user" | "project" | "issue",
  target: EmployeeProfileData | Project | TimeTask
): string {
  if (type === "user") {
    return employeeDisplayName(target as EmployeeProfileData);
  }
  if (type === "project") {
    return (target as Project).name;
  }
  const task = target as TimeTask;
  return `${task.project_name} · ${task.name}`;
}

function jiraDiscoveryMappingPayload(
  type: "user" | "project" | "issue",
  row: JiraProjectDiscoveryRow,
  targetId: number
): JiraMappingPayload {
  const id = jiraDiscoveryMappingId(row);
  if (type === "user") {
    return {
      mapping_type: "user",
      id,
      jira_account_id: jiraDiscoverySecondaryLabel(type, row),
      jira_display_name: jiraDiscoveryPrimaryLabel(type, row),
      employee_id: targetId,
      is_active: true,
    };
  }
  if (type === "project") {
    return {
      mapping_type: "project",
      id,
      jira_project_key: jiraDiscoveryPrimaryLabel(type, row),
      jira_project_name: jiraDiscoverySecondaryLabel(type, row),
      project_id: targetId,
      is_active: true,
    };
  }
  return {
    mapping_type: "issue",
    id,
    jira_issue_key: jiraDiscoveryPrimaryLabel(type, row),
    jira_issue_id: jiraDiscoveryValue(row, ["jira_issue_id", "issue_id", "id"]),
    task_id: targetId,
    is_active: true,
  };
}

function JiraUserMappingsPanel({
  mappings,
  form,
  setForm,
  employees,
  isSaving,
  onSave,
}: {
  mappings: JiraUserMapping[];
  form: JiraUserMappingForm;
  setForm: Dispatch<SetStateAction<JiraUserMappingForm>>;
  employees: EmployeeProfileData[];
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Mappings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Jira Account ID">
            <Input
              value={form.jira_account_id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jira_account_id: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Display Name">
            <Input
              value={form.jira_display_name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jira_display_name: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Employee">
            <Select
              value={form.employee_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, employee_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employeeDisplayName(employee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Active">
            <div className="flex h-10 items-center gap-2">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: checked === true }))
                }
              />
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {form.id ? "Update" : "Create"}
              </Button>
              {form.id && (
                <Button
                  variant="outline"
                  onClick={() => setForm(EMPTY_JIRA_USER_MAPPING_FORM)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Field>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jira User</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell>
                  <p className="font-medium">{mapping.jira_display_name}</p>
                  <p className="text-xs text-gray-500">
                    {mapping.jira_account_id}
                  </p>
                </TableCell>
                <TableCell>{mapping.employee_name}</TableCell>
                <TableCell>
                  {mapping.is_active ? "Active" : "Inactive"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setForm({
                        id: mapping.id,
                        jira_account_id: mapping.jira_account_id,
                        jira_display_name: mapping.jira_display_name,
                        employee_id: String(mapping.employee_id),
                        is_active: mapping.is_active,
                      })
                    }
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function JiraProjectMappingsPanel({
  mappings,
  form,
  setForm,
  projects,
  isSaving,
  onSave,
}: {
  mappings: JiraProjectMapping[];
  form: JiraProjectMappingForm;
  setForm: Dispatch<SetStateAction<JiraProjectMappingForm>>;
  projects: Project[];
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Mappings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Jira Project Key">
            <Input
              value={form.jira_project_key}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jira_project_key: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Jira Project Name">
            <Input
              value={form.jira_project_name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jira_project_name: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="BloomHub Project">
            <Select
              value={form.project_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, project_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Active">
            <div className="flex h-10 items-center gap-2">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: checked === true }))
                }
              />
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {form.id ? "Update" : "Create"}
              </Button>
              {form.id && (
                <Button
                  variant="outline"
                  onClick={() => setForm(EMPTY_JIRA_PROJECT_MAPPING_FORM)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Field>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jira Project</TableHead>
              <TableHead>BloomHub Project</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell>
                  <p className="font-medium">{mapping.jira_project_key}</p>
                  <p className="text-xs text-gray-500">
                    {mapping.jira_project_name}
                  </p>
                </TableCell>
                <TableCell>{mapping.project_name}</TableCell>
                <TableCell>
                  {mapping.is_active ? "Active" : "Inactive"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setForm({
                        id: mapping.id,
                        jira_project_key: mapping.jira_project_key,
                        jira_project_name: mapping.jira_project_name,
                        project_id: String(mapping.project_id),
                        is_active: mapping.is_active,
                      })
                    }
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function JiraIssueMappingsPanel({
  mappings,
  form,
  setForm,
  tasks,
  jiraBaseUrl,
  isSaving,
  onSave,
}: {
  mappings: JiraIssueMapping[];
  form: JiraIssueMappingForm;
  setForm: Dispatch<SetStateAction<JiraIssueMappingForm>>;
  tasks: TimeTask[];
  jiraBaseUrl?: string;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Mappings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Jira Issue Key">
            <Input
              value={form.jira_issue_key}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jira_issue_key: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Jira Issue ID">
            <Input
              value={form.jira_issue_id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  jira_issue_id: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="BloomHub Task">
            <Select
              value={form.task_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, task_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={String(task.id)}>
                    {task.project_name} · {task.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Active">
            <div className="flex h-10 items-center gap-2">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: checked === true }))
                }
              />
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {form.id ? "Update" : "Create"}
              </Button>
              {form.id && (
                <Button
                  variant="outline"
                  onClick={() => setForm(EMPTY_JIRA_ISSUE_MAPPING_FORM)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Field>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jira Issue</TableHead>
              <TableHead>BloomHub Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => {
              const issueUrl = jiraIssueUrl(
                jiraBaseUrl,
                mapping.jira_issue_key
              );
              return (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <JiraIssueLink
                      issueKey={mapping.jira_issue_key}
                      issueUrl={issueUrl}
                    />
                    <p className="text-xs text-gray-500">
                      {mapping.jira_issue_id}
                    </p>
                  </TableCell>
                  <TableCell>{mapping.task_name}</TableCell>
                  <TableCell>{mapping.project_name}</TableCell>
                  <TableCell>
                    {mapping.is_active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setForm({
                          id: mapping.id,
                          jira_issue_key: mapping.jira_issue_key,
                          jira_issue_id: mapping.jira_issue_id,
                          task_id: String(mapping.task_id),
                          is_active: mapping.is_active,
                        })
                      }
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function JiraImportPanel({
  filters,
  setFilters,
  preview,
  commitResult,
  jiraBaseUrl,
  employees,
  projects,
  isSaving,
  onPreview,
  onCommit,
  onRefreshEntries,
}: {
  filters: JiraImportFilterForm;
  setFilters: Dispatch<SetStateAction<JiraImportFilterForm>>;
  preview: JiraImportPreview | null;
  commitResult: JiraImportCommitResult | null;
  jiraBaseUrl?: string;
  employees: EmployeeProfileData[];
  projects: Project[];
  isSaving: boolean;
  onPreview: () => void;
  onCommit: () => void;
  onRefreshEntries: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="From">
              <DatePicker
                mode="single"
                value={filters.date_from}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_from: value,
                  }))
                }
                placeholder="From date"
              />
            </Field>
            <Field label="To">
              <DatePicker
                mode="single"
                value={filters.date_to}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_to: value,
                  }))
                }
                placeholder="To date"
              />
            </Field>
            <Field label="Employee">
              <Select
                value={filters.employee_id || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    employee_id: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employeeDisplayName(employee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Project">
              <Select
                value={filters.project_id || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    project_id: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jira Project Key">
              <Input
                value={filters.jira_project_key}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    jira_project_key: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Jira Issue Key">
              <Input
                value={filters.jira_issue_key}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    jira_issue_key: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Worklog ID">
              <Input
                value={filters.worklog_id}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    worklog_id: event.target.value,
                  }))
                }
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={onPreview} disabled={isSaving}>
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={onCommit}
                disabled={isSaving || !preview || preview.valid_count === 0}
              >
                Commit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {commitResult && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Commit Result</CardTitle>
              <Button variant="outline" onClick={onRefreshEntries}>
                Refresh Time Tracking
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryMini
                label="Created"
                value={commitResult.counts.created}
              />
              <SummaryMini
                label="Updated"
                value={commitResult.counts.updated}
              />
              <SummaryMini
                label="Skipped"
                value={commitResult.counts.skipped}
              />
              <SummaryMini label="Errors" value={commitResult.counts.error} />
            </div>
            {commitResult.entry_ids.length > 0 && (
              <p className="mt-3 text-sm text-gray-600">
                Entry IDs: {commitResult.entry_ids.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>
              Preview · {preview.date_from} to {preview.date_to}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <SummaryMini label="Rows" value={preview.row_count} />
              <SummaryMini label="Valid" value={preview.valid_count} />
              <SummaryMini label="Errors" value={preview.error_count} />
            </div>
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worklog</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project / Task</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => {
                    const issueUrl = jiraIssueUrl(jiraBaseUrl, row.issue_key);
                    return (
                      <TableRow
                        key={`${row.issue_key}-${row.worklog_id}`}
                        className={
                          row.status === "error" || row.action === "skip"
                            ? "bg-amber-50/60"
                            : undefined
                        }
                      >
                        <TableCell>
                          <JiraIssueLink
                            issueKey={row.issue_key}
                            issueUrl={issueUrl}
                          />
                          <p className="text-xs text-gray-500">
                            {row.worklog_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          {row.employee_name || row.employee_id || "--"}
                        </TableCell>
                        <TableCell>
                          <p>{row.project_name || row.project_id || "--"}</p>
                          <p className="text-xs text-gray-500">
                            {row.task_name || row.task_id || "--"}
                          </p>
                        </TableCell>
                        <TableCell>{row.work_date || "--"}</TableCell>
                        <TableCell>{row.hours}h</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              row.action === "skip"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : row.action === "update"
                                  ? "border-blue-200 bg-blue-50 text-blue-800"
                                  : "border-green-200 bg-green-50 text-green-800"
                            }
                          >
                            {row.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.validation_messages.length === 0 ? (
                            <span className="text-sm text-gray-500">Valid</span>
                          ) : (
                            <div className="space-y-1">
                              {row.validation_messages.map((message) => (
                                <p
                                  key={`${row.worklog_id}-${message.code}`}
                                  className="text-xs text-amber-800"
                                >
                                  {message.code}: {message.message}
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JiraAssignedIssuesImportPanel({
  form,
  setForm,
  result,
  jiraBaseUrl,
  employees,
  isSaving,
  onRun,
}: {
  form: JiraAssignedIssuesForm;
  setForm: Dispatch<SetStateAction<JiraAssignedIssuesForm>>;
  result: JiraAssignedIssuesImportResult | null;
  jiraBaseUrl?: string;
  employees: EmployeeProfileData[];
  isSaving: boolean;
  onRun: (dryRun: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Assigned Issues Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Employee">
              <Select
                value={form.employee_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, employee_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employeeDisplayName(employee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Max results">
              <Input
                type="number"
                min="1"
                max="1000"
                step="1"
                value={form.max_results}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    max_results: event.target.value,
                  }))
                }
              />
            </Field>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button
                variant="primary"
                onClick={() => onRun(true)}
                disabled={isSaving || !form.employee_id}
              >
                Dry run
              </Button>
              <Button
                variant="outline"
                onClick={() => onRun(false)}
                disabled={isSaving || !form.employee_id}
              >
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.dry_run ? "Dry Run Result" : "Import Result"} ·{" "}
              {result.row_count} issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <SummaryMini
                label="Projects"
                value={result.counts.created_projects}
              />
              <SummaryMini label="Tasks" value={result.counts.created_tasks} />
              <SummaryMini
                label="Updated Tasks"
                value={result.counts.updated_tasks}
              />
              <SummaryMini
                label="Mappings"
                value={result.counts.created_issue_mappings}
              />
              <SummaryMini
                label="Updated Maps"
                value={result.counts.updated_issue_mappings}
              />
              <SummaryMini label="Errors" value={result.counts.errors} />
            </div>

            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jira Issue</TableHead>
                    <TableHead>Jira Project</TableHead>
                    <TableHead>BloomHub Project</TableHead>
                    <TableHead>BloomHub Task</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => {
                    const issueUrl = jiraIssueUrl(
                      jiraBaseUrl,
                      row.jira_issue_key
                    );
                    return (
                      <TableRow
                        key={`${row.jira_issue_key}-${row.jira_issue_id}`}
                      >
                        <TableCell>
                          <JiraIssueLink
                            issueKey={row.jira_issue_key}
                            issueUrl={issueUrl}
                          />
                          <p className="text-xs text-gray-500">
                            {row.jira_issue_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>{row.jira_project_key}</p>
                          <p className="text-xs text-gray-500">
                            {row.jira_project_name}
                          </p>
                        </TableCell>
                        <TableCell>{row.project_id ?? "--"}</TableCell>
                        <TableCell>
                          <p>{row.task_name || "--"}</p>
                          <p className="text-xs text-gray-500">
                            {row.task_id ?? "--"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.action || "--"}</Badge>
                        </TableCell>
                        <TableCell>
                          {row.validation_messages.length === 0 ? (
                            <span className="text-sm text-gray-500">Valid</span>
                          ) : (
                            <div className="space-y-1">
                              {row.validation_messages.map((message) => (
                                <p
                                  key={`${row.jira_issue_key}-${message}`}
                                  className="text-xs text-amber-800"
                                >
                                  {message}
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {result.rows.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  No assigned Jira issues returned.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JiraIssueLink({
  issueKey,
  issueUrl,
}: {
  issueKey: string;
  issueUrl: string;
}) {
  if (!issueUrl) {
    return <p className="font-medium">{issueKey}</p>;
  }

  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-blue-700 underline-offset-2 hover:underline"
    >
      {issueKey}
    </a>
  );
}

function SummaryMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function DocumentSummaryMini({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
      <p className="text-xs font-medium uppercase text-blue-900">{label}</p>
      <p className="mt-1 text-xl font-semibold text-blue-950">{value}</p>
    </div>
  );
}

function WeekStrip({
  weekStart,
  weekDays,
  dayTotals,
  onPrevious,
  onNext,
  onToday,
  onPickWeek,
}: {
  weekStart: string;
  weekDays: string[];
  dayTotals: Record<string, number>;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onPickWeek: (value: string) => void;
}) {
  const today = isoDate(new Date());
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-[230px] items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-gray-200 bg-white text-gray-700"
            onClick={onPrevious}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[13px] font-semibold text-gray-950">
              Week of {weekStart}
            </p>
            <DatePicker
              mode="single"
              value={weekStart}
              onChange={onPickWeek}
              placeholder="Pick week"
              size="compact"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-gray-200 bg-white text-gray-700"
            onClick={onNext}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-gray-200 bg-white text-gray-800"
            onClick={onToday}
          >
            Today
          </Button>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
          {weekDays.map((day) => {
            const total = Number(dayTotals[day] || 0);
            const pct = Math.min((total / 8) * 100, 100);
            const date = new Date(`${day}T00:00:00`);
            return (
              <button
                key={day}
                type="button"
                className={`rounded-lg border px-3 py-2 text-left transition hover:border-gray-900 ${
                  day === today
                    ? "border-gray-950 bg-gray-950 text-white"
                    : "border-gray-200 bg-white text-gray-950"
                }`}
                onClick={() => onPickWeek(day)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      day === today ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="font-mono text-[11px] font-semibold">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[13px] font-semibold">
                  {decimalHours(String(total))}h
                </div>
                <div
                  className={`mt-2 h-1 rounded-full ${
                    day === today ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`h-full rounded-full ${
                      total >= 8
                        ? "bg-green-500"
                        : total > 0
                          ? "bg-gray-950"
                          : "bg-gray-300"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TempoIntegrationPanel({
  settings,
  settingsForm,
  setSettingsForm,
  mappings,
  mappingForm,
  setMappingForm,
  discoveryForm,
  setDiscoveryForm,
  discovery,
  importFilters,
  setImportFilters,
  preview,
  commitResult,
  employees,
  projects,
  error,
  message,
  isLoading,
  isSaving,
  onSaveSettings,
  onTestConnection,
  onSaveMapping,
  onDiscover,
  onSaveDiscoveryMapping,
  onPreview,
  onCommit,
  onRefresh,
  onRefreshEntries,
}: {
  settings: TempoSettings | null;
  settingsForm: TempoSettingsForm;
  setSettingsForm: Dispatch<SetStateAction<TempoSettingsForm>>;
  mappings: TempoMappings;
  mappingForm: TempoMappingForm;
  setMappingForm: Dispatch<SetStateAction<TempoMappingForm>>;
  discoveryForm: TempoDiscoveryForm;
  setDiscoveryForm: Dispatch<SetStateAction<TempoDiscoveryForm>>;
  discovery: TempoProjectDiscoveryResult | null;
  importFilters: TempoImportFilterForm;
  setImportFilters: Dispatch<SetStateAction<TempoImportFilterForm>>;
  preview: TempoImportPreview | null;
  commitResult: TempoImportCommitResult | null;
  employees: EmployeeProfileData[];
  projects: Project[];
  error: string | null;
  message: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onSaveSettings: () => void;
  onTestConnection: () => void;
  onSaveMapping: () => void;
  onDiscover: () => void;
  onSaveDiscoveryMapping: (
    type: "account" | "project" | "team",
    row: TempoProjectDiscoveryRow,
    projectId: number
  ) => void;
  onPreview: () => void;
  onCommit: () => void;
  onRefresh: () => void;
  onRefreshEntries: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Tempo Integration
          </h2>
          <p className="text-sm text-gray-500">
            Configure Tempo imports, mappings, preview, and commit.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Base URL">
              <Input
                value={settingsForm.base_url}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    base_url: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="API Token">
              <Input
                type="password"
                value={settingsForm.api_token}
                onChange={(event) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    api_token: event.target.value,
                  }))
                }
                placeholder={
                  settings?.has_api_token ? "Token saved" : "Paste token"
                }
              />
            </Field>
            <Field label="Enabled">
              <div className="flex h-10 items-center gap-2">
                <Checkbox
                  checked={settingsForm.enabled}
                  onCheckedChange={(checked) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      enabled: checked === true,
                    }))
                  }
                />
                <span className="text-sm">Allow Tempo imports</span>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm md:grid-cols-4">
            <Detail
              label="Token"
              value={settings?.has_api_token ? "Saved" : "Not saved"}
            />
            <Detail
              label="Last Test"
              value={settings?.last_test_status || "--"}
            />
            <Detail
              label="Message"
              value={settings?.last_test_message || "--"}
            />
            <Detail label="Tested At" value={settings?.last_test_at || "--"} />
          </div>
          {settings?.last_test_metadata &&
            Object.keys(settings.last_test_metadata).length > 0 && (
              <Detail
                label="Last Test Metadata"
                value={JSON.stringify(settings.last_test_metadata, null, 2)}
              />
            )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={onSaveSettings}
              disabled={isSaving}
            >
              Save settings
            </Button>
            <Button
              variant="outline"
              onClick={onTestConnection}
              disabled={isSaving}
            >
              Test connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mappings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        <TabsContent value="mappings" className="mt-4">
          <TempoMappingsPanel
            mappings={mappings}
            form={mappingForm}
            setForm={setMappingForm}
            employees={employees}
            projects={projects}
            isSaving={isSaving}
            onSave={onSaveMapping}
          />
        </TabsContent>
        <TabsContent value="discovery" className="mt-4">
          <TempoProjectDiscoveryPanel
            form={discoveryForm}
            setForm={setDiscoveryForm}
            discovery={discovery}
            mappings={mappings}
            projects={projects}
            isSaving={isSaving}
            onDiscover={onDiscover}
            onSaveMapping={onSaveDiscoveryMapping}
          />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <TempoImportPanel
            filters={importFilters}
            setFilters={setImportFilters}
            preview={preview}
            commitResult={commitResult}
            employees={employees}
            projects={projects}
            isSaving={isSaving}
            onPreview={onPreview}
            onCommit={onCommit}
            onRefreshEntries={onRefreshEntries}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TempoMappingsPanel({
  mappings,
  form,
  setForm,
  employees,
  projects,
  isSaving,
  onSave,
}: {
  mappings: TempoMappings;
  form: TempoMappingForm;
  setForm: Dispatch<SetStateAction<TempoMappingForm>>;
  employees: EmployeeProfileData[];
  projects: Project[];
  isSaving: boolean;
  onSave: () => void;
}) {
  const rows = [
    ...mappings.users.map((m) => ({
      type: "user" as const,
      id: m.id,
      left: m.tempo_display_name,
      sub: m.tempo_user_id,
      target: m.employee_name,
      active: m.is_active,
      raw: m,
    })),
    ...mappings.accounts.map((m) => ({
      type: "account" as const,
      id: m.id,
      left: m.tempo_account_key,
      sub: `${m.tempo_account_id} · ${m.tempo_account_name}`,
      target: m.project_name,
      active: m.is_active,
      raw: m,
    })),
    ...mappings.projects.map((m) => ({
      type: "project" as const,
      id: m.id,
      left: m.tempo_project_key,
      sub: `${m.tempo_project_id} · ${m.tempo_project_name}`,
      target: m.project_name,
      active: m.is_active,
      raw: m,
    })),
    ...mappings.teams.map((m) => ({
      type: "team" as const,
      id: m.id,
      left: m.tempo_team_name,
      sub: m.tempo_team_id,
      target: m.project_name,
      active: m.is_active,
      raw: m,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo Mappings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Mapping Type">
            <Select
              value={form.mapping_type}
              onValueChange={(value) =>
                setForm({
                  ...EMPTY_TEMPO_MAPPING_FORM,
                  mapping_type: value as TempoMappingForm["mapping_type"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.mapping_type === "user" ? (
            <>
              <Field label="Tempo User ID">
                <Input
                  value={form.tempo_user_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tempo_user_id: e.target.value }))
                  }
                />
              </Field>
              <Field label="Display Name">
                <Input
                  value={form.tempo_display_name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tempo_display_name: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Employee">
                <Select
                  value={form.employee_id}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, employee_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {employeeDisplayName(e)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          ) : (
            <>
              <Field
                label={
                  form.mapping_type === "account"
                    ? "Account ID"
                    : form.mapping_type === "project"
                      ? "Tempo Project ID"
                      : "Team ID"
                }
              >
                <Input
                  value={
                    form.mapping_type === "account"
                      ? form.tempo_account_id
                      : form.mapping_type === "project"
                        ? form.tempo_project_id
                        : form.tempo_team_id
                  }
                  onChange={(e) =>
                    setForm((p) =>
                      form.mapping_type === "account"
                        ? { ...p, tempo_account_id: e.target.value }
                        : form.mapping_type === "project"
                          ? { ...p, tempo_project_id: e.target.value }
                          : { ...p, tempo_team_id: e.target.value }
                    )
                  }
                />
              </Field>
              <Field
                label={
                  form.mapping_type === "team" ? "Team Name" : "Key / Name"
                }
              >
                <Input
                  value={
                    form.mapping_type === "account"
                      ? form.tempo_account_key
                      : form.mapping_type === "project"
                        ? form.tempo_project_key
                        : form.tempo_team_name
                  }
                  onChange={(e) =>
                    setForm((p) =>
                      form.mapping_type === "account"
                        ? { ...p, tempo_account_key: e.target.value }
                        : form.mapping_type === "project"
                          ? { ...p, tempo_project_key: e.target.value }
                          : { ...p, tempo_team_name: e.target.value }
                    )
                  }
                />
              </Field>
              <Field label="BloomHub Project">
                <Select
                  value={form.project_id}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, project_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
        </div>
        {(form.mapping_type === "account" ||
          form.mapping_type === "project") && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input
                value={
                  form.mapping_type === "account"
                    ? form.tempo_account_name
                    : form.tempo_project_name
                }
                onChange={(e) =>
                  setForm((p) =>
                    form.mapping_type === "account"
                      ? { ...p, tempo_account_name: e.target.value }
                      : { ...p, tempo_project_name: e.target.value }
                  )
                }
              />
            </Field>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.is_active}
            onCheckedChange={(checked) =>
              setForm((p) => ({ ...p, is_active: checked === true }))
            }
          />
          <span className="text-sm">Active</span>
          <Button variant="primary" onClick={onSave} disabled={isSaving}>
            {form.id ? "Update" : "Create"}
          </Button>
          {form.id && (
            <Button
              variant="outline"
              onClick={() => setForm(EMPTY_TEMPO_MAPPING_FORM)}
            >
              Cancel
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Tempo</TableHead>
              <TableHead>BloomHub</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.type}-${row.id}`}>
                <TableCell>{row.type}</TableCell>
                <TableCell>
                  <p className="font-medium">{row.left}</p>
                  <p className="text-xs text-gray-500">{row.sub}</p>
                </TableCell>
                <TableCell>{row.target}</TableCell>
                <TableCell>{row.active ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormFromTempoRow(row, setForm)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TempoProjectDiscoveryPanel({
  form,
  setForm,
  discovery,
  mappings,
  projects,
  isSaving,
  onDiscover,
  onSaveMapping,
}: {
  form: TempoDiscoveryForm;
  setForm: Dispatch<SetStateAction<TempoDiscoveryForm>>;
  discovery: TempoProjectDiscoveryResult | null;
  mappings: TempoMappings;
  projects: Project[];
  isSaving: boolean;
  onDiscover: () => void;
  onSaveMapping: (
    type: "account" | "project" | "team",
    row: TempoProjectDiscoveryRow,
    projectId: number
  ) => void;
}) {
  const [manualProjectIds, setManualProjectIds] = useState<
    Record<string, string>
  >({});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tempo Project Discovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <Field label="Base URL">
              <Input
                value={form.base_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, base_url: e.target.value }))
                }
              />
            </Field>
            <Field label="API Token">
              <Input
                type="password"
                value={form.api_token}
                onChange={(e) =>
                  setForm((p) => ({ ...p, api_token: e.target.value }))
                }
                placeholder="Use saved token if blank"
              />
            </Field>
            <Field label="Date From">
              <DatePicker
                mode="single"
                value={form.date_from}
                onChange={(value) =>
                  setForm((p) => ({ ...p, date_from: value }))
                }
                placeholder="From date"
              />
            </Field>
            <Field label="Date To">
              <DatePicker
                mode="single"
                value={form.date_to}
                onChange={(value) => setForm((p) => ({ ...p, date_to: value }))}
                placeholder="To date"
              />
            </Field>
            <Field label="Limit">
              <Input
                type="number"
                min="1"
                value={form.limit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, limit: e.target.value }))
                }
              />
            </Field>
          </div>
          <Button variant="primary" onClick={onDiscover} disabled={isSaving}>
            <Search className="mr-2 h-4 w-4" />
            Discover
          </Button>
        </CardContent>
      </Card>

      {discovery ? (
        <>
          <TempoDiscoveryTable
            title="Accounts"
            type="account"
            rows={discovery.accounts}
            mappings={mappings}
            projects={projects}
            manualProjectIds={manualProjectIds}
            setManualProjectIds={setManualProjectIds}
            isSaving={isSaving}
            onSaveMapping={onSaveMapping}
          />
          <TempoDiscoveryTable
            title="Projects"
            type="project"
            rows={discovery.projects}
            mappings={mappings}
            projects={projects}
            manualProjectIds={manualProjectIds}
            setManualProjectIds={setManualProjectIds}
            isSaving={isSaving}
            onSaveMapping={onSaveMapping}
          />
          <TempoDiscoveryTable
            title="Teams"
            type="team"
            rows={discovery.teams}
            mappings={mappings}
            projects={projects}
            manualProjectIds={manualProjectIds}
            setManualProjectIds={setManualProjectIds}
            isSaving={isSaving}
            onSaveMapping={onSaveMapping}
          />
        </>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-gray-500">
            Run discovery to load Tempo accounts, projects, and teams.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TempoDiscoveryTable({
  title,
  type,
  rows,
  mappings,
  projects,
  manualProjectIds,
  setManualProjectIds,
  isSaving,
  onSaveMapping,
}: {
  title: string;
  type: "account" | "project" | "team";
  rows: TempoProjectDiscoveryRow[];
  mappings: TempoMappings;
  projects: Project[];
  manualProjectIds: Record<string, string>;
  setManualProjectIds: Dispatch<SetStateAction<Record<string, string>>>;
  isSaving: boolean;
  onSaveMapping: (
    type: "account" | "project" | "team",
    row: TempoProjectDiscoveryRow,
    projectId: number
  ) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tempo</TableHead>
              <TableHead>Detected Project ID</TableHead>
              <TableHead>Suggested BloomHub Project</TableHead>
              <TableHead>Mapping Status</TableHead>
              <TableHead>Manual Project</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-gray-500">
                  No {title.toLowerCase()} discovered.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const rowKey = tempoDiscoveryRowKey(type, row, index);
                const suggestedProjectId =
                  tempoDiscoverySuggestedProjectId(row);
                const manualProjectId = manualProjectIds[rowKey] || "";
                const selectedProjectId = manualProjectId
                  ? Number(manualProjectId)
                  : suggestedProjectId;
                const mappingStatus = tempoDiscoveryMappingStatus(
                  type,
                  row,
                  mappings
                );

                return (
                  <TableRow key={rowKey}>
                    <TableCell>
                      <p className="font-medium">
                        {tempoDiscoveryRowKeyLabel(type, row)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tempoDiscoveryRowName(type, row)}
                      </p>
                    </TableCell>
                    <TableCell>{suggestedProjectId || "--"}</TableCell>
                    <TableCell>
                      <p>{tempoDiscoverySuggestedProjectName(row, projects)}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {tempoDiscoveryConfidence(row)}
                      </p>
                    </TableCell>
                    <TableCell>{mappingStatus}</TableCell>
                    <TableCell>
                      <Select
                        value={manualProjectId}
                        onValueChange={(value) =>
                          setManualProjectIds((prev) => ({
                            ...prev,
                            [rowKey]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={String(project.id)}
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving || !selectedProjectId}
                        onClick={() => {
                          if (selectedProjectId) {
                            onSaveMapping(type, row, selectedProjectId);
                          }
                        }}
                      >
                        {mappingStatus === "Unmapped" ? "Create" : "Update"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function setFormFromTempoRow(
  row:
    | { type: "user"; raw: TempoUserMapping }
    | { type: "account"; raw: TempoAccountMapping }
    | { type: "project"; raw: TempoProjectMapping }
    | { type: "team"; raw: TempoTeamMapping },
  setForm: Dispatch<SetStateAction<TempoMappingForm>>
) {
  const base = {
    ...EMPTY_TEMPO_MAPPING_FORM,
    id: row.raw.id,
    mapping_type: row.type,
    is_active: row.raw.is_active,
  };
  if (row.type === "user")
    setForm({
      ...base,
      tempo_user_id: row.raw.tempo_user_id,
      tempo_display_name: row.raw.tempo_display_name,
      employee_id: String(row.raw.employee_id),
    });
  if (row.type === "account")
    setForm({
      ...base,
      tempo_account_id: row.raw.tempo_account_id,
      tempo_account_key: row.raw.tempo_account_key,
      tempo_account_name: row.raw.tempo_account_name,
      project_id: String(row.raw.project_id),
    });
  if (row.type === "project")
    setForm({
      ...base,
      tempo_project_id: row.raw.tempo_project_id,
      tempo_project_key: row.raw.tempo_project_key,
      tempo_project_name: row.raw.tempo_project_name,
      project_id: String(row.raw.project_id),
    });
  if (row.type === "team")
    setForm({
      ...base,
      tempo_team_id: row.raw.tempo_team_id,
      tempo_team_name: row.raw.tempo_team_name,
      project_id: String(row.raw.project_id),
    });
}

function tempoDiscoveryValue(
  row: TempoProjectDiscoveryRow,
  keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function tempoDiscoveryExternalId(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow
): string {
  if (type === "account") {
    return tempoDiscoveryValue(row, [
      "tempo_account_id",
      "account_id",
      "tempo_id",
      "id",
    ]);
  }
  if (type === "project") {
    return tempoDiscoveryValue(row, [
      "tempo_project_id",
      "tempo_id",
      "id",
      "jira_project_id",
    ]);
  }
  return tempoDiscoveryValue(row, [
    "tempo_team_id",
    "team_id",
    "tempo_id",
    "id",
  ]);
}

function tempoDiscoveryExternalKey(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow
): string {
  if (type === "account") {
    return tempoDiscoveryValue(row, [
      "tempo_account_key",
      "account_key",
      "tempo_key",
      "key",
    ]);
  }
  if (type === "project") {
    return tempoDiscoveryValue(row, [
      "tempo_project_key",
      "project_key",
      "tempo_key",
      "key",
    ]);
  }
  return tempoDiscoveryValue(row, ["tempo_key", "key"]);
}

function tempoDiscoveryRowName(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow
): string {
  const value =
    type === "account"
      ? tempoDiscoveryValue(row, [
          "tempo_account_name",
          "account_name",
          "tempo_name",
          "name",
        ])
      : type === "project"
        ? tempoDiscoveryValue(row, [
            "tempo_project_name",
            "project_name",
            "tempo_name",
            "name",
          ])
        : tempoDiscoveryValue(row, [
            "tempo_team_name",
            "team_name",
            "tempo_name",
            "name",
          ]);
  return value || "--";
}

function tempoDiscoveryRowKeyLabel(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow
): string {
  const tempoId = tempoDiscoveryExternalId(type, row);
  const tempoKey = tempoDiscoveryExternalKey(type, row);
  const name = tempoDiscoveryRowName(type, row);
  return [tempoId, tempoKey, name === "--" ? "" : name]
    .filter(Boolean)
    .join(" / ");
}

function tempoDiscoveryRowKey(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow,
  index: number
): string {
  return `${type}-${tempoDiscoveryExternalId(type, row) || tempoDiscoveryExternalKey(type, row) || index}`;
}

function tempoDiscoverySuggestedProjectId(
  row: TempoProjectDiscoveryRow
): number | null {
  return row.project_id ?? row.suggested_project_id ?? null;
}

function tempoDiscoverySuggestedProjectName(
  row: TempoProjectDiscoveryRow,
  projects: Project[]
): string {
  const projectId = tempoDiscoverySuggestedProjectId(row);
  const fallbackProject = projectId
    ? projects.find((project) => project.id === projectId)
    : undefined;
  return (
    row.suggested_project_name ||
    row.bloomhub_project_name ||
    fallbackProject?.name ||
    "--"
  );
}

function tempoDiscoveryConfidence(row: TempoProjectDiscoveryRow): string {
  if (row.confidence === null || row.confidence === undefined) return "--";
  if (typeof row.confidence === "number") {
    return row.confidence <= 1
      ? `${Math.round(row.confidence * 100)}%`
      : `${Math.round(row.confidence)}%`;
  }
  return row.confidence;
}

function tempoDiscoveryMappingStatus(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow,
  mappings: TempoMappings
): string {
  if (row.existing_mapping_status) return row.existing_mapping_status;
  const externalId = tempoDiscoveryExternalId(type, row);
  const externalKey = tempoDiscoveryExternalKey(type, row);
  const existing =
    type === "account"
      ? mappings.accounts.find(
          (mapping) =>
            mapping.tempo_account_id === externalId ||
            mapping.tempo_account_key === externalKey
        )
      : type === "project"
        ? mappings.projects.find(
            (mapping) =>
              mapping.tempo_project_id === externalId ||
              mapping.tempo_project_key === externalKey
          )
        : mappings.teams.find(
            (mapping) => mapping.tempo_team_id === externalId
          );

  return existing
    ? `Mapped to ${existing.project_name}${existing.is_active ? "" : " (inactive)"}`
    : "Unmapped";
}

function tempoDiscoveryMappingPayload(
  type: "account" | "project" | "team",
  row: TempoProjectDiscoveryRow,
  projectId: number
): TempoMappingPayload {
  const externalId = tempoDiscoveryExternalId(type, row);
  const externalKey = tempoDiscoveryExternalKey(type, row);
  const externalName = tempoDiscoveryRowName(type, row);
  const existingMappingId =
    typeof row.existing_mapping_id === "number"
      ? row.existing_mapping_id
      : undefined;

  if (type === "account") {
    return {
      mapping_type: "account",
      id: existingMappingId,
      tempo_account_id: externalId,
      tempo_account_key: externalKey,
      tempo_account_name: externalName === "--" ? "" : externalName,
      project_id: projectId,
      is_active: true,
    };
  }
  if (type === "project") {
    return {
      mapping_type: "project",
      id: existingMappingId,
      tempo_project_id: externalId,
      tempo_project_key: externalKey,
      tempo_project_name: externalName === "--" ? "" : externalName,
      project_id: projectId,
      is_active: true,
    };
  }
  return {
    mapping_type: "team",
    id: existingMappingId,
    tempo_team_id: externalId,
    tempo_team_name: externalName === "--" ? "" : externalName,
    project_id: projectId,
    is_active: true,
  };
}

function TempoImportPanel(props: {
  filters: TempoImportFilterForm;
  setFilters: Dispatch<SetStateAction<TempoImportFilterForm>>;
  preview: TempoImportPreview | null;
  commitResult: TempoImportCommitResult | null;
  employees: EmployeeProfileData[];
  projects: Project[];
  isSaving: boolean;
  onPreview: () => void;
  onCommit: () => void;
  onRefreshEntries: () => void;
}) {
  const {
    filters,
    setFilters,
    preview,
    commitResult,
    employees,
    projects,
    isSaving,
    onPreview,
    onCommit,
    onRefreshEntries,
  } = props;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="From">
              <DatePicker
                mode="single"
                value={filters.date_from}
                onChange={(value) =>
                  setFilters((p) => ({ ...p, date_from: value }))
                }
                placeholder="From date"
              />
            </Field>
            <Field label="To">
              <DatePicker
                mode="single"
                value={filters.date_to}
                onChange={(value) =>
                  setFilters((p) => ({ ...p, date_to: value }))
                }
                placeholder="To date"
              />
            </Field>
            <Field label="Employee">
              <Select
                value={filters.employee_id || "all"}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    employee_id: v === "all" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {employeeDisplayName(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="BloomHub Project">
              <Select
                value={filters.project_id || "all"}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    project_id: v === "all" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tempo Team ID">
              <Input
                value={filters.tempo_team_id}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, tempo_team_id: e.target.value }))
                }
              />
            </Field>
            <Field label="Tempo Account ID">
              <Input
                value={filters.tempo_account_id}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    tempo_account_id: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Tempo Account Key">
              <Input
                value={filters.tempo_account_key}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    tempo_account_key: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Tempo Project ID">
              <Input
                value={filters.tempo_project_id}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    tempo_project_id: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Jira Issue Key">
              <Input
                value={filters.jira_issue_key}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, jira_issue_key: e.target.value }))
                }
              />
            </Field>
            <Field label="Worklog ID">
              <Input
                value={filters.worklog_id}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, worklog_id: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={onPreview} disabled={isSaving}>
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={onCommit}
                disabled={isSaving || !preview || preview.valid_count === 0}
              >
                Commit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {commitResult && (
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Commit Result</CardTitle>
              <Button variant="outline" onClick={onRefreshEntries}>
                Refresh Time Tracking
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryMini
                label="Created"
                value={commitResult.counts.created}
              />
              <SummaryMini
                label="Updated"
                value={commitResult.counts.updated}
              />
              <SummaryMini
                label="Skipped"
                value={commitResult.counts.skipped}
              />
              <SummaryMini label="Errors" value={commitResult.counts.error} />
            </div>
          </CardContent>
        </Card>
      )}
      {preview && <TempoPreviewTable preview={preview} />}
    </div>
  );
}

function TempoPreviewTable({ preview }: { preview: TempoImportPreview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Preview · {preview.date_from} to {preview.date_to}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <SummaryMini label="Rows" value={preview.row_count} />
          <SummaryMini label="Valid" value={preview.valid_count} />
          <SummaryMini label="Errors" value={preview.error_count} />
        </div>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worklog</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Project / Task</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row) => (
                <TableRow
                  key={`${row.jira_issue_key}-${row.worklog_id}`}
                  className={
                    row.status === "error" || row.action === "skip"
                      ? "bg-amber-50/60"
                      : undefined
                  }
                >
                  <TableCell>
                    <p className="font-medium">{row.jira_issue_key}</p>
                    <p className="text-xs text-gray-500">{row.worklog_id}</p>
                  </TableCell>
                  <TableCell>
                    {row.employee_name || row.employee_id || "--"}
                  </TableCell>
                  <TableCell>
                    <p>{row.project_name || row.project_id || "--"}</p>
                    <p className="text-xs text-gray-500">
                      {row.task_name || row.task_id || "--"}
                    </p>
                  </TableCell>
                  <TableCell>{row.work_date || "--"}</TableCell>
                  <TableCell>{row.hours}h</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        row.action === "skip"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : row.action === "update"
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : "border-green-200 bg-green-50 text-green-800"
                      }
                    >
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.validation_messages.length === 0 ? (
                      <span className="text-sm text-gray-500">Valid</span>
                    ) : (
                      <div className="space-y-1">
                        {row.validation_messages.map((m) => (
                          <p
                            key={`${row.worklog_id}-${m.code}`}
                            className="text-xs text-amber-800"
                          >
                            {m.code}: {m.message}
                            {row.duplicate_entry_id
                              ? ` · duplicate #${row.duplicate_entry_id}`
                              : ""}
                          </p>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentImportPanel({
  batch,
  mappingForm,
  setMappingForm,
  error,
  message,
  isSaving,
  onUpload,
  onMapColumns,
  onPreview,
  onCommit,
  onRefreshEntries,
}: {
  batch: TimeImportBatch | null;
  mappingForm: DocumentColumnMappingForm;
  setMappingForm: Dispatch<SetStateAction<DocumentColumnMappingForm>>;
  error: string | null;
  message: string | null;
  isSaving: boolean;
  onUpload: (file: File) => void;
  onMapColumns: () => void;
  onPreview: () => void;
  onCommit: () => void;
  onRefreshEntries: () => void;
}) {
  const missingRequiredFields = missingRequiredDocumentFields(mappingForm);
  const missingRequiredLabels = DOCUMENT_MAPPING_FIELDS.filter((field) =>
    missingRequiredFields.includes(field.key)
  ).map((field) => field.label);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-blue-950">Document Import</h2>
        <p className="text-sm text-blue-900">
          Upload CSV, XLSX, or DOCX timesheets, map columns, preview, commit.
        </p>
      </div>
      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </div>
          )}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".csv,.xlsx,.docx"
            disabled={isSaving}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          {batch && (
            <p className="mt-2 text-sm font-medium text-blue-950">
              Batch #{batch.id} · {batch.file_name} · {batch.status}
            </p>
          )}
        </CardContent>
      </Card>

      {batch && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(batch.detected_columns.headers ?? []).map((header) => (
                  <Badge
                    key={header}
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-900"
                  >
                    {header}
                  </Badge>
                ))}
              </div>
              {missingRequiredLabels.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Missing required: {missingRequiredLabels.join(", ")}
                </div>
              )}
              {(batch.detected_columns.ambiguous ?? []).length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {(batch.detected_columns.ambiguous ?? [])
                    .map(
                      (item) => `${item.field}: ${item.candidates.join(", ")}`
                    )
                    .join("; ")}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {DOCUMENT_MAPPING_FIELDS.map((field) => (
                  <Field
                    key={field.key}
                    label={`${field.label}${field.required ? " *" : ""}`}
                  >
                    <Select
                      value={mappingForm[field.key] || "none"}
                      onValueChange={(value) =>
                        setMappingForm((prev) => ({
                          ...prev,
                          [field.key]: value === "none" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="text-blue-950 data-[placeholder]:text-blue-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not mapped</SelectItem>
                        {(batch.detected_columns.headers ?? []).map(
                          (header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={onMapColumns}
                  disabled={isSaving || missingRequiredFields.length > 0}
                >
                  Save mapping
                </Button>
                <Button
                  variant="outline"
                  onClick={onPreview}
                  disabled={isSaving || missingRequiredFields.length > 0}
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={onCommit}
                  disabled={
                    isSaving ||
                    batch.valid_rows === 0 ||
                    missingRequiredFields.length > 0
                  }
                >
                  Commit
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Preview</CardTitle>
                <Button variant="outline" onClick={onRefreshEntries}>
                  Refresh Time Tracking
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <DocumentSummaryMini label="Total" value={batch.total_rows} />
                <DocumentSummaryMini label="Valid" value={batch.valid_rows} />
                <DocumentSummaryMini label="Errors" value={batch.error_rows} />
                <DocumentSummaryMini
                  label="Skipped"
                  value={batch.skipped_rows}
                />
                <DocumentSummaryMini
                  label="Committed"
                  value={batch.committed_rows}
                />
              </div>
              {batch.validation_messages.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {batch.validation_messages
                    .map((item) => `${item.code}: ${item.message}`)
                    .join("; ")}
                </div>
              )}
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table className="text-blue-950">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-blue-950">Row</TableHead>
                      <TableHead className="text-blue-950">Raw</TableHead>
                      <TableHead className="text-blue-950">Parsed</TableHead>
                      <TableHead className="text-blue-950">Status</TableHead>
                      <TableHead className="text-blue-950">
                        Validation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={
                          row.status === "error" || row.status === "skipped"
                            ? "bg-amber-50/60"
                            : undefined
                        }
                      >
                        <TableCell>
                          <p className="font-medium">#{row.row_number}</p>
                          <p className="text-xs text-blue-900">
                            {row.sheet_name}
                            {row.table_index !== null
                              ? ` · table ${row.table_index}`
                              : ""}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium text-blue-950">
                            Employee:{" "}
                            {rawDocumentValue(
                              batch,
                              row,
                              "employee",
                              mappingForm
                            )}
                          </p>
                          <p className="text-xs font-medium text-blue-950">
                            Date:{" "}
                            {rawDocumentValue(batch, row, "date", mappingForm)}
                          </p>
                          <p className="text-xs font-medium text-blue-950">
                            Project:{" "}
                            {rawDocumentValue(
                              batch,
                              row,
                              "project",
                              mappingForm
                            )}
                          </p>
                          <p className="text-xs font-medium text-blue-950">
                            Task:{" "}
                            {rawDocumentValue(batch, row, "task", mappingForm)}
                          </p>
                          <p className="text-xs font-medium text-blue-950">
                            Jira:{" "}
                            {rawDocumentValue(
                              batch,
                              row,
                              "jira_issue",
                              mappingForm
                            )}
                          </p>
                          <p className="text-xs font-medium text-blue-950">
                            Hours:{" "}
                            {rawDocumentValue(batch, row, "hours", mappingForm)}
                          </p>
                          <p className="text-xs font-medium text-blue-950">
                            Notes:{" "}
                            {rawDocumentValue(batch, row, "notes", mappingForm)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>{row.parsed_data.employee_name || "--"}</p>
                          <p className="text-xs text-blue-900">
                            {row.parsed_data.project_name || "--"} ·{" "}
                            {row.parsed_data.task_name || "No task"}
                          </p>
                          <p className="text-xs text-blue-900">
                            {row.parsed_data.work_date || "--"} ·{" "}
                            {row.parsed_data.hours || "--"}h
                          </p>
                          {row.parsed_data.jira_issue_key && (
                            <p className="text-xs text-blue-900">
                              {row.parsed_data.jira_issue_key}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-900"
                          >
                            {row.status}
                          </Badge>
                          {row.committed_entry_id && (
                            <p className="mt-1 text-xs text-blue-900">
                              entry #{row.committed_entry_id}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.validation_messages.length === 0 ? (
                            <span className="text-sm font-medium text-blue-950">
                              Valid
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {row.validation_messages.map((item) => (
                                <p
                                  key={`${row.id}-${item.code}`}
                                  className="text-xs text-amber-800"
                                >
                                  {item.code}: {item.message}
                                  {row.parsed_data.duplicate_entry_id
                                    ? ` · duplicate #${row.parsed_data.duplicate_entry_id}`
                                    : ""}
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TimeTrackingReportsPanel({
  filters,
  setFilters,
  dashboard,
  planned,
  employees,
  projects,
  error,
  message,
  isLoading,
  canViewOtherTimesheets,
  onLoad,
  onExport,
}: {
  filters: ReportFilters;
  setFilters: Dispatch<SetStateAction<ReportFilters>>;
  dashboard: WeeklyDashboard | null;
  planned: PlannedVsActualResponse | null;
  employees: EmployeeProfileData[];
  projects: Project[];
  error: string | null;
  message: string | null;
  isLoading: boolean;
  canViewOtherTimesheets: boolean;
  onLoad: () => void;
  onExport: () => void;
}) {
  return (
    <div className="space-y-4">
      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </div>
          )}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Week">
              <DatePicker
                mode="single"
                value={filters.week_start}
                onChange={(value) => {
                  const week = getWeekStart(new Date(value));
                  setFilters((prev) => ({
                    ...prev,
                    week_start: week,
                    date_from: week,
                    date_to: addDays(week, 6),
                  }));
                }}
                placeholder="Pick week"
              />
            </Field>
            <Field label="From">
              <DatePicker
                mode="single"
                value={filters.date_from}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_from: value,
                  }))
                }
                placeholder="From date"
              />
            </Field>
            <Field label="To">
              <DatePicker
                mode="single"
                value={filters.date_to}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_to: value,
                  }))
                }
                placeholder="To date"
              />
            </Field>
            {canViewOtherTimesheets && (
              <Field label="Employee">
                <Select
                  value={filters.employee_id || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      employee_id: value === "all" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employeeDisplayName(employee)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Project">
              <Select
                value={filters.project_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, project_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source">
              <Select
                value={filters.source_type}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    source_type: value as ReportFilters["source_type"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value as ReportFilters["status"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Export Format">
              <Select
                value={filters.export_format}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    export_format: value as "csv" | "xlsx",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={onLoad} disabled={isLoading}>
              Load reports
            </Button>
            <Button variant="outline" onClick={onExport} disabled={isLoading}>
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!dashboard ? (
            <p className="text-sm text-gray-500">No dashboard loaded.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <SummaryCard
                  icon={Clock}
                  label="Total Hours"
                  value={`${reportNumber(dashboard.total_hours)}h`}
                  detail={`${dashboard.week_start} to ${dashboard.week_end}`}
                />
                <SourceTotals totals={dashboard.totals_by_source} />
                <StatusTotals totals={dashboard.totals_by_status} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.employees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell>{employee.employee_name}</TableCell>
                      <TableCell>{employee.total_hours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ReportEntriesTable entries={dashboard.entries} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          {!planned ? (
            <p className="text-sm text-gray-500">No report loaded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planned.rows.map((row) => (
                  <TableRow
                    key={`${row.employee_id}-${row.project_id}-${row.week_start}`}
                    className={
                      row.allocation_status === "unallocated"
                        ? "bg-amber-50/60"
                        : undefined
                    }
                  >
                    <TableCell>{row.employee_name}</TableCell>
                    <TableCell>
                      {row.week_start} to {row.week_end}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{row.project_name}</p>
                      {row.assignments.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {row.assignments
                            .map(
                              (item) =>
                                `${item.allocation_percentage}%/${item.active_weekdays}d`
                            )
                            .join(", ")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{row.planned_hours}h</TableCell>
                    <TableCell>{row.actual_hours}h</TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${varianceClass(
                          row.variance_hours
                        )}`}
                      >
                        {row.variance_hours}h
                      </span>
                    </TableCell>
                    <TableCell>{row.allocation_percentage}%</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={allocationStatusClass(row.allocation_status)}
                      >
                        {row.allocation_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceTotals({ totals }: { totals: Record<string, string> }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="mb-2 text-sm text-gray-600">By Source</p>
      {(
        ["manual", "jira", "tempo", "document_import"] as TimeEntrySourceType[]
      ).map((source) => (
        <div key={source} className="flex justify-between text-sm">
          <span>{SOURCE_LABELS[source]}</span>
          <span className="font-medium">{reportNumber(totals[source])}h</span>
        </div>
      ))}
    </div>
  );
}

function StatusTotals({ totals }: { totals: Record<string, string> }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="mb-2 text-sm text-gray-600">By Status</p>
      {(Object.keys(STATUS_LABELS) as TimeEntryStatus[]).map((status) => (
        <div key={status} className="flex justify-between text-sm">
          <span>{STATUS_LABELS[status]}</span>
          <span className="font-medium">{reportNumber(totals[status])}h</span>
        </div>
      ))}
    </div>
  );
}

function ReportEntriesTable({ entries }: { entries: TimeEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">No entries.</p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Project / Task</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Allocation</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.work_date}</TableCell>
            <TableCell>{entry.employee_name}</TableCell>
            <TableCell>
              <p className="font-medium">{entry.project_name}</p>
              <p className="text-xs text-gray-500">
                {entry.task_name || "No task"}
              </p>
            </TableCell>
            <TableCell>{entry.hours}h</TableCell>
            <TableCell>
              {entry.allocation_context ? (
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className={allocationStatusClass(
                      entry.allocation_context.allocation_status
                    )}
                  >
                    {entry.allocation_context.allocation_status}
                  </Badge>
                  {entry.allocation_context.allocation_status ===
                    "allocated" && (
                    <p className="text-xs text-gray-500">
                      {entry.allocation_context.allocation_percentage}% ·{" "}
                      {entry.allocation_context.planned_daily_hours ?? "?"}h/day
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">unknown</span>
              )}
            </TableCell>
            <TableCell>
              <SourceBadge source={entry.source_type} />
            </TableCell>
            <TableCell>
              <StatusBadge status={entry.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ImportObservabilityPanel({
  importFilters,
  setImportFilters,
  batches,
  selectedBatch,
  selectedRow,
  setSelectedRow,
  reviewFilters,
  setReviewFilters,
  reviewEntries,
  selectedEntry,
  setSelectedEntry,
  note,
  setNote,
  employees,
  projects,
  error,
  message,
  isLoading,
  onLoad,
  onOpenBatch,
  onResolve,
}: {
  importFilters: ImportHistoryFilterForm;
  setImportFilters: Dispatch<SetStateAction<ImportHistoryFilterForm>>;
  batches: TimeImportBatch[];
  selectedBatch: TimeImportBatch | null;
  selectedRow: TimeImportRow | null;
  setSelectedRow: Dispatch<SetStateAction<TimeImportRow | null>>;
  reviewFilters: SourceReviewFilterForm;
  setReviewFilters: Dispatch<SetStateAction<SourceReviewFilterForm>>;
  reviewEntries: TimeEntry[];
  selectedEntry: TimeEntry | null;
  setSelectedEntry: Dispatch<SetStateAction<TimeEntry | null>>;
  note: string;
  setNote: Dispatch<SetStateAction<string>>;
  employees: EmployeeProfileData[];
  projects: Project[];
  error: string | null;
  message: string | null;
  isLoading: boolean;
  onLoad: () => void;
  onOpenBatch: (batchId: number) => void;
  onResolve: (
    action: "accept_current" | "apply_source" | "leave_flagged"
  ) => void;
}) {
  return (
    <div className="space-y-4">
      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button variant="primary" onClick={onLoad} disabled={isLoading}>
          Load review data
        </Button>
      </div>
      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Import History</TabsTrigger>
          <TabsTrigger value="source-review">Source Review</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import History Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Field label="Source">
                <Select
                  value={importFilters.source_type}
                  onValueChange={(value) =>
                    setImportFilters((prev) => ({
                      ...prev,
                      source_type:
                        value as ImportHistoryFilterForm["source_type"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="document_import">
                      DocumentImport
                    </SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="tempo">Tempo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={importFilters.status}
                  onValueChange={(value) =>
                    setImportFilters((prev) => ({
                      ...prev,
                      status: value as ImportHistoryFilterForm["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "all",
                      "uploaded",
                      "needs_mapping",
                      "previewed",
                      "partially_committed",
                      "committed",
                      "failed",
                    ].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Uploaded By ID">
                <Input
                  value={importFilters.uploaded_by}
                  onChange={(event) =>
                    setImportFilters((prev) => ({
                      ...prev,
                      uploaded_by: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="From">
                <DatePicker
                  mode="single"
                  value={importFilters.date_from}
                  onChange={(value) =>
                    setImportFilters((prev) => ({
                      ...prev,
                      date_from: value,
                    }))
                  }
                  placeholder="From date"
                />
              </Field>
              <Field label="To">
                <DatePicker
                  mode="single"
                  value={importFilters.date_to}
                  onChange={(value) =>
                    setImportFilters((prev) => ({
                      ...prev,
                      date_to: value,
                    }))
                  }
                  placeholder="To date"
                />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Import Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>File / Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Counts</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Created / Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow
                      key={batch.id}
                      className="cursor-pointer"
                      onClick={() => onOpenBatch(batch.id)}
                    >
                      <TableCell>{batch.source_type}</TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {batch.file_name || `Batch #${batch.id}`}
                        </p>
                        <p className="text-xs text-gray-500">#{batch.id}</p>
                      </TableCell>
                      <TableCell>{batch.status}</TableCell>
                      <TableCell>
                        total {batch.total_rows} · valid {batch.valid_rows} ·
                        error {batch.error_rows} · skipped {batch.skipped_rows}{" "}
                        · committed {batch.committed_rows}
                      </TableCell>
                      <TableCell>{batch.uploaded_by_name || "--"}</TableCell>
                      <TableCell>
                        <p>{batch.created_at}</p>
                        <p className="text-xs text-gray-500">
                          {batch.updated_at}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {batches.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">
                  No import batches.
                </p>
              )}
            </CardContent>
          </Card>
          {selectedBatch && (
            <ImportBatchDetail
              batch={selectedBatch}
              selectedRow={selectedRow}
              setSelectedRow={setSelectedRow}
            />
          )}
        </TabsContent>
        <TabsContent value="source-review" className="mt-4 space-y-4">
          <SourceReviewFilters
            filters={reviewFilters}
            setFilters={setReviewFilters}
            employees={employees}
            projects={projects}
          />
          <Card>
            <CardHeader>
              <CardTitle>Source Change Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project / Task</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>External ID</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <TableCell>{entry.employee_name}</TableCell>
                      <TableCell>
                        <p className="font-medium">{entry.project_name}</p>
                        <p className="text-xs text-gray-500">
                          {entry.task_name || "No task"}
                        </p>
                      </TableCell>
                      <TableCell>{entry.work_date}</TableCell>
                      <TableCell>{entry.hours}h</TableCell>
                      <TableCell>
                        <SourceBadge source={entry.source_type} />
                      </TableCell>
                      <TableCell>{entry.source_external_id || "--"}</TableCell>
                      <TableCell>{sourceChangeFlag(entry)}</TableCell>
                      <TableCell>
                        {metadataValue(entry.source_metadata, ["updated"]) ||
                          "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reviewEntries.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">
                  No source changes need review.
                </p>
              )}
            </CardContent>
          </Card>
          {selectedEntry && (
            <SourceReviewDetail
              entry={selectedEntry}
              note={note}
              setNote={setNote}
              onResolve={onResolve}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImportBatchDetail({
  batch,
  selectedRow,
  setSelectedRow,
}: {
  batch: TimeImportBatch;
  selectedRow: TimeImportRow | null;
  setSelectedRow: Dispatch<SetStateAction<TimeImportRow | null>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch #{batch.id} Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <SummaryMini label="Total" value={batch.total_rows} />
          <SummaryMini label="Valid" value={batch.valid_rows} />
          <SummaryMini label="Errors" value={batch.error_rows} />
          <SummaryMini label="Skipped" value={batch.skipped_rows} />
          <SummaryMini label="Committed" value={batch.committed_rows} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Raw</TableHead>
              <TableHead>Parsed</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Committed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => setSelectedRow(row)}
              >
                <TableCell>#{row.row_number}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <pre className="max-w-xs whitespace-pre-wrap text-xs">
                    {JSON.stringify(row.raw_data, null, 2)}
                  </pre>
                </TableCell>
                <TableCell>
                  <pre className="max-w-xs whitespace-pre-wrap text-xs">
                    {JSON.stringify(row.parsed_data, null, 2)}
                  </pre>
                </TableCell>
                <TableCell>
                  {row.validation_messages.length === 0
                    ? "Valid"
                    : row.validation_messages
                        .map((item) => `${item.code}: ${item.message}`)
                        .join("; ")}
                </TableCell>
                <TableCell>
                  {row.committed_entry_id
                    ? `entry #${row.committed_entry_id}`
                    : "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {selectedRow && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 font-medium">Row #{selectedRow.row_number}</p>
            <p className="text-xs text-gray-500">
              Fingerprint: {selectedRow.original_row_fingerprint}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Detail
                label="Validation"
                value={
                  selectedRow.validation_messages.length === 0
                    ? "None"
                    : selectedRow.validation_messages
                        .map((item) => `${item.code}: ${item.message}`)
                        .join("\n")
                }
              />
              <Detail
                label="Committed Entry"
                value={selectedRow.committed_entry_id || "--"}
              />
              <Detail
                label="Raw Payload"
                value={JSON.stringify(selectedRow.raw_data, null, 2)}
              />
              <Detail
                label="Parsed Payload"
                value={JSON.stringify(selectedRow.parsed_data, null, 2)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SourceReviewFilters({
  filters,
  setFilters,
  employees,
  projects,
}: {
  filters: SourceReviewFilterForm;
  setFilters: Dispatch<SetStateAction<SourceReviewFilterForm>>;
  employees: EmployeeProfileData[];
  projects: Project[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Review Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Field label="From">
          <DatePicker
            mode="single"
            value={filters.date_from}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, date_from: value }))
            }
            placeholder="From date"
          />
        </Field>
        <Field label="To">
          <DatePicker
            mode="single"
            value={filters.date_to}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, date_to: value }))
            }
            placeholder="To date"
          />
        </Field>
        <Field label="Employee">
          <Select
            value={filters.employee_id || "all"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                employee_id: value === "all" ? "" : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={String(employee.id)}>
                  {employeeDisplayName(employee)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Project">
          <Select
            value={filters.project_id}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, project_id: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Source">
          <Select
            value={filters.source_type}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                source_type: value as SourceReviewFilterForm["source_type"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="jira">Jira</SelectItem>
              <SelectItem value="tempo">Tempo</SelectItem>
              <SelectItem value="document_import">DocumentImport</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}

function SourceReviewDetail({
  entry,
  note,
  setNote,
  onResolve,
}: {
  entry: TimeEntry;
  note: string;
  setNote: Dispatch<SetStateAction<string>>;
  onResolve: (
    action: "accept_current" | "apply_source" | "leave_flagged"
  ) => void;
}) {
  const pending = sourcePendingUpdate(entry);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Review · Entry #{entry.id}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Detail label="Current Date" value={entry.work_date} />
          <Detail label="Current Hours" value={`${entry.hours}h`} />
          <Detail label="Current Notes" value={entry.notes || "--"} />
          <Detail label="Source Flag" value={sourceChangeFlag(entry)} />
          <Detail
            label="Deleted"
            value={entry.source_metadata.deleted === true ? "Yes" : "No"}
          />
          <Detail
            label="Updated"
            value={metadataValue(entry.source_metadata, ["updated"]) || "--"}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Detail
            label="Pending Source Update"
            value={
              Object.keys(pending).length > 0
                ? JSON.stringify(pending, null, 2)
                : "--"
            }
          />
          <Detail
            label="Source Metadata"
            value={JSON.stringify(entry.source_metadata, null, 2)}
          />
        </div>
        <Field label="Resolution Note">
          <Textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => onResolve("accept_current")}>
            Accept Current
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve("apply_source")}
            disabled={entry.status === "approved"}
          >
            Apply Source
          </Button>
          <Button variant="outline" onClick={() => onResolve("leave_flagged")}>
            Leave Flagged
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className="font-mono text-[26px] font-bold leading-none tracking-tight text-gray-950">
        {value}
      </p>
      <p className="mt-2 truncate text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function WeeklySummaryPanel({
  summary,
  error,
  isLoading,
}: {
  summary: WeeklySummary | null;
  error: string | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
        Loading allocation summary...
      </div>
    );
  }

  if (error) {
    const status = summaryStatusMessage(error);
    const toneClass =
      status.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : status.tone === "empty"
          ? "border-gray-200 bg-gray-50 text-gray-700"
          : "border-red-200 bg-red-50 text-red-700";

    return (
      <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}>
        <p className="font-medium">{status.title}</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
        No allocation summary returned for this week.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">
            Allocation Summary
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {summary.week_start} to {summary.week_end} ·{" "}
            {summary.projects.length} project
            {summary.projects.length === 1 ? "" : "s"}
          </p>
        </div>
        {summary.projects.length > 1 && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
              {summary.projects.map((project) => (
                <div
                  key={project.project_id}
                  className={
                    project.allocation_status === "unallocated"
                      ? "bg-amber-500"
                      : "bg-gray-950"
                  }
                  style={{
                    width: `${Math.max(Number(project.allocation_percentage), 0)}%`,
                  }}
                  title={`${project.project_name}: ${project.allocation_percentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {summary.projects.map((project) => (
                <Badge
                  key={project.project_id}
                  variant="outline"
                  className={allocationStatusClass(project.allocation_status)}
                >
                  {project.project_name}: {project.allocation_percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#fafaf9]">
            <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Project
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Planned
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Actual
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Variance
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Allocation
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.projects.map((project) => (
            <TableRow
              key={project.project_id}
              className={
                project.allocation_status === "unallocated"
                  ? "bg-amber-50/60"
                  : undefined
              }
            >
              <TableCell className="text-gray-950">
                <div>
                  <p className="font-medium">{project.project_name}</p>
                  {project.assignments.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {project.assignments.map((assignment) => (
                        <p
                          key={assignment.assignment_id}
                          className="text-xs text-gray-500"
                        >
                          {assignment.start_date} to{" "}
                          {assignment.end_date ?? "ongoing"} ·{" "}
                          {assignment.allocation_percentage}% ·{" "}
                          {assignment.active_weekdays} weekdays ·{" "}
                          {assignment.status}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-gray-950">
                {project.planned_hours}h
              </TableCell>
              <TableCell className="font-mono text-gray-950">
                {project.actual_hours}h
              </TableCell>
              <TableCell>
                <span
                  className={`font-medium ${varianceClass(
                    project.variance_hours
                  )}`}
                >
                  {project.variance_hours}h
                </span>
              </TableCell>
              <TableCell className="font-mono text-gray-950">
                {project.allocation_percentage}%
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={allocationStatusClass(project.allocation_status)}
                >
                  {project.allocation_status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {summary.projects.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-gray-600">
          No planned or actual project hours for this week.
        </p>
      )}
    </div>
  );
}

function AllocationContextPanel({
  assignment,
  entryContext,
  isLoading,
  error,
  hasProject,
  remainingPercentage,
  remainingHours,
}: {
  assignment: ReturnType<typeof activeAssignmentContext>;
  entryContext: TimeEntry["allocation_context"];
  isLoading: boolean;
  error: string | null;
  hasProject: boolean;
  remainingPercentage?: string;
  remainingHours?: string;
}) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        Loading allocation context...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Allocation unknown. Manual logging is still available.
      </div>
    );
  }

  if (assignment) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={allocationStatusClass("allocated")}
          >
            allocated
          </Badge>
          <span>
            {assignment.allocation_percentage}% ·{" "}
            {assignment.weekly_allocation_hours}h planned this week
          </span>
        </div>
        <p className="mt-1 text-xs text-green-800">
          {assignment.start_date} to {assignment.end_date ?? "ongoing"} ·{" "}
          {remainingPercentage ?? "0.00"}% / {remainingHours ?? "0.00"}h
          remaining capacity
        </p>
      </div>
    );
  }

  if (entryContext?.allocation_status === "allocated") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
        <Badge variant="outline" className={allocationStatusClass("allocated")}>
          allocated
        </Badge>
        <p className="mt-1 text-xs text-green-800">
          {entryContext.allocation_percentage}% ·{" "}
          {entryContext.weekly_allocation_hours}h/wk · daily plan{" "}
          {entryContext.planned_daily_hours ?? "unknown"}h
        </p>
      </div>
    );
  }

  if (hasProject) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <Badge
          variant="outline"
          className={allocationStatusClass("unallocated")}
        >
          unallocated
        </Badge>
        <p className="mt-1 text-xs">
          No allocation configured for this employee, date, and project. Manual
          logging is still allowed.
        </p>
      </div>
    );
  }

  return null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: TimeEntryStatus }) {
  return (
    <Badge variant="outline" className={statusClass(status)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function SourceBadge({ source }: { source: TimeEntrySourceType }) {
  return (
    <Badge variant="outline" className={sourceClass(source)}>
      {SOURCE_LABELS[source]}
    </Badge>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
        {value}
      </div>
    </div>
  );
}
