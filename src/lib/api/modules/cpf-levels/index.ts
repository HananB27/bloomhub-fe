import { API_BASE_URL } from "../../../config";
import { get } from "../../helpers";

export const cpfLevelsApi = {
  /**
   * Fetch CPF levels for a specific role
   * @param roleId - The role ID (e.g., "EMP", "MGR", etc.)
   */
  async getCPFLevelsByRole(roleId: string): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/${roleId}/`,
      `Failed to fetch CPF levels for role ${roleId}`
    );
    if (Array.isArray(data)) return data as string[];
    const obj = data as Record<string, unknown>;
    return (obj.cpf_levels ?? obj.results ?? []) as string[];
  },

  /**
   * Fetch all CPF levels (without filtering by role)
   * @deprecated Use getCPFLevelsByRole instead for role-specific levels
   */
  async getAllCPFLevels(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/`,
      "Failed to fetch CPF levels"
    );
    if (Array.isArray(data)) return data as string[];
    const obj = data as Record<string, unknown>;
    return (obj.cpf_levels ?? obj.results ?? []) as string[];
  },
};
