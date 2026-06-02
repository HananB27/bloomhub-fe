export type JobListingStatus = "draft" | "open" | "closed" | "cancelled";

export const JOB_LISTING_STATUS_LABELS: Record<JobListingStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const ALL_JOB_LISTING_STATUSES: JobListingStatus[] = [
  "draft",
  "open",
  "closed",
  "cancelled",
];

export type ListingTone =
  | "draft"
  | "upcoming"
  | "open"
  | "closing-soon"
  | "expired"
  | "cancelled"
  | "filled"
  | "closed";

export interface ListingTonePill {
  label: string;
  bg: string;
  dot: string;
}

export const LISTING_TONE_PILLS: Record<ListingTone, ListingTonePill> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
  },
  upcoming: {
    label: "Upcoming",
    bg: "bg-sky-50 text-sky-700",
    dot: "bg-sky-600",
  },
  open: {
    label: "Open",
    bg: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-600",
  },
  "closing-soon": {
    label: "Closing soon",
    bg: "bg-amber-50 text-amber-700",
    dot: "bg-amber-600",
  },
  filled: {
    label: "Filled",
    bg: "bg-blue-50 text-blue-700",
    dot: "bg-blue-600",
  },
  expired: {
    label: "Expired",
    bg: "bg-rose-50 text-rose-700",
    dot: "bg-rose-600",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  closed: {
    label: "Closed",
    bg: "bg-red-50 text-red-700",
    dot: "bg-red-600",
  },
};

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "withdrawn"
  | "accepted";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const ALL_APPLICATION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "accepted",
  "rejected",
  "withdrawn",
];

export interface ApplicationStatusBadge {
  bg: string;
  dot: string;
}

export const APPLICATION_STATUS_BADGE_COLORS: Record<
  ApplicationStatus,
  ApplicationStatusBadge
> = {
  submitted: { bg: "bg-gray-100 text-gray-700", dot: "bg-gray-500" },
  under_review: { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-600" },
  shortlisted: { bg: "bg-violet-50 text-violet-700", dot: "bg-violet-600" },
  accepted: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
  rejected: { bg: "bg-red-50 text-red-700", dot: "bg-red-600" },
  withdrawn: { bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

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
  decisionNote: string;
  decidedById: number | null;
  decidedByName: string;
  decidedAt: string | null;
  allowedNextStatuses: ApplicationStatus[];
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

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  departmentId?: number | null;
  openAt?: string;
  closeAt?: string;
  status?: JobListingStatus;
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
  decisionNote?: string;
}

export interface WithdrawApplicationPayload {
  decisionNote?: string;
}

export const APPLICATION_TERMINAL_STATUSES: ApplicationStatus[] = [
  "accepted",
  "rejected",
  "withdrawn",
];

export function isTerminalApplicationStatus(s: ApplicationStatus): boolean {
  return APPLICATION_TERMINAL_STATUSES.includes(s);
}
