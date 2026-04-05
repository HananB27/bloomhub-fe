import { API_BASE_URL } from "../../../config";
import { get, buildQueryString } from "../../helpers";

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

export const managersApi = {
  /**
   * Fetch eligible managers based on roles
   * Only returns employees with MGR, MGR+, ADMIN management roles
   * @param roles - Array of role names to filter by (e.g., ["MGR", "MGR+", "ADMIN"])
   */
  async getEligibleManagers(roles?: string[]): Promise<Manager[]> {
    const params =
      roles && roles.length > 0 ? { role: roles.join(",") } : undefined;
    const url = `${API_BASE_URL}/api/employees/managers/${buildQueryString(params)}`;

    const data = await get<unknown>(url, "Failed to fetch eligible managers");

    if (Array.isArray(data)) return data as Manager[];
    return ((data as Record<string, unknown>).results ?? []) as Manager[];
  },

  /**
   * Fetch managers with standard management roles
   * Valid roles: MGR, MGR+, ADMIN
   */
  async getManagersByRole(roleNames?: string[]): Promise<Manager[]> {
    const defaultRoles = ["MGR", "MGR+", "ADMIN"];
    const roles = roleNames || defaultRoles;
    return this.getEligibleManagers(roles);
  },
};
