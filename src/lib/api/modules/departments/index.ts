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

function departmentName(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;

  const name = (value as Record<string, unknown>).name;
  return typeof name === "string" ? name : null;
}

export function normalizeDepartmentNames(values: unknown): string[] {
  const arr = Array.isArray(values)
    ? values
    : values && typeof values === "object"
      ? ((values as Record<string, unknown>).departments ??
        (values as Record<string, unknown>).results ??
        [])
      : [];

  if (!Array.isArray(arr)) return [];

  return Array.from(
    new Set(
      arr
        .map(departmentName)
        .filter((name): name is string => Boolean(name?.trim()))
        .map((name) => name.trim())
    )
  );
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
    return normalizeDepartmentNames(data);
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
