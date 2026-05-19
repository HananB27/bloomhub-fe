export type JobListingStatus = "draft" | "open" | "closed" | "cancelled";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "withdrawn"
  | "accepted";

export interface JobListing {
  id: number;
  title: string;
  departmentId: number | null;
  departmentName: string;
  openAt: string;
  closeAt: string;
  status: JobListingStatus;
  statusDisplay: string;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobListingDetail extends JobListing {
  description: string;
  createdById: number | null;
  createdByName: string;
  hasApplied: boolean;
}

export interface JobApplication {
  id: number;
  listingId: number;
  listingTitle: string;
  applicantId: number;
  applicantName: string;
  status: ApplicationStatus;
  statusDisplay: string;
  appliedAt: string;
  coverNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobListingFilters {
  department?: number;
  search?: string;
  ordering?: string;
}

export interface ApplyToListingPayload {
  coverNote?: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  departmentId?: number | null;
  openAt: string;
  closeAt: string;
  status?: JobListingStatus;
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
}
