import { API_BASE_URL } from "../config";
import { fetchWithAuthRetry } from "./refresh";
import { buildQueryString, getHeaders } from "./helpers/httpClient";

export type CelebrationTypeFilter = "all" | "birthday" | "anniversary";
export type CelebrationEventType = "birthday" | "anniversary";

export interface CelebrationEmployee {
  id: number;
  full_name: string;
  department: string | null;
  avatar_url: string | null;
}

export interface UpcomingCelebration {
  event_type: CelebrationEventType;
  event_date: string;
  days_until: number;
  employee: CelebrationEmployee;
  anniversary_years: number | null;
}

export interface UpcomingCelebrationsParams {
  days?: number;
  type?: CelebrationTypeFilter;
}

export class CelebrationAccessDeniedError extends Error {
  constructor(message = "You do not have access to upcoming celebrations.") {
    super(message);
    this.name = "CelebrationAccessDeniedError";
  }
}

const upcomingBase = `${API_BASE_URL}/api/celebrations/upcoming`;

export const celebrationsApi = {
  async upcoming(
    params: UpcomingCelebrationsParams = { days: 30, type: "all" },
    opts?: { signal?: AbortSignal }
  ): Promise<UpcomingCelebration[]> {
    const qs = buildQueryString({
      days: params.days ?? 30,
      type: params.type ?? "all",
    });

    const response = await fetchWithAuthRetry(`${upcomingBase}/${qs}`, {
      method: "GET",
      headers: getHeaders(),
      signal: opts?.signal,
    });

    if (response.status === 403) {
      throw new CelebrationAccessDeniedError();
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error.detail === "string"
          ? error.detail
          : "Failed to load upcoming celebrations"
      );
    }

    return response.json() as Promise<UpcomingCelebration[]>;
  },
};
