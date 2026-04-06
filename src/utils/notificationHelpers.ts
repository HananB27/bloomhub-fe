/**
 * Toast/notification helper utilities.
 * Centralized to ensure consistent notification UX across all modules.
 * Uses sonner library (already configured in package.json).
 */

import { toast } from "sonner";

export interface NotificationOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show success notification.
 */
export function notifySuccess(
  message: string,
  options?: NotificationOptions
): string | number {
  return toast.success(message, {
    duration: options?.duration ?? 3000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show error notification.
 */
export function notifyError(
  message: string,
  options?: NotificationOptions
): string | number {
  return toast.error(message, {
    duration: options?.duration ?? 5000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show warning notification.
 */
export function notifyWarning(
  message: string,
  options?: NotificationOptions
): string | number {
  return toast.warning(message, {
    duration: options?.duration ?? 4000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show info notification.
 */
export function notifyInfo(
  message: string,
  options?: NotificationOptions
): string | number {
  return toast.info(message, {
    duration: options?.duration ?? 3000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show loading notification (returns toast ID for later dismissal).
 */
export function notifyLoading(
  message: string,
  options?: Omit<NotificationOptions, "duration">
): string | number {
  return toast.loading(message, {
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Dismiss a specific toast by ID.
 */
export function dismissNotification(toastId: string | number): void {
  toast.dismiss(toastId);
}

/**
 * Replace a toast (e.g., loading → success).
 */
export function replaceNotification(
  toastId: string | number,
  message: string,
  type: "success" | "error" | "warning" | "info" = "success"
): void {
  dismissNotification(toastId);

  switch (type) {
    case "success":
      notifySuccess(message);
      break;
    case "error":
      notifyError(message);
      break;
    case "warning":
      notifyWarning(message);
      break;
    case "info":
      notifyInfo(message);
      break;
  }
}

/**
 * Handle API error with appropriate notification.
 * Extracts message from ApiError or standard Error.
 */
export function notifyApiError(error: Error): void {
  let message = "An error occurred";

  if (error instanceof Error) {
    message = error.message;
  }

  notifyError(message, {
    description: "Please try again or contact support if the issue persists.",
  });
}

/**
 * Show confirmation toast before proceeding (returns promise).
 * Used for destructive actions.
 */
export async function confirmAction(
  message: string,
  description?: string
): Promise<boolean> {
  return new Promise((resolve) => {
    toast(message, {
      description,
      action: {
        label: "Confirm",
        onClick: () => resolve(true),
      },
      duration: 10000,
      onAutoClose: () => resolve(false),
    });
  });
}

/**
 * Show loading state for async operations.
 * Automatically replaces with success/error.
 */
export async function withNotification<T>(
  promise: Promise<T>,
  loadingMessage: string,
  successMessage: string,
  errorPrefix = "Error"
): Promise<T> {
  const toastId = notifyLoading(loadingMessage);

  try {
    const result = await promise;
    replaceNotification(String(toastId), successMessage, "success");
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    replaceNotification(
      String(toastId),
      `${errorPrefix}: ${errorMessage}`,
      "error"
    );
    throw error;
  }
}

/**
 * Common notification messages (DRY - used across modules).
 */
export const NotificationMessages = {
  // Success
  CREATED_SUCCESS: "Created successfully",
  UPDATED_SUCCESS: "Updated successfully",
  DELETED_SUCCESS: "Deleted successfully",
  UPLOADED_SUCCESS: "Uploaded successfully",
  SIGNED_SUCCESS: "Signed successfully",
  SENT_SUCCESS: "Sent successfully",
  DOWNLOADED_SUCCESS: "Downloaded successfully",
  COPIED_SUCCESS: "Copied to clipboard",
  SAVED_SUCCESS: "Saved successfully",

  // Error
  CREATED_ERROR: "Failed to create",
  UPDATED_ERROR: "Failed to update",
  DELETED_ERROR: "Failed to delete",
  UPLOADED_ERROR: "Upload failed",
  SIGNED_ERROR: "Failed to sign",
  SENT_ERROR: "Failed to send",
  DOWNLOADED_ERROR: "Download failed",
  PERMISSION_ERROR: "You don't have permission to perform this action",
  NETWORK_ERROR: "Network error. Please check your connection",
  VALIDATION_ERROR: "Please check your input and try again",

  // Warning
  UNSAVED_CHANGES: "You have unsaved changes",
  CONFIRM_DELETE: "This action cannot be undone",
  CONFIRM_DISCARD: "Discard all changes?",

  // Info
  NO_RESULTS: "No results found",
  LOADING: "Loading...",
  PROCESSING: "Processing...",
};

/**
 * Show quick action feedback (brief, auto-dismiss).
 * Used for non-critical UX feedback.
 */
export function notifyQuickFeedback(
  message: string,
  type: "success" | "error" | "info" = "info"
): void {
  const notify = {
    success: notifySuccess,
    error: notifyError,
    info: notifyInfo,
  }[type];

  notify(message, { duration: 2000 });
}
