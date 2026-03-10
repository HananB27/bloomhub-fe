import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotifications } from "@/components/hr-dashboard/notifications";

const mockNotifications = [
  {
    id: "1",
    module: "dashboard" as const,
    type: "info" as const,
    title: "First",
    message: "Message 1",
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: "2",
    module: "dashboard" as const,
    type: "success" as const,
    title: "Second",
    message: "Message 2",
    timestamp: new Date().toISOString(),
    isRead: true,
  },
  {
    id: "3",
    module: "vacations" as const,
    type: "warning" as const,
    title: "Third",
    message: "Message 3",
    timestamp: new Date().toISOString(),
    isRead: false,
  },
];

describe("useNotifications", () => {
  it("returns initial notifications and zero counts when empty", () => {
    const { result } = renderHook(() => useNotifications([]));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.notificationCounts).toEqual({});
    expect(result.current.unreadCount).toBe(0);
  });

  it("returns initial notifications when provided", () => {
    const { result } = renderHook(() => useNotifications(mockNotifications));

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.unreadCount).toBe(2);
  });

  it("computes notificationCounts per module for unread only", () => {
    const { result } = renderHook(() => useNotifications(mockNotifications));

    expect(result.current.notificationCounts).toEqual({
      dashboard: 1,
      vacations: 1,
    });
  });

  it("markAsRead marks a notification as read", () => {
    const { result } = renderHook(() => useNotifications(mockNotifications));

    act(() => {
      result.current.markAsRead("1");
    });

    expect(result.current.notifications.find((n) => n.id === "1")?.isRead).toBe(
      true
    );
    expect(result.current.unreadCount).toBe(1);
  });

  it("markAsRead does nothing for non-existent id", () => {
    const { result } = renderHook(() => useNotifications(mockNotifications));
    const before = result.current.notifications;

    act(() => {
      result.current.markAsRead("nonexistent");
    });

    expect(result.current.notifications).toEqual(before);
  });

  it("markAllAsRead marks all as read", () => {
    const { result } = renderHook(() => useNotifications(mockNotifications));

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.notifications.every((n) => n.isRead)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notificationCounts).toEqual({});
  });
});
