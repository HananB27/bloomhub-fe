import { getAccessToken } from "./tokens";

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(
  response: Response,
  errorMessage: string
): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as Record<string, unknown>).detail)
        : errorMessage;
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function get<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response, errorMessage);
}

export async function post<T>(
  url: string,
  body: unknown,
  errorMessage: string
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response, errorMessage);
}

export async function patch<T>(
  url: string,
  body: unknown,
  errorMessage: string
): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response, errorMessage);
}

export async function del(url: string, errorMessage: string): Promise<void> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as Record<string, unknown>).detail)
        : errorMessage;
    throw new Error(detail);
  }
}

export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.append(key, String(value));
  }
  return `?${searchParams.toString()}`;
}

export function handleListResponse<T>(
  data: T[] | { results?: T[]; count?: number }
): { results: T[]; count: number } {
  if (Array.isArray(data)) {
    return { results: data, count: data.length };
  }
  return {
    results: data.results ?? [],
    count: data.count ?? data.results?.length ?? 0,
  };
}

export interface EmployeeProfileData {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  department: string;
  role?: { id: number; name: string };
  role_name?: string;
  manager_ids?: number[];
  managers?: { id: number; name: string }[];
  manager_names?: string[];
  avatar?: string;
  start_date: string;
  birth_date?: string;
  employment_status: string;
  career_level?: string;
  cpf_level?: string;
  is_active: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  technology_tags?: { id: number; name: string }[];
  assigned_projects?: {
    id: number;
    project_id?: number;
    name?: string;
    role?: string;
    start_date?: string;
    end_date?: string | null;
    status?: string;
  }[];
  salary?: number;
  current_salary?: number | null;
  current_net_salary?: number | null;
  current_total_monthly?: number | null;
  currency?: string;
}

interface RawEmployeeData {
  [key: string]: unknown;
}

const TECHNOLOGY_TAG_NAME_BY_ID: Record<number, string> = {
  1: "React",
  2: "Angular",
  3: "Vue.js",
  4: "TypeScript",
  5: "JavaScript",
  6: "Python",
  7: "Django",
  8: "Node.js",
  9: "Next.js",
  10: "PostgreSQL",
  11: "Docker",
  12: "AWS",
  13: "Tailwind CSS",
  14: "GraphQL",
  15: "Redis",
  16: "Git",
  17: "Java",
  18: "C#",
  19: ".NET",
  20: "Go",
  21: "Rust",
  22: "Kubernetes",
  23: "Flutter",
  24: "Swift",
  25: "Kotlin",
  26: "MongoDB",
  27: "MySQL",
};

function normalizeTechnologyTags(
  input: unknown
): { id: number; name: string }[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((rawTag) => {
      if (typeof rawTag === "number") {
        return {
          id: rawTag,
          name: TECHNOLOGY_TAG_NAME_BY_ID[rawTag] ?? `Tag ${rawTag}`,
        };
      }

      if (rawTag && typeof rawTag === "object") {
        const tagObj = rawTag as { id?: unknown; name?: unknown };
        const tagId = Number(tagObj.id);
        if (!Number.isFinite(tagId)) return null;
        const tagName =
          typeof tagObj.name === "string" && tagObj.name.trim().length > 0
            ? tagObj.name
            : (TECHNOLOGY_TAG_NAME_BY_ID[tagId] ?? `Tag ${tagId}`);
        return { id: tagId, name: tagName };
      }

      return null;
    })
    .filter((tag): tag is { id: number; name: string } => tag !== null);
}

export function transformEmployeeData(
  raw: RawEmployeeData
): EmployeeProfileData {
  return {
    id: Number(raw.id),
    employee_id: String(raw.employee_id ?? raw.id ?? ""),
    first_name: String(raw.first_name ?? ""),
    last_name: String(raw.last_name ?? ""),
    email: String(raw.email ?? raw.email_address ?? ""),
    phone_number: String(raw.phone_number ?? ""),
    address: String(raw.address ?? ""),
    department: String(raw.department ?? ""),
    role:
      raw.role && typeof raw.role === "object"
        ? (raw.role as { id: number; name: string })
        : raw.role_name
          ? { id: Number(raw.role ?? 0), name: String(raw.role_name) }
          : undefined,
    role_name: String(raw.role_name ?? ""),
    manager_ids: Array.isArray(raw.manager_ids)
      ? (raw.manager_ids as number[])
      : raw.manager
        ? [Number(raw.manager)]
        : [],
    managers: Array.isArray(raw.managers)
      ? (raw.managers as { id: number; name: string }[])
      : [],
    avatar: raw.avatar ? String(raw.avatar) : undefined,
    start_date: String(raw.start_date ?? ""),
    birth_date: raw.birth_date ? String(raw.birth_date) : undefined,
    employment_status: String(raw.employment_status ?? "active"),
    career_level: raw.career_level ? String(raw.career_level) : undefined,
    cpf_level: raw.cpf_level ? String(raw.cpf_level) : undefined,
    is_active: raw.is_active !== false,
    emergency_contact_name: raw.emergency_contact_name
      ? String(raw.emergency_contact_name)
      : undefined,
    emergency_contact_phone: raw.emergency_contact_phone
      ? String(raw.emergency_contact_phone)
      : undefined,
    technology_tags: normalizeTechnologyTags(
      raw.tech_tags ?? raw.technology_tags
    ),
    assigned_projects: Array.isArray(raw.assigned_projects)
      ? (raw.assigned_projects as EmployeeProfileData["assigned_projects"])
      : [],
    salary:
      raw.salary != null
        ? Number(raw.salary)
        : raw.current_net_salary != null
          ? Number(raw.current_net_salary)
          : undefined,
    current_salary:
      raw.current_salary != null ? Number(raw.current_salary) : null,
    current_net_salary:
      raw.current_net_salary != null ? Number(raw.current_net_salary) : null,
    current_total_monthly:
      raw.current_total_monthly != null
        ? Number(raw.current_total_monthly)
        : null,
    currency: raw.currency ? String(raw.currency) : undefined,
  };
}

export function transformEmployeeList(
  rawList: EmployeeProfileData[]
): EmployeeProfileData[] {
  return rawList.map((item) =>
    transformEmployeeData(item as unknown as RawEmployeeData)
  );
}
