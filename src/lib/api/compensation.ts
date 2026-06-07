import { API_BASE_URL } from "../config";
import { del, get, patch, post } from "./helpers/httpClient";

// Compensation API — wired to BloomHub-be endpoints:
//   GET  /api/compensation/overview/             (HR-only aggregate payload)
//   GET  /api/bonuses/                           (HR: all, non-HR: own)
//   GET  /api/employees/{id}/bonuses/            (per-employee history)
//   POST /api/bonuses/                           (HR only)

export type CompensationStatus = "Active" | "OnLeave" | "PTO";
export type AvatarColor = "green" | "indigo" | "rose" | "gray" | "orange";

export interface CompensationEmployee {
  id: number;
  name: string;
  title: string;
  dept: string;
  salary: number;
  bonus: number;
  last: string;
  next: string;
  status: CompensationStatus;
  color: AvatarColor;
}

export interface SalaryBand {
  label: string;
  count: number;
  pct: number;
}

export interface CompensationMixSegment {
  name: string;
  pct: number;
  color: string;
}

export interface CompensationStats {
  totalMonthly: number;
  avgSalary: number;
  medianSalary: number;
  pendingReviews: number;
  overdueReviews: number;
  totalEmployees: number;
  monthlyDeltaPct: number;
  avgYoyPct: number;
  medianQoqPct: number;
}

export interface CompensationOverview {
  stats: CompensationStats;
  bands: SalaryBand[];
  mix: CompensationMixSegment[];
  employees: CompensationEmployee[];
}

export type BonusTypeId =
  | "performance"
  | "retention"
  | "referral"
  | "project"
  | "education"
  | "spot";

export interface BonusRecord {
  id: number;
  user_profile: number;
  employee_name: string;
  bonus_type: BonusTypeId;
  bonus_type_display: string;
  amount: string;
  currency: string;
  effective_date: string;
  reason: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface CreateBonusPayload {
  user_profile: number;
  bonus_type: BonusTypeId;
  amount: number;
  effective_date: string;
  reason: string;
  currency?: string;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return "";
  const search = new URLSearchParams();
  for (const [key, val] of entries) {
    search.set(key, String(val));
  }
  return `?${search.toString()}`;
}

async function fetchList<T>(url: string, errorMsg: string): Promise<T[]> {
  const data = await get<T[] | { results: T[] }>(url, errorMsg);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

// Backend serializer returns Tailwind-palette names; map to hex used by the
// donut SVG + legend swatches. Unknown names fall back to neutral gray.
const MIX_COLOR_MAP: Record<string, string> = {
  indigo: "#171717",
  emerald: "#16a34a",
  violet: "#d97706",
  amber: "#6b7280",
};

function normalizeMix(
  segments: CompensationMixSegment[]
): CompensationMixSegment[] {
  return segments.map((s) => ({
    ...s,
    color: MIX_COLOR_MAP[s.color] ?? s.color ?? "#6b7280",
  }));
}

function normalizeBands(bands: SalaryBand[]): SalaryBand[] {
  return bands.map((b) => ({ ...b, pct: Number(b.pct.toFixed(2)) }));
}

export const compensationApi = {
  async getOverview(): Promise<CompensationOverview> {
    const data = await get<CompensationOverview>(
      `${API_BASE_URL}/api/compensation/overview/`,
      "Failed to load compensation overview"
    );
    return {
      stats: data.stats,
      bands: normalizeBands(data.bands ?? []),
      mix: normalizeMix(data.mix ?? []),
      employees: data.employees ?? [],
    };
  },
};

export type BenefitTypeId =
  | "transport"
  | "meal"
  | "recreation"
  | "health"
  | "education"
  | "equipment"
  | "remote_work"
  | "phone"
  | "other";

export interface CompensationPolicy {
  id: number;
  cpf_level: string;
  net_monthly: string;
  currency: string;
  effective_date: string;
  notes: string;
  employees_count?: number;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCompensationPolicyPayload {
  cpf_level: string;
  net_monthly: number;
  effective_date: string;
  notes?: string;
  currency?: string;
}

export type UpdateCompensationPolicyPayload =
  Partial<CreateCompensationPolicyPayload>;

export interface BenefitCatalogEntry {
  id: number;
  benefit_type: BenefitTypeId;
  benefit_type_display: string;
  name: string;
  monthly_amount: string;
  currency: string;
  is_active: boolean;
  effective_date: string;
  end_date: string | null;
  notes: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBenefitCatalogPayload {
  benefit_type: BenefitTypeId;
  name: string;
  monthly_amount: number;
  effective_date: string;
  is_active?: boolean;
  end_date?: string | null;
  notes?: string;
  currency?: string;
}

export type UpdateBenefitCatalogPayload = Partial<CreateBenefitCatalogPayload>;

export const policyApi = {
  async list(): Promise<CompensationPolicy[]> {
    return fetchList<CompensationPolicy>(
      `${API_BASE_URL}/api/compensation/policies/`,
      "Failed to load compensation policies"
    );
  },

  async create(
    payload: CreateCompensationPolicyPayload
  ): Promise<CompensationPolicy> {
    return post<CompensationPolicy>(
      `${API_BASE_URL}/api/compensation/policies/`,
      payload,
      "Failed to create policy"
    );
  },

  async update(
    id: number,
    payload: UpdateCompensationPolicyPayload
  ): Promise<CompensationPolicy> {
    return patch<CompensationPolicy>(
      `${API_BASE_URL}/api/compensation/policies/${id}/`,
      payload,
      "Failed to update policy"
    );
  },

  async remove(id: number): Promise<void> {
    return del(
      `${API_BASE_URL}/api/compensation/policies/${id}/`,
      "Failed to delete policy"
    );
  },
};

export const benefitCatalogApi = {
  async list(params?: { is_active?: boolean }): Promise<BenefitCatalogEntry[]> {
    const qs = buildQueryString({ is_active: params?.is_active });
    return fetchList<BenefitCatalogEntry>(
      `${API_BASE_URL}/api/compensation/benefits/${qs}`,
      "Failed to load benefits catalog"
    );
  },

  async create(
    payload: CreateBenefitCatalogPayload
  ): Promise<BenefitCatalogEntry> {
    return post<BenefitCatalogEntry>(
      `${API_BASE_URL}/api/compensation/benefits/`,
      payload,
      "Failed to create benefit"
    );
  },

  async update(
    id: number,
    payload: UpdateBenefitCatalogPayload
  ): Promise<BenefitCatalogEntry> {
    return patch<BenefitCatalogEntry>(
      `${API_BASE_URL}/api/compensation/benefits/${id}/`,
      payload,
      "Failed to update benefit"
    );
  },

  async remove(id: number): Promise<void> {
    return del(
      `${API_BASE_URL}/api/compensation/benefits/${id}/`,
      "Failed to delete benefit"
    );
  },
};

export const bonusApi = {
  async list(params?: {
    employee_id?: number;
    since?: string;
    bonus_type?: BonusTypeId;
  }): Promise<BonusRecord[]> {
    const qs = buildQueryString({
      employee_id: params?.employee_id,
      since: params?.since,
      bonus_type: params?.bonus_type,
    });
    return fetchList<BonusRecord>(
      `${API_BASE_URL}/api/bonuses/${qs}`,
      "Failed to load bonuses"
    );
  },

  async listForEmployee(employeeId: number): Promise<BonusRecord[]> {
    return get<BonusRecord[]>(
      `${API_BASE_URL}/api/employees/${employeeId}/bonuses/`,
      "Failed to load employee bonuses"
    );
  },

  async create(payload: CreateBonusPayload): Promise<BonusRecord> {
    return post<BonusRecord>(
      `${API_BASE_URL}/api/bonuses/`,
      payload,
      "Failed to log bonus"
    );
  },
};
