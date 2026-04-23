import type { EmployeeProfileData } from "@/lib/api/employees";

export type EditableField =
  | "first_name"
  | "last_name"
  | "phone_number"
  | "address";

export interface EmployeeProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  birth_date: string;
}

export interface ProfileFieldErrors {
  [key: string]: string;
}

export function isHrRole(role?: string): boolean {
  return role === "HR" || role === "Admin";
}

export function isOwnProfileById(
  sessionUserId: number,
  employeeId?: number
): boolean {
  return Number.isFinite(sessionUserId) && sessionUserId === employeeId;
}

export function getEditableFields(
  isHRUser: boolean,
  isOwnProfile: boolean
): EditableField[] {
  if (isHRUser) return ["first_name", "last_name", "phone_number", "address"];
  if (isOwnProfile) return ["phone_number", "address"];
  return [];
}

export function buildFormDataFromEmployee(
  employee: EmployeeProfileData
): EmployeeProfileFormData {
  return {
    first_name: employee.first_name || "",
    last_name: employee.last_name || "",
    email: employee.email || "",
    phone_number: employee.phone_number || "",
    address: employee.address || "",
    birth_date: employee.birth_date || "",
  };
}

export function validateProfileForm(
  formData: EmployeeProfileFormData
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (!formData.first_name.trim()) errors.first_name = "First name is required";
  if (!formData.last_name.trim()) errors.last_name = "Last name is required";
  if (formData.phone_number && !/^[\d+\s\-()]+$/.test(formData.phone_number)) {
    errors.phone_number = "Invalid phone number format";
  }
  return errors;
}

export function buildProfileUpdatePayload(
  employee: EmployeeProfileData,
  formData: EmployeeProfileFormData,
  editableFields: EditableField[]
): Partial<EmployeeProfileData> {
  const updatePayload: Partial<EmployeeProfileData> = {};
  editableFields.forEach((field) => {
    const value = formData[field];
    if (value !== undefined && value !== employee[field]) {
      updatePayload[field] = value;
    }
  });
  return updatePayload;
}
