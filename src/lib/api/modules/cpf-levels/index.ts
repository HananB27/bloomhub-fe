import { API_BASE_URL } from "../../../config";
import { get } from "../../helpers/httpClient";

function uniqueLevels(levels: unknown): string[] {
  if (!Array.isArray(levels)) return [];
  return Array.from(
    new Set(
      levels.filter((level): level is string => typeof level === "string")
    )
  );
}

export const cpfLevelsApi = {
  async getCPFLevelsByRole(roleId: string): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/${roleId}/`,
      `Failed to fetch CPF levels for role ${roleId}`
    );
    if (Array.isArray(data)) return uniqueLevels(data);
    const obj = data as Record<string, unknown>;
    return uniqueLevels(obj.cpf_levels ?? obj.results);
  },

  /** @deprecated Use getCPFLevelsByRole for role-specific levels */
  async getAllCPFLevels(): Promise<string[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/`,
      "Failed to fetch CPF levels"
    );
    if (Array.isArray(data)) return uniqueLevels(data);
    const obj = data as Record<string, unknown>;
    return uniqueLevels(obj.cpf_levels ?? obj.results);
  },
};
