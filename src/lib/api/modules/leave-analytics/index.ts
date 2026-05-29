import { API_BASE_URL } from "@/lib/config";
import type { LeaveType } from "@/types/vacations";
import type {
  LeaveAnalyticsDepartmentRow,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsListParams,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsRefreshResponse,
  LeaveAnalyticsYearTotals,
  LeaveBalanceSnapshot,
  LeaveMonthlyAggregate,
} from "@/types/leaveAnalytics";

import {
  LEAVE_ANALYTICS_API_BASE,
  LEAVE_ANALYTICS_DEPARTMENTS_PATH,
  LEAVE_ANALYTICS_EMPLOYEES_PATH,
  LEAVE_ANALYTICS_MONTHLY_PATH,
  LEAVE_ANALYTICS_REFRESH_PATH,
  LEAVE_ANALYTICS_YEARLY_TOTALS_PATH,
  LEAVE_BALANCE_SNAPSHOTS_API_BASE,
} from "../../constants/leaveAnalyticsEndpoints";
import {
  buildQueryString,
  get,
  handleListResponse,
  post,
} from "../../helpers/httpClient";
import {
  transformLeaveAnalyticsDepartmentRowList,
  transformLeaveAnalyticsEmployeeSummaryList,
  transformLeaveAnalyticsMonthRowList,
  transformLeaveAnalyticsRefreshResponse,
  transformLeaveAnalyticsYearTotals,
  transformLeaveBalanceSnapshotList,
  transformLeaveMonthlyAggregateList,
} from "../../helpers/transformers";

interface RefreshPayload {
  yearFrom?: number;
  yearTo?: number;
}

function _toListQuery(params?: LeaveAnalyticsListParams) {
  if (!params) return undefined;
  return {
    employee: params.employee,
    leave_type: params.leaveType,
    year: params.year,
    month: params.month,
    ordering: params.ordering,
    page: params.page,
    page_size: params.pageSize,
  };
}

export const leaveAnalyticsApi = {
  async list(
    params?: LeaveAnalyticsListParams
  ): Promise<{ results: LeaveMonthlyAggregate[]; count: number }> {
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_API_BASE}${buildQueryString(
      _toListQuery(params)
    )}`;
    const data = await get<unknown>(url, "Failed to fetch leave analytics");
    const handled = handleListResponse<Record<string, unknown>>(
      data as
        | Record<string, unknown>[]
        | { results?: Record<string, unknown>[]; count?: number }
    );
    return {
      results: transformLeaveMonthlyAggregateList(handled.results),
      count: handled.count,
    };
  },

  async monthly(params: {
    year: number;
    leaveType?: LeaveType;
    department?: string;
    month?: number;
  }): Promise<LeaveAnalyticsMonthRow[]> {
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_MONTHLY_PATH}${buildQueryString(
      {
        year: params.year,
        leave_type: params.leaveType,
        department: params.department,
        month: params.month,
      }
    )}`;
    const data = await get<Record<string, unknown>[]>(
      url,
      "Failed to fetch monthly leave trend"
    );
    return transformLeaveAnalyticsMonthRowList(data);
  },

  async yearlyTotals(params: {
    year: number;
    department?: string;
    month?: number;
  }): Promise<LeaveAnalyticsYearTotals> {
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_YEARLY_TOTALS_PATH}${buildQueryString(
      {
        year: params.year,
        department: params.department,
        month: params.month,
      }
    )}`;
    const data = await get<Record<string, unknown>>(
      url,
      "Failed to fetch yearly leave totals"
    );
    return transformLeaveAnalyticsYearTotals(data);
  },

  async departments(params: {
    year: number;
    month?: number;
  }): Promise<LeaveAnalyticsDepartmentRow[]> {
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_DEPARTMENTS_PATH}${buildQueryString(
      { year: params.year, month: params.month }
    )}`;
    const data = await get<Record<string, unknown>[]>(
      url,
      "Failed to fetch department leave breakdown"
    );
    return transformLeaveAnalyticsDepartmentRowList(data);
  },

  async employees(params: {
    year: number;
    department?: string;
    month?: number;
  }): Promise<LeaveAnalyticsEmployeeSummary[]> {
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_EMPLOYEES_PATH}${buildQueryString(
      {
        year: params.year,
        department: params.department,
        month: params.month,
      }
    )}`;
    const data = await get<Record<string, unknown>[]>(
      url,
      "Failed to fetch per-employee leave summary"
    );
    return transformLeaveAnalyticsEmployeeSummaryList(data);
  },

  async refresh(
    payload: RefreshPayload = {}
  ): Promise<LeaveAnalyticsRefreshResponse> {
    const body: Record<string, number> = {};
    if (payload.yearFrom !== undefined) body.year_from = payload.yearFrom;
    if (payload.yearTo !== undefined) body.year_to = payload.yearTo;
    const raw = await post<Record<string, unknown>>(
      `${API_BASE_URL}${LEAVE_ANALYTICS_REFRESH_PATH}`,
      body,
      "Failed to refresh leave analytics"
    );
    return transformLeaveAnalyticsRefreshResponse(raw);
  },

  async listSnapshots(params?: {
    employee?: number;
    leaveType?: LeaveType;
    year?: number;
    snapshotDate?: string;
  }): Promise<{ results: LeaveBalanceSnapshot[]; count: number }> {
    const url = `${API_BASE_URL}${LEAVE_BALANCE_SNAPSHOTS_API_BASE}${buildQueryString(
      {
        employee: params?.employee,
        leave_type: params?.leaveType,
        year: params?.year,
        snapshot_date: params?.snapshotDate,
      }
    )}`;
    const data = await get<unknown>(
      url,
      "Failed to fetch leave balance snapshots"
    );
    const handled = handleListResponse<Record<string, unknown>>(
      data as
        | Record<string, unknown>[]
        | { results?: Record<string, unknown>[]; count?: number }
    );
    return {
      results: transformLeaveBalanceSnapshotList(handled.results),
      count: handled.count,
    };
  },
};

export type {
  LeaveAnalyticsDepartmentRow,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsListParams,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsRefreshResponse,
  LeaveAnalyticsYearTotals,
  LeaveBalanceSnapshot,
  LeaveMonthlyAggregate,
} from "@/types/leaveAnalytics";
