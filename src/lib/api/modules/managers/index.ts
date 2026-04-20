import { API_BASE_URL } from "../../../config";
import { get, buildQueryString } from "../../helpers/httpClient";

export interface Manager {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  cpf_level?: string;
  role: {
    id: number;
    name: string;
  };
}

const DEFAULT_MANAGER_ROLES = ["MGR", "MGR+", "ADMIN"];

export const managersApi = {
  async getEligibleManagers(roles?: string[]): Promise<Manager[]> {
    const params =
      roles && roles.length > 0 ? { role: roles.join(",") } : undefined;
    const url = `${API_BASE_URL}/api/employees/managers/${buildQueryString(params)}`;
    const data = await get<unknown>(url, "Failed to fetch eligible managers");
    if (Array.isArray(data)) return data as Manager[];
    return ((data as Record<string, unknown>).results ?? []) as Manager[];
  },

  async getManagersByRole(roleNames?: string[]): Promise<Manager[]> {
    return this.getEligibleManagers(roleNames ?? DEFAULT_MANAGER_ROLES);
  },
};
