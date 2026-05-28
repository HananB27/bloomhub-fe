import type { AvatarColor } from "./analyticsModuleHelpers";

const AVATAR_COLORS: AvatarColor[] = ["green", "indigo", "rose", "orange", "gray"];

/**
 * Deterministic colour pick for an employee id. Same employee always gets the
 * same swatch across the module, regardless of which API call rendered them.
 */
export function getAvatarColorForEmployee(employeeId: number): AvatarColor {
  if (employeeId == null || Number.isNaN(employeeId)) return "gray";
  const idx = Math.abs(employeeId) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
