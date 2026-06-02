import { API_BASE_URL } from "@/lib/config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
  patch,
  post,
  put,
} from "../../helpers/httpClient";
import type {
  ApplicationStatus,
  ApplyToListingPayload,
  CreateListingPayload,
  JobApplication,
  JobListing,
  JobListingDetail,
  JobListingFilters,
  JobListingStatus,
  UpdateListingPayload,
  UpdateApplicationStatusPayload,
  WithdrawApplicationPayload,
} from "@/types/jobListing";

const BASE = `${API_BASE_URL}/api/job-listings`;

interface ApiJobListing {
  id: number;
  title: string;
  department_id: number | null;
  department_name: string;
  open_at: string;
  close_at: string;
  status: string;
  status_display: string;
  application_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiJobListingDetail extends ApiJobListing {
  description: string;
  created_by_id: number | null;
  created_by_name: string;
  has_applied: boolean;
}

interface ApiJobApplication {
  id: number;
  listing_id: number;
  listing_title: string;
  applicant_id: number;
  applicant_name: string;
  status: string;
  status_display: string;
  applied_at: string;
  cover_note: string;
  decision_note?: string;
  decided_by_id?: number | null;
  decided_by_name?: string;
  decided_at?: string | null;
  allowed_next_statuses?: string[];
  created_at: string;
  updated_at: string;
}

function transformListing(raw: ApiJobListing): JobListing {
  return {
    id: raw.id,
    title: raw.title,
    departmentId: raw.department_id,
    departmentName: raw.department_name || "",
    openAt: raw.open_at,
    closeAt: raw.close_at,
    status: raw.status as JobListingStatus,
    statusDisplay: raw.status_display,
    applicationCount: raw.application_count ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function transformListingDetail(raw: ApiJobListingDetail): JobListingDetail {
  return {
    ...transformListing(raw),
    description: raw.description ?? "",
    createdById: raw.created_by_id,
    createdByName: raw.created_by_name || "",
    hasApplied: Boolean(raw.has_applied),
  };
}

function transformApplication(raw: ApiJobApplication): JobApplication {
  return {
    id: raw.id,
    listingId: raw.listing_id,
    listingTitle: raw.listing_title,
    applicantId: raw.applicant_id,
    applicantName: raw.applicant_name || "",
    status: raw.status as ApplicationStatus,
    statusDisplay: raw.status_display,
    appliedAt: raw.applied_at,
    coverNote: raw.cover_note ?? "",
    decisionNote: raw.decision_note ?? "",
    decidedById: raw.decided_by_id ?? null,
    decidedByName: raw.decided_by_name ?? "",
    decidedAt: raw.decided_at ?? null,
    allowedNextStatuses: Array.isArray(raw.allowed_next_statuses)
      ? (raw.allowed_next_statuses as ApplicationStatus[])
      : [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function buildListingBody(
  payload: CreateListingPayload | UpdateListingPayload
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (payload.title !== undefined) body.title = payload.title;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.departmentId !== undefined) {
    body.department_id = payload.departmentId;
  }
  if (payload.openAt !== undefined) body.open_at = payload.openAt;
  if (payload.closeAt !== undefined) body.close_at = payload.closeAt;
  if (payload.status !== undefined) body.status = payload.status;

  return body;
}

export const jobListingsApi = {
  async listListings(filters?: JobListingFilters): Promise<JobListing[]> {
    const qs = buildQueryString({
      department: filters?.department,
      search: filters?.search,
      ordering: filters?.ordering,
    });
    const data = await get<
      ApiJobListing[] | { results?: ApiJobListing[]; count?: number }
    >(`${BASE}/${qs}`, "Failed to fetch job listings");
    return handleListResponse(data).results.map(transformListing);
  },

  async listActiveListings(filters?: JobListingFilters): Promise<JobListing[]> {
    return jobListingsApi.listListings(filters);
  },

  async getListing(id: number): Promise<JobListingDetail> {
    const data = await get<ApiJobListingDetail>(
      `${BASE}/${id}/`,
      "Failed to fetch job listing"
    );
    return transformListingDetail(data);
  },

  async applyToListing(
    id: number,
    payload: ApplyToListingPayload = {}
  ): Promise<JobApplication> {
    const data = await post<ApiJobApplication>(
      `${BASE}/${id}/apply/`,
      { cover_note: payload.coverNote ?? "" },
      "Failed to submit application"
    );
    return transformApplication(data);
  },

  async listMyApplications(): Promise<JobApplication[]> {
    const data = await get<
      ApiJobApplication[] | { results?: ApiJobApplication[]; count?: number }
    >(`${BASE}/my-applications/`, "Failed to fetch your applications");
    return handleListResponse(data).results.map(transformApplication);
  },

  async listApplicationsForListing(
    listingId: number
  ): Promise<JobApplication[]> {
    const data = await get<
      ApiJobApplication[] | { results?: ApiJobApplication[]; count?: number }
    >(
      `${BASE}/${listingId}/applications/`,
      "Failed to fetch listing applications"
    );
    return handleListResponse(data).results.map(transformApplication);
  },

  async createListing(payload: CreateListingPayload): Promise<JobListing> {
    const body = buildListingBody({
      ...payload,
      status: payload.status ?? "open",
    });
    const data = await post<ApiJobListing>(
      `${BASE}/`,
      body,
      "Failed to post role"
    );
    return transformListing(data);
  },

  async updateListing(
    id: number,
    payload: UpdateListingPayload
  ): Promise<JobListingDetail> {
    const data = await put<ApiJobListingDetail>(
      `${BASE}/${id}/`,
      buildListingBody(payload),
      "Failed to update job listing"
    );
    return transformListingDetail(data);
  },

  async patchListing(
    id: number,
    payload: UpdateListingPayload
  ): Promise<JobListingDetail> {
    const data = await patch<ApiJobListingDetail>(
      `${BASE}/${id}/`,
      buildListingBody(payload),
      "Failed to update job listing"
    );
    return transformListingDetail(data);
  },

  async deleteListing(id: number): Promise<void> {
    await del(`${BASE}/${id}/`, "Failed to delete job listing");
  },

  async listAllApplications(filters?: {
    listing?: number;
    status?: string;
  }): Promise<JobApplication[]> {
    const qs = buildQueryString({
      listing: filters?.listing,
      status: filters?.status,
    });
    const data = await get<
      ApiJobApplication[] | { results?: ApiJobApplication[]; count?: number }
    >(
      `${API_BASE_URL}/api/job-applications/${qs}`,
      "Failed to fetch applications"
    );
    return handleListResponse(data).results.map(transformApplication);
  },

  async updateApplicationStatus(
    applicationId: number,
    payload: UpdateApplicationStatusPayload
  ): Promise<JobApplication> {
    const body: Record<string, unknown> = { status: payload.status };
    if (payload.decisionNote !== undefined) {
      body.decision_note = payload.decisionNote;
    }
    const data = await patch<ApiJobApplication>(
      `${API_BASE_URL}/api/job-applications/${applicationId}/`,
      body,
      "Failed to update application status"
    );
    return transformApplication(data);
  },

  async withdrawApplication(
    applicationId: number,
    payload: WithdrawApplicationPayload = {}
  ): Promise<JobApplication> {
    const body: Record<string, unknown> = {};
    if (payload.decisionNote !== undefined) {
      body.decision_note = payload.decisionNote;
    }
    const data = await post<ApiJobApplication>(
      `${API_BASE_URL}/api/job-applications/${applicationId}/withdraw/`,
      body,
      "Failed to withdraw application"
    );
    return transformApplication(data);
  },
};
