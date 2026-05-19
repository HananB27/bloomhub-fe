import { beforeEach, describe, expect, it, vi } from "vitest";
import { employeeApi } from "@/lib/api/modules/employees";
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

describe("employeeApi", () => {
  beforeEach(() => {
    vi.mocked(fetchWithAuthRetry).mockReset();
  });

  it("creates employees through the backend employees endpoint", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        id: 7,
        employee_id: "EMP-7",
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        start_date: "2026-05-14",
        is_active: true,
      })
    );

    const employee = await employeeApi.createEmployee({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      department: "People",
      start_date: "2026-05-14",
      send_invite: true,
      start_onboarding: true,
    });

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining("/api/employees/"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"send_invite":true'),
      })
    );
    expect(employee).toMatchObject({
      id: 7,
      first_name: "Ada",
      email: "ada@example.com",
    });
  });

  it("exports employees as a backend-generated blob and uses response filename", async () => {
    const response = new Response("first_name,last_name\nAda,Lovelace\n", {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          "attachment; filename*=UTF-8''bloomhub-employees-filtered.csv",
      },
    });
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(response);

    const result = await employeeApi.exportEmployees({
      format: "csv",
      scope: "filtered",
      columns: ["first_name", "last_name"],
      include_header: true,
      filename: "fallback.csv",
      filters: {
        search: "ada",
        department: "People",
        status: "active",
      },
    });

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/employees/export/?format=csv&scope=filtered&columns=first_name%2Clast_name&include_header=true&filename=fallback.csv&search=ada&department=People&status=active"
      ),
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/octet-stream" },
      })
    );
    await expect(result.blob.text()).resolves.toContain("Ada");
    expect(result.filename).toBe("bloomhub-employees-filtered.csv");
  });

  it("checks employee email availability through the backend", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        email: "ada@example.com",
        available: false,
        user_id: 22,
      })
    );

    const result = await employeeApi.checkEmailAvailability("ada@example.com");

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/employees/email-availability/?email=ada%40example.com"
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(result).toMatchObject({
      email: "ada@example.com",
      available: false,
      user_id: 22,
    });
  });

  it("surfaces backend export errors", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse(
        { detail: "You do not have permission to export employees." },
        { status: 403 }
      )
    );

    await expect(
      employeeApi.exportEmployees({
        format: "csv",
        scope: "all",
        columns: ["first_name"],
        include_header: true,
      })
    ).rejects.toThrow("You do not have permission to export employees.");
  });
});
