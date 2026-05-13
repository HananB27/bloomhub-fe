import { getApiBaseUrl } from "../config";
import type {
  CreatePeerSessionPayload,
  PeerSession,
  PeerSessionFilters,
  UpdatePeerSessionPayload,
} from "@/types/peerSession";

const API_BASE_URL = getApiBaseUrl();
const ENDPOINT = `${API_BASE_URL}/api/peer-sessions/`;

interface ApiPeerSession {
  id: number;
  employee_id: number;
  employee_name: string;
  topic: string;
  session_date: string;
  duration_minutes?: number | null;
  incentive_id?: number | null;
  description?: string | null;
  created_at: string;
  updated_at?: string;
}

function transformPeerSession(api: ApiPeerSession): PeerSession {
  return {
    id: api.id,
    employeeId: api.employee_id,
    employeeName: api.employee_name || "Unknown",
    topic: api.topic,
    sessionDate: api.session_date,
    durationMinutes:
      api.duration_minutes !== undefined && api.duration_minutes !== null
        ? Number(api.duration_minutes)
        : null,
    incentiveId:
      api.incentive_id !== undefined && api.incentive_id !== null
        ? Number(api.incentive_id)
        : null,
    description: api.description ?? "",
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function buildFilterQuery(filters: PeerSessionFilters): string {
  const params = new URLSearchParams();
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
  if (response.status === 404) return "Peer session not found";
  if (response.status === 403) {
    return "Forbidden: You can only manage your own peer sessions";
  }
  const error = await response.json().catch(() => ({}));
  for (const field of [
    "topic",
    "session_date",
    "duration_minutes",
    "description",
    "non_field_errors",
  ]) {
    if (error[field]) {
      const v = error[field];
      return Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return fallback;
}

function buildPayload(
  payload: CreatePeerSessionPayload | UpdatePeerSessionPayload,
  isCreate: boolean
): Record<string, string | number | null | undefined> {
  const body: Record<string, string | number | null | undefined> = {};
  if (payload.topic !== undefined) body.topic = payload.topic;
  if (payload.sessionDate !== undefined)
    body.session_date = payload.sessionDate;
  if (payload.durationMinutes !== undefined)
    body.duration_minutes = payload.durationMinutes;
  if (payload.incentiveId !== undefined)
    body.incentive_id = payload.incentiveId;
  if (payload.description !== undefined)
    body.description = payload.description ?? "";
  if (isCreate) {
    const employeeId = (payload as CreatePeerSessionPayload).employeeId;
    if (employeeId !== undefined) body.employee_id = employeeId;
  }
  return body;
}

export const fetchPeerSessions = async (
  accessToken: string,
  filters?: PeerSessionFilters
): Promise<PeerSession[]> => {
  const queryString = filters ? buildFilterQuery(filters) : "";
  const url = `${ENDPOINT}${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to fetch peer sessions")
    );
  }
  const data = await response.json();
  const list = data.results ? data.results : Array.isArray(data) ? data : [];
  return list.map(transformPeerSession);
};

export const fetchPeerSession = async (
  id: number,
  accessToken: string
): Promise<PeerSession> => {
  const response = await fetch(`${ENDPOINT}${id}/`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to fetch peer session")
    );
  }
  const data: ApiPeerSession = await response.json();
  return transformPeerSession(data);
};

export const createPeerSession = async (
  payload: CreatePeerSessionPayload,
  accessToken: string
): Promise<PeerSession> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(buildPayload(payload, true)),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to create peer session")
    );
  }
  const data: ApiPeerSession = await response.json();
  return transformPeerSession(data);
};

export const updatePeerSession = async (
  id: number,
  payload: UpdatePeerSessionPayload,
  accessToken: string
): Promise<PeerSession> => {
  const response = await fetch(`${ENDPOINT}${id}/`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(buildPayload(payload, false)),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to update peer session")
    );
  }
  const data: ApiPeerSession = await response.json();
  return transformPeerSession(data);
};

export const deletePeerSession = async (
  id: number,
  accessToken: string
): Promise<void> => {
  const response = await fetch(`${ENDPOINT}${id}/`, {
    method: "DELETE",
    headers: authHeaders(accessToken, false),
  });
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "Failed to delete peer session")
    );
  }
};
