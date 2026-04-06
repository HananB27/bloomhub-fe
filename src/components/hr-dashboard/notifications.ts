import { useMemo, useState, useCallback } from "react";
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

let notificationIdCounter = 1;

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

  const addNotification = useCallback(
    (
      module: HrModuleId,
      type: NotificationType,
      title: string,
      message: string
    ) => {
      const notification: Notification = {
        id: `notif-${notificationIdCounter++}`,
        module,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    },
    []
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
    addNotification,
    markAsRead,
    markAllAsRead,
  };
}
