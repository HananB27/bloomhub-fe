import { beforeEach, describe, expect, it, vi } from "vitest";
import { timeTrackingApi } from "@/lib/api/timeTracking";
import { fetchWithAuthRetry } from "@/lib/api/refresh";

vi.mock("@/lib/api/refresh", () => ({
  fetchWithAuthRetry: vi.fn(),
}));

vi.mock("@/lib/api/tokens", () => ({
  getAccessToken: vi.fn(() => "token"),
}));

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

describe("timeTrackingApi", () => {
  beforeEach(() => {
    vi.mocked(fetchWithAuthRetry).mockReset();
  });

  it("normalizes Tempo OAuth authorize URLs to Tempo public API", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        authorize_url:
          "http://organization-public.default.svc.cluster.local/oauth/authorize/?client_id=abc&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Ftempo%2Fcallback&state=state-1&response_type=code",
        state: "state-1",
      })
    );

    const result = await timeTrackingApi.startTempoOAuth();

    expect(result.authorize_url).toBe(
      "https://api.tempo.io/oauth/authorize/?client_id=abc&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Ftempo%2Fcallback&state=state-1&response_type=code"
    );
  });

  it("passes Jira site URL when starting Tempo OAuth", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        authorize_url: "https://api.tempo.io/oauth/authorize/redirect?state=s",
        state: "s",
      })
    );

    await timeTrackingApi.startTempoOAuth({
      jira_url: "https://acme.atlassian.net",
      redirect_uri: "https://bloomhub-fe-dev.vercel.app/oauth/tempo/callback",
    });

    const url = vi.mocked(fetchWithAuthRetry).mock.calls[0][0] as string;
    expect(url).toContain("jira_url=https%3A%2F%2Facme.atlassian.net");
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fbloomhub-fe-dev.vercel.app%2Foauth%2Ftempo%2Fcallback"
    );
  });

  it("loads weekly allocation summary with employee filter", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        employee_id: 12,
        employee_name: "Jane Doe",
        week_start: "2026-05-18",
        week_end: "2026-05-24",
        weekly_capacity_hours: "40.00",
        planned_hours: "16.00",
        actual_hours: "7.00",
        remaining_capacity_hours: "33.00",
        unallocated_capacity_hours: "24.00",
        projects: [],
      })
    );

    const summary = await timeTrackingApi.getWeeklySummary({
      week_start: "2026-05-18",
      employee_id: 12,
    });

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/time-tracking/weekly-summary/?week_start=2026-05-18&employee_id=12"
      ),
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(summary).toMatchObject({
      employee_id: 12,
      planned_hours: "16.00",
    });
  });

  it("loads active allocations with employee and work date filters", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        employee_id: 12,
        work_date: "2026-05-18",
        total_allocation_percentage: "75.00",
        remaining_allocation_percentage: "25.00",
        total_weekly_allocation_hours: "30.00",
        remaining_weekly_allocation_hours: "10.00",
        assignments: [
          {
            assignment_id: 101,
            project_id: 5,
            project_name: "Alpha",
            allocation_percentage: "50.00",
            weekly_allocation_hours: "20.00",
            planned_weekly_hours: "20.00",
            start_date: "2026-05-01",
            end_date: null,
            status: "active",
          },
        ],
      })
    );

    const allocations = await timeTrackingApi.getActiveAllocations({
      work_date: "2026-05-18",
      employee_id: 12,
    });

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/time-tracking/active-allocations/?work_date=2026-05-18&employee_id=12"
      ),
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(allocations.assignments[0]).toMatchObject({
      project_id: 5,
      weekly_allocation_hours: "20.00",
    });
  });

  it("sends Jira preview filters without fixture worklogs", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        source_type: "jira",
        date_from: "2026-05-18",
        date_to: "2026-05-24",
        row_count: 0,
        valid_count: 0,
        error_count: 0,
        rows: [],
      })
    );

    await timeTrackingApi.previewJiraImport({
      date_from: "2026-05-18",
      date_to: "2026-05-24",
      employee_id: 12,
      jira_project_key: "BH",
    });

    const [, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({
      date_from: "2026-05-18",
      date_to: "2026-05-24",
      employee_id: 12,
      jira_project_key: "BH",
    });
    expect(JSON.parse(String(options.body))).not.toHaveProperty("worklogs");
  });

  it("posts Jira assigned issues import payload", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        source_type: "jira",
        employee_id: 123,
        jira_account_id: "abc123",
        dry_run: true,
        row_count: 1,
        counts: {
          created_projects: 1,
          created_tasks: 1,
          updated_tasks: 0,
          created_issue_mappings: 1,
          updated_issue_mappings: 0,
          errors: 0,
        },
        rows: [],
      })
    );

    await timeTrackingApi.importJiraAssignedIssues({
      employee_id: 123,
      max_results: 1000,
      dry_run: true,
    });

    const [url, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/api/time-imports/jira/assigned-issues/");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({
      employee_id: 123,
      max_results: 1000,
      dry_run: true,
    });
  });

  it("tests Jira connection against saved settings", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        base_url: "https://example.atlassian.net",
        auth_email: "admin@example.com",
        has_api_token: true,
        enabled: true,
        last_test_status: "ok",
        last_test_message: "Connected",
        last_test_at: "2026-05-25T00:00:00Z",
        last_test_metadata: {},
        created_at: "2026-05-25T00:00:00Z",
        updated_at: "2026-05-25T00:00:00Z",
      })
    );

    await timeTrackingApi.testJiraConnection();

    const [url, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/api/time-integrations/jira/test-connection/");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({});
  });

  it("posts Jira project discovery filters", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        users: [],
        projects: [],
        issues: [],
        counts: { users: 0, projects: 0, issues: 0 },
      })
    );

    await timeTrackingApi.discoverJiraProjects({
      query: "BHB",
      employee_id: 42,
      date_from: "2026-05-01",
      date_to: "2026-05-25",
      limit: 1000,
    });

    const [url, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/api/time-integrations/jira/project-discovery/");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({
      query: "BHB",
      employee_id: 42,
      date_from: "2026-05-01",
      date_to: "2026-05-25",
      limit: 1000,
    });
  });

  it("sends Tempo test connection payload with base URL and token", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        base_url: "https://api.tempo.io/4",
        has_api_token: true,
        enabled: true,
        last_test_status: "ok",
        last_test_message: "Connected",
        last_test_at: "2026-05-25T00:00:00Z",
        last_test_metadata: {},
        created_at: "2026-05-25T00:00:00Z",
        updated_at: "2026-05-25T00:00:00Z",
      })
    );

    await timeTrackingApi.testTempoConnection({
      base_url: "https://api.tempo.io/4",
      api_token: "tempo-token",
      enabled: true,
    });

    const [, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({
      base_url: "https://api.tempo.io/4",
      api_token: "tempo-token",
      enabled: true,
    });
  });

  it("posts Tempo project discovery filters", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        accounts: [],
        projects: [],
        teams: [],
      })
    );

    await timeTrackingApi.discoverTempoProjects({
      base_url: "https://api.tempo.io/4",
      api_token: "tempo-token",
      date_from: "2026-05-18",
      date_to: "2026-05-24",
      limit: 50,
    });

    const [url, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/api/time-integrations/tempo/project-discovery/");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({
      base_url: "https://api.tempo.io/4",
      api_token: "tempo-token",
      date_from: "2026-05-18",
      date_to: "2026-05-24",
      limit: 50,
    });
  });

  it("uploads document imports as multipart form data", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        id: 9,
        source_type: "document_import",
        file_name: "timesheet.csv",
        uploaded_by: 1,
        uploaded_by_name: "Admin",
        requested_filters: {},
        column_mapping: {},
        detected_columns: {
          headers: ["Employee", "Date", "Project", "Hours"],
          mapping: {},
          ambiguous: [],
          missing_required: [],
        },
        status: "uploaded",
        total_rows: 0,
        valid_rows: 0,
        error_rows: 0,
        skipped_rows: 0,
        committed_rows: 0,
        validation_messages: [],
        rows: [],
        created_at: "2026-05-18T00:00:00Z",
        updated_at: "2026-05-18T00:00:00Z",
      })
    );

    await timeTrackingApi.uploadDocumentImport(
      new File(["employee,date\n"], "timesheet.csv", { type: "text/csv" })
    );

    const [url, options] = vi.mocked(fetchWithAuthRetry).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/api/time-imports/documents/upload/");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.headers).toMatchObject({
      Authorization: "Bearer token",
    });
    expect(options.headers).not.toHaveProperty("Content-Type");
  });

  it("uses document preview endpoint and batch-level commit endpoint", async () => {
    vi.mocked(fetchWithAuthRetry)
      .mockResolvedValueOnce(
        jsonResponse({
          id: 9,
          source_type: "document_import",
          file_name: "timesheet.csv",
          uploaded_by: 1,
          uploaded_by_name: "Admin",
          requested_filters: {},
          column_mapping: {},
          detected_columns: {},
          status: "previewed",
          total_rows: 0,
          valid_rows: 0,
          error_rows: 0,
          skipped_rows: 0,
          committed_rows: 0,
          validation_messages: [],
          rows: [],
          created_at: "2026-05-18T00:00:00Z",
          updated_at: "2026-05-18T00:00:00Z",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 9,
          source_type: "document_import",
          file_name: "timesheet.csv",
          uploaded_by: 1,
          uploaded_by_name: "Admin",
          requested_filters: {},
          column_mapping: {},
          detected_columns: {},
          status: "committed",
          total_rows: 0,
          valid_rows: 0,
          error_rows: 0,
          skipped_rows: 0,
          committed_rows: 0,
          validation_messages: [],
          rows: [],
          created_at: "2026-05-18T00:00:00Z",
          updated_at: "2026-05-18T00:00:00Z",
        })
      );

    await timeTrackingApi.previewDocumentImport(9);
    await timeTrackingApi.commitDocumentImport(9);

    expect(vi.mocked(fetchWithAuthRetry).mock.calls[0][0]).toContain(
      "/api/time-imports/documents/9/preview/"
    );
    expect(vi.mocked(fetchWithAuthRetry).mock.calls[1][0]).toContain(
      "/api/time-imports/9/commit/"
    );
  });

  it("downloads timesheet exports and keeps backend filename", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      new Response("employee,hours\nJane,7\n", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="weekly.csv"',
        },
      })
    );

    const result = await timeTrackingApi.exportTimesheets({
      format: "csv",
      date_from: "2026-05-18",
      date_to: "2026-05-24",
      source_type: "tempo",
      status: "approved",
    });

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/time-tracking/exports/timesheets/?format=csv&date_from=2026-05-18&date_to=2026-05-24&source_type=tempo&status=approved"
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      })
    );
    await expect(result.blob.text()).resolves.toContain("Jane");
    expect(result.filename).toBe("weekly.csv");
  });

  it("posts source change review resolution action and note", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        id: 77,
        source_type: "tempo",
        status: "draft",
        source_metadata: { source_change_flag: "none" },
      })
    );

    await timeTrackingApi.resolveSourceChange(77, {
      action: "apply_source",
      note: "Reviewed with manager",
    });

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/time-tracking/source-change-review/77/resolve/"
      ),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "apply_source",
          note: "Reviewed with manager",
        }),
      })
    );
  });
});
