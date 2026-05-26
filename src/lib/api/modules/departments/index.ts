import { API_BASE_URL } from "../../../config";
import {
  del,
  get,
  handleListResponse,
  patch,
  post,
} from "../../helpers/httpClient";

export interface Department {
  id: number;
  name: string;
}

export interface DepartmentPayload {
  name: string;
}

export const departmentsApi = {
  async listDepartments(): Promise<Department[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/departments/`,
      "Failed to fetch departments"
    );
    const result = handleListResponse<Department>(
      data as Department[] | { results?: Department[]; count?: number }
    ).results;
    return (Array.isArray(result) ? result : []) as Department[];
  },

  async getDepartmentsAsStrings(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/departments/`,
      "Failed to fetch departments"
    );
    if (Array.isArray(data)) return data as string[];
    const obj = data as Record<string, unknown>;
    return (obj.departments ?? obj.results ?? []) as string[];
  },

  async createDepartment(payload: DepartmentPayload): Promise<Department> {
    return post<Department>(
      `${API_BASE_URL}/api/departments/`,
      payload,
      "Failed to create department"
    );
  },

  async updateDepartment(
    id: number,
    payload: Partial<DepartmentPayload>
  ): Promise<Department> {
    return patch<Department>(
      `${API_BASE_URL}/api/departments/${id}/`,
      payload,
      "Failed to update department"
    );
  },

  async deleteDepartment(id: number): Promise<void> {
    return del(
      `${API_BASE_URL}/api/departments/${id}/`,
      "Failed to delete department"
    );
  },
};
