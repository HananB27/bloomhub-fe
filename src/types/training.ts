/**
 * Training Entry status
 */
export type TrainingStatus = "completed" | "in-progress" | "planned";

/**
 * Training type classification
 */
export type TrainingType =
  | "course"
  | "workshop"
  | "conference"
  | "certification"
  | "seminar"
  | "other";

/**
 * Training entry record
 */
export interface TrainingEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  courseTitle: string;
  provider: string;
  trainingDate: string; // ISO date format
  trainingType: TrainingType;
  trainingTypeDisplay: string;
  cost?: number;
  completedAt?: string; // ISO datetime format
  description?: string;
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Training entry filter criteria
 */
export interface TrainingEntryFilters {
  trainingType?: TrainingType;
  year?: number;
  employeeId?: number;
  search?: string;
  ordering?: string;
}

/**
 * Payload for creating a training entry
 */
export interface CreateTrainingEntryPayload {
  courseTitle: string;
  provider: string;
  trainingDate: string; // ISO date format
  trainingType: TrainingType;
  cost?: number;
  description?: string;
  completedAt?: string; // ISO datetime format
  employeeId?: number; // HR only: assign to different employee
}

/**
 * Payload for updating a training entry
 */
export interface UpdateTrainingEntryPayload extends Partial<CreateTrainingEntryPayload> {
  courseTitle?: string;
  provider?: string;
  trainingDate?: string;
  trainingType?: TrainingType;
}

/**
 * API response wrapper for list endpoints
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Error response format
 */
export interface ApiError {
  [key: string]: string[] | string;
}
