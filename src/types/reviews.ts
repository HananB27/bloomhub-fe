export type ReviewStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ReviewType = "quarterly" | "mid_year" | "annual" | "probation" | "custom";

export type NoteVisibility = "private" | "shared";

export type ReminderType = "upcoming_due" | "overdue" | "pending_action" | "completion_reminder";

export type ActionPointStatus = "open" | "in_progress" | "completed";

export type HistoryEventType =
  | "review_created"
  | "review_scheduled"
  | "review_started"
  | "review_completed"
  | "review_cancelled"
  | "note_added"
  | "note_updated"
  | "note_deleted"
  | "action_point_added"
  | "action_point_updated"
  | "action_point_deleted"
  | "attachment_added"
  | "attachment_deleted"
  | "status_changed"
  | "reminder_sent"
  | "reminder_read";

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  reviewerId: string;
  reviewerName: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  title?: string;
  periodStart?: string; // ISO date
  periodEnd?: string; // ISO date
  scheduledDate: string; // ISO date
  nextReviewDate?: string; // ISO date
  completedAt?: string; // ISO datetime
  outcome?: "exceeds_expectations" | "meets_expectations" | "partially_meets" | "needs_improvement" | "unsatisfactory";
  overallRating?: number; // 1-5 scale
  performanceScore?: number;
  cpfScore?: number;
  cpfCurrentLevel?: string;
  cpfRecommendedLevel?: string;
  summary?: string;
  employeeComments?: string;
  reviewerComments?: string;
  reminderOffsetsDays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewNote {
  id: string;
  reviewId: string;
  authorId: string;
  authorName: string;
  visibility: NoteVisibility;
  content: string;
  createdAt: string;
  updatedAt: string;
  isReviewer: boolean; // Whether author is the review's reviewer
}

export interface PerformanceReviewActionPoint {
  id: string;
  reviewId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  dueDate: string; // ISO date
  status: ActionPointStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewAttachment {
  id: string;
  reviewId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface PerformanceReviewReminder {
  id: string;
  reviewId: string;
  recipientId: string;
  recipientName: string;
  reminderType: ReminderType;
  scheduledFor: string; // ISO datetime
  sentAt?: string; // ISO datetime
  readAt?: string; // ISO datetime
  isRead: boolean;
}

export interface PerformanceReviewHistoryEvent {
  id: string;
  reviewId: string;
  eventType: HistoryEventType;
  actorId: string;
  actorName: string;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface PerformanceReviewListItem extends PerformanceReview {
  notesCount?: number;
  actionPointsCount?: number;
  attachmentsCount?: number;
}

// Payload types for API requests
export interface CreatePerformanceReviewPayload {
  employee: string | number; // UserProfile ID
  reviewer: string | number; // UserProfile ID
  reviewType: ReviewType;
  scheduledDate: string; // ISO date
  title?: string;
  periodStart?: string; // ISO date
  periodEnd?: string; // ISO date
  nextReviewDate?: string; // ISO date
  reminderOffsetsDays?: number[];
}

export interface UpdatePerformanceReviewPayload {
  status?: ReviewStatus;
  overallRating?: number;
  performanceScore?: number;
  cpfScore?: number;
  cpfCurrentLevel?: string;
  cpfRecommendedLevel?: string;
  summary?: string;
  employeeComments?: string;
  reviewerComments?: string;
  outcome?: string;
  scheduledDate?: string;
  nextReviewDate?: string;
}

export interface CreateReviewNotePayload {
  content: string;
  visibility: NoteVisibility;
}

export interface UpdateReviewNotePayload {
  content: string;
}

export interface CreateActionPointPayload {
  title: string;
  description: string;
  ownerId: string;
  dueDate: string;
}

export interface UpdateActionPointPayload {
  title?: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  status?: ActionPointStatus;
}

export interface UpdateReminderPayload {
  isRead: boolean;
}

// Display constants
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  deferred: "Deferred",
};

export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  quarterly: "Quarterly Review",
  mid_year: "Mid-Year Review",
  annual: "Annual Review",
  probation: "Probation Review",
  custom: "Custom Review",
};

export const REVIEW_TYPE_COLORS: Record<ReviewType, string> = {
  quarterly: "bg-blue-500",
  mid_year: "bg-purple-500",
  annual: "bg-green-500",
  probation: "bg-orange-500",
  custom: "bg-gray-500",
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  upcoming_due: "Upcoming Due",
  overdue: "Overdue",
  pending_action: "Pending Action",
  completion_reminder: "Completion Reminder",
};

export const ACTION_POINT_STATUS_LABELS: Record<ActionPointStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export const ACTION_POINT_STATUS_COLORS: Record<ActionPointStatus, string> = {
  open: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  private: "Private",
  shared: "Shared",
};

export const HISTORY_EVENT_TYPE_LABELS: Record<HistoryEventType, string> = {
  review_created: "Review Created",
  review_scheduled: "Review Scheduled",
  review_started: "Review Started",
  review_completed: "Review Completed",
  review_cancelled: "Review Cancelled",
  note_added: "Note Added",
  note_updated: "Note Updated",
  note_deleted: "Note Deleted",
  action_point_added: "Action Point Added",
  action_point_updated: "Action Point Updated",
  action_point_deleted: "Action Point Deleted",
  attachment_added: "Attachment Added",
  attachment_deleted: "Attachment Deleted",
  status_changed: "Status Changed",
  reminder_sent: "Reminder Sent",
  reminder_read: "Reminder Read",
};

export const ALL_REVIEW_STATUSES: ReviewStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "deferred",
];

export const ALL_REVIEW_TYPES: ReviewType[] = [
  "quarterly",
  "mid_year",
  "annual",
  "probation",
  "custom",
];

export const RATING_SCALE = [1, 2, 3, 4, 5] as const;

export const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};
