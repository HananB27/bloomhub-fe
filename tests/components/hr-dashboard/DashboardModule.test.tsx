import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { DashboardModule } from "@/components/hr-dashboard/dashboard";

vi.mock("@/lib/api/tokens", () => ({
  getAccessToken: () => "test-token",
  getStoredUser: () => null,
  storeTokens: vi.fn(),
  clearTokens: vi.fn(),
  isAuthenticated: () => true,
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { name: "Aida Salihović", email: "aida@bloomteq.com" },
      accessToken: "tok",
    },
    status: "authenticated",
  })),
}));

const mockUseUserRole = vi.fn(() => ({
  userId: 1,
  profileId: 12,
  email: "aida@bloomteq.com",
  fullName: "Aida Salihović",
  isAdmin: true,
  isManager: false,
  isLoading: false,
  error: null,
}));
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockUseUserRole(),
}));

const mockHrLoad = vi.fn();
const mockManagerLoad = vi.fn();
const mockEmployeeLoad = vi.fn();
vi.mock("@/components/hr-dashboard/dashboard/dashboardModuleLoaders", () => ({
  loadHrDashboard: (...args: unknown[]) => mockHrLoad(...args),
  loadManagerDashboard: (...args: unknown[]) => mockManagerLoad(...args),
  loadEmployeeDashboard: (...args: unknown[]) => mockEmployeeLoad(...args),
}));

vi.mock("@/utils/notificationHelpers", () => ({
  notifyApiError: vi.fn(),
}));

function fakeHrData() {
  return {
    headcount: {
      total: 142,
      byDepartment: [
        { department: "Engineering", count: 58 },
        { department: "Design", count: 14 },
      ],
      deltaThisMonth: 4,
    },
    pendingApprovals: { items: [], total: 9 },
    outToday: [
      {
        employeeId: 1,
        employeeName: "Lana Marković",
        leaveType: "vacation" as const,
        until: "2026-06-12",
      },
    ],
    onboarding: [],
    celebrations: [],
    announcements: [
      {
        id: 1,
        title: "Summer office hours",
        body: "Closes at 15:00 on Fridays.",
        authorName: "Aida Salihović",
        tag: "company",
        date: "2026-05-30T10:00:00Z",
      },
    ],
  };
}

function fakeManagerData() {
  return {
    teamSize: 6,
    teamPending: [],
    teamOut: [],
    teamReviews: [
      {
        id: "rev-1",
        employeeId: 42,
        employeeName: "Tarik M.",
        role: "quarterly",
        kind: "quarterly",
        dueDate: "2026-06-15",
      },
    ],
    teamTime: [
      {
        employeeId: 42,
        employeeName: "Tarik M.",
        logged: 32,
        expected: 40,
      },
    ],
    celebrations: [],
    announcements: [],
  };
}

function fakeEmployeeData() {
  return {
    balance: {
      vacationUsed: 6,
      vacationTotal: 25,
      sickUsed: 2,
      wfhUsed: 8,
    },
    myRequests: [],
    hoursThisWeek: { logged: 32, expected: 40 },
    projects: [
      {
        id: 1,
        name: "Atlas",
        role: "Contributor",
        leadName: "Asmin B.",
        allocation: 70,
      },
    ],
    nextReview: null,
    training: {
      budgetTotal: 2000,
      budgetUsed: 800,
      currency: "EUR",
      items: [],
    },
    openRoles: [],
    outToday: [],
    celebrations: [],
    announcements: [],
  };
}

describe("DashboardModule", () => {
  beforeEach(() => {
    mockUseUserRole.mockReturnValue({
      userId: 1,
      profileId: 12,
      email: "aida@bloomteq.com",
      fullName: "Aida Salihović",
      isAdmin: true,
      isManager: false,
      isLoading: false,
      error: null,
    });
  });

  it("renders greeting, KPI values, and HR widgets after load", async () => {
    mockHrLoad.mockResolvedValueOnce(fakeHrData());

    render(<DashboardModule />);

    expect(
      screen.getByRole("status", { name: /loading dashboard/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("142")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /Aida/ })).toBeInTheDocument();
    expect(screen.getByText("Active headcount")).toBeInTheDocument();
    expect(screen.getByText("Pending approvals")).toBeInTheDocument();
    expect(screen.getByText("Headcount by department")).toBeInTheDocument();
    expect(screen.getByText("Lana Marković")).toBeInTheDocument();
    expect(screen.getByText("Summer office hours")).toBeInTheDocument();
  });

  it("renders an error state with retry button when load fails", async () => {
    mockHrLoad.mockRejectedValueOnce(new Error("Server unreachable"));

    render(<DashboardModule />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/Server unreachable/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("derives manager persona and renders manager widgets", async () => {
    mockUseUserRole.mockReturnValue({
      userId: 18,
      profileId: 18,
      email: "asmin@bloomteq.com",
      fullName: "Asmin B.",
      isAdmin: false,
      isManager: true,
      isLoading: false,
      error: null,
    });
    mockManagerLoad.mockResolvedValueOnce(fakeManagerData());

    render(<DashboardModule />);

    await waitFor(() => {
      const root = screen.getByTestId("dashboard-module");
      expect(root.getAttribute("data-persona")).toBe("manager");
    });
    expect(screen.getByText("Team members")).toBeInTheDocument();
    expect(screen.getByText("Reviews to conduct")).toBeInTheDocument();
    expect(screen.getByText("Team hours this week")).toBeInTheDocument();
  });

  it("falls back to employee persona and renders employee widgets", async () => {
    mockUseUserRole.mockReturnValue({
      userId: 42,
      profileId: 42,
      email: "tarik@bloomteq.com",
      fullName: "Tarik M.",
      isAdmin: false,
      isManager: false,
      isLoading: false,
      error: null,
    });
    mockEmployeeLoad.mockResolvedValueOnce(fakeEmployeeData());

    render(<DashboardModule />);

    await waitFor(() => {
      const root = screen.getByTestId("dashboard-module");
      expect(root.getAttribute("data-persona")).toBe("employee");
    });
    expect(screen.getByText("Vacation days left")).toBeInTheDocument();
    expect(screen.getByText("My time off")).toBeInTheDocument();
    expect(screen.getByText("My projects")).toBeInTheDocument();
    expect(screen.getByText("Training & development")).toBeInTheDocument();
  });

  it("does not render persona switch or cta button", async () => {
    mockHrLoad.mockResolvedValueOnce(fakeHrData());

    render(<DashboardModule />);

    await waitFor(() => {
      expect(screen.getByText("142")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Viewing as/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /post announcement/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /schedule review/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^request time off$/i })
    ).not.toBeInTheDocument();
  });
});
