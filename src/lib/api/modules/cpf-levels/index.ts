import { API_BASE_URL } from "../../../config";
import { get, patch } from "../../helpers/httpClient";

export interface CPFLevel {
  code: string;
  display_name: string | null;
  career_level: string | null;
}

export interface CPFLevelUpdate {
  display_name?: string | null;
  career_level?: string | null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLevel(input: unknown): CPFLevel | null {
  if (typeof input === "string") {
    const code = input.trim();
    if (!code) return null;
    return { code, display_name: null, career_level: null };
  }
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const code =
      asString(obj.code) ?? asString(obj.name) ?? asString(obj.cpf_level);
    if (!code) return null;
    return {
      code,
      display_name: asString(obj.display_name) ?? asString(obj.label),
      career_level: asString(obj.career_level),
    };
  }
  return null;
}

function normalizeLevelList(data: unknown): CPFLevel[] {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.cpf_levels)
      ? ((data as Record<string, unknown>).cpf_levels as unknown[])
      : Array.isArray((data as Record<string, unknown>)?.results)
        ? ((data as Record<string, unknown>).results as unknown[])
        : [];

  const seen = new Map<string, CPFLevel>();
  for (const entry of raw) {
    const level = normalizeLevel(entry);
    if (!level) continue;
    const existing = seen.get(level.code);
    if (existing) {
      seen.set(level.code, {
        code: level.code,
        display_name: existing.display_name ?? level.display_name,
        career_level: existing.career_level ?? level.career_level,
      });
    } else {
      seen.set(level.code, level);
    }
  }
  return Array.from(seen.values());
}

export const cpfLevelsApi = {
  async list(): Promise<CPFLevel[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/`,
      "Failed to fetch CPF levels"
    );
    return normalizeLevelList(data);
  },

  async listByRole(roleId: string): Promise<CPFLevel[]> {
    const data = await get<unknown>(
      `${API_BASE_URL}/api/cpf-levels/${roleId}/`,
      `Failed to fetch CPF levels for role ${roleId}`
    );
    return normalizeLevelList(data);
  },

  async update(code: string, payload: CPFLevelUpdate): Promise<CPFLevel> {
    const data = await patch<unknown>(
      `${API_BASE_URL}/api/cpf-levels/${encodeURIComponent(code)}/`,
      payload,
      `Failed to update CPF level ${code}`
    );
    const normalized = normalizeLevel(data);
    if (!normalized) {
      throw new Error(`Invalid response updating CPF level ${code}`);
    }
    return normalized;
  },

  async getCPFLevelsByRole(roleId: string): Promise<string[]> {
    const levels = await this.listByRole(roleId);
    return levels.map((l) => l.code);
  },

  /** @deprecated Use list() for full CPF level objects. */
  async getAllCPFLevels(): Promise<string[]> {
    const levels = await this.list();
    return levels.map((l) => l.code);
  },
};
