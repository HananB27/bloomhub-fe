import { getAccessToken } from "./tokens";
import { fetchWithAuthRetry } from "./refresh";
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

/** Bitwise permission mask; supports bigint when values exceed Number.MAX_SAFE_INTEGER (JSON metadata). */
export function hasPermission(
  userPermissionBits: number | bigint,
  permissionBit: number
): boolean {
  const mask = BigInt(1) << BigInt(permissionBit);
  const bits =
    typeof userPermissionBits === "bigint"
      ? userPermissionBits
      : Number.isSafeInteger(userPermissionBits)
        ? BigInt(userPermissionBits)
        : BigInt(0);
  return (bits & mask) !== BigInt(0);
}

export function hasAllPermissions(
  userPermissionBits: number | bigint,
  permissionBits: number[]
): boolean {
  return permissionBits.every((bit) => hasPermission(userPermissionBits, bit));
}

export function hasAnyPermission(
  userPermissionBits: number | bigint,
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

export function getPermissionBits(
  userPermissionBits: number | bigint
): number[] {
  const maxBit =
    Math.max(...(Object.values(EMPLOYEE_PERMISSIONS) as number[])) + 1;
  const bits: number[] = [];
  for (let i = 0; i < maxBit; i++) {
    if (hasPermission(userPermissionBits, i)) bits.push(i);
  }
  return bits;
}

export function getPermissionNames(
  userPermissionBits: number | bigint
): string[] {
  return Object.entries(EMPLOYEE_PERMISSIONS)
    .filter(([, bit]) => hasPermission(userPermissionBits, bit))
    .map(([name]) => name);
}

export const PERMISSION_REQUIREMENTS = {
  canViewOwnProfile: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_OWN_PROFILE),
  canEditOwnBasicInfo: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EDIT_OWN_BASIC_INFO),
  canEditOwnSensitiveInfo: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EDIT_OWN_ROLE_SALARY_CPF),
  canViewTeamProfiles: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_TEAM_PROFILES),
  canViewAllProfiles: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_ALL_PROFILES),
  canViewSalaryHistory: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_SALARY_HISTORY),
  canViewAuditLog: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_AUDIT_LOG),
  canExportData: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EXPORT_EMPLOYEE_DATA),
  canManageEmployees: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.ADD_REMOVE_EMPLOYEES),
  canUploadOwnCV: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPLOAD_OWN_CV),
  canUploadAnyCV: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPLOAD_ANY_CV),
  canUpdateOwnProfile: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPDATE_OWN_PROFILE),
  canUpdateAnyProfile: (bits: number | bigint) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPDATE_ANY_PROFILE),
  isHR: (bits: number | bigint) =>
    hasAllPermissions(bits, [
      EMPLOYEE_PERMISSIONS.VIEW_ALL_PROFILES,
      EMPLOYEE_PERMISSIONS.VIEW_SALARY_HISTORY,
      EMPLOYEE_PERMISSIONS.ADD_REMOVE_EMPLOYEES,
    ]),
} as const;

export async function getUserPermissions(): Promise<number | bigint> {
  const token = getAccessToken();
  if (!token) return 0;

  try {
    const response = await fetchWithAuthRetry(
      `${getApiBaseUrl()}/api/auth/permissions/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) return 0;

    const data = await response.json();

    const decimalString = (v: unknown): string | null =>
      typeof v === "string" && /^\d+$/.test(v) ? v : null;

    const pStr =
      decimalString(data.permissions) ?? decimalString(data.permission_bits);
    if (pStr !== null) {
      try {
        return BigInt(pStr);
      } catch {
        /* fall through */
      }
    }

    if (
      typeof data.permissions === "number" &&
      Number.isSafeInteger(data.permissions)
    ) {
      return data.permissions;
    }
    if (
      typeof data.permission_bits === "number" &&
      Number.isSafeInteger(data.permission_bits)
    ) {
      return data.permission_bits;
    }

    if (Array.isArray(data.permissions)) {
      return data.permissions.reduce(
        (bits: bigint, perm: { bit_position: number }) =>
          bits | (BigInt(1) << BigInt(perm.bit_position - 1)),
        BigInt(0)
      );
    }
    return 0;
  } catch {
    return 0;
  }
}
