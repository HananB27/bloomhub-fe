import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HRDashboardApp from "@/components/hr-dashboard/App";

type SessionMock = {
  data: {
    user: {
      email: string;
    };
    accessToken?: string;
  };
  status: string;
};

const mocks = vi.hoisted(() => ({
  session: {
    data: {
      user: {
        email: "ada.lovelace@bloomteq.com",
      },
      accessToken: "access-token-123",
    },
    status: "authenticated",
  } as SessionMock,
  storedUser: null as Record<string, unknown> | null,
  careerLevelResponse: { career_level: "Senior" },
  apiBaseUrl: "https://api.example.com",
  useNotificationsResult: {
    notifications: [
      {
        id: "n1",
        module: "dashboard" as const,
        type: "success" as const,
        title: "Success notification",
        message: "Something succeeded",
        timestamp: "2026-05-26T10:00:00.000Z",
        isRead: false,
      },
    ],
    notificationCounts: { dashboard: 1 } as Record<string, number>,
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    addNotification: vi.fn(),
    refreshNotifications: vi.fn(),
  },
  routerPush: vi.fn(),
  router: {
    push: vi.fn(),
  },
  signOut: vi.fn(),
  logoutUser: vi.fn(),
  storeTokens: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("@/components/hr-dashboard/DashboardView", () => ({
  DashboardView: ({
    activeModule,
    onNavigate,
  }: {
    activeModule: string;
    onNavigate: (moduleId: string) => void;
  }) => (
    <div data-testid="dashboard-view">
      <span>Active: {activeModule}</span>
      <button type="button" onClick={() => onNavigate("training")}>
        Go Training
      </button>
    </div>
  ),
}));

vi.mock("@/components/hr-dashboard/AIAssistant", () => ({
  AIAssistant: ({
    onModuleNavigate,
  }: {
    onModuleNavigate: (moduleId: string) => void;
  }) => (
    <div data-testid="ai-assistant">
      AI Assistant
      <button type="button" onClick={() => onModuleNavigate("reviews")}>
        Go Reviews
      </button>
    </div>
  ),
}));

vi.mock("@/components/hr-dashboard/notifications", () => ({
  useNotifications: () => mocks.useNotificationsResult,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => mocks.session,
  signOut: (...args: unknown[]) => mocks.signOut(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/auth", () => ({
  logoutUser: (...args: unknown[]) => mocks.logoutUser(...args),
}));

vi.mock("@/lib/api/tokens", () => ({
  getStoredUser: () => mocks.storedUser,
  storeTokens: (...args: unknown[]) => mocks.storeTokens(...args),
}));

vi.mock("@/hooks/useAdminAccess", () => ({
  useAdminAccess: () => ({
    isAdmin: false,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/lib/config", () => ({
  getApiBaseUrl: () => mocks.apiBaseUrl,
  API_BASE_URL: mocks.apiBaseUrl,
}));

vi.mock("@/utils", () => ({
  formatRelativeTimestamp: () => "relative time",
}));

describe("HRDashboardApp coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session = {
      data: {
        user: {
          email: "ada.lovelace@bloomteq.com",
        },
        accessToken: "access-token-123",
      },
      status: "authenticated",
    };
    mocks.storedUser = null;
    mocks.apiBaseUrl = "https://api.example.com";
    mocks.careerLevelResponse = { career_level: "Senior" };
    mocks.useNotificationsResult.notifications = [
      {
        id: "n1",
        module: "dashboard",
        type: "success",
        title: "Success notification",
        message: "Something succeeded",
        timestamp: "2026-05-26T10:00:00.000Z",
        isRead: false,
      },
    ];
    mocks.useNotificationsResult.notificationCounts = { dashboard: 1 };
    mocks.useNotificationsResult.unreadCount = 1;
    mocks.useNotificationsResult.markAsRead = vi.fn();
    mocks.useNotificationsResult.markAllAsRead = vi.fn();
    mocks.useNotificationsResult.addNotification = vi.fn();
    mocks.useNotificationsResult.refreshNotifications = vi.fn();
    mocks.routerPush.mockReset();
    mocks.router = {
      push: mocks.routerPush,
    };
    mocks.signOut.mockReset();
    mocks.logoutUser.mockReset();
    mocks.storeTokens.mockReset();
    mocks.fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    vi.spyOn(globalThis, "fetch").mockImplementation(mocks.fetchMock as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the initial shell before the mounted effect runs", () => {
    const { container } = render(<HRDashboardApp />);

    expect(
      container.querySelector('[data-testid="notifications-trigger"]')
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="profile-trigger"]')
    ).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("stores the access token and renders the stored-user fallback", async () => {
    mocks.session = {
      data: {
        user: {
          email: "ada.lovelace@bloomteq.com",
        },
        accessToken: "access-token-123",
      },
      status: "authenticated",
    };
    mocks.storedUser = {
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada.lovelace@bloomteq.com",
      avatar_url: "https://example.com/avatar.png",
    };

    render(<HRDashboardApp />);

    await screen.findByTestId("profile-trigger");

    expect(mocks.storeTokens).toHaveBeenCalledWith({
      access: "access-token-123",
    });
    expect(screen.getByText("Ada · Member")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("profile-trigger"));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada.lovelace@bloomteq.com")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("fetches the profile when NODE_ENV allows it", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.storedUser = {
      email: "ada.lovelace@bloomteq.com",
    };
    mocks.fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mocks.careerLevelResponse,
    } as Response);

    render(<HRDashboardApp />);

    await waitFor(() => {
      expect(mocks.fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/auth/profile/",
        {
          headers: {
            Authorization: "Bearer access-token-123",
          },
        }
      );
    });
    await screen.findByTestId("profile-trigger");
    expect(
      screen.getByText("ada.lovelace@bloomteq.com · Senior")
    ).toBeInTheDocument();
  });

  it("skips the profile fetch when no access token exists", async () => {
    mocks.session = {
      data: {
        user: {
          email: "ada.lovelace@bloomteq.com",
        },
      },
      status: "authenticated",
    };

    render(<HRDashboardApp />);

    await screen.findByTestId("profile-trigger");
    expect(mocks.fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("profile-trigger")).toBeInTheDocument();
  });

  it("signs out when the profile endpoint returns 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    render(<HRDashboardApp />);

    await waitFor(() => {
      expect(mocks.fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/auth/profile/",
        {
          headers: {
            Authorization: "Bearer access-token-123",
          },
        }
      );
    });
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false });
    });
    expect(mocks.routerPush).toHaveBeenCalledWith("/login");
  });

  it("logs profile fetch failures without throwing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.fetchMock.mockRejectedValueOnce(new Error("network down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<HRDashboardApp />);

    await waitFor(() => {
      expect(mocks.fetchMock).toHaveBeenCalled();
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Profile fetch error:",
      expect.any(Error)
    );
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("opens notifications and handles the empty state", async () => {
    mocks.useNotificationsResult.notifications = [];
    mocks.useNotificationsResult.notificationCounts = {};
    mocks.useNotificationsResult.unreadCount = 0;

    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("notifications-trigger");
    fireEvent.click(trigger);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark all read/i })).toBeNull();
  });

  it("logs out from the profile menu", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("profile-trigger");
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole("button", { name: /Sign Out/i }));

    expect(mocks.logoutUser).toHaveBeenCalledWith("dummy-refresh");
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false });
    });
    expect(mocks.routerPush).toHaveBeenCalledWith("/login");
  });

  it("updates the sidebar CSS variable when toggled", async () => {
    render(<HRDashboardApp />);

    await screen.findByTestId("profile-trigger");
    expect(
      document.documentElement.style.getPropertyValue("--ws-sidebar-w")
    ).toBe("270px");

    fireEvent.click(screen.getByRole("button", { name: /Collapse sidebar/i }));
    expect(
      document.documentElement.style.getPropertyValue("--ws-sidebar-w")
    ).toBe("85px");
  });

  it("navigates from notification clicks and marks them read", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("notifications-trigger");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText("Success notification"));

    expect(mocks.useNotificationsResult.markAsRead).toHaveBeenCalledWith("n1");
    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: dashboard"
    );
  });

  it("navigates from child callbacks and logs out from the sidebar", async () => {
    render(<HRDashboardApp />);

    await screen.findByTestId("profile-trigger");

    fireEvent.click(screen.getByRole("button", { name: /Go Reviews/i }));
    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: reviews"
    );

    fireEvent.click(screen.getByRole("button", { name: /Go Training/i }));
    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: training"
    );

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(mocks.logoutUser).toHaveBeenCalledWith("dummy-refresh");
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false });
    });
    expect(mocks.routerPush).toHaveBeenCalledWith("/login");
  });
});
