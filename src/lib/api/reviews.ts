import { getApiBaseUrl } from "../config";
import type {
  CreatePerformanceReviewPayload,
  PerformanceReview,
  PerformanceReviewListItem,
  PerformanceReviewNote,
  CreateReviewNotePayload,
  UpdateReviewNotePayload,
  PerformanceReviewActionPoint,
  CreateActionPointPayload,
  UpdateActionPointPayload,
  PerformanceReviewAttachment,
  PerformanceReviewReminder,
  PerformanceReviewHistoryEvent,
  UpdatePerformanceReviewPayload,
  UpdateReminderPayload,
  ReviewStatus,
  ReviewType,
  NoteVisibility,
  ActionPointStatus,
  ReminderType,
  HistoryEventType,
} from "@/types/reviews";

const API_BASE_URL = getApiBaseUrl();

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

/**
 * Format backend error responses into user-friendly messages
 */
export const formatErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // Handle field-specific validation errors
    const fieldErrors: string[] = [];
    for (const [, messages] of Object.entries(errorObj)) {
      if (Array.isArray(messages)) {
        messages.forEach((msg) => {
          if (typeof msg === "string") {
            fieldErrors.push(msg);
          }
        });
      } else if (typeof messages === "string") {
        fieldErrors.push(messages);
      }
    }
    
    if (fieldErrors.length > 0) {
      return fieldErrors.join(" ");
    }

    // Fallback to generic error message
    return JSON.stringify(error);
  }

  return "An unknown error occurred";
};

// ============================================
// TRANSFORMATION UTILITIES (snake_case <-> camelCase)
// ============================================

interface ApiPerformanceReview {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_avatar?: string;
  reviewer_id: string;
  reviewer_name: string;
  review_type: string;
  status: string;
  title?: string;
  period_start?: string;
  period_end?: string;
  scheduled_date: string;
  next_review_date?: string;
  completed_at?: string;
  outcome?: string;
  overall_rating?: number;
  performance_score?: number;
  cpf_score?: number;
  cpf_current_level?: string;
  cpf_recommended_level?: string;
  summary?: string;
  employee_comments?: string;
  reviewer_comments?: string;
  reminder_offsets_days: number[];
  created_at: string;
  updated_at: string;
  notes_count?: number;
  action_points_count?: number;
  attachments_count?: number;
}

interface ApiPerformanceReviewNote {
  id: string;
  review_id: string;
  author_id: string;
  author_name: string;
  visibility: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_reviewer: boolean;
}

interface ApiPerformanceReviewActionPoint {
  id: string;
  review_id: string;
  title: string;
  description: string;
  owner_id: string;
  owner_name: string;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiPerformanceReviewAttachment {
  id: string;
  review_id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

interface ApiPerformanceReviewReminder {
  id: string;
  review_id: string;
  recipient_id: string;
  recipient_name: string;
  reminder_type: string;
  scheduled_for: string;
  sent_at?: string;
  read_at?: string;
  is_read: boolean;
}

interface ApiPerformanceReviewHistoryEvent {
  id: string;
  review_id: string;
  event_type: string;
  actor_id: string;
  actor_name: string;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
  created_at: string;
}

/**
 * Transform API response to frontend PerformanceReview format
 */
function transformPerformanceReview(api: ApiPerformanceReview): PerformanceReview {
  return {
    id: api.id,
    employeeId: api.employee_id,
    employeeName: api.employee_name,
    employeeAvatar: api.employee_avatar || undefined,
    reviewerId: api.reviewer_id,
    reviewerName: api.reviewer_name,
    reviewType: api.review_type as ReviewType,
    status: api.status as ReviewStatus,
    title: api.title || undefined,
    periodStart: api.period_start || undefined,
    periodEnd: api.period_end || undefined,
    scheduledDate: api.scheduled_date,
    nextReviewDate: api.next_review_date || undefined,
    completedAt: api.completed_at || undefined,
    outcome: (api.outcome as "exceeds_expectations" | "meets_expectations" | "partially_meets" | "needs_improvement" | "unsatisfactory" | undefined) || undefined,
    overallRating: api.overall_rating || undefined,
    performanceScore: api.performance_score || undefined,
    cpfScore: api.cpf_score || undefined,
    cpfCurrentLevel: api.cpf_current_level || undefined,
    cpfRecommendedLevel: api.cpf_recommended_level || undefined,
    summary: api.summary || undefined,
    employeeComments: api.employee_comments || undefined,
    reviewerComments: api.reviewer_comments || undefined,
    reminderOffsetsDays: api.reminder_offsets_days,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Transform API response to frontend PerformanceReviewNote format
 */
function transformPerformanceReviewNote(
  api: ApiPerformanceReviewNote
): PerformanceReviewNote {
  return {
    id: api.id,
    reviewId: api.review_id,
    authorId: api.author_id,
    authorName: api.author_name,
    visibility: api.visibility as NoteVisibility,
    content: api.content,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    isReviewer: api.is_reviewer,
  };
}

/**
 * Transform API response to frontend PerformanceReviewActionPoint format
 */
function transformActionPoint(
  api: ApiPerformanceReviewActionPoint
): PerformanceReviewActionPoint {
  return {
    id: api.id,
    reviewId: api.review_id,
    title: api.title,
    description: api.description,
    ownerId: api.owner_id,
    ownerName: api.owner_name,
    dueDate: api.due_date,
    status: api.status as ActionPointStatus,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/**
 * Transform API response to frontend PerformanceReviewAttachment format
 */
function transformAttachment(
  api: ApiPerformanceReviewAttachment
): PerformanceReviewAttachment {
  return {
    id: api.id,
    reviewId: api.review_id,
    fileName: api.file_name,
    fileSize: api.file_size,
    fileUrl: api.file_url,
    uploadedById: api.uploaded_by_id,
    uploadedByName: api.uploaded_by_name,
    uploadedAt: api.uploaded_at,
  };
}

/**
 * Transform API response to frontend PerformanceReviewReminder format
 */
function transformReminder(
  api: ApiPerformanceReviewReminder
): PerformanceReviewReminder {
  return {
    id: api.id,
    reviewId: api.review_id,
    recipientId: api.recipient_id,
    recipientName: api.recipient_name,
    reminderType: api.reminder_type as ReminderType,
    scheduledFor: api.scheduled_for,
    sentAt: api.sent_at || undefined,
    readAt: api.read_at || undefined,
    isRead: api.is_read,
  };
}

/**
 * Transform API response to frontend PerformanceReviewHistoryEvent format
 */
function transformHistoryEvent(
  api: ApiPerformanceReviewHistoryEvent
): PerformanceReviewHistoryEvent {
  return {
    id: api.id,
    reviewId: api.review_id,
    eventType: api.event_type as HistoryEventType,
    actorId: api.actor_id,
    actorName: api.actor_name,
    description: api.description,
    metadata: api.metadata || undefined,
    createdAt: api.created_at,
  };
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch performance reviews (user's own + assigned/team if reviewer)
 */
export const fetchPerformanceReviews = async (
  accessToken: string
): Promise<PerformanceReviewListItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/performance-reviews/`, {
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
    throw new Error("Failed to fetch performance reviews");
  }

  const data: (ApiPerformanceReview)[] = await response.json();

  return data.map((item) => ({
    ...transformPerformanceReview(item),
    notesCount: item.notes_count,
    actionPointsCount: item.action_points_count,
    attachmentsCount: item.attachments_count,
  }));
};

/**
 * Fetch a specific performance review
 */
export const fetchPerformanceReview = async (
  id: string,
  accessToken: string
): Promise<PerformanceReview> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${id}/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 404) {
      throw new Error("Performance review not found");
    }
    throw new Error("Failed to fetch performance review");
  }

  const data: ApiPerformanceReview = await response.json();
  return transformPerformanceReview(data);
};

export const createPerformanceReview = async (
  payload: CreatePerformanceReviewPayload,
  accessToken: string
): Promise<PerformanceReview> => {
  // Convert string IDs to numbers if needed
  const employeeId = typeof payload.employee === 'string' ? parseInt(payload.employee, 10) : payload.employee;
  const reviewerId = typeof payload.reviewer === 'string' ? parseInt(payload.reviewer, 10) : payload.reviewer;
  
  const requestBody = {
    employee: employeeId,
    reviewer: reviewerId,
    review_type: payload.reviewType,
    scheduled_date: payload.scheduledDate,
    title: payload.title || "",
    period_start: payload.periodStart || null,
    period_end: payload.periodEnd || null,
    next_review_date: payload.nextReviewDate || null,
    reminder_offsets_days: payload.reminderOffsetsDays || [3, 1],
  };
  
  const response = await fetch(`${API_BASE_URL}/api/performance-reviews/`, {
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
    if (response.status === 403) {
      throw new Error("Forbidden: Only HR/managers can create reviews");
    }
    const error = await response.json().catch(() => ({}));
    const errorMessage = formatErrorMessage(error);
    throw new Error(errorMessage);
  }

  const data: ApiPerformanceReview = await response.json();
  return transformPerformanceReview(data);
};

/**
 * Update a performance review
 */
export const updatePerformanceReview = async (
  id: string,
  payload: UpdatePerformanceReviewPayload,
  accessToken: string
): Promise<PerformanceReview> => {
  const body: Record<string, string | number | undefined> = {};
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.overallRating !== undefined)
    body.overall_rating = payload.overallRating;
  if (payload.performanceScore !== undefined)
    body.performance_score = payload.performanceScore;
  if (payload.cpfScore !== undefined) body.cpf_score = payload.cpfScore;
  if (payload.cpfCurrentLevel !== undefined) body.cpf_current_level = payload.cpfCurrentLevel;
  if (payload.cpfRecommendedLevel !== undefined) body.cpf_recommended_level = payload.cpfRecommendedLevel;
  if (payload.summary !== undefined) body.summary = payload.summary;
  if (payload.employeeComments !== undefined) body.employee_comments = payload.employeeComments;
  if (payload.reviewerComments !== undefined) body.reviewer_comments = payload.reviewerComments;
  if (payload.outcome !== undefined) body.outcome = payload.outcome;
  if (payload.scheduledDate !== undefined) body.scheduled_date = payload.scheduledDate;
  if (payload.nextReviewDate !== undefined) body.next_review_date = payload.nextReviewDate;

  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: You don't have permission to update this review");
    }
    if (response.status === 404) {
      throw new Error("Performance review not found");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update performance review");
  }

  const data: ApiPerformanceReview = await response.json();
  return transformPerformanceReview(data);
};

/**
 * Update review status (e.g., start, complete, cancel)
 */
export const updateReviewStatus = async (
  id: string,
  newStatus: string,
  accessToken: string
): Promise<PerformanceReview> => {
  return updatePerformanceReview(
    id,
    { status: newStatus as ReviewStatus },
    accessToken
  );
};

/**
 * Fetch notes for a review
 */
export const fetchReviewNotes = async (
  reviewId: string,
  accessToken: string
): Promise<PerformanceReviewNote[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/notes/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch review notes");
  }

  const data: ApiPerformanceReviewNote[] = await response.json();
  return data.map(transformPerformanceReviewNote);
};

/**
 * Create a note on a review
 */
export const createReviewNote = async (
  reviewId: string,
  payload: CreateReviewNotePayload,
  accessToken: string
): Promise<PerformanceReviewNote> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/notes/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content: payload.content,
        visibility: payload.visibility,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: You don't have permission to add notes");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create review note");
  }

  const data: ApiPerformanceReviewNote = await response.json();
  return transformPerformanceReviewNote(data);
};

/**
 * Update a review note
 */
export const updateReviewNote = async (
  reviewId: string,
  noteId: string,
  payload: UpdateReviewNotePayload,
  accessToken: string
): Promise<PerformanceReviewNote> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/notes/${noteId}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content: payload.content }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: You can't edit this note");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update review note");
  }

  const data: ApiPerformanceReviewNote = await response.json();
  return transformPerformanceReviewNote(data);
};

/**
 * Delete a review note
 */
export const deleteReviewNote = async (
  reviewId: string,
  noteId: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/notes/${noteId}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 403) {
      throw new Error("Forbidden: You can't delete this note");
    }
    throw new Error("Failed to delete review note");
  }
};

/**
 * Fetch action points for a review
 */
export const fetchActionPoints = async (
  reviewId: string,
  accessToken: string
): Promise<PerformanceReviewActionPoint[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/action-points/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch action points");
  }

  const data: ApiPerformanceReviewActionPoint[] = await response.json();
  return data.map(transformActionPoint);
};

/**
 * Create an action point
 */
export const createActionPoint = async (
  reviewId: string,
  payload: CreateActionPointPayload,
  accessToken: string
): Promise<PerformanceReviewActionPoint> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/action-points/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        owner_id: payload.ownerId,
        due_date: payload.dueDate,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create action point");
  }

  const data: ApiPerformanceReviewActionPoint = await response.json();
  return transformActionPoint(data);
};

/**
 * Update an action point
 */
export const updateActionPoint = async (
  reviewId: string,
  actionPointId: string,
  payload: UpdateActionPointPayload,
  accessToken: string
): Promise<PerformanceReviewActionPoint> => {
  const body: Record<string, string | undefined> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.ownerId !== undefined) body.owner_id = payload.ownerId;
  if (payload.dueDate !== undefined) body.due_date = payload.dueDate;
  if (payload.status !== undefined) body.status = payload.status;

  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/action-points/${actionPointId}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update action point");
  }

  const data: ApiPerformanceReviewActionPoint = await response.json();
  return transformActionPoint(data);
};

/**
 * Delete an action point
 */
export const deleteActionPoint = async (
  reviewId: string,
  actionPointId: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/action-points/${actionPointId}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to delete action point");
  }
};

/**
 * Upload attachment to a review
 */
export const uploadAttachment = async (
  reviewId: string,
  file: File,
  accessToken: string
): Promise<PerformanceReviewAttachment> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/attachments/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    if (response.status === 413) {
      throw new Error("File too large");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to upload attachment");
  }

  const data: ApiPerformanceReviewAttachment = await response.json();
  return transformAttachment(data);
};

/**
 * Fetch attachments for a review
 */
export const fetchAttachments = async (
  reviewId: string,
  accessToken: string
): Promise<PerformanceReviewAttachment[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/attachments/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch attachments");
  }

  const data: ApiPerformanceReviewAttachment[] = await response.json();
  return data.map(transformAttachment);
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (
  reviewId: string,
  attachmentId: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/attachments/${attachmentId}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to delete attachment");
  }
};

/**
 * Fetch history for a review
 */
export const fetchReviewHistory = async (
  reviewId: string,
  accessToken: string
): Promise<PerformanceReviewHistoryEvent[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-reviews/${reviewId}/history/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch review history");
  }

  const data: ApiPerformanceReviewHistoryEvent[] = await response.json();
  return data.map(transformHistoryEvent);
};

/**
 * Fetch reminders for current user
 */
export const fetchReminders = async (
  accessToken: string
): Promise<PerformanceReviewReminder[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-review-reminders/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch reminders");
  }

  const data: ApiPerformanceReviewReminder[] = await response.json();
  return data.map(transformReminder);
};

/**
 * Mark a reminder as read
 */
export const markReminderAsRead = async (
  reminderId: string,
  accessToken: string
): Promise<PerformanceReviewReminder> => {
  const response = await fetch(
    `${API_BASE_URL}/api/performance-review-reminders/${reminderId}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ is_read: true }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to mark reminder as read");
  }

  const data: ApiPerformanceReviewReminder = await response.json();
  return transformReminder(data);
};

/**
 * Fetch user profiles (for employee/reviewer selection)
 */
export interface UserProfileDTO {
  id: number;
  user_id: number;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  };
  employee_id?: string;
  department?: string;
  phone_number?: string;
  hire_date?: string;
}

export interface UserProfile {
  id: number;
  name: string;
}

export const fetchUserProfiles = async (accessToken: string): Promise<UserProfile[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user-profiles/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again");
    }
    throw new Error("Failed to fetch user profiles");
  }

  const data: UserProfileDTO[] = await response.json();
  return data.map((profile) => {
    const firstName = profile.user?.first_name || "";
    const lastName = profile.user?.last_name || "";
    const username = profile.user?.username || `User ${profile.id}`;
    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || username;
    
    return {
      id: profile.id,
      name: displayName,
    };
  });
};
