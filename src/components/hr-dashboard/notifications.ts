import { useCallback, useEffect, useMemo, useState } from "react";
import type { HrModuleId } from "./hr-modules";
import {
  notificationsApi,
  type AppNotification,
} from "@/lib/api/modules/notifications";

export type NotificationType = "info" | "warning" | "success" | "alert";

export interface Notification {
  id: string;
  module: HrModuleId;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  remoteId?: number;
}

export type AddNotification = (
  module: HrModuleId,
  type: NotificationType,
  title: string,
  message: string
) => void;

const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

const KNOWN_MODULE_IDS: readonly HrModuleId[] = [
  "dashboard",
  "vacations",
  "profiles",
  "reviews",
  "onboarding",
  "training",
  "compensation",
  "feedback",
  "timetracking",
  "mobility",
  "documents",
  "assets",
  "orgchart",
  "analytics",
  "announcements",
  "admin",
];

function isHrModuleId(value: string): value is HrModuleId {
  return (KNOWN_MODULE_IDS as readonly string[]).includes(value);
}

function mapApiNotificationToLocal(remote: AppNotification): Notification {
  const moduleId: HrModuleId = isHrModuleId(remote.module)
    ? remote.module
    : "dashboard";
  return {
    id: `remote-${remote.id}`,
    remoteId: remote.id,
    module: moduleId,
    type: remote.type as NotificationType,
    title: remote.title,
    message: remote.message,
    timestamp: remote.createdAt,
    isRead: remote.isRead,
    link: remote.link || undefined,
  };
}

export function useNotifications(initialNotifications: Notification[] = []) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const refresh = useCallback(async () => {
    try {
      const remote = await notificationsApi.list({ page_size: 50 });
      setNotifications(remote.map(mapApiNotificationToLocal));
    } catch {
      // Fail silently — keep current state.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, NOTIFICATION_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

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

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      if (target?.remoteId !== undefined) {
        try {
          await notificationsApi.markRead(target.remoteId);
        } catch {
          // Optimistic; next poll reconciles.
        }
      }
    },
    [notifications]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Optimistic; next poll reconciles.
    }
  }, []);

  const addNotification = useCallback<AddNotification>(
    (module, type, title, message) => {
      setNotifications((prev) => [
        {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          module,
          type,
          title,
          message,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    },
    []
  );

  return {
    notifications,
    notificationCounts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    refreshNotifications: refresh,
  };
}
