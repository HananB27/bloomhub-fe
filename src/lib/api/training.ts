import { getApiBaseUrl } from "../config";
import type {
  CreateTrainingEntryPayload,
  TrainingEntry,
  TrainingEntryFilters,
  UpdateTrainingEntryPayload,
  PaginatedResponse,
  TrainingType,
  TrainingStatus,
} from "@/types/training";

const API_BASE_URL = getApiBaseUrl();

// ============================================
// TRANSFORMATION UTILITIES (snake_case <-> camelCase)
// ============================================

interface ApiTrainingEntry {
  id: number;
  employee_id: number;
  employee_name: string;
  course_title: string;
  provider: string;
  training_date: string;
  training_type: string;
  training_type_display: string;
  cost?: number;
  completed_at?: string;
  description?: string;
  certificate_link?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform API response to frontend TrainingEntry format
 */
function transformTrainingEntry(api: ApiTrainingEntry): TrainingEntry {
  return {
    id: api.id,
    employeeId: api.employee_id,
    employeeName: api.employee_name || "Unknown",
    courseTitle: api.course_title,
    provider: api.provider,
    trainingDate: api.training_date,
    trainingType: api.training_type as TrainingType,
    trainingTypeDisplay: api.training_type_display,
    cost:
      api.cost !== undefined && api.cost !== null
        ? Number(api.cost)
        : undefined,
    completedAt: api.completed_at,
    description: api.description,
    certificateLink: api.certificate_link,
    status: api.status as TrainingStatus,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Build query string from filters
 */
function buildFilterQuery(filters: TrainingEntryFilters): string {
  const params = new URLSearchParams();

  if (filters.trainingType) {
    params.append("training_type", filters.trainingType);
  }
  if (filters.year) {
    params.append("year", filters.year.toString());
  }
  if (filters.employeeId) {
    params.append("employee", filters.employeeId.toString());
  }
  if (filters.search) {
    params.append("search", filters.search);
  }
  if (filters.ordering) {
    params.append("ordering", filters.ordering);
  }

  return params.toString();
}

/**
 * Fetch all training entries with optional filters
 */
export const fetchTrainingEntries = async (
  accessToken: string,
  filters?: TrainingEntryFilters
): Promise<TrainingEntry[]> => {
  const queryString = filters ? buildFilterQuery(filters) : "";
  const url = `${API_BASE_URL}/api/training-entries/${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch training entries");
  }

  const data = await response.json();

  // Handle both paginated and non-paginated responses
  const entries = data.results ? data.results : Array.isArray(data) ? data : [];
  return entries.map(transformTrainingEntry);
};

/**
 * Fetch a specific training entry
 */
export const fetchTrainingEntry = async (
  id: number,
  accessToken: string
): Promise<TrainingEntry> => {
  const response = await fetch(`${API_BASE_URL}/api/training-entries/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 404) {
      throw new Error("Training entry not found");
    }
    throw new Error("Failed to fetch training entry");
  }

  const data: ApiTrainingEntry = await response.json();
  return transformTrainingEntry(data);
};

/**
 * Create a new training entry
 */
export const createTrainingEntry = async (
  payload: CreateTrainingEntryPayload,
  accessToken: string
): Promise<TrainingEntry> => {
  const requestBody: Record<string, string | number | undefined> = {
    course_title: payload.courseTitle,
    provider: payload.provider,
    training_date: payload.trainingDate,
    training_type: payload.trainingType,
  };

  if (payload.cost !== undefined) {
    requestBody.cost = payload.cost;
  }
  if (payload.description) {
    requestBody.description = payload.description;
  }
  if (payload.completedAt) {
    requestBody.completed_at = payload.completedAt;
  }
  if (payload.certificateLink !== undefined) {
    requestBody.certificate_link = payload.certificateLink || "";
  }
  if (payload.employeeId !== undefined) {
    requestBody.employee_id = payload.employeeId;
  }

  const response = await fetch(`${API_BASE_URL}/api/training-entries/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    const error = await response.json().catch(() => ({}));
    // Extract validation errors
    if (error.training_date) {
      throw new Error(
        Array.isArray(error.training_date)
          ? error.training_date[0]
          : error.training_date
      );
    }
    if (error.completed_at) {
      throw new Error(
        Array.isArray(error.completed_at)
          ? error.completed_at[0]
          : error.completed_at
      );
    }
    if (error.cost) {
      throw new Error(Array.isArray(error.cost) ? error.cost[0] : error.cost);
    }
    if (error.non_field_errors) {
      throw new Error(
        Array.isArray(error.non_field_errors)
          ? error.non_field_errors[0]
          : error.non_field_errors
      );
    }
    throw new Error("Failed to create training entry");
  }

  const data: ApiTrainingEntry = await response.json();
  return transformTrainingEntry(data);
};

/**
 * Update a training entry
 */
export const updateTrainingEntry = async (
  id: number,
  payload: UpdateTrainingEntryPayload,
  accessToken: string
): Promise<TrainingEntry> => {
  const requestBody: Record<string, string | number | undefined> = {};

  if (payload.courseTitle !== undefined) {
    requestBody.course_title = payload.courseTitle;
  }
  if (payload.provider !== undefined) {
    requestBody.provider = payload.provider;
  }
  if (payload.trainingDate !== undefined) {
    requestBody.training_date = payload.trainingDate;
  }
  if (payload.trainingType !== undefined) {
    requestBody.training_type = payload.trainingType;
  }
  if (payload.cost !== undefined) {
    requestBody.cost = payload.cost;
  }
  if (payload.description !== undefined) {
    requestBody.description = payload.description;
  }
  if (payload.completedAt !== undefined) {
    requestBody.completed_at = payload.completedAt;
  }
  if (payload.certificateLink !== undefined) {
    requestBody.certificate_link = payload.certificateLink || "";
  }

  const response = await fetch(`${API_BASE_URL}/api/training-entries/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 404) {
      throw new Error("Training entry not found");
    }
    const error = await response.json().catch(() => ({}));
    if (error.training_date) {
      throw new Error(
        Array.isArray(error.training_date)
          ? error.training_date[0]
          : error.training_date
      );
    }
    if (error.completed_at) {
      throw new Error(
        Array.isArray(error.completed_at)
          ? error.completed_at[0]
          : error.completed_at
      );
    }
    throw new Error("Failed to update training entry");
  }

  const data: ApiTrainingEntry = await response.json();
  return transformTrainingEntry(data);
};

/**
 * Delete a training entry
 */
export const deleteTrainingEntry = async (
  id: number,
  accessToken: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/training-entries/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 404) {
      throw new Error("Training entry not found");
    }
    if (response.status === 403) {
      throw new Error(
        "Forbidden: You can only delete your own training entries"
      );
    }
    throw new Error("Failed to delete training entry");
  }
};
