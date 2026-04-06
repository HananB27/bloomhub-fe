import { API_BASE_URL } from "../config";

export interface Employee {
  id: number;
  username: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email_address: string;
  department: string;
  role: number;
  role_name: string;
  manager: number | null;
  manager_name: string | null;
  start_date: string;
  phone_number: string;
  address: string;
  employment_status: "active" | "inactive";
  avatar: string | null;
  is_active: boolean;
  permissions_bitmap?: string;
  career_level?: string;
}

export interface FetchEmployeesOptions {
  accessToken: string;
}

export const fetchEmployees = async (
  options: FetchEmployeesOptions
): Promise<Employee[]> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }

    if (response.status === 403) {
      throw new Error("Forbidden: You don't have permission to view employees");
    }

    throw new Error(error.detail || "Failed to fetch employees");
  }

  return response.json();
};

export const fetchCurrentUserProfile = async (
  accessToken: string
): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch user profile");
  }

  return response.json();
};

export { employeeApi } from "./modules/employees";
export type { EmployeeProfileData } from "./modules/employees";
export type { SalaryHistoryItem } from "./modules/employees";
