import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useNotifications } from "@/components/hr-dashboard/notifications";
import { notificationsApi } from "@/lib/api/modules/notifications";

vi.mock("@/lib/api/modules/notifications", () => ({
  notificationsApi: {
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

describe("useNotifications coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes from the API and maps unknown modules to dashboard", async () => {
    vi.mocked(notificationsApi.list).mockResolvedValueOnce([
      {
        id: 7,
        module: "unknown-module",
        type: "alert",
        title: "Remote alert",
        message: "Pay attention",
        link: "",
        metadata: {},
        isRead: false,
        readAt: null,
        createdAt: "2026-05-26T10:00:00.000Z",
      },
    ]);

    const { result } = renderHook(() =>
      useNotifications([
        {
          id: "local-1",
          module: "vacations",
          type: "info",
          title: "Local",
          message: "Keep me",
          timestamp: "2026-05-26T09:00:00.000Z",
          isRead: true,
        },
      ])
    );

    await waitFor(() => {
      expect(result.current.notifications[0]?.id).toBe("remote-7");
    });

    expect(notificationsApi.list).toHaveBeenCalledWith({ page_size: 50 });
    expect(result.current.notifications[0]).toMatchObject({
      id: "remote-7",
      module: "dashboard",
      type: "alert",
      title: "Remote alert",
      message: "Pay attention",
      timestamp: "2026-05-26T10:00:00.000Z",
      isRead: false,
      link: undefined,
      remoteId: 7,
    });
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notificationCounts).toEqual({ dashboard: 1 });
  });

  it("keeps current notifications if refresh fails", async () => {
    vi.mocked(notificationsApi.list).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() =>
      useNotifications([
        {
          id: "1",
          module: "dashboard",
          type: "info",
          title: "Seed",
          message: "Seeded",
          timestamp: "2026-05-26T09:00:00.000Z",
          isRead: false,
        },
      ])
    );

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Seed");
  });

  it("marks read items through the API when a remote id exists", async () => {
    vi.mocked(notificationsApi.list).mockResolvedValueOnce([
      {
        id: 1,
        module: "dashboard",
        type: "info",
        title: "Remote",
        message: "Unread",
        link: "",
        metadata: {},
        isRead: false,
        readAt: null,
        createdAt: "2026-05-26T10:00:00.000Z",
      },
    ]);
    vi.mocked(notificationsApi.markRead).mockResolvedValueOnce({
      id: 1,
      module: "dashboard",
      type: "info",
      title: "Remote",
      message: "Updated",
      link: "",
      metadata: {},
      isRead: true,
      readAt: "2026-05-26T10:05:00.000Z",
      createdAt: "2026-05-26T10:00:00.000Z",
    });

    const { result } = renderHook(() =>
      useNotifications([
        {
          id: "remote-1",
          remoteId: 1,
          module: "dashboard",
          type: "info",
          title: "Remote",
          message: "Unread",
          timestamp: "2026-05-26T10:00:00.000Z",
          isRead: false,
        },
      ])
    );

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));

    await act(async () => {
      await result.current.markAsRead("remote-1");
    });

    expect(notificationsApi.markRead).toHaveBeenCalledWith(1);
    expect(result.current.notifications[0]?.isRead).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("marks all notifications read and tolerates API failures", async () => {
    vi.mocked(notificationsApi.list).mockRejectedValueOnce(
      new Error("skip refresh")
    );
    vi.mocked(notificationsApi.markAllRead).mockRejectedValueOnce(
      new Error("offline")
    );

    const { result } = renderHook(() =>
      useNotifications([
        {
          id: "1",
          module: "dashboard",
          type: "info",
          title: "One",
          message: "Unread",
          timestamp: "2026-05-26T10:00:00.000Z",
          isRead: false,
        },
        {
          id: "2",
          module: "vacations",
          type: "success",
          title: "Two",
          message: "Unread",
          timestamp: "2026-05-26T10:01:00.000Z",
          isRead: false,
        },
      ])
    );

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(notificationsApi.markAllRead).toHaveBeenCalledTimes(1);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notificationCounts).toEqual({});
  });

  it("adds local notifications at the top of the list", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1716717600000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    vi.mocked(notificationsApi.list).mockRejectedValueOnce(
      new Error("skip refresh")
    );

    const { result } = renderHook(() => useNotifications([]));

    await act(async () => {
      result.current.addNotification(
        "profiles",
        "success",
        "Local notice",
        "Created locally"
      );
    });

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(result.current.notifications[0]).toMatchObject({
      module: "profiles",
      type: "success",
      title: "Local notice",
      message: "Created locally",
      isRead: false,
    });
    expect(result.current.notifications[0]?.id).toMatch(
      /^local-1716717600000-/
    );
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notificationCounts).toEqual({ profiles: 1 });
  });
});
