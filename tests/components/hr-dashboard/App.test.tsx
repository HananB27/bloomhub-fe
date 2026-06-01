import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HRDashboardApp from "@/components/hr-dashboard/App";

// Mock heavy child components to keep tests fast and focus coverage on App
vi.mock("@/components/hr-dashboard/DashboardView", () => ({
  DashboardView: ({ activeModule }: { activeModule: string }) => (
    <div data-testid="dashboard-view">Active: {activeModule}</div>
  ),
}));
vi.mock("@/components/hr-dashboard/AIAssistant", () => ({
  AIAssistant: () => <div data-testid="ai-assistant">AI Assistant</div>,
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        name: "John Doe",
        email: "john.doe@bloomteq.com",
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      accessToken: "dummy-token",
    },
    status: "authenticated",
  })),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock useNotifications so we can control notifications and cover branches
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
vi.mock("@/components/hr-dashboard/notifications", () => ({
  useNotifications: vi.fn(() => ({
    notifications: [
      {
        id: "n1",
        module: "dashboard" as const,
        type: "success" as const,
        title: "Success notification",
        message: "Something succeeded",
        timestamp: new Date().toISOString(),
        isRead: false,
      },
      {
        id: "n2",
        module: "vacations" as const,
        type: "warning" as const,
        title: "Warning",
        message: "Please review",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        isRead: false,
      },
      {
        id: "n3",
        module: "feedback" as const,
        type: "alert" as const,
        title: "Alert",
        message: "Action required",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: "n4",
        module: "profiles" as const,
        type: "info" as const,
        title: "Info",
        message: "FYI",
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: false,
      },
    ],
    notificationCounts: { dashboard: 1, vacations: 1, profiles: 1 },
    unreadCount: 3,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
  })),
}));

describe("HRDashboardApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders main layout with sidebar and content", () => {
    render(<HRDashboardApp />);

    expect(screen.getByText(/Bloomteq/i)).toBeInTheDocument();
    expect(screen.getByText(/HR Management System/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search modules/i)).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-view")).toBeInTheDocument();
    expect(screen.getByTestId("ai-assistant")).toBeInTheDocument();
  });

  it("renders Dashboard as default active module", () => {
    render(<HRDashboardApp />);
    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: dashboard"
    );
  });

  it("shows search dropdown when typing and filters modules", async () => {
    render(<HRDashboardApp />);

    const search = screen.getByPlaceholderText(/Search modules/i);
    fireEvent.change(search, { target: { value: "vac" } });

    expect(screen.getAllByText(/Vacations/i).length).toBeGreaterThan(0);
    const buttons = screen.getAllByRole("button", { name: /Vacations/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("selecting a module from search closes dropdown and switches module", async () => {
    render(<HRDashboardApp />);

    const search = screen.getByPlaceholderText(/Search modules/i);
    fireEvent.change(search, { target: { value: "Vacations" } });

    // First "Vacations" button is sidebar nav, second is search dropdown result
    const vacationButtons = screen.getAllByRole("button", {
      name: /Vacations/i,
    });
    const dropdownOption = vacationButtons[vacationButtons.length - 1];
    fireEvent.click(dropdownOption);

    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: vacations"
    );
    expect(search).toHaveValue("");
  });

  it("sidebar toggle collapses and expands", async () => {
    render(<HRDashboardApp />);

    const collapseBtn = screen.getByRole("button", {
      name: /Collapse sidebar/i,
    });
    fireEvent.click(collapseBtn);

    expect(
      screen.getByRole("button", { name: /Expand sidebar/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Expand sidebar/i }));
    expect(
      screen.getByRole("button", { name: /Collapse sidebar/i })
    ).toBeInTheDocument();
  });

  it("clicking a sidebar nav item switches active module", async () => {
    render(<HRDashboardApp />);

    const vacationsNav = screen.getByRole("button", { name: /Vacations/i });
    fireEvent.click(vacationsNav);

    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: vacations"
    );
  });

  it("opens notifications popover and shows list", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("notifications-trigger");
    fireEvent.click(trigger);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Success notification")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Alert")).toBeInTheDocument();
    expect(screen.getByText("Info")).toBeInTheDocument();
  });

  it("mark as read is called when clicking a notification", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("notifications-trigger");
    fireEvent.click(trigger);

    const firstNotification = screen.getByText("Success notification");
    fireEvent.click(firstNotification);
    expect(mockMarkAsRead).toHaveBeenCalledWith("n1");
  });

  it("mark all read button calls markAllAsRead", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("notifications-trigger");
    fireEvent.click(trigger);
    const markAll = screen.getByRole("button", { name: /Mark all read/i });
    fireEvent.click(markAll);
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it("profile popover shows user info and View Profile", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("profile-trigger");
    fireEvent.click(trigger);

    expect(screen.getByText("john.doe@bloomteq.com")).toBeInTheDocument();
  });

  it("View Profile from menu switches module to profiles", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("profile-trigger");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: /View Profile/i }));

    expect(screen.getByTestId("dashboard-view")).toHaveTextContent(
      "Active: profiles"
    );
  });

  it("Settings dialog can be opened from profile menu", async () => {
    render(<HRDashboardApp />);

    const trigger = await screen.findByTestId("profile-trigger");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));

    expect(
      screen.getByRole("dialog", { name: /User Settings/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
  });

  it("displays unread notification badge when there are unread notifications", async () => {
    render(<HRDashboardApp />);
    const badge = await screen.findByText(/3|9\+/);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-red-500");
  });
});
