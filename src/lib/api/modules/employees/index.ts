import { API_BASE_URL } from "../../../config";
import {
  get,
  post,
  patch,
  del,
  buildQueryString,
  handleListResponse,
  transformEmployeeData,
  transformEmployeeList,
  type EmployeeProfileData,
} from "../../helpers";

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

// Re-export for backward compatibility
export type { EmployeeProfileData } from "../../helpers";

export const employeeApi = {
  /**
   * Fetch all employees with optional filtering
   */
  async listEmployees(params?: {
    search?: string;
    department?: string;
    role__name?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ results: EmployeeProfileData[]; count: number }> {
    const url = `${API_BASE_URL}/api/employees/${buildQueryString(params)}`;
    const data = await get<unknown>(url, "Failed to fetch employees");

    const result = handleListResponse<EmployeeProfileData>(
      data as
        | EmployeeProfileData[]
        | { results?: EmployeeProfileData[]; count?: number }
    );
    return {
      ...result,
      results: transformEmployeeList(result.results),
    };
  },

  /**
   * Fetch a specific employee by ID
   */
  async getEmployee(id: number | string): Promise<EmployeeProfileData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await get<any>(
      `${API_BASE_URL}/api/employees/${id}/`,
      "Failed to fetch employee"
    );
    return transformEmployeeData(data);
  },

  /**
   * Update employee profile (PATCH - partial update)
   */
  async updateEmployee(
    id: number | string,
    data: Partial<EmployeeProfileData>
  ): Promise<EmployeeProfileData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = await patch<any>(
      `${API_BASE_URL}/api/employees/${id}/bulk-update/`,
      data,
      "Failed to update employee"
    );
    return transformEmployeeData(responseData);
  },

  /**
   * Get salary history for an employee
   */
  async getSalaryHistory(
    employeeId: number | string
  ): Promise<SalaryHistoryItem[]> {
    return get<SalaryHistoryItem[]>(
      `${API_BASE_URL}/api/employees/${employeeId}/salary-history/`,
      "Failed to fetch salary history"
    );
  },

  /**
   * Update employee role
   */
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

  /**
   * Soft delete (deactivate) an employee
   */
  async deleteEmployee(id: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}/api/employees/${id}/`,
      "Failed to delete employee"
    );
  },

  /**
   * Fetch all departments
   */
  async getDepartments(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/departments/`,
      "Failed to fetch departments"
    );
    if (Array.isArray(data)) return data as string[];
    const obj = data as Record<string, unknown>;
    return (obj.departments ?? obj.results ?? []) as string[];
  },

  /**
   * Fetch all projects
   */
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

  /**
   * Fetch tech leads for a specific project
   */
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

  /**
   * Fetch all roles
   */
  async getRoles(): Promise<{ id: number; name: string }[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/roles/`,
      "Failed to fetch roles"
    );
    if (Array.isArray(data)) return data as { id: number; name: string }[];
    const obj = data as Record<string, unknown>;
    return (obj.roles ?? obj.results ?? []) as { id: number; name: string }[];
  },

  /**
   * Fetch all CPF levels
   */
  async getCPFLevels(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/`,
      "Failed to fetch CPF levels"
    );
    if (Array.isArray(data)) return data as string[];
    const obj = data as Record<string, unknown>;
    return (obj.cpf_levels ?? obj.results ?? []) as string[];
  },
};
