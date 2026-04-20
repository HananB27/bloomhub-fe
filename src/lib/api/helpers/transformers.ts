export interface EmployeeProfileData {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  birth_date?: string;
  start_date: string;
  employment_status: string;
  role_id?: number;
  role?: {
    id: number;
    name: string;
  };
  department?: string;
  manager_ids?: number[];
  manager_names?: string;
  salary?: number;
  currency?: string;
  is_active: boolean;
  avatar?: string;
  career_level?: string;
  cpf_level?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  technology_tags?: { id: number; name: string }[];
  created_at: string;
  updated_at: string;
  assigned_projects?:
    | {
        id: number;
        project_id: number;
        project_name: string;
        role?: string;
        start_date: string;
        end_date?: string | null;
        status: string;
      }[]
    | null;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformEmployeeData(data: any): EmployeeProfileData {
  return {
    id: data.id as number,
    employee_id: (data.employee_id as string) || "",
    first_name: (data.first_name as string) || "",
    last_name: (data.last_name as string) || "",
    email: (data.email as string) || (data.email_address as string) || "",
    phone_number: data.phone_number as string | undefined,
    address: data.address as string | undefined,
    birth_date: (data.birth_date as string) || (data.birthday as string),
    start_date: data.start_date as string,
    employment_status: (data.employment_status as string) || "active",
    role_id:
      typeof data.role === "number"
        ? (data.role as number)
        : (data.role as { id: number } | undefined)?.id,
    role:
      typeof data.role === "object" && data.role !== null
        ? (data.role as { id: number; name: string })
        : data.role_name
          ? { id: data.role as number, name: data.role_name as string }
          : undefined,
    department: data.department as string | undefined,
    manager_ids: Array.isArray(data.managers)
      ? (data.managers as number[])
      : [],
    manager_names: data.manager_names as string | undefined,
    salary: data.salary as number | undefined,
    currency: data.currency as string | undefined,
    is_active:
      data.is_active !== undefined ? (data.is_active as boolean) : true,
    avatar: data.avatar as string | undefined,
    career_level: data.career_level as string | undefined,
    cpf_level: data.cpf_level as string | undefined,
    emergency_contact_name: data.emergency_contact_name as string | undefined,
    emergency_contact_phone: data.emergency_contact_phone as string | undefined,
    technology_tags: normalizeTechnologyTags(
      data.tech_tags ?? data.technology_tags
    ),
    created_at: (data.created_at as string) || new Date().toISOString(),
    updated_at: (data.updated_at as string) || new Date().toISOString(),
    assigned_projects: Array.isArray(data.assigned_projects)
      ? (data.assigned_projects as Record<string, unknown>[]).map((p) => ({
          id: p.id as number,
          project_id: p.project_id as number,
          project_name: p.project_name as string,
          role: p.role as string | undefined,
          start_date: p.start_date as string,
          end_date: p.end_date as string | null | undefined,
          status: p.status as string,
        }))
      : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformEmployeeList(data: any[]): EmployeeProfileData[] {
  return data.map((emp) => transformEmployeeData(emp));
}
