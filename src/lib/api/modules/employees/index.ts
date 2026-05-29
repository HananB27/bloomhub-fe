import { API_BASE_URL } from "../../../config";
import {
  get,
  post,
  patch,
  del,
  buildQueryString,
  handleListResponse,
} from "../../helpers/httpClient";
import {
  transformEmployeeData,
  transformEmployeeList,
  type EmployeeProfileData,
} from "../../helpers/transformers";
import {
  fetchEmployeeProfileModalBundle,
  fetchEmployeeProfileModalBundleWithRevalidation,
  fetchHrProfilesPageBundle,
  type EmployeeProfileModalBundleApplied,
  type EmployeeProfileModalBundleFetchMeta,
  type HrProfilesPageBundleApplied,
} from "./hrProfileBundles";
import type { ProfileModalBundleSection } from "../../constants/hrEmployeeProfilesEndpoints";
import { fetchWithAuthRetry } from "../../refresh";

export interface SalaryHistoryItem {
  id: number;
  employee_id: number;
  effective_date: string;
  amount: number;
  currency: string;
  notes?: string;
  approved_by?: string;
  created_at: string;
}

export interface EmployeeProfileChangeHistoryItem {
  id: number | string;
  employee_id: number;
  field: string;
  old_value: unknown;
  new_value: unknown;
  changed_by?: number | string | null;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
  changed_at: string;
  created_at?: string;
}

function uniqueStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === "string")
    )
  );
}

export type EmployeeExportFormat = "csv" | "xlsx" | "json" | "pdf";
export type EmployeeExportScope = "all" | "filtered";

export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  birth_date?: string;
  address?: string;
  avatar_color?: string;
  role?: number | null;
  role_name?: string;
  job_title?: string;
  employment_type?: string;
  department?: string;
  team?: string;
  location?: string;
  start_date?: string;
  employment_status?: string;
  manager?: number | null;
  manager_name?: string;
  project?: number | null;
  project_id?: number | null;
  onboarding_template?: number | null;
  onboarding_template_id?: number | null;
  send_invite?: boolean;
  start_onboarding?: boolean;
  publish_intro_announcement?: boolean;
  intro_announcement_title?: string;
  intro_announcement_body?: string;
  intro_announcement_scheduled_at?: string | null;
}

export interface EmployeeIntroAnnouncementPayload {
  publish_intro_announcement?: boolean;
  intro_announcement_title?: string;
  intro_announcement_body?: string;
  intro_announcement_scheduled_at?: string | null;
}

export interface EmployeeEmailAvailability {
  email: string;
  available: boolean;
  employee_id?: number | string | null;
  user_id?: number | string | null;
}

export interface EmployeeExportPayload {
  format: EmployeeExportFormat;
  scope: EmployeeExportScope;
  columns: string[];
  include_header: boolean;
  filename?: string;
  filters?: {
    search?: string;
    department?: string;
    status?: string;
  };
}

export interface EmployeeExportResult {
  blob: Blob;
  filename: string;
}

export type { EmployeeProfileData } from "../../helpers/transformers";

export type {
  EmployeeProfileModalBundleApplied,
  EmployeeProfileModalBundleFetchMeta,
  HrProfilesPageBundleApplied,
} from "./hrProfileBundles";

export type { ProfileModalBundleSection } from "../../constants/hrEmployeeProfilesEndpoints";

export { PROFILE_MODAL_BUNDLE_SECTIONS } from "../../constants/hrEmployeeProfilesEndpoints";

function parseContentDispositionFilename(value: string | null): string | null {
  if (!value) return null;

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }

  const filenameMatch = value.match(/filename=([^;]+)/i);
  return filenameMatch?.[1]?.trim().replace(/^"|"$/g, "") ?? null;
}

function buildEmployeeExportQuery(payload: EmployeeExportPayload): string {
  const params = new URLSearchParams();
  params.set("format", payload.format);
  params.set("scope", payload.scope);
  params.set("columns", payload.columns.join(","));
  params.set("include_header", String(payload.include_header));
  if (payload.filename) params.set("filename", payload.filename);

  if (payload.filters?.search) params.set("search", payload.filters.search);
  if (payload.filters?.department) {
    params.set("department", payload.filters.department);
  }
  if (payload.filters?.status) params.set("status", payload.filters.status);

  return params.toString();
}

export const employeeApi = {
  async listEmployees(
    params?: {
      search?: string;
      department?: string;
      role__name?: string;
      is_active?: boolean;
      page?: number;
      page_size?: number;
    },
    init?: RequestInit
  ): Promise<{ results: EmployeeProfileData[]; count: number }> {
    const url = `${API_BASE_URL}/api/employees/${buildQueryString(params)}`;
    const data = await get<unknown>(url, "Failed to fetch employees", init);
    const result = handleListResponse<EmployeeProfileData>(
      data as
        | EmployeeProfileData[]
        | { results?: EmployeeProfileData[]; count?: number }
    );
    return { ...result, results: transformEmployeeList(result.results) };
  },

  async getEmployee(id: number | string): Promise<EmployeeProfileData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await get<any>(
      `${API_BASE_URL}/api/employees/${id}/`,
      "Failed to fetch employee"
    );
    return transformEmployeeData(data);
  },

  async updateEmployee(
    id: number | string,
    data: Partial<EmployeeProfileData> & EmployeeIntroAnnouncementPayload
  ): Promise<EmployeeProfileData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = await patch<any>(
      `${API_BASE_URL}/api/employees/${id}/`,
      data,
      "Failed to update employee"
    );
    return transformEmployeeData(responseData);
  },

  async createEmployee(
    data: CreateEmployeePayload
  ): Promise<EmployeeProfileData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = await post<any>(
      `${API_BASE_URL}/api/employees/`,
      data,
      "Failed to create employee"
    );
    return transformEmployeeData(responseData);
  },

  async checkEmailAvailability(
    email: string,
    init?: RequestInit
  ): Promise<EmployeeEmailAvailability> {
    const url = `${API_BASE_URL}/api/employees/email-availability/${buildQueryString({ email })}`;
    const data = await get<unknown>(
      url,
      "Failed to check employee email",
      init
    );
    const obj = data as Record<string, unknown>;
    const normalizedEmail = String(obj.email ?? email);
    const available =
      typeof obj.available === "boolean"
        ? obj.available
        : typeof obj.exists === "boolean"
          ? !obj.exists
          : true;

    return {
      email: normalizedEmail,
      available,
      employee_id:
        (obj.employee_id as number | string | null | undefined) ?? null,
      user_id: (obj.user_id as number | string | null | undefined) ?? null,
    };
  },

  async exportEmployees(
    payload: EmployeeExportPayload
  ): Promise<EmployeeExportResult> {
    const query = buildEmployeeExportQuery(payload);
    let response = await fetchWithAuthRetry(
      `${API_BASE_URL}/api/employees/export/${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          Accept:
            payload.format === "json"
              ? "application/json"
              : "application/octet-stream",
        },
      }
    );

    if (response.status === 404) {
      response = await fetchWithAuthRetry(
        `${API_BASE_URL}/api/employees/export${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            Accept:
              payload.format === "json"
                ? "application/json"
                : "application/octet-stream",
          },
        }
      );
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const errorPayload = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => "");

      const message =
        errorPayload && typeof errorPayload === "object"
          ? ((errorPayload as { detail?: string; message?: string }).detail ??
            (errorPayload as { detail?: string; message?: string }).message)
          : undefined;
      throw new Error(message || "Failed to export employees");
    }

    const blob = await response.blob();
    const filenameFromHeader = parseContentDispositionFilename(
      response.headers.get("content-disposition")
    );

    return {
      blob,
      filename:
        filenameFromHeader ||
        payload.filename ||
        `bloomhub-employees.${payload.format}`,
    };
  },

  async getSalaryHistory(
    employeeId: number | string
  ): Promise<SalaryHistoryItem[]> {
    return get<SalaryHistoryItem[]>(
      `${API_BASE_URL}/api/employees/${employeeId}/salary-history/`,
      "Failed to fetch salary history"
    );
  },

  async getProfileChangeHistory(
    employeeId: number | string
  ): Promise<EmployeeProfileChangeHistoryItem[]> {
    return get<EmployeeProfileChangeHistoryItem[]>(
      `${API_BASE_URL}/api/employees/${employeeId}/profile-change-history/`,
      "Failed to fetch profile change history"
    );
  },

  async updateEmployeeRole(
    employeeId: number | string,
    roleId: number
  ): Promise<EmployeeProfileData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = await post<any>(
      `${API_BASE_URL}/api/employees/${employeeId}/update-role/`,
      { role_id: roleId },
      "Failed to update employee role"
    );
    return transformEmployeeData(responseData);
  },

  async deleteEmployee(id: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}/api/employees/${id}/`,
      "Failed to delete employee"
    );
  },

  async getDepartments(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/departments/`,
      "Failed to fetch departments"
    );
    if (Array.isArray(data)) return data as string[];
    const obj = data as Record<string, unknown>;
    return (obj.departments ?? obj.results ?? []) as string[];
  },

  async getProjects(): Promise<
    { id: number; name: string; leaders?: { id: number; name: string }[] }[]
  > {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/projects/`,
      "Failed to fetch projects"
    );
    if (Array.isArray(data))
      return data as {
        id: number;
        name: string;
        leaders?: { id: number; name: string }[];
      }[];
    const obj = data as Record<string, unknown>;
    return (obj.projects ?? obj.results ?? []) as {
      id: number;
      name: string;
      leaders?: { id: number; name: string }[];
    }[];
  },

  async getProjectTechLeads(
    projectId: number
  ): Promise<{ id: number; first_name: string; last_name: string }[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/projects/${projectId}/tech-leads/`,
      "Failed to fetch tech leads"
    );
    if (Array.isArray(data))
      return data as { id: number; first_name: string; last_name: string }[];
    const obj = data as Record<string, unknown>;
    return (obj.tech_leads ?? obj.results ?? []) as {
      id: number;
      first_name: string;
      last_name: string;
    }[];
  },

  async getRoles(): Promise<{ id: number; name: string }[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/roles/`,
      "Failed to fetch roles"
    );
    if (Array.isArray(data)) return data as { id: number; name: string }[];
    const obj = data as Record<string, unknown>;
    return (obj.roles ?? obj.results ?? []) as { id: number; name: string }[];
  },

  async getCPFLevels(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/`,
      "Failed to fetch CPF levels"
    );
    if (Array.isArray(data)) return uniqueStringList(data);
    const obj = data as Record<string, unknown>;
    return uniqueStringList(obj.cpf_levels ?? obj.results);
  },

  async loadHrProfilesPageBundle(
    signal?: AbortSignal
  ): Promise<HrProfilesPageBundleApplied | null> {
    return fetchHrProfilesPageBundle(signal);
  },

  async loadEmployeeProfileModalBundle(
    employeeId: number | string,
    options?: {
      signal?: AbortSignal;
      sections?: readonly ProfileModalBundleSection[];
    }
  ): Promise<EmployeeProfileModalBundleApplied | null> {
    return fetchEmployeeProfileModalBundle(employeeId, options);
  },

  async loadEmployeeProfileModalBundleWithRevalidation(
    employeeId: number | string,
    options: {
      ifNoneMatch: string;
      signal?: AbortSignal;
      sections?: readonly ProfileModalBundleSection[];
    }
  ): Promise<EmployeeProfileModalBundleFetchMeta> {
    return fetchEmployeeProfileModalBundleWithRevalidation(employeeId, options);
  },
};
