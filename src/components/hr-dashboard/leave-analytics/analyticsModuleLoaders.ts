import type { LeaveStatus, LeaveType } from "@/types/vacations";
import {
  DIRECTORY,
  LEAVES,
  type AnalyticsEmployee,
  type LeaveEntry,
} from "./analyticsModuleHelpers";

// Loader signatures mirror the eventual `leaveAnalyticsApi` shape. Today they
// resolve against deterministic mock data; once the backend `Leave Analytics`
// data model lands (BHB-482), swap each body for the matching `leaveAnalyticsApi.*`
// call from `src/lib/api/modules/leave-analytics/index.ts`.

export interface LoadLeavesParams {
  yearFrom?: number;
  yearTo?: number;
  status?: LeaveStatus;
  type?: LeaveType;
  employeeId?: number;
}

export async function loadDirectory(): Promise<AnalyticsEmployee[]> {
  return DIRECTORY;
}

export async function loadLeaves(params: LoadLeavesParams = {}): Promise<LeaveEntry[]> {
  return LEAVES.filter((lv) => {
    if (params.status && lv.status !== params.status) return false;
    if (params.type && lv.type !== params.type) return false;
    if (params.employeeId && lv.employeeId !== params.employeeId) return false;
    if (params.yearFrom != null) {
      const y = Number(lv.startDate.slice(0, 4));
      if (y < params.yearFrom) return false;
    }
    if (params.yearTo != null) {
      const y = Number(lv.startDate.slice(0, 4));
      if (y > params.yearTo) return false;
    }
    return true;
  });
}
