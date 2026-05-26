import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeTrackingModule } from "@/components/hr-dashboard/TimeTrackingModule";
import { timeTrackingApi, type TimeEntry } from "@/lib/api/timeTracking";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        role: "manager",
        permissions: [
          "Time Tracking.view_team_timesheets",
          "Time Tracking.approve_team_timesheets",
          "Time Tracking.export_timesheets",
        ],
      },
    },
    status: "authenticated",
  })),
}));

vi.mock("@/lib/api/modules/projects", () => ({
  projectApi: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/api/modules/employees", () => ({
  employeeApi: {
    listEmployees: vi.fn(),
  },
}));

vi.mock("@/lib/api/timeTracking", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/timeTracking")>(
    "@/lib/api/timeTracking"
  );
  return {
    ...actual,
    timeTrackingApi: {
      listTasks: vi.fn(),
      listEntries: vi.fn(),
      getWeeklySummary: vi.fn(),
      getApprovalQueue: vi.fn(),
      approveEntry: vi.fn(),
      rejectEntry: vi.fn(),
      submitWeek: vi.fn(),
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
      getWeeklyDashboard: vi.fn(),
      getPlannedVsActual: vi.fn(),
      exportTimesheets: vi.fn(),
    },
  };
});

const { projectApi } = await import("@/lib/api/modules/projects");
const { employeeApi } = await import("@/lib/api/modules/employees");

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 1,
    employee_id: 12,
    employee_name: "Jane Doe",
    project_id: 1,
    project_name: "Alpha",
    task_id: null,
    task_name: null,
    work_date: "2026-05-18",
    start_time: "08:00:00",
    hours: "5.00",
    notes: "Existing work",
    source_type: "manual",
    status: "draft",
    source_external_id: "",
    source_metadata: {},
    duplicate_fingerprint: "fp-1",
    duplicate_of: null,
    submitted_at: null,
    submitted_by: null,
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    rejection_reason: "",
    audit_events: [],
    created_at: "2026-05-18T00:00:00Z",
    updated_at: "2026-05-18T00:00:00Z",
    ...overrides,
  };
}

function mockDefaults(entries: TimeEntry[] = [makeEntry()]) {
  vi.mocked(projectApi.list).mockResolvedValue({
    count: 2,
    results: [
      {
        id: 1,
        name: "Alpha",
        description: null,
        client: null,
        app_stack: null,
        project_type: "client",
        status: "active",
        stage: "delivery",
        stage_note: "",
        start_date: null,
        end_date: null,
        owner_id: null,
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Beta",
        description: null,
        client: null,
        app_stack: null,
        project_type: "client",
        status: "active",
        stage: "delivery",
        stage_note: "",
        start_date: null,
        end_date: null,
        owner_id: null,
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      },
    ],
  });
  vi.mocked(employeeApi.listEmployees).mockResolvedValue({
    count: 1,
    results: [
      {
        id: 12,
        employee_id: "EMP-12",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        username: "jane",
        start_date: "2026-01-01",
        employment_status: "active",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
  });
  vi.mocked(timeTrackingApi.listTasks).mockResolvedValue([
    {
      id: 7,
      project_id: 2,
      project_name: "Beta",
      name: "Discovery",
      description: "",
      jira_issue_key: "",
      jira_project_key: "",
      is_active: true,
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-01T00:00:00Z",
    },
  ]);
  vi.mocked(timeTrackingApi.listEntries).mockResolvedValue(entries);
  vi.mocked(timeTrackingApi.getWeeklySummary).mockResolvedValue({
    employee_id: 12,
    employee_name: "Jane Doe",
    week_start: "2026-05-18",
    week_end: "2026-05-24",
    weekly_capacity_hours: "40.00",
    planned_hours: "16.00",
    actual_hours: "5.00",
    remaining_capacity_hours: "35.00",
    unallocated_capacity_hours: "24.00",
    projects: [
      {
        project_id: 1,
        project_name: "Alpha",
        planned_hours: "16.00",
        actual_hours: "5.00",
        variance_hours: "-11.00",
        allocation_percentage: "40.00",
        allocation_status: "allocated",
        assignments: [
          {
            assignment_id: 10,
            allocation_percentage: 40,
            start_date: "2026-05-18",
            end_date: null,
            status: "active",
            active_weekdays: 5,
          },
        ],
      },
    ],
  });
  vi.mocked(timeTrackingApi.getApprovalQueue).mockResolvedValue([
    makeEntry({ status: "submitted" }),
  ]);
  vi.mocked(timeTrackingApi.approveEntry).mockResolvedValue(
    makeEntry({ status: "approved" })
  );
  vi.mocked(timeTrackingApi.rejectEntry).mockResolvedValue(
    makeEntry({ status: "rejected" })
  );
  vi.mocked(timeTrackingApi.createEntry).mockResolvedValue(
    makeEntry({ id: 20 })
  );
  vi.mocked(timeTrackingApi.updateEntry).mockResolvedValue(makeEntry());
  vi.mocked(timeTrackingApi.deleteEntry).mockResolvedValue(undefined);
  vi.mocked(timeTrackingApi.submitWeek).mockResolvedValue(entries);
}

describe("TimeTrackingModule", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-19T12:00:00Z"));
    vi.clearAllMocks();
    mockDefaults();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders week calendar with weekday columns and time labels", async () => {
    render(<TimeTrackingModule />);

    expect(
      await screen.findByRole("heading", { name: "Weekly Timesheet" })
    ).toBeInTheDocument();
    expect((await screen.findAllByText("Mon")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tue").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /slot/i })).toHaveLength(105);
    expect(screen.queryByText("Sat")).not.toBeInTheDocument();
    expect(screen.queryByText("Sun")).not.toBeInTheDocument();
    expect(screen.getByText("8:00 AM")).toBeInTheDocument();
    expect(screen.getByText("6:00 PM")).toBeInTheDocument();
    expect(screen.getAllByText("5.00h").length).toBeGreaterThan(0);
  });

  it("clicking an empty slot opens entry dialog with selected date and default duration", async () => {
    mockDefaults([]);
    render(<TimeTrackingModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /2026-05-18 8:00 AM slot/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText(/Mon, May 18/i).length).toBeGreaterThan(
      0
    );
    expect(within(dialog).getByText("8:00 AM")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("spinbutton", { name: /Duration hours/i })
    ).toHaveValue(1);
  });

  it("saving slot entry calls createEntry with selected date and duration", async () => {
    mockDefaults([]);
    render(<TimeTrackingModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /2026-05-18 8:00 AM slot/i })
    );
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByLabelText("Entry project"));
    fireEvent.click(await screen.findByRole("option", { name: "Alpha" }));
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: /Duration hours/i }),
      {
        target: { value: "3.5" },
      }
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(timeTrackingApi.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 1,
          task_id: null,
          work_date: "2026-05-18",
          start_time: "08:00:00",
          hours: "3.50",
        })
      );
    });
  });

  it("clicking editable manual draft event allows update", async () => {
    render(<TimeTrackingModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Alpha.*5.00h/i })
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(
      within(dialog).getByRole("spinbutton", { name: /Duration hours/i }),
      {
        target: { value: "6" },
      }
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(timeTrackingApi.updateEntry).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ hours: "6.00", start_time: "08:00:00" })
      );
    });
  });

  it("deleting editable manual event calls deleteEntry", async () => {
    render(<TimeTrackingModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Alpha.*5.00h/i })
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(timeTrackingApi.deleteEntry).toHaveBeenCalledWith(1);
    });
  });

  it("renders rejected manual events with rejected status marker", async () => {
    mockDefaults([
      makeEntry({
        status: "rejected",
        rejection_reason: "Needs clearer notes",
      }),
    ]);
    render(<TimeTrackingModule />);

    expect(await screen.findByText("Rejected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Alpha.*5.00h/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Needs clearer notes")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("imported event renders source marker and opens read-only details", async () => {
    mockDefaults([
      makeEntry({
        source_type: "jira",
        source_external_id: "10001",
        source_metadata: { issue_key: "ALPHA-1" },
      }),
    ]);
    render(<TimeTrackingModule />);

    expect(await screen.findByText("Jira")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Alpha.*5.00h/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/read-only/i)).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Save" })
    ).not.toBeInTheDocument();
    expect(timeTrackingApi.updateEntry).not.toHaveBeenCalled();
  });

  it("submit week still calls existing submitWeek", async () => {
    render(<TimeTrackingModule />);

    fireEvent.click(
      (await screen.findAllByRole("button", { name: /Submit week/i }))[0]
    );

    await waitFor(() => {
      expect(timeTrackingApi.submitWeek).toHaveBeenCalledWith({
        week_start: "2026-05-18",
        employee_id: undefined,
      });
    });
  });

  it("bulk approves selected approval queue entries", async () => {
    render(<TimeTrackingModule />);

    const approvalsTab = await screen.findByRole("tab", {
      name: /Approvals/i,
    });
    fireEvent.pointerDown(approvalsTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(approvalsTab, { button: 0, ctrlKey: false });
    fireEvent.mouseUp(approvalsTab, { button: 0, ctrlKey: false });
    fireEvent.click(approvalsTab);

    await waitFor(() => {
      expect(screen.getAllByText(/Jane Doe/).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole("button", { name: /Bulk approve/i })).toBeVisible();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole("button", { name: /Bulk approve/i }));

    await waitFor(() => {
      expect(timeTrackingApi.approveEntry).toHaveBeenCalledWith(1);
    });
    expect(timeTrackingApi.getApprovalQueue).toHaveBeenCalled();
  });
});
