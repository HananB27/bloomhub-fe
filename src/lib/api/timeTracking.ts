import { API_BASE_URL } from "../config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
  patch,
  post,
} from "./helpers/httpClient";
import { fetchWithAuthRetry } from "./refresh";
import { getAccessToken } from "./tokens";

const base = `${API_BASE_URL}/api`;
const TEMPO_AUTHORIZE_PATH = "/oauth/authorize/";
const TEMPO_AUTHORIZE_REDIRECT_PATH = "/oauth/authorize/redirect/";

function normalizeTempoAuthorizeUrl(authorizeUrl: string): string {
  try {
    const url = new URL(authorizeUrl);
    const normalizedPath = url.pathname.endsWith("/")
      ? url.pathname
      : `${url.pathname}/`;

    if (
      normalizedPath === TEMPO_AUTHORIZE_PATH ||
      normalizedPath === TEMPO_AUTHORIZE_REDIRECT_PATH
    ) {
      url.protocol = "https:";
      url.host = "api.tempo.io";
      url.pathname =
        normalizedPath === TEMPO_AUTHORIZE_REDIRECT_PATH
          ? "/oauth/authorize/redirect"
          : TEMPO_AUTHORIZE_PATH;
      return url.toString();
    }
  } catch {
    // Fall through and let the browser/backend surface malformed URLs.
  }

  return authorizeUrl;
}

export type TimeEntrySourceType =
  | "manual"
  | "jira"
  | "tempo"
  | "document_import";

export type TimeEntryStatus = "draft" | "submitted" | "approved" | "rejected";

export interface TimeTask {
  id: number;
  project_id: number;
  project_name: string;
  name: string;
  description: string;
  jira_issue_key: string;
  jira_project_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryAuditEvent {
  id: number;
  event_type:
    | "created"
    | "updated"
    | "submitted"
    | "approved"
    | "rejected"
    | "deleted"
    | "imported"
    | "corrected";
  actor: number | null;
  actor_name: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TimeEntry {
  id: number;
  employee_id: number;
  employee_name: string;
  project_id: number;
  project_name: string;
  task_id: number | null;
  task_name: string | null;
  work_date: string;
  start_time: string | null;
  hours: string;
  notes: string;
  source_type: TimeEntrySourceType;
  status: TimeEntryStatus;
  source_external_id: string;
  source_metadata: Record<string, unknown>;
  duplicate_fingerprint: string;
  duplicate_of: number | null;
  submitted_at: string | null;
  submitted_by: number | null;
  approved_at: string | null;
  approved_by: number | null;
  rejected_at: string | null;
  rejected_by: number | null;
  rejection_reason: string;
  audit_events: TimeEntryAuditEvent[];
  allocation_context?: TimeEntryAllocationContext | null;
  created_at: string;
  updated_at: string;
}

export type AllocationStatus = "allocated" | "unallocated";

export interface TimeEntryAllocationContext {
  allocation_status: AllocationStatus;
  assignment_id: number | null;
  allocation_percentage: string | null;
  weekly_allocation_hours: string | null;
  planned_daily_hours: string | null;
  start_date: string | null;
  end_date: string | null;
  project_status: string | null;
}

export interface TimeTaskFilters {
  project_id?: number;
  project?: number;
  is_active?: boolean;
  jira_project_key?: string;
  jira_issue_key?: string;
  search?: string;
}

export interface TimeEntryFilters {
  employee?: number;
  project?: number;
  task?: number;
  status?: TimeEntryStatus;
  source_type?: TimeEntrySourceType;
  work_date?: string;
  date_from?: string;
  date_to?: string;
}

export interface ActiveAllocationFilters {
  work_date?: string;
  employee_id?: number;
  employee?: number;
}

export interface ActiveAllocationAssignment {
  assignment_id: number;
  project_id: number;
  project_name: string;
  allocation_percentage: string;
  weekly_allocation_hours: string;
  planned_weekly_hours: string;
  start_date: string;
  end_date: string | null;
  status: string;
}

export interface ActiveAllocations {
  employee_id: number;
  work_date: string;
  total_allocation_percentage: string;
  remaining_allocation_percentage: string;
  total_weekly_allocation_hours: string;
  remaining_weekly_allocation_hours: string;
  assignments: ActiveAllocationAssignment[];
}

export interface WeeklyDashboardFilters {
  week_start?: string;
  employee_id?: number;
  employee?: number;
}

export interface WeeklyDashboard {
  week_start: string;
  week_end: string;
  total_hours: string;
  totals_by_source: Record<string, string>;
  totals_by_status: Record<string, string>;
  employees: Array<{
    employee_id: number;
    employee_name: string;
    total_hours: string;
  }>;
  entries: TimeEntry[];
}

export interface ApprovalQueueFilters {
  week_start?: string;
  date_from?: string;
  date_to?: string;
  employee?: number;
  employee_id?: number;
  project?: number;
  project_id?: number;
  source_type?: TimeEntrySourceType;
  status?: TimeEntryStatus;
}

export interface PlannedVsActualFilters {
  week_start?: string;
  date_from?: string;
  date_to?: string;
  employee?: number;
  employee_id?: number;
  project?: number;
  project_id?: number;
}

export interface PlannedVsActualRow {
  employee_id: number;
  employee_name: string;
  week_start: string;
  week_end: string;
  project_id: number;
  project_name: string;
  planned_hours: string;
  actual_hours: string;
  variance_hours: string;
  allocation_percentage: string;
  allocation_status: "allocated" | "unallocated";
  assignments: Array<{
    assignment_id: number;
    allocation_percentage: number;
    start_date: string;
    end_date: string | null;
    status: string;
    active_weekdays: number;
  }>;
}

export interface PlannedVsActualResponse {
  date_from: string;
  date_to: string;
  rows: PlannedVsActualRow[];
}

export interface TimesheetExportFilters {
  format: "csv" | "xlsx";
  date_from?: string;
  date_to?: string;
  employee?: number;
  project?: number;
  source_type?: TimeEntrySourceType;
  status?: TimeEntryStatus;
}

export interface TimeTaskPayload {
  project_id: number;
  name: string;
  description?: string;
  jira_issue_key?: string;
  jira_project_key?: string;
  is_active?: boolean;
}

export interface TimeEntryPayload {
  project_id: number;
  task_id?: number | null;
  work_date: string;
  start_time?: string | null;
  hours: string;
  notes?: string;
  employee_id?: number;
}

export type WeeklyAllocationStatus = "allocated" | "unallocated";

export type WeeklyAssignmentStatus = "active" | "completed" | "on_hold";

export interface WeeklyAssignmentSlice {
  assignment_id: number;
  allocation_percentage: number;
  start_date: string;
  end_date: string | null;
  status: WeeklyAssignmentStatus;
  active_weekdays: number;
}

export interface WeeklyProjectSummary {
  project_id: number;
  project_name: string;
  planned_hours: string;
  actual_hours: string;
  variance_hours: string;
  allocation_percentage: string;
  allocation_status: WeeklyAllocationStatus;
  assignments: WeeklyAssignmentSlice[];
}

export interface WeeklySummary {
  employee_id: number;
  employee_name: string;
  week_start: string;
  week_end: string;
  weekly_capacity_hours: string;
  planned_hours: string;
  actual_hours: string;
  remaining_capacity_hours: string;
  unallocated_capacity_hours: string;
  projects: WeeklyProjectSummary[];
}

export interface JiraSettings {
  base_url: string;
  auth_email: string;
  has_api_token: boolean;
  enabled: boolean;
  last_test_status: string;
  last_test_message: string;
  last_test_at: string | null;
  last_test_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface JiraSettingsPayload {
  base_url?: string;
  auth_email?: string;
  api_token?: string;
  enabled?: boolean;
}

export interface JiraOAuthStatus {
  connected: boolean;
  jira_account_id: string | null;
  jira_email: string | null;
  jira_display_name: string | null;
  cloud_id: string | null;
  site_url: string | null;
  connected_at: string | null;
  token_expires_at: string | null;
  scopes: string[];
}

export interface JiraOAuthAuthorize {
  authorize_url: string;
  state: string;
}

export interface TempoOAuthStatus {
  connected: boolean;
  tempo_account_id: string | null;
  tempo_email: string | null;
  tempo_display_name: string | null;
  site_url: string | null;
  connected_at: string | null;
  token_expires_at: string | null;
  scopes: string[];
}

export interface TempoOAuthAuthorize {
  authorize_url: string;
  state: string;
}

export interface JiraUserMapping {
  id: number;
  jira_account_id: string;
  jira_display_name: string;
  employee_id: number;
  employee_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JiraProjectMapping {
  id: number;
  jira_project_key: string;
  jira_project_name: string;
  project_id: number;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JiraIssueMapping {
  id: number;
  jira_issue_key: string;
  jira_issue_id: string;
  task_id: number;
  task_name: string;
  project_id: number;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JiraMappings {
  users: JiraUserMapping[];
  projects: JiraProjectMapping[];
  issues: JiraIssueMapping[];
}

export type JiraMappingPayload =
  | {
      mapping_type: "user";
      id?: number;
      jira_account_id?: string;
      jira_display_name?: string;
      employee_id?: number;
      is_active?: boolean;
    }
  | {
      mapping_type: "project";
      id?: number;
      jira_project_key?: string;
      jira_project_name?: string;
      project_id?: number;
      is_active?: boolean;
    }
  | {
      mapping_type: "issue";
      id?: number;
      jira_issue_key?: string;
      jira_issue_id?: string;
      task_id?: number;
      is_active?: boolean;
    };

export interface JiraProjectDiscoveryPayload {
  query?: string;
  employee_id?: number;
  project_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface JiraProjectDiscoveryRow {
  [key: string]: unknown;
  id?: string | number;
  jira_account_id?: string;
  account_id?: string;
  accountId?: string;
  jira_display_name?: string;
  display_name?: string;
  displayName?: string;
  email?: string;
  jira_project_key?: string;
  project_key?: string;
  key?: string;
  jira_project_name?: string;
  project_name?: string;
  name?: string;
  jira_issue_key?: string;
  issue_key?: string;
  jira_issue_id?: string;
  issue_id?: string;
  summary?: string;
  employee_id?: number | null;
  suggested_employee_id?: number | null;
  suggested_employee_name?: string;
  project_id?: number | null;
  suggested_project_id?: number | null;
  suggested_project_name?: string;
  task_id?: number | null;
  suggested_task_id?: number | null;
  suggested_task_name?: string;
  confidence?: number | string | null;
  existing_mapping_status?: string;
  existing_mapping_id?: number | null;
  existing_employee_name?: string;
  existing_project_name?: string;
  existing_task_name?: string;
}

export interface JiraProjectDiscoveryResult {
  users: JiraProjectDiscoveryRow[];
  projects: JiraProjectDiscoveryRow[];
  issues: JiraProjectDiscoveryRow[];
  counts?: Record<string, number>;
}

export interface JiraImportFilters {
  date_from: string;
  date_to: string;
  employee_id?: number;
  project_id?: number;
  jira_project_key?: string;
  jira_issue_key?: string;
  worklog_id?: string;
}

export interface JiraImportValidationMessage {
  code: string;
  message: string;
}

export interface JiraImportRow {
  worklog_id: string;
  issue_key: string;
  employee_id: number | null;
  employee_name: string;
  project_id: number | null;
  project_name: string;
  task_id: number | null;
  task_name: string;
  work_date: string | null;
  hours: string;
  comment: string;
  status: "valid" | "error";
  action: "create" | "update" | "skip";
  duplicate_entry_id: number | null;
  existing_entry_id: number | null;
  validation_messages: JiraImportValidationMessage[];
  source_metadata: Record<string, unknown>;
  duplicate_fingerprint: string;
}

export interface JiraImportPreview {
  source_type: "jira";
  date_from: string;
  date_to: string;
  row_count: number;
  valid_count: number;
  error_count: number;
  rows: JiraImportRow[];
}

export interface JiraImportCommitResult {
  source_type: "jira";
  counts: {
    created: number;
    updated: number;
    skipped: number;
    error: number;
  };
  entry_ids: number[];
  preview: JiraImportPreview;
}

export interface JiraAssignedIssuesImportPayload {
  employee_id: number;
  max_results?: number;
  dry_run?: boolean;
}

export interface JiraAssignedIssuesImportRow {
  jira_issue_key: string;
  jira_issue_id: string;
  jira_project_key: string;
  jira_project_name: string;
  project_id: number | null;
  task_id: number | null;
  task_name: string;
  action: string;
  validation_messages: string[];
}

export interface JiraAssignedIssuesImportResult {
  source_type: "jira";
  employee_id: number;
  jira_account_id: string;
  dry_run: boolean;
  row_count: number;
  counts: {
    created_projects: number;
    created_tasks: number;
    updated_tasks: number;
    created_issue_mappings: number;
    updated_issue_mappings: number;
    errors: number;
  };
  rows: JiraAssignedIssuesImportRow[];
}

export interface TempoSettings {
  base_url: string;
  has_api_token: boolean;
  enabled: boolean;
  last_test_status: string;
  last_test_message: string;
  last_test_at: string | null;
  last_test_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TempoSettingsPayload {
  base_url?: string;
  api_token?: string;
  enabled?: boolean;
}

export interface TempoAbsenceSyncSettings {
  enabled: boolean;
  default_jira_issue_key: string | null;
  daily_hours: string;
  default_start_time: string;
  leave_type_issue_keys: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface TempoAbsenceSyncSettingsPayload {
  enabled?: boolean;
  default_jira_issue_key?: string | null;
  daily_hours?: string;
  default_start_time?: string;
  leave_type_issue_keys?: Record<string, string>;
}

export interface TempoAbsenceSyncFailure {
  employee_name: string;
  leave_request_id: number;
  work_date: string;
  leave_type: string;
  jira_issue_key: string | null;
  error_code: string;
  last_error: string;
  retry_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface TempoUserMapping {
  id: number;
  tempo_user_id: string;
  tempo_display_name: string;
  employee_id: number;
  employee_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TempoAccountMapping {
  id: number;
  tempo_account_id: string;
  tempo_account_key: string;
  tempo_account_name: string;
  project_id: number;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TempoProjectMapping {
  id: number;
  tempo_project_id: string;
  tempo_project_key: string;
  tempo_project_name: string;
  project_id: number;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TempoTeamMapping {
  id: number;
  tempo_team_id: string;
  tempo_team_name: string;
  project_id: number;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TempoMappings {
  users: TempoUserMapping[];
  accounts: TempoAccountMapping[];
  projects: TempoProjectMapping[];
  teams: TempoTeamMapping[];
}

export type TempoMappingPayload =
  | {
      mapping_type: "user";
      id?: number;
      tempo_user_id?: string;
      tempo_display_name?: string;
      employee_id?: number;
      is_active?: boolean;
    }
  | {
      mapping_type: "account";
      id?: number;
      tempo_account_id?: string;
      tempo_account_key?: string;
      tempo_account_name?: string;
      project_id?: number;
      is_active?: boolean;
    }
  | {
      mapping_type: "project";
      id?: number;
      tempo_project_id?: string;
      tempo_project_key?: string;
      tempo_project_name?: string;
      project_id?: number;
      is_active?: boolean;
    }
  | {
      mapping_type: "team";
      id?: number;
      tempo_team_id?: string;
      tempo_team_name?: string;
      project_id?: number;
      is_active?: boolean;
    };

export interface TempoProjectDiscoveryPayload {
  base_url: string;
  api_token?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface TempoProjectDiscoveryRow {
  [key: string]: unknown;
  tempo_id?: string;
  id?: string;
  tempo_key?: string;
  key?: string;
  tempo_name?: string;
  name?: string;
  account_id?: string;
  account_key?: string;
  account_name?: string;
  project_key?: string;
  project_name?: string;
  team_id?: string;
  team_name?: string;
  tempo_account_id?: string;
  tempo_account_key?: string;
  tempo_account_name?: string;
  tempo_project_id?: string;
  tempo_project_key?: string;
  tempo_project_name?: string;
  tempo_team_id?: string;
  tempo_team_name?: string;
  project_id?: number | null;
  suggested_project_id?: number | null;
  suggested_project_name?: string;
  bloomhub_project_name?: string;
  confidence?: number | string | null;
  existing_mapping_status?: string;
  existing_mapping_id?: number | null;
  existing_project_id?: number | null;
  existing_project_name?: string;
}

export interface TempoProjectDiscoveryResult {
  accounts: TempoProjectDiscoveryRow[];
  projects: TempoProjectDiscoveryRow[];
  teams: TempoProjectDiscoveryRow[];
}

export interface TempoImportFilters {
  date_from: string;
  date_to: string;
  employee_id?: number;
  tempo_team_id?: string;
  tempo_account_id?: string;
  tempo_account_key?: string;
  tempo_project_id?: string;
  project_id?: number;
  jira_issue_key?: string;
  worklog_id?: string;
}

export interface TempoImportRow {
  worklog_id: string;
  jira_issue_key: string;
  employee_id: number | null;
  employee_name: string;
  project_id: number | null;
  project_name: string;
  task_id: number | null;
  task_name: string;
  work_date: string | null;
  hours: string;
  comment: string;
  status: "valid" | "error";
  action: "create" | "update" | "skip";
  duplicate_entry_id: number | null;
  existing_entry_id: number | null;
  validation_messages: JiraImportValidationMessage[];
  source_metadata: Record<string, unknown>;
  duplicate_fingerprint: string;
}

export interface TempoImportPreview {
  source_type: "tempo";
  date_from: string;
  date_to: string;
  row_count: number;
  valid_count: number;
  error_count: number;
  rows: TempoImportRow[];
}

export interface TempoImportCommitResult {
  source_type: "tempo";
  counts: {
    created: number;
    updated: number;
    skipped: number;
    error: number;
  };
  entry_ids: number[];
  preview: TempoImportPreview;
}

export interface ImportValidationMessage {
  code: string;
  message: string;
}

export interface TimeImportRow {
  id: number;
  sheet_name: string;
  table_index: number | null;
  row_number: number;
  row_index: number;
  raw_data: Record<string, unknown>;
  parsed_data: {
    employee_id?: number;
    employee_name?: string;
    work_date?: string;
    hours?: string;
    project_id?: number;
    project_name?: string;
    task_id?: number;
    task_name?: string;
    jira_issue_key?: string;
    notes?: string;
    duplicate_entry_id?: number;
    duplicate_fingerprint?: string;
  };
  original_row_fingerprint: string;
  status: "pending" | "valid" | "error" | "skipped" | "committed";
  validation_messages: ImportValidationMessage[];
  committed_entry_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimeImportBatch {
  id: number;
  source_type: "document_import" | "jira" | "tempo";
  file_name: string;
  uploaded_by: number | null;
  uploaded_by_name: string;
  requested_filters: Record<string, unknown>;
  column_mapping: Record<string, string>;
  detected_columns: {
    headers?: string[];
    mapping?: Record<string, string>;
    ambiguous?: Array<{ field: string; candidates: string[] }>;
    missing_required?: string[];
  };
  status:
    | "uploaded"
    | "needs_mapping"
    | "previewed"
    | "partially_committed"
    | "committed"
    | "failed";
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  skipped_rows: number;
  committed_rows: number;
  validation_messages: ImportValidationMessage[];
  rows: TimeImportRow[];
  created_at: string;
  updated_at: string;
}

export interface ImportHistoryFilters {
  source_type?: "document_import" | "jira" | "tempo";
  status?:
    | "uploaded"
    | "needs_mapping"
    | "previewed"
    | "partially_committed"
    | "committed"
    | "failed";
  uploaded_by?: number;
  date_from?: string;
  date_to?: string;
}

export interface SourceChangeReviewFilters {
  date_from?: string;
  date_to?: string;
  employee?: number;
  employee_id?: number;
  project?: number;
  project_id?: number;
  source_type?: "jira" | "tempo" | "document_import";
  status?: TimeEntryStatus;
}

export interface ResolveSourceChangePayload {
  action: "accept_current" | "apply_source" | "leave_flagged";
  note?: string;
}

export interface DocumentColumnMappingPayload {
  column_mapping: {
    employee: string;
    employee_id?: string;
    date: string;
    work_date?: string;
    project: string;
    project_id?: string;
    hours: string;
    task?: string;
    task_id?: string;
    jira_issue?: string;
    jira_issue_key?: string;
    notes?: string;
  };
}

async function uploadDocumentImport(file: File): Promise<TimeImportBatch> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getAccessToken();
  const response = await fetchWithAuthRetry(
    `${base}/time-imports/documents/upload/`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    }
  );
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const message =
      typeof error.detail === "string"
        ? error.detail
        : typeof error.message === "string"
          ? error.message
          : "Failed to upload document";
    throw new Error(message);
  }
  return response.json() as Promise<TimeImportBatch>;
}

async function downloadTimesheetExport(
  filters: TimesheetExportFilters
): Promise<{ blob: Blob; filename: string }> {
  const qs = buildQueryString(
    filters as unknown as Record<
      string,
      string | number | boolean | null | undefined
    >
  );
  const token = getAccessToken();
  const response = await fetchWithAuthRetry(
    `${base}/time-tracking/exports/timesheets/${qs}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const message =
      typeof error.detail === "string"
        ? error.detail
        : typeof error.message === "string"
          ? error.message
          : "Failed to export timesheets";
    throw new Error(message);
  }
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return {
    blob: await response.blob(),
    filename:
      match?.[1] ?? `timesheets.${filters.format === "xlsx" ? "xlsx" : "csv"}`,
  };
}

function listResult<T>(data: unknown): T[] {
  return handleListResponse<T>(data as { results?: T[]; count?: number } | T[])
    .results;
}

export const timeTrackingApi = {
  async listTasks(params?: TimeTaskFilters): Promise<TimeTask[]> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return listResult<TimeTask>(
      await get<unknown>(`${base}/time-tasks/${qs}`, "Failed to load tasks")
    );
  },

  async createTask(payload: TimeTaskPayload): Promise<TimeTask> {
    return post<TimeTask>(
      `${base}/time-tasks/`,
      payload,
      "Failed to create task"
    );
  },

  async updateTask(
    id: number,
    payload: Partial<TimeTaskPayload>
  ): Promise<TimeTask> {
    return patch<TimeTask>(
      `${base}/time-tasks/${id}/`,
      payload,
      "Failed to update task"
    );
  },

  async deleteTask(id: number): Promise<void> {
    return del(`${base}/time-tasks/${id}/`, "Failed to delete task");
  },

  async listEntries(params?: TimeEntryFilters): Promise<TimeEntry[]> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return listResult<TimeEntry>(
      await get<unknown>(`${base}/time-entries/${qs}`, "Failed to load entries")
    );
  },

  async getActiveAllocations(
    params?: ActiveAllocationFilters
  ): Promise<ActiveAllocations> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return get<ActiveAllocations>(
      `${base}/time-tracking/active-allocations/${qs}`,
      "Failed to load active allocations"
    );
  },

  async getWeeklyDashboard(
    params?: WeeklyDashboardFilters
  ): Promise<WeeklyDashboard> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return get<WeeklyDashboard>(
      `${base}/time-tracking/weekly-dashboard/${qs}`,
      "Failed to load weekly dashboard"
    );
  },

  async getApprovalQueue(params?: ApprovalQueueFilters): Promise<TimeEntry[]> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return get<TimeEntry[]>(
      `${base}/time-tracking/approval-queue/${qs}`,
      "Failed to load approval queue"
    );
  },

  async getPlannedVsActual(
    params?: PlannedVsActualFilters
  ): Promise<PlannedVsActualResponse> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return get<PlannedVsActualResponse>(
      `${base}/time-tracking/planned-vs-actual/${qs}`,
      "Failed to load planned vs actual report"
    );
  },

  async exportTimesheets(
    filters: TimesheetExportFilters
  ): Promise<{ blob: Blob; filename: string }> {
    return downloadTimesheetExport(filters);
  },

  async createEntry(payload: TimeEntryPayload): Promise<TimeEntry> {
    return post<TimeEntry>(
      `${base}/time-entries/`,
      payload,
      "Failed to save time entry"
    );
  },

  async updateEntry(
    id: number,
    payload: Partial<TimeEntryPayload>
  ): Promise<TimeEntry> {
    return patch<TimeEntry>(
      `${base}/time-entries/${id}/`,
      payload,
      "Failed to update time entry"
    );
  },

  async deleteEntry(id: number): Promise<void> {
    return del(`${base}/time-entries/${id}/`, "Failed to delete time entry");
  },

  async submitWeek(payload: {
    week_start: string;
    employee_id?: number;
  }): Promise<TimeEntry[]> {
    return post<TimeEntry[]>(
      `${base}/time-entries/submit-week/`,
      payload,
      "Failed to submit week"
    );
  },

  async getWeeklySummary(params: {
    week_start: string;
    employee_id?: number;
  }): Promise<WeeklySummary> {
    const qs = buildQueryString(params);
    return get<WeeklySummary>(
      `${base}/time-tracking/weekly-summary/${qs}`,
      "Failed to load weekly allocation summary"
    );
  },

  async approveEntry(id: number): Promise<TimeEntry> {
    return post<TimeEntry>(
      `${base}/time-entries/${id}/approve/`,
      {},
      "Failed to approve time entry"
    );
  },

  async rejectEntry(id: number, reason: string): Promise<TimeEntry> {
    return post<TimeEntry>(
      `${base}/time-entries/${id}/reject/`,
      { reason },
      "Failed to reject time entry"
    );
  },

  async getJiraSettings(): Promise<JiraSettings> {
    return get<JiraSettings>(
      `${base}/time-integrations/jira/settings/`,
      "Failed to load Jira settings"
    );
  },

  async updateJiraSettings(
    payload: JiraSettingsPayload
  ): Promise<JiraSettings> {
    return patch<JiraSettings>(
      `${base}/time-integrations/jira/settings/`,
      payload,
      "Failed to save Jira settings"
    );
  },

  async testJiraConnection(): Promise<JiraSettings> {
    return post<JiraSettings>(
      `${base}/time-integrations/jira/test-connection/`,
      {},
      "Failed to test Jira connection"
    );
  },

  async getJiraOAuthStatus(): Promise<JiraOAuthStatus> {
    return get<JiraOAuthStatus>(
      `${base}/time-integrations/jira/oauth/status/`,
      "Failed to load Jira OAuth status"
    );
  },

  async startJiraOAuth(): Promise<JiraOAuthAuthorize> {
    return get<JiraOAuthAuthorize>(
      `${base}/time-integrations/jira/oauth/authorize/`,
      "Failed to start Jira OAuth"
    );
  },

  async completeJiraOAuth(
    code: string,
    state: string
  ): Promise<JiraOAuthStatus> {
    return post<JiraOAuthStatus>(
      `${base}/time-integrations/jira/oauth/callback/`,
      { code, state },
      "Failed to complete Jira OAuth"
    );
  },

  async disconnectJira(): Promise<void> {
    return del(
      `${base}/time-integrations/jira/oauth/connection/`,
      "Failed to disconnect Jira"
    );
  },

  async syncJiraMappings(): Promise<JiraMappings> {
    return post<JiraMappings>(
      `${base}/time-integrations/jira/sync/`,
      {},
      "Failed to sync Jira data"
    );
  },

  async getJiraMappings(): Promise<JiraMappings> {
    return get<JiraMappings>(
      `${base}/time-integrations/jira/mappings/`,
      "Failed to load Jira mappings"
    );
  },

  async createJiraMapping(payload: JiraMappingPayload): Promise<unknown> {
    return post<unknown>(
      `${base}/time-integrations/jira/mappings/`,
      payload,
      "Failed to create Jira mapping"
    );
  },

  async updateJiraMapping(payload: JiraMappingPayload): Promise<unknown> {
    return patch<unknown>(
      `${base}/time-integrations/jira/mappings/`,
      payload,
      "Failed to update Jira mapping"
    );
  },

  async discoverJiraProjects(
    payload: JiraProjectDiscoveryPayload
  ): Promise<JiraProjectDiscoveryResult> {
    return post<JiraProjectDiscoveryResult>(
      `${base}/time-integrations/jira/project-discovery/`,
      payload,
      "Failed to discover Jira projects"
    );
  },

  async previewJiraImport(
    payload: JiraImportFilters
  ): Promise<JiraImportPreview> {
    return post<JiraImportPreview>(
      `${base}/time-imports/jira/preview/`,
      payload,
      "Failed to preview Jira import"
    );
  },

  async commitJiraImport(
    payload: JiraImportFilters
  ): Promise<JiraImportCommitResult> {
    return post<JiraImportCommitResult>(
      `${base}/time-imports/jira/commit/`,
      payload,
      "Failed to commit Jira import"
    );
  },

  async importJiraAssignedIssues(
    payload: JiraAssignedIssuesImportPayload
  ): Promise<JiraAssignedIssuesImportResult> {
    return post<JiraAssignedIssuesImportResult>(
      `${base}/time-imports/jira/assigned-issues/`,
      payload,
      "Failed to import assigned Jira issues"
    );
  },

  async getTempoOAuthStatus(): Promise<TempoOAuthStatus> {
    return get<TempoOAuthStatus>(
      `${base}/time-integrations/tempo/oauth/status/`,
      "Failed to load Tempo OAuth status"
    );
  },

  async startTempoOAuth(params?: {
    jira_url?: string;
    redirect_uri?: string;
  }): Promise<TempoOAuthAuthorize> {
    const qs = buildQueryString({
      jira_url: params?.jira_url,
      redirect_uri: params?.redirect_uri,
    });
    const response = await get<TempoOAuthAuthorize>(
      `${base}/time-integrations/tempo/oauth/authorize/${qs}`,
      "Failed to start Tempo OAuth"
    );
    return {
      ...response,
      authorize_url: normalizeTempoAuthorizeUrl(response.authorize_url),
    };
  },

  async completeTempoOAuth(
    code: string,
    state: string,
    redirectUri?: string
  ): Promise<TempoOAuthStatus> {
    return post<TempoOAuthStatus>(
      `${base}/time-integrations/tempo/oauth/callback/`,
      { code, state, redirect_uri: redirectUri },
      "Failed to complete Tempo OAuth"
    );
  },

  async disconnectTempo(): Promise<void> {
    return del(
      `${base}/time-integrations/tempo/oauth/connection/`,
      "Failed to disconnect Tempo"
    );
  },

  async syncTempoMappings(): Promise<TempoMappings> {
    return post<TempoMappings>(
      `${base}/time-integrations/tempo/sync/`,
      {},
      "Failed to sync Tempo data"
    );
  },

  async syncTempo(payload: Record<string, never> = {}): Promise<unknown> {
    return post<unknown>(
      `${base}/time-integrations/tempo/sync/`,
      payload,
      "Failed to sync Tempo data"
    );
  },

  async getTempoSettings(): Promise<TempoSettings> {
    return get<TempoSettings>(
      `${base}/time-integrations/tempo/settings/`,
      "Failed to load Tempo settings"
    );
  },

  async updateTempoSettings(
    payload: TempoSettingsPayload
  ): Promise<TempoSettings> {
    return patch<TempoSettings>(
      `${base}/time-integrations/tempo/settings/`,
      payload,
      "Failed to save Tempo settings"
    );
  },

  async testTempoConnection(
    payload: TempoSettingsPayload
  ): Promise<TempoSettings> {
    return post<TempoSettings>(
      `${base}/time-integrations/tempo/test-connection/`,
      payload,
      "Failed to test Tempo connection"
    );
  },

  async getTempoMappings(): Promise<TempoMappings> {
    return get<TempoMappings>(
      `${base}/time-integrations/tempo/mappings/`,
      "Failed to load Tempo mappings"
    );
  },

  async createTempoMapping(payload: TempoMappingPayload): Promise<unknown> {
    return post<unknown>(
      `${base}/time-integrations/tempo/mappings/`,
      payload,
      "Failed to create Tempo mapping"
    );
  },

  async discoverTempoProjects(
    payload: TempoProjectDiscoveryPayload
  ): Promise<TempoProjectDiscoveryResult> {
    return post<TempoProjectDiscoveryResult>(
      `${base}/time-integrations/tempo/project-discovery/`,
      payload,
      "Failed to discover Tempo projects"
    );
  },

  async updateTempoMapping(payload: TempoMappingPayload): Promise<unknown> {
    return patch<unknown>(
      `${base}/time-integrations/tempo/mappings/`,
      payload,
      "Failed to update Tempo mapping"
    );
  },

  async getTempoAbsenceSyncSettings(): Promise<TempoAbsenceSyncSettings> {
    return get<TempoAbsenceSyncSettings>(
      `${base}/time-integrations/tempo/absence-sync/settings/`,
      "Failed to load Tempo absence sync settings"
    );
  },

  async updateTempoAbsenceSyncSettings(
    payload: TempoAbsenceSyncSettingsPayload
  ): Promise<TempoAbsenceSyncSettings> {
    return patch<TempoAbsenceSyncSettings>(
      `${base}/time-integrations/tempo/absence-sync/settings/`,
      payload,
      "Failed to save Tempo absence sync settings"
    );
  },

  async getTempoAbsenceSyncFailures(): Promise<TempoAbsenceSyncFailure[]> {
    return get<TempoAbsenceSyncFailure[]>(
      `${base}/time-integrations/tempo/absence-sync/failures/`,
      "Failed to load Tempo absence sync failures"
    );
  },

  async retryTempoAbsenceSync(leaveRequestId: number): Promise<unknown> {
    return post<unknown>(
      `${base}/time-integrations/tempo/absence-sync/${leaveRequestId}/retry/`,
      {},
      "Failed to retry Tempo absence sync"
    );
  },

  async previewTempoImport(
    payload: TempoImportFilters
  ): Promise<TempoImportPreview> {
    return post<TempoImportPreview>(
      `${base}/time-imports/tempo/preview/`,
      payload,
      "Failed to preview Tempo import"
    );
  },

  async commitTempoImport(
    payload: TempoImportFilters
  ): Promise<TempoImportCommitResult> {
    return post<TempoImportCommitResult>(
      `${base}/time-imports/tempo/commit/`,
      payload,
      "Failed to commit Tempo import"
    );
  },

  async uploadDocumentImport(file: File): Promise<TimeImportBatch> {
    return uploadDocumentImport(file);
  },

  async mapDocumentColumns(
    batchId: number,
    payload: DocumentColumnMappingPayload
  ): Promise<TimeImportBatch> {
    return post<TimeImportBatch>(
      `${base}/time-imports/documents/${batchId}/map-columns/`,
      payload,
      "Failed to map document columns"
    );
  },

  async previewDocumentImport(batchId: number): Promise<TimeImportBatch> {
    return get<TimeImportBatch>(
      `${base}/time-imports/documents/${batchId}/preview/`,
      "Failed to preview document import"
    );
  },

  async commitDocumentImport(batchId: number): Promise<TimeImportBatch> {
    return post<TimeImportBatch>(
      `${base}/time-imports/${batchId}/commit/`,
      {},
      "Failed to commit document import"
    );
  },

  async listImportBatches(
    params?: ImportHistoryFilters
  ): Promise<TimeImportBatch[]> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return listResult<TimeImportBatch>(
      await get<unknown>(
        `${base}/time-imports/${qs}`,
        "Failed to load import history"
      )
    );
  },

  async getImportBatch(batchId: number): Promise<TimeImportBatch> {
    return get<TimeImportBatch>(
      `${base}/time-imports/${batchId}/`,
      "Failed to load import batch"
    );
  },

  async getSourceChangeReview(
    params?: SourceChangeReviewFilters
  ): Promise<TimeEntry[]> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    return get<TimeEntry[]>(
      `${base}/time-tracking/source-change-review/${qs}`,
      "Failed to load source change review"
    );
  },

  async resolveSourceChange(
    entryId: number,
    payload: ResolveSourceChangePayload
  ): Promise<TimeEntry> {
    return post<TimeEntry>(
      `${base}/time-tracking/source-change-review/${entryId}/resolve/`,
      payload,
      "Failed to resolve source change"
    );
  },
};
