/**
 * Attendance status for a conference or course registration.
 */
export type ConferenceCourseRegistrationStatus =
  | "registered"
  | "attended"
  | "cancelled";

export const CONFERENCE_COURSE_REGISTRATION_STATUS_LABELS: Record<
  ConferenceCourseRegistrationStatus,
  string
> = {
  registered: "Registered",
  attended: "Attended",
  cancelled: "Cancelled",
};

export const CONFERENCE_COURSE_REGISTRATION_STATUS_PILL_CLASSES: Record<
  ConferenceCourseRegistrationStatus,
  string
> = {
  registered: "bg-blue-50 text-blue-700",
  attended: "bg-green-50 text-green-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export const ALL_CONFERENCE_COURSE_REGISTRATION_STATUSES: ConferenceCourseRegistrationStatus[] =
  ["registered", "attended", "cancelled"];

/**
 * Conference / course registration record.
 */
export interface ConferenceCourseRegistration {
  id: number;
  employeeId: number;
  employeeName: string;
  name: string;
  date: string; // ISO date
  status: ConferenceCourseRegistrationStatus;
  statusDisplay: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConferenceCourseRegistrationFilters {
  status?: ConferenceCourseRegistrationStatus;
  year?: number;
  employeeId?: number;
  search?: string;
  ordering?: string;
}

export interface CreateConferenceCourseRegistrationPayload {
  name: string;
  date: string;
  status: ConferenceCourseRegistrationStatus;
  notes?: string;
  employeeId?: number; // HR only
}

export type UpdateConferenceCourseRegistrationPayload = Partial<
  Omit<CreateConferenceCourseRegistrationPayload, "employeeId">
>;
