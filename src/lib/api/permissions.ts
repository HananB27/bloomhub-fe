/**
 * Permission management utilities for Employee Profiles module
 * Uses bit flags for efficient permission checking
 */

/**
 * Permission definitions with their bit positions
 * Each permission is represented by a single bit (2^position)
 */
export const EMPLOYEE_PERMISSIONS = {
  // Bit 0 (2^0 = 1)
  VIEW_OWN_PROFILE: 0,
  // Bit 1 (2^1 = 2)
  EDIT_OWN_BASIC_INFO: 1,
  // Bit 2 (2^2 = 4)
  EDIT_OWN_ROLE_SALARY_CPF: 2,
  // Bit 3 (2^3 = 8)
  VIEW_TEAM_PROFILES: 3,
  // Bit 4 (2^4 = 16)
  VIEW_ALL_PROFILES: 4,
  // Bit 5 (2^5 = 32)
  VIEW_SALARY_HISTORY: 5,
  // Bit 6 (2^6 = 64)
  VIEW_AUDIT_LOG: 6,
  // Bit 7 (2^7 = 128)
  EXPORT_EMPLOYEE_DATA: 7,
  // Bit 8 (2^8 = 256)
  ADD_REMOVE_EMPLOYEES: 8,
  // Bit 9 (2^9 = 512)
  UPLOAD_OWN_CV: 9,
  // Bit 10 (2^10 = 1024)
  UPLOAD_ANY_CV: 10,
  // Bit 11 (2^11 = 2048)
  UPDATE_OWN_PROFILE: 11,
  // Bit 12 (2^12 = 4096)
  UPDATE_ANY_PROFILE: 12,
} as const;

/**
 * Get the bit value for a permission
 * @param permissionBit - The bit position (0-10)
 * @returns The numeric value of that bit (2^position)
 */
export function getBitValue(permissionBit: number): number {
  return Math.pow(2, permissionBit);
}

/**
 * Check if a user has a specific permission
 * @param userPermissionBits - The user's permission bits (integer with multiple bits set)
 * @param permissionBit - The bit position to check
 * @returns true if user has this permission
 */
export function hasPermission(
  userPermissionBits: number,
  permissionBit: number
): boolean {
  const bitValue = getBitValue(permissionBit);
  return (userPermissionBits & bitValue) !== 0;
}

/**
 * Check multiple permissions - user must have ALL of them
 * @param userPermissionBits - The user's permission bits
 * @param permissionBits - Array of bit positions to check
 * @returns true if user has all these permissions
 */
export function hasAllPermissions(
  userPermissionBits: number,
  permissionBits: number[]
): boolean {
  return permissionBits.every((bit) => hasPermission(userPermissionBits, bit));
}

/**
 * Check multiple permissions - user must have ANY of them
 * @param userPermissionBits - The user's permission bits
 * @param permissionBits - Array of bit positions to check
 * @returns true if user has any of these permissions
 */
export function hasAnyPermission(
  userPermissionBits: number,
  permissionBits: number[]
): boolean {
  return permissionBits.some((bit) => hasPermission(userPermissionBits, bit));
}

/**
 * Add a permission to a user's bits
 * @param userPermissionBits - Current permission bits
 * @param permissionBit - Bit position to add
 * @returns Updated permission bits
 */
export function addPermission(
  userPermissionBits: number,
  permissionBit: number
): number {
  const bitValue = getBitValue(permissionBit);
  return userPermissionBits | bitValue;
}

/**
 * Remove a permission from a user's bits
 * @param userPermissionBits - Current permission bits
 * @param permissionBit - Bit position to remove
 * @returns Updated permission bits
 */
export function removePermission(
  userPermissionBits: number,
  permissionBit: number
): number {
  const bitValue = getBitValue(permissionBit);
  return userPermissionBits & ~bitValue;
}

/**
 * Get all permission bits for a user
 * @param userPermissionBits - The user's permission bits
 * @returns Array of bit positions the user has
 */
export function getPermissionBits(userPermissionBits: number): number[] {
  const bits: number[] = [];
  const maxBit =
    Math.max(...(Object.values(EMPLOYEE_PERMISSIONS) as number[])) + 1;
  for (let i = 0; i < maxBit; i++) {
    if (hasPermission(userPermissionBits, i)) {
      bits.push(i);
    }
  }
  return bits;
}

/**
 * Get readable permission names for debugging
 * @param userPermissionBits - The user's permission bits
 * @returns Array of permission names the user has
 */
export function getPermissionNames(userPermissionBits: number): string[] {
  const names: string[] = [];
  const entries = Object.entries(EMPLOYEE_PERMISSIONS);

  for (const [name, bit] of entries) {
    if (hasPermission(userPermissionBits, bit)) {
      names.push(name);
    }
  }

  return names;
}

/**
 * Permission requirement helpers for common use cases
 */
export const PERMISSION_REQUIREMENTS = {
  // View own profile
  canViewOwnProfile: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_OWN_PROFILE),

  // Edit own basic info (name, email, phone, address)
  canEditOwnBasicInfo: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EDIT_OWN_BASIC_INFO),

  // Edit own sensitive info (role, salary, CPF)
  canEditOwnSensitiveInfo: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EDIT_OWN_ROLE_SALARY_CPF),

  // View team profiles (employees under same manager)
  canViewTeamProfiles: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_TEAM_PROFILES),

  // View all employee profiles
  canViewAllProfiles: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_ALL_PROFILES),

  // View salary history
  canViewSalaryHistory: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_SALARY_HISTORY),

  // View audit logs
  canViewAuditLog: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.VIEW_AUDIT_LOG),

  // Export employee data
  canExportData: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.EXPORT_EMPLOYEE_DATA),

  // Add/remove employees
  canManageEmployees: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.ADD_REMOVE_EMPLOYEES),

  // Upload own CV
  canUploadOwnCV: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPLOAD_OWN_CV),

  // Upload any employee's CV
  canUploadAnyCV: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPLOAD_ANY_CV),

  // Update own profile
  canUpdateOwnProfile: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPDATE_OWN_PROFILE),

  // Update any employee's profile
  canUpdateAnyProfile: (bits: number) =>
    hasPermission(bits, EMPLOYEE_PERMISSIONS.UPDATE_ANY_PROFILE),

  // Is HR/Admin (has most permissions)
  isHR: (bits: number) =>
    hasAllPermissions(bits, [
      EMPLOYEE_PERMISSIONS.VIEW_ALL_PROFILES,
      EMPLOYEE_PERMISSIONS.VIEW_SALARY_HISTORY,
      EMPLOYEE_PERMISSIONS.ADD_REMOVE_EMPLOYEES,
    ]),
} as const;
