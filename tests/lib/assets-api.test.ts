import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignAssetToEmployee,
  cancelScheduledMaintenance,
  completeScheduledMaintenance,
  createAsset,
  createReplacementLog,
  createScheduledMaintenance,
  deleteAssetById,
  downloadAssetQrCode,
  getAssetCapabilities,
  getAssetFrontendUrl,
  getAssetQrCodeUrl,
  listAssignments,
  listAssets,
  listAssignableUsers,
  listReplacementLogs,
  listScheduledMaintenance,
  processAssetReturn,
  updateAsset,
  updateReplacementLog,
} from "@/lib/api/assets";
import { ApiError } from "@/utils/api";

describe("assets api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("uses stored token for listAssets", async () => {
    window.localStorage.setItem("accessToken", "token-123");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1, name: "MacBook Pro" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await listAssets();

    expect(result).toEqual([{ id: 1, name: "MacBook Pro" }]);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assets\/$/);
    expect(options).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer token-123" },
    });
  });

  it("loads asset capabilities", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          permissions: ["view_own_assets"],
          scope: "own",
          capabilities: { can_view_any_assets: true },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const result = await getAssetCapabilities("token-cap");

    expect(result).toEqual({
      permissions: ["view_own_assets"],
      scope: "own",
      capabilities: { can_view_any_assets: true },
    });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assets\/capabilities\/$/);
    expect(options).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer token-cap" },
    });
  });

  it("sends createAsset payload as JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 5, name: "Dell" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await createAsset({ name: "Dell", serial_number: "SN-1" }, "token-x");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assets\/$/);
    expect(options).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer token-x",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Dell", serial_number: "SN-1" }),
    });
  });

  it("calls delete endpoint for deleteAssetById", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await deleteAssetById(99, "token-y");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assets\/99\/$/);
    expect(options).toMatchObject({ method: "DELETE" });
  });

  it("falls back to alternate return endpoint when primary is 404", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 7, is_active: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await processAssetReturn(7, { notes: "ok" }, "token-z");

    const [url1, options1] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [url2, options2] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url1).toMatch(/\/api\/assignments\/7\/return\/$/);
    expect(options1).toMatchObject({ method: "POST" });
    expect(url2).toMatch(/\/api\/assets\/7\/return\/$/);
    expect(options2).toMatchObject({ method: "POST" });
    expect(result).toEqual({ id: 7, is_active: false });
  });

  it("appends query params when listing maintenance logs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 10, asset_id: 4 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await listReplacementLogs(4, "token-r");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/replacement-logs\/\?asset=4$/);
    expect(options).toMatchObject({ method: "GET" });
  });

  it("creates maintenance logs with explicit date and optional fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 20,
          asset: 4,
          reason: "Display failed",
          date: "2026-05-10",
          replacement_asset: 9,
          cost: "125.50",
          asset_status_before: "active",
          asset_status_after: "maintenance",
          asset_condition_before: "good",
          asset_condition_after: "damaged",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await createReplacementLog(
      {
        asset: 4,
        reason: "Display failed",
        date: "2026-05-10",
        replacement_asset: 9,
        cost: "125.50",
        asset_status_before: "active",
        asset_status_after: "maintenance",
        asset_condition_before: "good",
        asset_condition_after: "damaged",
      },
      "token-replacement"
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/replacement-logs\/$/);
    expect(options).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer token-replacement",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset: 4,
        reason: "Display failed",
        date: "2026-05-10",
        replacement_asset: 9,
        cost: "125.50",
        asset_status_before: "active",
        asset_status_after: "maintenance",
        asset_condition_before: "good",
        asset_condition_after: "damaged",
      }),
    });
    expect(JSON.parse(String(options.body))).not.toHaveProperty("replaced_by");
  });

  it("updates maintenance logs without sending replaced_by", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 20,
          asset: 4,
          reason: "Updated reason",
          date: "2026-05-11",
          replacement_asset: null,
          cost: null,
          asset_status_after: null,
          asset_condition_after: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await updateReplacementLog(
      20,
      {
        asset: 4,
        reason: "Updated reason",
        date: "2026-05-11",
        replacement_asset: null,
        cost: null,
        asset_status_after: null,
        asset_condition_after: null,
      },
      "token-replacement"
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/replacement-logs\/20\/$/);
    expect(options).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({
        asset: 4,
        reason: "Updated reason",
        date: "2026-05-11",
        replacement_asset: null,
        cost: null,
        asset_status_after: null,
        asset_condition_after: null,
      }),
    });
    expect(JSON.parse(String(options.body))).not.toHaveProperty("replaced_by");
  });

  it("lists scheduled maintenance with filters", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 30, asset: 4 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await listScheduledMaintenance(
      { asset: 4, status: "scheduled", due_state: "overdue" },
      "token-m"
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(
      /\/api\/scheduled-maintenance\/\?asset=4&status=scheduled&due_state=overdue$/
    );
    expect(options).toMatchObject({ method: "GET" });
  });

  it("creates scheduled maintenance", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 31, asset: 4 }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );

    await createScheduledMaintenance(
      {
        asset: 4,
        due_date: "2026-06-01",
        reason: "Inspection",
        maintenance_type: "inspection",
        owner: 12,
        estimated_cost: "150.00",
        vendor: "Vendor Co",
      },
      "token-m"
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/scheduled-maintenance\/$/);
    expect(options).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        asset: 4,
        due_date: "2026-06-01",
        reason: "Inspection",
        maintenance_type: "inspection",
        owner: 12,
        estimated_cost: "150.00",
        vendor: "Vendor Co",
      }),
    });
  });

  it("completes and cancels scheduled maintenance", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 31, status: "completed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 32, status: "cancelled" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    await completeScheduledMaintenance(
      31,
      {
        date: "2026-06-01",
        reason: "Inspection completed",
        cost: "150.00",
        asset_status_before: "active",
        asset_status_after: "returned",
        asset_condition_before: "good",
        asset_condition_after: "fair",
        replacement_asset: 456,
      },
      "token-m"
    );
    await cancelScheduledMaintenance(
      32,
      { cancelled_reason: "No longer needed" },
      "token-m"
    );

    expect(fetchMock.mock.calls[0][0]).toMatch(
      /\/api\/scheduled-maintenance\/31\/complete\/$/
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        date: "2026-06-01",
        reason: "Inspection completed",
        cost: "150.00",
        asset_status_before: "active",
        asset_status_after: "returned",
        asset_condition_before: "good",
        asset_condition_after: "fair",
        replacement_asset: 456,
      }),
    });
    expect(fetchMock.mock.calls[1][0]).toMatch(
      /\/api\/scheduled-maintenance\/32\/cancel\/$/
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ cancelled_reason: "No longer needed" }),
    });
  });

  it("throws ApiError with detail message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Duplicate serial number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(listAssets("token-1")).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        status: 400,
        message: "Duplicate serial number",
      })
    );
  });

  it("uses explicit token over stored token", async () => {
    window.localStorage.setItem("accessToken", "stored-token");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 2 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await listAssets("explicit-token");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options).toMatchObject({
      headers: { Authorization: "Bearer explicit-token" },
    });
  });

  it("sends patch payload via updateAsset", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 3, condition: "fair" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await updateAsset(3, { condition: "fair" }, "tok-3");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assets\/3\/$/);
    expect(options).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ condition: "fair" }),
    });
  });

  it("builds asset QR download URLs from the backend endpoint", () => {
    expect(getAssetQrCodeUrl(42)).toMatch(/\/api\/assets\/42\/qr-code\/$/);
  });

  it("builds frontend asset scan URLs with the current frontend host", () => {
    expect(getAssetFrontendUrl(42)).toBe("http://localhost:3000/assets/42");
  });

  it("downloads asset QR code PNG through the backend endpoint", async () => {
    const pngBlob = new Blob(["png-bytes"], { type: "image/png" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(pngBlob, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": 'attachment; filename="asset-42-qr.png"',
        },
      })
    );

    const result = await downloadAssetQrCode(42, "tok-qr");

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assets\/42\/qr-code\/$/);
    expect(options).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer tok-qr" },
    });
    expect(result.filename).toBe("asset-42-qr.png");
    expect(result.blob.type).toBe("image/png");
  });

  it("throws ApiError for QR download failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(downloadAssetQrCode(42, "tok-qr")).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        status: 403,
        message: "Forbidden",
      })
    );
  });

  it("lists assignment records", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1, asset_id: 10 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await listAssignments("tok-a");
    expect(result).toEqual([{ id: 1, asset_id: 10 }]);
  });

  it("creates assignments via assignAssetToEmployee", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 55, asset_id: 10 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await assignAssetToEmployee(
      { asset_id: 10, employee_id: "u-55" },
      "tok-assign"
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/assignments\/$/);
    expect(options).toMatchObject({
      method: "POST",
      body: JSON.stringify({ asset: 10, employee: "u-55" }),
    });
  });

  it("lists assignable users", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 11,
            full_name: "A User",
            user: { email: "a.user@example.com", username: "auser" },
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const result = await listAssignableUsers("tok-users");
    expect(result).toEqual([{ id: "11", name: "A User" }]);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/user-profiles\/$/);
  });

  it("rethrows processAssetReturn errors when primary is not 404", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      processAssetReturn(44, { notes: "x" }, "tok-return")
    ).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        status: 403,
        message: "Forbidden",
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("prefers detail over error and message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: "Detail message",
          error: "Error message",
          message: "Generic message",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await expect(listAssets("tok-priority")).rejects.toEqual(
      expect.objectContaining({ message: "Detail message" })
    );
  });

  it("prefers error over message when detail is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "Error message",
          message: "Generic message",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await expect(listAssets("tok-priority")).rejects.toEqual(
      expect.objectContaining({ message: "Error message" })
    );
  });

  it("uses message when detail and error are absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Only message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(listAssets("tok-priority")).rejects.toEqual(
      expect.objectContaining({ message: "Only message" })
    );
  });

  it("falls back to status-based message when payload has no known keys", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ foo: "bar" }), {
        status: 418,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(listAssets("tok-priority")).rejects.toEqual(
      expect.objectContaining({
        message: "Request failed with status 418",
      })
    );
  });

  it("falls back to status-based message when backend returns HTML", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        "<!DOCTYPE html><html><body><h1>Server Error</h1></body></html>",
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        }
      )
    );

    await expect(listAssets("tok-html")).rejects.toEqual(
      expect.objectContaining({
        message: "Request failed with status 500",
      })
    );
  });
});
