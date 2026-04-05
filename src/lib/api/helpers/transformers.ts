/**
 * Data Transformation Helpers
 * Centralizes all data transformation logic for consistent data mapping
 */

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

/**
 * Transform API response to EmployeeProfileData format
 * Handles multiple field name variations from different API versions
 */
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

/**
 * Transform array of employee data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformEmployeeList(data: any[]): EmployeeProfileData[] {
  return data.map((emp) => transformEmployeeData(emp));
}
