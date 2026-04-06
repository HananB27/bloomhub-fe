import { getAccessToken } from "./tokens";
import { getApiBaseUrl } from "../config";

export const EMPLOYEE_PERMISSIONS = {
  VIEW_OWN_PROFILE: 0,
  EDIT_OWN_BASIC_INFO: 1,
  EDIT_OWN_ROLE_SALARY_CPF: 2,
  VIEW_TEAM_PROFILES: 3,
  VIEW_ALL_PROFILES: 4,
  VIEW_SALARY_HISTORY: 5,
  VIEW_AUDIT_LOG: 6,
  EXPORT_EMPLOYEE_DATA: 7,
  ADD_REMOVE_EMPLOYEES: 8,
  UPLOAD_OWN_CV: 9,
  UPLOAD_ANY_CV: 10,
  UPDATE_OWN_PROFILE: 11,
  UPDATE_ANY_PROFILE: 12,
} as const;

export function getBitValue(permissionBit: number): number {
  return Math.pow(2, permissionBit);
}

export function hasPermission(
  userPermissionBits: number,
  permissionBit: number
): boolean {
  return (userPermissionBits & getBitValue(permissionBit)) !== 0;
}

export function hasAllPermissions(
  userPermissionBits: number,
  permissionBits: number[]
): boolean {
  return permissionBits.every((bit) => hasPermission(userPermissionBits, bit));
}

export function hasAnyPermission(
  userPermissionBits: number,
  permissionBits: number[]
): boolean {
  return permissionBits.some((bit) => hasPermission(userPermissionBits, bit));
}

export function addPermission(
  userPermissionBits: number,
  permissionBit: number
): number {
  return userPermissionBits | getBitValue(permissionBit);
}

export function removePermission(
  userPermissionBits: number,
  permissionBit: number
): number {
  return userPermissionBits & ~getBitValue(permissionBit);
}

export function getPermissionBits(userPermissionBits: number): number[] {
  const maxBit =
    Math.max(...(Object.values(EMPLOYEE_PERMISSIONS) as number[])) + 1;
  const bits: number[] = [];
  for (let i = 0; i < maxBit; i++) {
    if (hasPermission(userPermissionBits, i)) bits.push(i);
  }
  return bits;
}

export function getPermissionNames(userPermissionBits: number): string[] {
  return Object.entries(EMPLOYEE_PERMISSIONS)
    .filter(([, bit]) => hasPermission(userPermissionBits, bit))
    .map(([name]) => name);
}

export const PERMISSION_REQUIREMENTS = {
  canViewOwnProfile: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_OWN_PROFILE),
  canEditOwnBasicInfo: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EDIT_OWN_BASIC_INFO),
  canEditOwnSensitiveInfo: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EDIT_OWN_ROLE_SALARY_CPF),
  canViewTeamProfiles: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_TEAM_PROFILES),
  canViewAllProfiles: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_ALL_PROFILES),
  canViewSalaryHistory: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_SALARY_HISTORY),
  canViewAuditLog: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_AUDIT_LOG),
  canExportData: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EXPORT_EMPLOYEE_DATA),
  canManageEmployees: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.ADD_REMOVE_EMPLOYEES),
  canUploadOwnCV: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPLOAD_OWN_CV),
  canUploadAnyCV: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPLOAD_ANY_CV),
  canUpdateOwnProfile: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPDATE_OWN_PROFILE),
  canUpdateAnyProfile: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPDATE_ANY_PROFILE),
  isHR: (bits: number) =>
    hasAllPermissions(bits, [
      EMPLOYEE_PERMISSIONS.VIEW_ALL_PROFILES,
      EMPLOYEE_PERMISSIONS.VIEW_SALARY_HISTORY,
      EMPLOYEE_PERMISSIONS.ADD_REMOVE_EMPLOYEES,
    ]),
} as const;

export async function getUserPermissions(): Promise<number> {
  const token = getAccessToken();
  if (!token) return 0;

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/permissions/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return 0;

    const data = await response.json();

    if (typeof data.permissions === "number") return data.permissions;
    if (typeof data.permission_bits === "number") return data.permission_bits;
    if (Array.isArray(data.permissions)) {
      return data.permissions.reduce(
        (bits: number, perm: { bit_position: number }) =>
          bits | (1 << (perm.bit_position - 1)),
        0
      );
    }
    return 0;
  } catch {
    return 0;
  }
}
