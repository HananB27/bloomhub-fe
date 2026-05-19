import { API_BASE_URL } from "@/lib/config";
import {
  buildQueryString,
  get,
  handleListResponse,
  patch,
  post,
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
  UpdateApplicationStatusPayload,
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
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const jobListingsApi = {
  async listActiveListings(filters?: JobListingFilters): Promise<JobListing[]> {
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
    const body = {
      title: payload.title,
      description: payload.description,
      department_id: payload.departmentId ?? null,
      open_at: payload.openAt,
      close_at: payload.closeAt,
      status: payload.status ?? "open",
    };
    const data = await post<ApiJobListing>(
      `${BASE}/`,
      body,
      "Failed to post role"
    );
    return transformListing(data);
  },

  async updateApplicationStatus(
    applicationId: number,
    payload: UpdateApplicationStatusPayload
  ): Promise<JobApplication> {
    const data = await patch<ApiJobApplication>(
      `${API_BASE_URL}/api/job-applications/${applicationId}/`,
      { status: payload.status },
      "Failed to update application status"
    );
    return transformApplication(data);
  },
};
