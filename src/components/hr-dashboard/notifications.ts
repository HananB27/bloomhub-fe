import { useMemo, useState } from "react";
import type { HrModuleId } from "./hr-modules";

export type NotificationType = "info" | "warning" | "success" | "alert";

export interface Notification {
  id: string;
  module: HrModuleId;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// TODO: Implement - fetch notifications from API
export const DEFAULT_NOTIFICATIONS: Notification[] = [];

export function useNotifications(
  initialNotifications: Notification[] = DEFAULT_NOTIFICATIONS
) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const notificationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((notification) => {
      if (!notification.isRead) {
        counts[notification.module] = (counts[notification.module] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  return {
    notifications,
    notificationCounts,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
