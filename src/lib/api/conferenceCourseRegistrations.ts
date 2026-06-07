import { getApiBaseUrl } from "../config";
import type {
  ConferenceCourseRegistration,
  ConferenceCourseRegistrationFilters,
  ConferenceCourseRegistrationStatus,
  CreateConferenceCourseRegistrationPayload,
  UpdateConferenceCourseRegistrationPayload,
} from "@/types/conferenceCourseRegistration";
import { describe, it, expect, vi, beforeEach } from "vitest";

const API_BASE_URL = getApiBaseUrl();
const ENDPOINT = `${API_BASE_URL}/api/conference-course-registrations/`;

interface ApiRegistration {
  id: number;
  employee_id: number;
  employee_name: string;
  name: string;
  date: string;
  status: string;
  status_display: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function transformRegistration(
  api: ApiRegistration
): ConferenceCourseRegistration {
  return {
    id: api.id,
    employeeId: api.employee_id,
    employeeName: api.employee_name || "Unknown",
    name: api.name,
    date: api.date,
    status: api.status as ConferenceCourseRegistrationStatus,
    statusDisplay: api.status_display,
    notes: api.notes ?? "",
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function buildFilterQuery(
  filters: ConferenceCourseRegistrationFilters
): string {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.year) params.append("year", filters.year.toString());
  if (filters.employeeId)
    params.append("employee", filters.employeeId.toString());
  if (filters.search) params.append("search", filters.search);
  if (filters.ordering) params.append("ordering", filters.ordering);
  return params.toString();
}

function authHeaders(accessToken: string, withJson = true): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
}

async function extractErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  if (response.status === 401) return "Unauthorized: Please log in again";
  if (response.status === 404) return "Registration not found";
  if (response.status === 403) {
    return "Forbidden: You can only manage your own registrations";
  }
  const error = await response.json().catch(() => ({}));
  for (const field of ["name", "date", "status", "notes", "non_field_errors"]) {
    if (error[field]) {
      const v = error[field];
      return Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return fallback;
}

export const fetchConferenceCourseRegistrations = async (
  accessToken: string,
  filters?: ConferenceCourseRegistrationFilters
): Promise<ConferenceCourseRegistration[]> => {
  const queryString = filters ? buildFilterQuery(filters) : "";
  const url = `${ENDPOINT}${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to fetch registrations")
    );
  }
  const data = await response.json();
  const list = data.results ? data.results : Array.isArray(data) ? data : [];
  return list.map(transformRegistration);
};

export const fetchConferenceCourseRegistration = async (
  id: number,
  accessToken: string
): Promise<ConferenceCourseRegistration> => {
  const response = await fetch(`${ENDPOINT}${id}/`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to fetch registration")
    );
  }
  const data: ApiRegistration = await response.json();
  return transformRegistration(data);
};

function buildPayload(
  payload:
    | CreateConferenceCourseRegistrationPayload
    | UpdateConferenceCourseRegistrationPayload
    | (UpdateConferenceCourseRegistrationPayload & { employeeId?: number }),
  isCreate: boolean
): Record<string, string | number | undefined> {
  const body: Record<string, string | number | undefined> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.notes !== undefined) body.notes = payload.notes ?? "";
  if (isCreate) {
    const employeeId = (payload as CreateConferenceCourseRegistrationPayload)
      .employeeId;
    if (employeeId !== undefined) body.employee_id = employeeId;
  }
  return body;
}

export const createConferenceCourseRegistration = async (
  payload: CreateConferenceCourseRegistrationPayload,
  accessToken: string
): Promise<ConferenceCourseRegistration> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(buildPayload(payload, true)),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to create registration")
    );
  }
  const data: ApiRegistration = await response.json();
  return transformRegistration(data);
};

export const updateConferenceCourseRegistration = async (
  id: number,
  payload: UpdateConferenceCourseRegistrationPayload,
  accessToken: string
): Promise<ConferenceCourseRegistration> => {
  const response = await fetch(`${ENDPOINT}${id}/`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(buildPayload(payload, false)),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to update registration")
    );
  }
  const data: ApiRegistration = await response.json();
  return transformRegistration(data);
};

export const deleteConferenceCourseRegistration = async (
  id: number,
  accessToken: string
): Promise<void> => {
  const response = await fetch(`${ENDPOINT}${id}/`, {
    method: "DELETE",
    headers: authHeaders(accessToken, false),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to delete registration")
    );
  }
};
