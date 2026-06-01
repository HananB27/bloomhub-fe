import { API_BASE_URL } from "@/lib/config";
import type { LeaveType } from "@/types/vacations";
import type {
  LeaveAnalyticsDepartmentRow,
  LeaveAnalyticsEmployeeHistory,
  LeaveAnalyticsEmployeeHistoryParams,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsExportParams,
  LeaveAnalyticsExportResult,
  LeaveAnalyticsListParams,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsRefreshResponse,
  LeaveAnalyticsYearTotals,
  LeaveAvailabilityParams,
  LeaveAvailabilityResponse,
  LeaveBalanceSnapshot,
  LeaveMonthlyAggregate,
} from "@/types/leaveAnalytics";

import { fetchWithAuthRetry } from "../../refresh";
import {
  LEAVE_ANALYTICS_API_BASE,
  LEAVE_ANALYTICS_AVAILABILITY_PATH,
  LEAVE_ANALYTICS_DEPARTMENTS_PATH,
  LEAVE_ANALYTICS_EMPLOYEE_HISTORY_PATH,
  LEAVE_ANALYTICS_EMPLOYEES_PATH,
  LEAVE_ANALYTICS_EXPORT_PATH,
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
  transformLeaveAnalyticsEmployeeHistory,
  transformLeaveAnalyticsEmployeeSummaryList,
  transformLeaveAnalyticsMonthRowList,
  transformLeaveAnalyticsRefreshResponse,
  transformLeaveAnalyticsYearTotals,
  transformLeaveAvailabilityResponse,
  transformLeaveBalanceSnapshotList,
  transformLeaveMonthlyAggregateList,
} from "../../helpers/transformers";

interface RefreshPayload {
  yearFrom?: number;
  yearTo?: number;
}

function _parseContentDispositionFilename(value: string | null): string | null {
  if (!value) return null;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }
  const filenameMatch = value.match(/filename=([^;]+)/i);
  return filenameMatch?.[1]?.trim().replace(/^"|"$/g, "") ?? null;
}

function _defaultExportFilename(params: LeaveAnalyticsExportParams): string {
  const parts = ["leave-analytics", String(params.year)];
  if (params.month !== undefined)
    parts.push(String(params.month).padStart(2, "0"));
  if (params.department) {
    parts.push(params.department.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  }
  return `${parts.join("-")}.${params.format}`;
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

  async employeeHistory(
    params: LeaveAnalyticsEmployeeHistoryParams
  ): Promise<LeaveAnalyticsEmployeeHistory> {
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_EMPLOYEE_HISTORY_PATH}${buildQueryString(
      {
        employee: params.employee,
        year_from: params.yearFrom,
        year_to: params.yearTo,
        leave_type: params.leaveType,
      }
    )}`;
    const raw = await get<Record<string, unknown>>(
      url,
      "Failed to fetch employee leave history"
    );
    return transformLeaveAnalyticsEmployeeHistory(raw);
  },

  async availability(
    params: LeaveAvailabilityParams
  ): Promise<LeaveAvailabilityResponse> {
    const query: Record<string, string | number | undefined> = {
      start_date: params.startDate,
      end_date: params.endDate,
      project: params.project,
    };
    if (params.leaveTypes && params.leaveTypes.length > 0) {
      query.leave_type = params.leaveTypes.join(",");
    }
    if (params.statuses && params.statuses.length > 0) {
      query.status = params.statuses.join(",");
    }
    const url = `${API_BASE_URL}${LEAVE_ANALYTICS_AVAILABILITY_PATH}${buildQueryString(
      query
    )}`;
    const raw = await get<Record<string, unknown>>(
      url,
      "Failed to fetch team availability"
    );
    return transformLeaveAvailabilityResponse(raw);
  },

  async export(
    params: LeaveAnalyticsExportParams
  ): Promise<LeaveAnalyticsExportResult> {
    const query = buildQueryString({
      format: params.format,
      year: params.year,
      month: params.month,
      department: params.department,
    });
    const acceptHeader =
      params.format === "pdf" ? "application/pdf" : "text/csv";
    const response = await fetchWithAuthRetry(
      `${API_BASE_URL}${LEAVE_ANALYTICS_EXPORT_PATH}${query}`,
      {
        method: "GET",
        headers: { Accept: acceptHeader },
      }
    );
    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const errorPayload = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => "");
      const message =
        errorPayload && typeof errorPayload === "object"
          ? ((errorPayload as { detail?: string; message?: string }).detail ??
            (errorPayload as { detail?: string; message?: string }).message)
          : undefined;
      throw new Error(message || "Failed to export leave analytics");
    }
    const blob = await response.blob();
    const filename =
      _parseContentDispositionFilename(
        response.headers.get("content-disposition")
      ) || _defaultExportFilename(params);
    return { blob, filename };
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
  LeaveAnalyticsEmployeeHistory,
  LeaveAnalyticsEmployeeHistoryParams,
  LeaveAnalyticsEmployeeSummary,
  LeaveAnalyticsExportFormat,
  LeaveAnalyticsExportParams,
  LeaveAnalyticsExportResult,
  LeaveAnalyticsListParams,
  LeaveAnalyticsMonthRow,
  LeaveAnalyticsRefreshResponse,
  LeaveAnalyticsYearTotals,
  LeaveAvailabilityDayCount,
  LeaveAvailabilityEmployee,
  LeaveAvailabilityEntry,
  LeaveAvailabilityParams,
  LeaveAvailabilityRange,
  LeaveAvailabilityResponse,
  LeaveBalanceSnapshot,
  LeaveMonthlyAggregate,
  LeaveRequestHistoryRow,
} from "@/types/leaveAnalytics";
