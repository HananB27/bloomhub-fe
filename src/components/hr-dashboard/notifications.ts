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

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    module: "vacations",
    type: "warning",
    title: "Pending Vacation Approvals",
    message: "5 vacation requests waiting for your approval",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "2",
    module: "announcements",
    type: "info",
    title: "New Company Announcement",
    message: "New hybrid work policy has been published",
    timestamp: "4 hours ago",
    isRead: false,
  },
  {
    id: "3",
    module: "timetracking",
    type: "alert",
    title: "Missing Timesheets",
    message: "3 employees haven't submitted this week's timesheet",
    timestamp: "6 hours ago",
    isRead: false,
  },
  {
    id: "4",
    module: "onboarding",
    type: "success",
    title: "Onboarding Complete",
    message: "Lisa Chen has completed all onboarding tasks",
    timestamp: "1 day ago",
    isRead: true,
  },
  {
    id: "5",
    module: "reviews",
    type: "warning",
    title: "Performance Reviews Due",
    message: "2 performance reviews are overdue",
    timestamp: "1 day ago",
    isRead: false,
  },
];

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
