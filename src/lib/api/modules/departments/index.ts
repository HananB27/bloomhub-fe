import { API_BASE_URL } from "../../../config";
import { get, handleListResponse } from "../../helpers/httpClient";

export interface Department {
  id: number;
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
};
