import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AssetsModule } from "@/components/hr-dashboard/AssetsModule";
import { ApiError } from "@/utils/api";

const mockListAssets = vi.fn();
const mockListAssignments = vi.fn();
const mockListAssignableUsers = vi.fn();
const mockAssignAssetToEmployee = vi.fn();
const mockRequestAssetReturn = vi.fn();
const mockApproveAssetReturn = vi.fn();
const mockRejectAssetReturn = vi.fn();
const mockListPendingReturnRequests = vi.fn();
const mockCreateAsset = vi.fn();
const mockUpdateAsset = vi.fn();
const mockListReplacementLogs = vi.fn();
const mockCreateReplacementLog = vi.fn();
const mockUpdateReplacementLog = vi.fn();
const mockListScheduledMaintenance = vi.fn();
const mockCreateScheduledMaintenance = vi.fn();
const mockCompleteScheduledMaintenance = vi.fn();
const mockCancelScheduledMaintenance = vi.fn();
const mockExportAssetsCsv = vi.fn();
const mockDownloadAssetQrCode = vi.fn();
const mockGetAssetCapabilities = vi.fn();

let sessionRole = "Employee";

function getMockAssetCapabilities(role: string) {
  const isAssetAdmin = ["HR", "SUPER_ADMIN", "Admin"].includes(role);
  const hasLostOnlyPermission = role === "LostOnly";

  return {
    permissions: hasLostOnlyPermission
      ? [
          "view_own_assets",
          "initiate_asset_return",
          "view_asset_history",
          "log_asset_lost",
        ]
      : isAssetAdmin
        ? [
            "view_own_assets",
            "view_team_assets",
            "view_all_assets",
            "assign_assets",
            "update_asset_condition",
            "initiate_asset_return",
            "process_asset_return",
            "log_asset_replacement",
            "generate_qr_codes",
            "view_asset_history",
            "configure_asset_types",
            "export_inventory",
          ]
        : ["view_own_assets", "initiate_asset_return", "view_asset_history"],
    scope: isAssetAdmin ? "all" : "own",
    capabilities: {
      can_view_any_assets: true,
      can_create_assets: isAssetAdmin,
      can_update_assets: isAssetAdmin,
      can_delete_assets: isAssetAdmin,
      can_assign_assets: isAssetAdmin,
      can_request_return: true,
      can_process_return: isAssetAdmin,
      can_export_inventory: isAssetAdmin,
      can_view_asset_history: true,
      can_update_asset_condition: true,
      can_generate_qr_codes: isAssetAdmin,
      can_log_asset_replacement: isAssetAdmin,
    },
  };
}

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        name: "Jane Doe",
        email: "jane@company.com",
        employee_id: "7",
        role: sessionRole,
      },
      accessToken: "test-token",
    },
    status: "authenticated",
  })),
}));

vi.mock("@/lib/api/assets", () => ({
  getAssetCapabilities: (...args: unknown[]) =>
    mockGetAssetCapabilities(...args),
  getAssetFrontendUrl: (assetId: number | string) =>
    `http://localhost:3000/assets/${assetId}`,
  listAssets: (...args: unknown[]) => mockListAssets(...args),
  listAssignments: (...args: unknown[]) => mockListAssignments(...args),
  listAssignableUsers: (...args: unknown[]) => mockListAssignableUsers(...args),
  assignAssetToEmployee: (...args: unknown[]) =>
    mockAssignAssetToEmployee(...args),
  requestAssetReturn: (...args: unknown[]) => mockRequestAssetReturn(...args),
  approveAssetReturn: (...args: unknown[]) => mockApproveAssetReturn(...args),
  rejectAssetReturn: (...args: unknown[]) => mockRejectAssetReturn(...args),
  listPendingReturnRequests: (...args: unknown[]) =>
    mockListPendingReturnRequests(...args),
  createAsset: (...args: unknown[]) => mockCreateAsset(...args),
  updateAsset: (...args: unknown[]) => mockUpdateAsset(...args),
  listReplacementLogs: (...args: unknown[]) => mockListReplacementLogs(...args),
  createReplacementLog: (...args: unknown[]) =>
    mockCreateReplacementLog(...args),
  updateReplacementLog: (...args: unknown[]) =>
    mockUpdateReplacementLog(...args),
  listScheduledMaintenance: (...args: unknown[]) =>
    mockListScheduledMaintenance(...args),
  createScheduledMaintenance: (...args: unknown[]) =>
    mockCreateScheduledMaintenance(...args),
  completeScheduledMaintenance: (...args: unknown[]) =>
    mockCompleteScheduledMaintenance(...args),
  cancelScheduledMaintenance: (...args: unknown[]) =>
    mockCancelScheduledMaintenance(...args),
  exportAssetsCsv: (...args: unknown[]) => mockExportAssetsCsv(...args),
  downloadAssetQrCode: (...args: unknown[]) => mockDownloadAssetQrCode(...args),
  deleteAssetById: vi.fn(),
}));

function getAnyEnabledButton(name: RegExp): HTMLButtonElement {
  const button = screen
    .getAllByRole("button", { name })
    .find((candidate) => !candidate.hasAttribute("disabled"));

  if (!button) {
    throw new Error(`No enabled button found for: ${name.toString()}`);
  }

  return button as HTMLButtonElement;
}

async function selectAssetCategory(valueLabel: string) {
  const dialog = await screen.findByRole("dialog");
  const categoryTrigger = within(dialog).getByLabelText(/Category/i);
  fireEvent.click(categoryTrigger);

  const option =
    screen.queryByRole("option", {
      name: new RegExp(`^${valueLabel}$`, "i"),
    }) ||
    (await screen.findAllByText(new RegExp(`^${valueLabel}$`, "i"))).at(-1);

  if (!option) {
    throw new Error(`Category option not found: ${valueLabel}`);
  }

  fireEvent.click(option);
}

function getCategoryCount(label: string): string {
  const categoryLabel = screen.getByText(label);
  const row = categoryLabel.closest("div.flex.items-center.justify-between");

  if (!(row instanceof HTMLElement)) {
    throw new Error(`Category row not found for: ${label}`);
  }

  const values = within(row).getAllByText(/^\d+$/);
  return values[values.length - 1].textContent || "0";
}

function withinAssetCard(assetName: string) {
  const card = screen.getByText(assetName).closest('[data-slot="card"]');

  if (!(card instanceof HTMLElement)) {
    throw new Error(`Asset card not found for: ${assetName}`);
  }

  return within(card);
}

describe("AssetsModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionRole = "Employee";
    mockGetAssetCapabilities.mockImplementation(() =>
      Promise.resolve(getMockAssetCapabilities(sessionRole))
    );
    mockListAssets.mockResolvedValue([]);
    mockListAssignments.mockResolvedValue([]);
    mockListAssignableUsers.mockResolvedValue([]);
    mockAssignAssetToEmployee.mockResolvedValue({
      id: 1,
      asset_id: 1,
      employee_id: "1",
      employee_name: "Assigned User",
      assigned_date: "2026-05-13",
      is_active: true,
    });
    mockRequestAssetReturn.mockResolvedValue({ id: 1, is_active: true });
    mockApproveAssetReturn.mockResolvedValue({ id: 1, is_active: false });
    mockRejectAssetReturn.mockResolvedValue({ id: 1, is_active: true });
    mockListPendingReturnRequests.mockResolvedValue([]);
    mockListScheduledMaintenance.mockResolvedValue([]);
    mockCreateScheduledMaintenance.mockResolvedValue({});
    mockCompleteScheduledMaintenance.mockResolvedValue({});
    mockCancelScheduledMaintenance.mockResolvedValue({});
    mockCreateAsset.mockResolvedValue({});
    mockUpdateAsset.mockResolvedValue({});
    mockListReplacementLogs.mockResolvedValue([]);
    mockCreateReplacementLog.mockResolvedValue({
      id: 1,
      asset: 1,
      reason: "Replacement logged",
      date: "2026-05-11",
    });
    mockUpdateReplacementLog.mockResolvedValue({
      id: 1,
      asset: 1,
      reason: "Replacement updated",
      date: "2026-05-11",
      replaced_by_details: null,
      replacement_asset_details: null,
    });
    mockExportAssetsCsv.mockResolvedValue({
      blob: new Blob(["asset_id,name\nAST-1,Device\n"], { type: "text/csv" }),
      filename: "asset_export.csv",
    });
    mockDownloadAssetQrCode.mockResolvedValue({
      blob: new Blob(["png-bytes"], { type: "image/png" }),
      filename: "asset-1-qr.png",
    });
  });

  it("loads and renders assets from backend", async () => {
    mockListAssets.mockResolvedValueOnce([
      {
        id: 1,
        name: "MacBook Pro 14",
        category: "laptops",
        serial_number: "SN-100",
        asset_tag: "AT-100",
        status: "available",
        condition: "good",
        purchase_price: 2500,
      },
    ]);

    render(<AssetsModule />);

    expect(await screen.findByText("MacBook Pro 14")).toBeInTheDocument();
    expect(mockListAssets).toHaveBeenCalledWith("test-token");
    expect(mockListAssignments).toHaveBeenCalledWith("test-token");
  });

  it("toggles asset filter controls from the header Filter button", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 102,
        name: "Filter Test Device",
        category: "laptops",
        serial_number: "SN-102",
        asset_tag: "AT-102",
        status: "available",
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Filter Test Device");

    const filterButton = screen.getByRole("button", { name: /Filter/i });
    expect(screen.getByPlaceholderText(/Search assets/i)).toBeInTheDocument();

    fireEvent.click(filterButton);
    expect(screen.queryByPlaceholderText(/Search assets/i)).toBeNull();

    fireEvent.click(filterButton);
    expect(
      await screen.findByPlaceholderText(/Search assets/i)
    ).toBeInTheDocument();

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );
    expect(
      await screen.findByText(/No assignment history/i)
    ).toBeInTheDocument();
    fireEvent.click(filterButton);
    expect(
      await screen.findByPlaceholderText(/Search assets/i)
    ).toBeInTheDocument();
  });

  it("filters assets by active assignment assignee", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 1021,
        name: "Searchable Assigned Laptop",
        category: "laptops",
        serial_number: "SN-1021",
        asset_tag: "AT-1021",
        status: "active",
      },
      {
        id: 1022,
        name: "Unrelated Monitor",
        category: "monitors",
        serial_number: "SN-1022",
        asset_tag: "AT-1022",
        status: "available",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 9021,
        asset_id: 1021,
        employee_id: "u-9021",
        employee_name: "Casey Assignee",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Searchable Assigned Laptop");
    expect(screen.getByText("Unrelated Monitor")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search assets/i), {
      target: { value: "Casey Assignee" },
    });

    expect(screen.getByText("Searchable Assigned Laptop")).toBeInTheDocument();
    expect(screen.queryByText("Unrelated Monitor")).toBeNull();
  });

  it("exports assets as CSV from the header Export button", async () => {
    sessionRole = "HR";
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.click(screen.getByRole("button", { name: /^Export$/i }));

    await waitFor(() => {
      expect(mockExportAssetsCsv).toHaveBeenCalledWith(
        expect.objectContaining({ include_assignment: true }),
        "test-token"
      );
    });
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("shows a permission message when export returns 403", async () => {
    sessionRole = "HR";
    mockExportAssetsCsv.mockRejectedValueOnce(new ApiError("Forbidden", 403));

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.click(screen.getByRole("button", { name: /^Export$/i }));

    expect(
      await screen.findByText(
        /do not have permission to export the full asset inventory/i
      )
    ).toBeInTheDocument();
  });

  it("applies employee permission gating", async () => {
    sessionRole = "Employee";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);

    const addAssetButtons = screen.getAllByRole("button", {
      name: /Add Asset/i,
    });
    expect(addAssetButtons.length).toBeGreaterThan(0);
    addAssetButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: /Export/i })).toBeDisabled();
    const scanButtons = screen.getAllByRole("button", { name: /Scan QR/i });
    scanButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("shows admin actions for HR role", async () => {
    sessionRole = "HR";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);

    const addAssetButtons = screen.getAllByRole("button", {
      name: /Add Asset/i,
    });
    expect(
      addAssetButtons.some((button) => !button.hasAttribute("disabled"))
    ).toBe(true);
    expect(screen.getByRole("button", { name: /Export/i })).toBeEnabled();
    const scanButtons = screen.getAllByRole("button", { name: /Scan QR/i });
    expect(scanButtons.some((button) => !button.hasAttribute("disabled"))).toBe(
      true
    );
  });

  it("opens the QR scanner from the header Scan QR button", async () => {
    sessionRole = "HR";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);

    fireEvent.click(screen.getByRole("button", { name: /^Scan QR$/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Scan QR Code")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Scan an asset QR code/i)
    ).toBeInTheDocument();
    expect(
      await within(dialog).findByText(/Camera scanning is not available/i)
    ).toBeInTheDocument();
  });

  it("opens the QR scanner from quick actions", async () => {
    sessionRole = "HR";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);

    const scanButtons = screen
      .getAllByRole("button", { name: /Scan QR/i })
      .filter((button) => !button.hasAttribute("disabled"));
    fireEvent.click(scanButtons[scanButtons.length - 1]);

    expect(await screen.findByRole("dialog")).toHaveTextContent("Scan QR Code");
  });

  it("shows admin actions for SUPER_ADMIN role", async () => {
    sessionRole = "SUPER_ADMIN";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);

    const addAssetButtons = screen.getAllByRole("button", {
      name: /Add Asset/i,
    });
    expect(
      addAssetButtons.some((button) => !button.hasAttribute("disabled"))
    ).toBe(true);
    expect(screen.getByRole("button", { name: /Export/i })).toBeEnabled();
    const scanButtons = screen.getAllByRole("button", { name: /Scan QR/i });
    expect(scanButtons.some((button) => !button.hasAttribute("disabled"))).toBe(
      true
    );
  });

  it("renders API errors from backend load", async () => {
    mockListAssets.mockRejectedValueOnce(new Error("Backend unavailable"));

    render(<AssetsModule />);

    expect(await screen.findByText("Backend unavailable")).toBeInTheDocument();
  });

  it("shows assignee in the view dialog using active assignment fallback", async () => {
    mockListAssets.mockResolvedValueOnce([
      {
        id: 41,
        name: "HP EliteBook",
        category: "laptops",
        serial_number: "SN-541",
        asset_tag: "AT-541",
        status: "active",
        assigned_employee_name: null,
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 741,
        asset_id: 41,
        employee_id: "u-77",
        employee_name: "Fallback Assignee",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);

    expect(await screen.findByText("Fallback Assignee")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /^View$/i }));

    expect(await screen.findByText("Assigned To")).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getByText("Fallback Assignee")
    ).toBeInTheDocument();
  });

  it("shows and downloads QR code from asset details", async () => {
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:qr-url");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const originalCreateElement = document.createElement.bind(document);
    let downloadAnchor: HTMLAnchorElement | null = null;
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);

        if (tagName.toLowerCase() === "a") {
          downloadAnchor = element as HTMLAnchorElement;
          vi.spyOn(downloadAnchor, "click").mockImplementation(() => undefined);
        }

        return element;
      });
    mockListAssets.mockResolvedValueOnce([
      {
        id: 42,
        name: "QR Laptop",
        category: "laptops",
        serial_number: "SN-QR",
        asset_tag: "AT-QR",
        status: "available",
        condition: "good",
        qr_code_payload: "http://localhost:3000/assets/42",
        qr_code_url: "/api/assets/42/qr-code/",
      },
    ]);
    mockDownloadAssetQrCode.mockResolvedValueOnce({
      blob: new Blob(["png-bytes"], { type: "image/png" }),
      filename: "asset-42-qr.png",
    });

    render(<AssetsModule />);
    await screen.findByText("QR Laptop");

    fireEvent.click(screen.getByRole("button", { name: /^View$/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("QR Code")).toBeInTheDocument();
    expect(
      await within(dialog).findByRole("img", { name: /QR Laptop QR code/i })
    ).toHaveAttribute("src", "blob:qr-url");

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Download QR/i })
    );

    await waitFor(() => {
      expect(mockDownloadAssetQrCode).toHaveBeenCalledWith(42, "test-token");
    });
    expect(downloadAnchor?.download).toBe("QR-Laptop-42-qr.png");
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:qr-url");

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("shows QR download errors using asset details error pattern", async () => {
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:qr-url");
    mockListAssets.mockResolvedValueOnce([
      {
        id: 43,
        name: "Forbidden QR Laptop",
        category: "laptops",
        serial_number: "SN-QR-403",
        asset_tag: "AT-QR-403",
        status: "available",
        condition: "good",
        qr_code_url: "/api/assets/43/qr-code/",
      },
    ]);
    mockDownloadAssetQrCode
      .mockResolvedValueOnce({
        blob: new Blob(["png-bytes"], { type: "image/png" }),
        filename: "asset-43-qr.png",
      })
      .mockRejectedValueOnce(new ApiError("Forbidden", 403));

    render(<AssetsModule />);
    await screen.findByText("Forbidden QR Laptop");

    fireEvent.click(screen.getByRole("button", { name: /^View$/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Download QR/i })
    );

    expect(
      await within(dialog).findByText(
        /do not have permission to download this QR code/i
      )
    ).toBeInTheDocument();

    createObjectURLSpy.mockRestore();
  });

  it("processes return when checklist is complete", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 10,
        name: "ThinkPad X1",
        category: "laptops",
        serial_number: "SN-200",
        asset_tag: "AT-200",
        status: "active",
        condition: "good",
        assigned_to: "u-1",
        assigned_employee_name: "Dev User",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 88,
        asset_id: 10,
        employee_id: "u-1",
        employee_name: "Dev User",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);
    mockListAssets.mockResolvedValueOnce([
      {
        id: 10,
        name: "ThinkPad X1",
        category: "laptops",
        serial_number: "SN-200",
        asset_tag: "AT-200",
        status: "active",
        condition: "good",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Approve Return/i })
    );

    const processButton = await screen.findByRole("button", {
      name: /Approve Return/i,
    });
    expect(processButton).toBeDisabled();

    const checkboxes = await screen.findAllByRole("checkbox");
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));

    await waitFor(() => expect(processButton).toBeEnabled());
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(mockApproveAssetReturn).toHaveBeenCalledWith(
        88,
        expect.objectContaining({
          notes: "",
          checklist: expect.any(Array),
          return_description: "",
          return_checklist: expect.any(Array),
        }),
        "test-token"
      );
    });
    expect(mockRequestAssetReturn).not.toHaveBeenCalled();
  });

  it("allows an employee to process return for an asset assigned to them", async () => {
    sessionRole = "Employee";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 12,
        name: "Employee-Owned Laptop",
        category: "laptops",
        serial_number: "SN-212",
        asset_tag: "AT-212",
        status: "active",
        condition: "good",
        assigned_to: "7",
        capabilities: {
          can_request_return: true,
        },
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 312,
        asset_id: 12,
        employee_id: "7",
        employee_name: "Jane Doe",
        employee_details: {
          user: {
            email: "jane@company.com",
          },
        },
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Request Return/i })
    );

    const processButton = await screen.findByRole("button", {
      name: /Request Return/i,
    });
    expect(processButton).toBeDisabled();

    const checkboxes = await screen.findAllByRole("checkbox");
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));

    await waitFor(() => expect(processButton).toBeEnabled());
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(mockRequestAssetReturn).toHaveBeenCalledWith(
        312,
        expect.objectContaining({
          notes: "",
          checklist: expect.any(Array),
          return_description: "",
          return_checklist: expect.any(Array),
        }),
        "test-token"
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Employee-Owned Laptop")).toBeNull();
    });
  });

  it("submits employee return requests with description and checklist payloads", async () => {
    sessionRole = "Employee";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 121,
        name: "Checklist Payload Laptop",
        category: "laptops",
        serial_number: "SN-121",
        asset_tag: "AT-121",
        status: "active",
        condition: "good",
        assigned_to: "7",
        capabilities: {
          can_request_return: true,
        },
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 512,
        asset_id: 121,
        employee_id: "7",
        employee_name: "Jane Doe",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Request Return/i })
    );

    const dialog = await screen.findByRole("dialog");
    const checkboxes = within(dialog).getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.change(
      within(dialog).getByLabelText(/Additional Return Notes/i),
      {
        target: { value: "Battery has started swelling." },
      }
    );

    const requestButton = within(dialog).getByRole("button", {
      name: /Request Return/i,
    });
    await waitFor(() => expect(requestButton).toBeEnabled());
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(mockRequestAssetReturn).toHaveBeenCalled();
    });
    const [, payload, token] = mockRequestAssetReturn.mock.calls[0];
    expect(token).toBe("test-token");
    expect(payload).toEqual(
      expect.objectContaining({
        notes: "Battery has started swelling.",
        return_description: "Battery has started swelling.",
      })
    );
    expect(payload.checklist).toEqual(payload.return_checklist);
    expect(payload.return_checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "physical",
          label: "Physical condition check",
          required: true,
          checked: true,
        }),
        expect.objectContaining({
          id: "software",
          label: "Software licenses deactivated",
          required: true,
          checked: true,
        }),
      ])
    );
  });

  it("keeps return action disabled for an employee when asset belongs to someone else", async () => {
    sessionRole = "Employee";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 13,
        name: "Other User Laptop",
        category: "laptops",
        serial_number: "SN-213",
        asset_tag: "AT-213",
        status: "active",
        condition: "good",
        assigned_to: "99",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 313,
        asset_id: 13,
        employee_id: "99",
        employee_name: "Another User",
        employee_details: {
          user: {
            email: "another@company.com",
          },
        },
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);

    expect(await screen.findByText("Other User Laptop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return/i })).toBeDisabled();
  });

  it("shows assign action for an active asset with no active assignment", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 11,
        name: "Unassigned Device",
        category: "laptops",
        serial_number: "SN-201",
        asset_tag: "AT-201",
        status: "active",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);

    expect(await screen.findByText("Unassigned Device")).toBeInTheDocument();
    const assetCard = withinAssetCard("Unassigned Device");
    const assignButton = assetCard.getByRole("button", {
      name: /Assign Asset/i,
    });

    expect(assignButton).toBeEnabled();
    expect(assetCard.queryByRole("button", { name: /Return/i })).toBeNull();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockRequestAssetReturn).not.toHaveBeenCalled();
  });

  it("shows assign action for an available asset with no active assignment", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 12,
        name: "Available Unassigned Device",
        category: "laptops",
        serial_number: "SN-202",
        asset_tag: "AT-202",
        status: "available",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);

    expect(
      await screen.findByText("Available Unassigned Device")
    ).toBeInTheDocument();
    const assetCard = withinAssetCard("Available Unassigned Device");

    expect(
      assetCard.getByRole("button", { name: /Assign Asset/i })
    ).toBeEnabled();
    expect(assetCard.queryByRole("button", { name: /Return/i })).toBeNull();
  });

  it("creates a new asset through the API and renders it", async () => {
    sessionRole = "HR";
    mockCreateAsset.mockResolvedValueOnce({
      id: 501,
      name: "Surface Laptop",
      category: "laptops",
      serial_number: "SN-501",
      asset_tag: "AT-501",
      status: "available",
      condition: "excellent",
      purchase_price: 1800,
    });

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.click(getAnyEnabledButton(/Add Asset/i));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Asset Name/i), {
      target: { value: "Surface Laptop" },
    });
    await selectAssetCategory("Laptops");
    fireEvent.change(within(dialog).getByLabelText(/Serial Number/i), {
      target: { value: "SN-501" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: /Add Asset/i }));

    await waitFor(() => {
      expect(mockCreateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          asset_id: "SN-501",
          name: "Surface Laptop",
          category: "laptops",
          serial_number: "SN-501",
          purchase_date: expect.any(String),
        }),
        "test-token"
      );
    });

    expect(await screen.findByText("Surface Laptop")).toBeInTheDocument();
  });

  it("sends maintenance status when editing an asset", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 701,
        name: "Maintenance Candidate",
        category: "laptops",
        serial_number: "SN-701",
        asset_tag: "AT-701",
        status: "active",
        condition: "good",
      },
    ]);
    mockUpdateAsset.mockResolvedValueOnce({
      id: 701,
      name: "Maintenance Candidate",
      category: "laptops",
      serial_number: "SN-701",
      asset_tag: "AT-701",
      status: "maintenance",
      condition: "good",
    });

    render(<AssetsModule />);
    await screen.findByText("Maintenance Candidate");

    const assetCard = withinAssetCard("Maintenance Candidate");
    const overflowButton = assetCard.getAllByRole("button").at(-1);
    if (!overflowButton) {
      throw new Error("Asset actions menu not found");
    }

    fireEvent.pointerDown(overflowButton);
    fireEvent.click(await screen.findByRole("menuitem", { name: /Edit/i }));

    const dialog = await screen.findByRole("dialog", { name: /Edit Asset/i });
    fireEvent.click(within(dialog).getByRole("combobox", { name: /Status/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Maintenance" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Changes/i })
    );

    await waitFor(() => {
      expect(mockUpdateAsset).toHaveBeenCalledWith(
        701,
        expect.objectContaining({ status: "maintenance" }),
        "test-token"
      );
    });
  });

  it("sends retired status when editing an asset", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 702,
        name: "Retirement Candidate",
        category: "laptops",
        serial_number: "SN-702",
        asset_tag: "AT-702",
        status: "active",
        condition: "good",
      },
    ]);
    mockUpdateAsset.mockResolvedValueOnce({
      id: 702,
      name: "Retirement Candidate",
      category: "laptops",
      serial_number: "SN-702",
      asset_tag: "AT-702",
      status: "retired",
      condition: "good",
    });

    render(<AssetsModule />);
    await screen.findByText("Retirement Candidate");

    const assetCard = withinAssetCard("Retirement Candidate");
    const overflowButton = assetCard.getAllByRole("button").at(-1);
    if (!overflowButton) {
      throw new Error("Asset actions menu not found");
    }

    fireEvent.pointerDown(overflowButton);
    fireEvent.click(await screen.findByRole("menuitem", { name: /Edit/i }));

    const dialog = await screen.findByRole("dialog", { name: /Edit Asset/i });
    fireEvent.click(within(dialog).getByRole("combobox", { name: /Status/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Retired" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Changes/i })
    );

    await waitFor(() => {
      expect(mockUpdateAsset).toHaveBeenCalledWith(
        702,
        expect.objectContaining({ status: "retired" }),
        "test-token"
      );
    });
  });

  it("creates a maintenance log with a manually selected date", async () => {
    sessionRole = "HR";
    const today = new Date();
    const replacementDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    mockListAssets.mockResolvedValueOnce([
      {
        id: 601,
        name: "Damaged Laptop",
        category: "laptops",
        serial_number: "SN-601",
        asset_tag: "AT-601",
        status: "active",
        condition: "damaged",
      },
      {
        id: 602,
        name: "Replacement Laptop",
        category: "laptops",
        serial_number: "SN-602",
        asset_tag: "AT-602",
        status: "available",
        condition: "excellent",
      },
    ]);
    mockCreateReplacementLog.mockResolvedValueOnce({
      id: 901,
      asset: 601,
      asset_details: {
        id: 601,
        name: "Damaged Laptop",
      },
      reason: "Screen stopped working",
      date: replacementDate,
      replaced_by_details: {
        id: 77,
        full_name: "Jane Doe",
        user: {
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@company.com",
        },
      },
      replacement_asset: 602,
      replacement_asset_details: {
        id: 602,
        name: "Replacement Laptop",
      },
      cost: "150.00",
      asset_status_before: "active",
      asset_status_after: "maintenance",
      asset_condition_before: "damaged",
      asset_condition_after: "poor",
    });

    render(<AssetsModule />);
    await screen.findByText("Damaged Laptop");

    fireEvent.click(
      withinAssetCard("Damaged Laptop").getByRole("button", { name: /View/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(mockListReplacementLogs).toHaveBeenCalledWith(601, "test-token");

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Log Maintenance/i })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Select date/i })
    );
    fireEvent.click(
      screen
        .getAllByRole("button", { name: String(today.getDate()) })
        .find((button) => !button.hasAttribute("tabindex")) as HTMLElement
    );
    fireEvent.change(within(dialog).getByLabelText(/Reason/i), {
      target: { value: "Screen stopped working" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Cost/i), {
      target: { value: "150.00" },
    });
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Related Asset/i })
    );
    fireEvent.click(await screen.findByText("Replacement Laptop (AT-602)"));
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Status after/i })
    );
    fireEvent.click(await screen.findByRole("option", { name: "Maintenance" }));
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Condition after/i })
    );
    fireEvent.click(await screen.findByRole("option", { name: "Poor" }));

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Maintenance/i })
    );

    await waitFor(() => {
      expect(mockCreateReplacementLog).toHaveBeenCalledWith(
        {
          asset: 601,
          reason: "Screen stopped working",
          date: replacementDate,
          replacement_asset: 602,
          cost: "150.00",
          asset_status_after: "maintenance",
          asset_condition_after: "poor",
        },
        "test-token"
      );
    });
    expect(mockCreateReplacementLog.mock.calls[0][0]).not.toHaveProperty(
      "asset_status_before"
    );
    expect(mockCreateReplacementLog.mock.calls[0][0]).not.toHaveProperty(
      "asset_condition_before"
    );
    expect(
      await screen.findByText("Screen stopped working")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Status before: Active")
    ).toBeInTheDocument();
    expect(screen.getByText("Status after: Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Condition before: Damaged")).toBeInTheDocument();
    expect(screen.getByText("Condition after: Poor")).toBeInTheDocument();
    expect(await screen.findByText("Logged by: Jane Doe")).toBeInTheDocument();
    expect(
      await screen.findByText("Related asset: Replacement Laptop")
    ).toBeInTheDocument();
    expect(await screen.findByText("Cost: $150.00")).toBeInTheDocument();
  });

  it("explains maintenance logs are history-only and leaves inventory state untouched", async () => {
    sessionRole = "HR";
    const today = new Date();
    const replacementDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    mockListAssets.mockResolvedValueOnce([
      {
        id: 621,
        name: "Assigned Damaged Laptop",
        category: "laptops",
        serial_number: "SN-621",
        asset_tag: "AT-621",
        status: "active",
        condition: "damaged",
        assigned_to: "42",
        assigned_employee_name: "Current Assignee",
      },
      {
        id: 622,
        name: "Spare Replacement Laptop",
        category: "laptops",
        serial_number: "SN-622",
        asset_tag: "AT-622",
        status: "available",
        condition: "excellent",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 721,
        asset_id: 621,
        employee_id: "42",
        employee_name: "Current Assignee",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);
    mockCreateReplacementLog.mockResolvedValueOnce({
      id: 921,
      asset: 621,
      reason: "Original device damaged beyond repair",
      date: replacementDate,
      replacement_asset: 622,
      cost: "900.00",
    });

    render(<AssetsModule />);
    await screen.findByText("Assigned Damaged Laptop");

    const originalCard = withinAssetCard("Assigned Damaged Laptop");
    const replacementCard = withinAssetCard("Spare Replacement Laptop");
    expect(originalCard.getByText("active")).toBeInTheDocument();
    expect(originalCard.getByText("damaged")).toBeInTheDocument();
    expect(originalCard.getByText("Current Assignee")).toBeInTheDocument();
    expect(replacementCard.getByText("available")).toBeInTheDocument();
    expect(replacementCard.getByText("excellent")).toBeInTheDocument();
    expect(replacementCard.getByText("--")).toBeInTheDocument();

    fireEvent.click(originalCard.getByRole("button", { name: /View/i }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Log Maintenance/i })
    );
    expect(
      within(dialog).getByText(/creates a history record only/i)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/will not change asset status/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Select date/i })
    );
    fireEvent.click(
      screen
        .getAllByRole("button", { name: String(today.getDate()) })
        .find((button) => !button.hasAttribute("tabindex")) as HTMLElement
    );
    fireEvent.change(within(dialog).getByLabelText(/Reason/i), {
      target: { value: "Original device damaged beyond repair" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Cost/i), {
      target: { value: "900.00" },
    });
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Related Asset/i })
    );
    fireEvent.click(
      await screen.findByText("Spare Replacement Laptop (AT-622)")
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Maintenance/i })
    );

    await waitFor(() => {
      expect(mockCreateReplacementLog).toHaveBeenCalledWith(
        {
          asset: 621,
          reason: "Original device damaged beyond repair",
          date: replacementDate,
          replacement_asset: 622,
          cost: "900.00",
        },
        "test-token"
      );
    });

    expect(mockListAssets).toHaveBeenCalledTimes(1);
    expect(mockListAssignments).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("Original device damaged beyond repair")
    ).toBeInTheDocument();
    expect(originalCard.getByText("active")).toBeInTheDocument();
    expect(originalCard.getByText("damaged")).toBeInTheDocument();
    expect(originalCard.getByText("Current Assignee")).toBeInTheDocument();
    expect(replacementCard.getByText("available")).toBeInTheDocument();
    expect(replacementCard.getByText("excellent")).toBeInTheDocument();
    expect(replacementCard.getByText("--")).toBeInTheDocument();
  });

  it("edits an existing maintenance log and replaces the displayed record", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 631,
        name: "Editable Original Laptop",
        category: "laptops",
        serial_number: "SN-631",
        asset_tag: "AT-631",
        status: "active",
        condition: "damaged",
      },
      {
        id: 632,
        name: "Editable Replacement Laptop",
        category: "laptops",
        serial_number: "SN-632",
        asset_tag: "AT-632",
        status: "available",
        condition: "excellent",
      },
    ]);
    mockListReplacementLogs.mockResolvedValueOnce([
      {
        id: 931,
        asset: 631,
        asset_details: {
          id: 631,
          name: "Editable Original Laptop",
        },
        reason: "Original reason",
        date: "2026-05-10",
        replaced_by: 77,
        replaced_by_details: {
          id: 77,
          full_name: "Jane Doe",
        },
        replacement_asset: 632,
        replacement_asset_details: {
          id: 632,
          name: "Editable Replacement Laptop",
        },
        cost: "800.00",
        asset_status_before: "active",
        asset_status_after: "maintenance",
        asset_condition_before: "damaged",
        asset_condition_after: "poor",
      },
    ]);
    mockUpdateReplacementLog.mockResolvedValueOnce({
      id: 931,
      asset: 631,
      asset_details: {
        id: 631,
        name: "Editable Original Laptop",
      },
      reason: "Updated replacement reason",
      date: "2026-05-11",
      replaced_by: 77,
      replaced_by_details: {
        id: 77,
        full_name: "Jane Doe",
      },
      replacement_asset: 632,
      replacement_asset_details: {
        id: 632,
        name: "Editable Replacement Laptop",
      },
      cost: "900.00",
      asset_status_before: "active",
      asset_status_after: "retired",
      asset_condition_before: "damaged",
      asset_condition_after: "damaged",
    });

    render(<AssetsModule />);
    await screen.findByText("Editable Original Laptop");

    fireEvent.click(
      withinAssetCard("Editable Original Laptop").getByRole("button", {
        name: /View/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    expect(await screen.findByText("Original reason")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /Edit/i }));

    expect(
      within(dialog).getByDisplayValue("Original reason")
    ).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("800.00")).toBeInTheDocument();
    expect(within(dialog).getAllByText("May 10, 2026").length).toBeGreaterThan(
      0
    );
    expect(
      within(dialog).queryByLabelText(/Logged by/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText("Status before: Active")).toBeInTheDocument();
    expect(screen.getByText("Status after: Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Condition before: Damaged")).toBeInTheDocument();
    expect(screen.getByText("Condition after: Poor")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/Reason/i), {
      target: { value: "Updated replacement reason" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Cost/i), {
      target: { value: "900.00" },
    });
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Status after/i })
    );
    fireEvent.click(await screen.findByRole("option", { name: "Retired" }));
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Condition after/i })
    );
    fireEvent.click(await screen.findByRole("option", { name: "Damaged" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Changes/i })
    );

    await waitFor(() => {
      expect(mockUpdateReplacementLog).toHaveBeenCalledWith(
        931,
        {
          asset: 631,
          reason: "Updated replacement reason",
          date: "2026-05-10",
          replacement_asset: 632,
          cost: "900.00",
          asset_status_before: "active",
          asset_status_after: "retired",
          asset_condition_before: "damaged",
          asset_condition_after: "damaged",
        },
        "test-token"
      );
    });
    expect(mockUpdateReplacementLog.mock.calls[0][1]).not.toHaveProperty(
      "replaced_by"
    );
    expect(
      await screen.findByText("Updated replacement reason")
    ).toBeInTheDocument();
    expect(screen.getByText("May 11, 2026")).toBeInTheDocument();
    expect(screen.getByText("Status after: Retired")).toBeInTheDocument();
    expect(screen.getByText("Condition after: Damaged")).toBeInTheDocument();
    expect(screen.getByText("Cost: $900.00")).toBeInTheDocument();
    expect(screen.queryByText("Original reason")).toBeNull();
    expect(mockListAssets).toHaveBeenCalledTimes(1);
    expect(mockListAssignments).toHaveBeenCalledTimes(1);
  });

  it("allows optional maintenance-log fields to be cleared on edit", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 641,
        name: "Clearable Original Laptop",
        category: "laptops",
        serial_number: "SN-641",
        asset_tag: "AT-641",
        status: "active",
        condition: "damaged",
      },
      {
        id: 642,
        name: "Clearable Replacement Laptop",
        category: "laptops",
        serial_number: "SN-642",
        asset_tag: "AT-642",
        status: "available",
        condition: "excellent",
      },
    ]);
    mockListReplacementLogs.mockResolvedValueOnce([
      {
        id: 941,
        asset: 641,
        asset_details: {
          id: 641,
          name: "Clearable Original Laptop",
        },
        reason: "Clear optional fields",
        date: "2026-05-10",
        replaced_by: null,
        replaced_by_details: null,
        replacement_asset: 642,
        replacement_asset_details: {
          id: 642,
          name: "Clearable Replacement Laptop",
        },
        cost: "300.00",
        asset_status_before: null,
        asset_status_after: "maintenance",
        asset_condition_before: null,
        asset_condition_after: "poor",
      },
    ]);
    mockUpdateReplacementLog.mockResolvedValueOnce({
      id: 941,
      asset: 641,
      asset_details: {
        id: 641,
        name: "Clearable Original Laptop",
      },
      reason: "Clear optional fields",
      date: "2026-05-10",
      replaced_by: null,
      replaced_by_details: null,
      replacement_asset: null,
      replacement_asset_details: null,
      cost: null,
      asset_status_before: null,
      asset_status_after: null,
      asset_condition_before: null,
      asset_condition_after: null,
    });

    render(<AssetsModule />);
    await screen.findByText("Clearable Original Laptop");

    fireEvent.click(
      withinAssetCard("Clearable Original Laptop").getByRole("button", {
        name: /View/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      await within(dialog).findByRole("button", { name: /Edit/i })
    );
    fireEvent.click(
      within(dialog).getByRole("combobox", {
        name: /Related asset/i,
      })
    );
    fireEvent.click(await screen.findByText("No related asset"));
    fireEvent.change(within(dialog).getByLabelText(/Cost/i), {
      target: { value: "" },
    });
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Status after/i })
    );
    fireEvent.click(
      await screen.findByRole("option", { name: "Status after: Not recorded" })
    );
    fireEvent.click(
      within(dialog).getByRole("combobox", { name: /Condition after/i })
    );
    fireEvent.click(
      await screen.findByRole("option", {
        name: "Condition after: Not recorded",
      })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Changes/i })
    );

    await waitFor(() => {
      expect(mockUpdateReplacementLog).toHaveBeenCalledWith(
        941,
        expect.objectContaining({
          replacement_asset: null,
          cost: null,
          asset_status_after: null,
          asset_condition_after: null,
        }),
        "test-token"
      );
    });
    await waitFor(() => {
      expect(screen.queryByText(/^Related asset:/i)).toBeNull();
      expect(screen.queryByText(/^Cost:/i)).toBeNull();
    });
  });

  it("shows maintenance-log update field errors from the API", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 651,
        name: "Invalid Edit Laptop",
        category: "laptops",
        serial_number: "SN-651",
        asset_tag: "AT-651",
        status: "active",
        condition: "damaged",
      },
    ]);
    mockListReplacementLogs.mockResolvedValueOnce([
      {
        id: 951,
        asset: 651,
        asset_details: {
          id: 651,
          name: "Invalid Edit Laptop",
        },
        reason: "Invalid edit record",
        date: "2026-05-10",
        replaced_by: null,
        replaced_by_details: null,
        replacement_asset: null,
        replacement_asset_details: null,
        cost: null,
      },
    ]);
    mockUpdateReplacementLog.mockRejectedValueOnce(
      new ApiError("Please review the form details.", 400, {
        reason: ["Reason is too short."],
        date: ["Enter a valid date."],
      })
    );

    render(<AssetsModule />);
    await screen.findByText("Invalid Edit Laptop");

    fireEvent.click(
      withinAssetCard("Invalid Edit Laptop").getByRole("button", {
        name: /View/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      await within(dialog).findByRole("button", { name: /Edit/i })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Save Changes/i })
    );

    expect(await screen.findByText("Reason is too short.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid date.")).toBeInTheDocument();
  });

  it("does not expose maintenance logging to regular employee capabilities", async () => {
    mockListAssets.mockResolvedValueOnce([
      {
        id: 611,
        name: "Employee Laptop",
        category: "laptops",
        serial_number: "SN-611",
        asset_tag: "AT-611",
        status: "active",
        condition: "good",
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Employee Laptop");

    fireEvent.click(
      withinAssetCard("Employee Laptop").getByRole("button", { name: /View/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: /Log Maintenance/i })
    ).toBeNull();
  });

  it("keeps maintenance history visible without maintenance mutation permission", async () => {
    mockListAssets.mockResolvedValueOnce([
      {
        id: 612,
        name: "History Only Laptop",
        category: "laptops",
        serial_number: "SN-612",
        asset_tag: "AT-612",
        status: "active",
        condition: "good",
      },
    ]);
    mockListReplacementLogs.mockResolvedValueOnce([
      {
        id: 912,
        asset: 612,
        reason: "Prior replacement record",
        date: "2026-05-01",
        replaced_by_details: {
          id: 88,
          full_name: "History Viewer",
        },
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("History Only Laptop");

    fireEvent.click(
      withinAssetCard("History Only Laptop").getByRole("button", {
        name: /View/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      await screen.findByText("Prior replacement record")
    ).toBeInTheDocument();
    expect(screen.getByText("Logged by: History Viewer")).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /Log Maintenance/i })
    ).toBeNull();
    expect(within(dialog).queryByRole("button", { name: /Edit/i })).toBeNull();
  });

  it("renders maintenance logs when optional response fields are missing", async () => {
    mockListAssets.mockResolvedValueOnce([
      {
        id: 614,
        name: "Minimal History Laptop",
        category: "laptops",
        serial_number: "SN-614",
        asset_tag: "AT-614",
        status: "active",
        condition: "good",
      },
    ]);
    mockListReplacementLogs.mockResolvedValueOnce([
      {
        id: 914,
        asset: 614,
        asset_details: {
          id: 614,
          name: "Minimal History Laptop",
        },
        reason: "Minimal response record",
        created_at: "2026-05-11",
        replaced_by: null,
        replaced_by_details: null,
        replacement_asset: null,
        replacement_asset_details: null,
        cost: null,
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Minimal History Laptop");

    fireEvent.click(
      withinAssetCard("Minimal History Laptop").getByRole("button", {
        name: /View/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      await screen.findByText("Minimal response record")
    ).toBeInTheDocument();
    expect(screen.getByText("May 11, 2026")).toBeInTheDocument();
    expect(screen.getByText("Status before: Not recorded")).toBeInTheDocument();
    expect(screen.getByText("Status after: Not recorded")).toBeInTheDocument();
    expect(
      screen.getByText("Condition before: Not recorded")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Condition after: Not recorded")
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/^Logged by:/i)).toBeNull();
    expect(within(dialog).queryByText(/^Related asset:/i)).toBeNull();
    expect(within(dialog).queryByText(/^Cost:/i)).toBeNull();
  });

  it("does not allow log_asset_lost alone to mutate maintenance logs", async () => {
    sessionRole = "LostOnly";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 613,
        name: "Lost Only Laptop",
        category: "laptops",
        serial_number: "SN-613",
        asset_tag: "AT-613",
        status: "active",
        condition: "good",
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Lost Only Laptop");

    fireEvent.click(
      withinAssetCard("Lost Only Laptop").getByRole("button", {
        name: /View/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: /Log Maintenance/i })
    ).toBeNull();
  });

  it("does not call create API when required fields are missing", async () => {
    sessionRole = "HR";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);
    fireEvent.click(getAnyEnabledButton(/Add Asset/i));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Add Asset/i }));

    expect(mockCreateAsset).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("parses optional fields on create and resets dialog form", async () => {
    sessionRole = "HR";
    mockCreateAsset.mockResolvedValueOnce({
      id: 777,
      name: "Configured Asset",
      category: "laptops",
      serial_number: "SN-777",
      asset_tag: "AT-777",
      status: "available",
      condition: "excellent",
      purchase_price: 1999,
      specifications: { ram: "16GB" },
    });

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.click(getAnyEnabledButton(/Add Asset/i));

    let dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Asset Name/i), {
      target: { value: "Configured Asset" },
    });
    await selectAssetCategory("Laptops");
    fireEvent.change(within(dialog).getByLabelText(/Serial Number/i), {
      target: { value: "SN-777" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Purchase Price/i), {
      target: { value: "1999" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Specifications/i), {
      target: { value: '{"ram":"16GB"}' },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: /Add Asset/i }));

    await waitFor(() => {
      expect(mockCreateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          asset_id: "SN-777",
          name: "Configured Asset",
          category: "laptops",
          serial_number: "SN-777",
          purchase_price: 1999,
          manufacturer: undefined,
          purchase_date: expect.any(String),
        }),
        "test-token"
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    fireEvent.click(getAnyEnabledButton(/Add Asset/i));
    dialog = await screen.findByRole("dialog");

    expect(
      (within(dialog).getByLabelText(/Asset Name/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (within(dialog).getByLabelText(/Serial Number/i) as HTMLInputElement)
        .value
    ).toBe("");
    expect(
      (within(dialog).getByLabelText(/Purchase Price/i) as HTMLInputElement)
        .value
    ).toBe("");
  });

  it("keeps selected category when create response omits category", async () => {
    sessionRole = "HR";
    mockCreateAsset.mockResolvedValueOnce({
      id: 778,
      name: "Category Fallback Asset",
      serial_number: "SN-778",
      asset_tag: "AT-778",
      status: "available",
      condition: "good",
      purchase_price: 1200,
    });

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.click(getAnyEnabledButton(/Add Asset/i));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Asset Name/i), {
      target: { value: "Category Fallback Asset" },
    });
    await selectAssetCategory("Laptops");
    fireEvent.change(within(dialog).getByLabelText(/Serial Number/i), {
      target: { value: "SN-778" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: /Add Asset/i }));

    expect(
      await screen.findByText("Category Fallback Asset")
    ).toBeInTheDocument();
    expect(getCategoryCount("Laptops")).toBe("1");
    expect(getCategoryCount("Other")).toBe("0");
  });

  it("blocks create when specifications JSON is invalid", async () => {
    sessionRole = "HR";
    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);
    fireEvent.click(getAnyEnabledButton(/Add Asset/i));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Asset Name/i), {
      target: { value: "Invalid JSON Asset" },
    });
    await selectAssetCategory("Laptops");
    fireEvent.change(within(dialog).getByLabelText(/Serial Number/i), {
      target: { value: "SN-BAD" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Specifications/i), {
      target: { value: "{not valid json}" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: /Add Asset/i }));

    expect(
      await screen.findByText(/Specifications must be valid JSON/i)
    ).toBeInTheDocument();
    expect(mockCreateAsset).not.toHaveBeenCalled();
  });

  it("shows backend create errors such as duplicate serial", async () => {
    sessionRole = "HR";
    mockCreateAsset.mockRejectedValueOnce(new Error("Duplicate serial number"));

    render(<AssetsModule />);

    await screen.findByText(/No assets found/i);
    fireEvent.click(getAnyEnabledButton(/Add Asset/i));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Asset Name/i), {
      target: { value: "Duplicate Serial Asset" },
    });
    await selectAssetCategory("Laptops");
    fireEvent.change(within(dialog).getByLabelText(/Serial Number/i), {
      target: { value: "SN-DUP" },
    });

    fireEvent.click(within(dialog).getByRole("button", { name: /Add Asset/i }));

    expect(
      await screen.findByText("Duplicate serial number")
    ).toBeInTheDocument();
  });

  it("shows return processing error if API fails", async () => {
    sessionRole = "HR";
    mockApproveAssetReturn.mockRejectedValueOnce(new Error("Return failed"));
    mockListAssets.mockResolvedValueOnce([
      {
        id: 20,
        name: "Return Error Asset",
        category: "laptops",
        serial_number: "SN-RERR",
        asset_tag: "AT-RERR",
        status: "active",
        condition: "good",
        assigned_to: "u-2",
        assigned_employee_name: "Dev User",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 99,
        asset_id: 20,
        employee_id: "u-2",
        employee_name: "Dev User",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Approve Return/i })
    );
    const processButton = await screen.findByRole("button", {
      name: /Approve Return/i,
    });
    const checkboxes = await screen.findAllByRole("checkbox");
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));

    await waitFor(() => expect(processButton).toBeEnabled());
    fireEvent.click(processButton);

    expect(await screen.findByText("Return failed")).toBeInTheDocument();
  });

  it("requests return instead of self-approving when an HR user's own asset is returned", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 21,
        name: "HR Assigned Laptop",
        category: "laptops",
        serial_number: "SN-HR",
        asset_tag: "AT-HR",
        status: "active",
        condition: "good",
        assigned_to: "7",
        assigned_employee_name: "Jane Doe",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 100,
        asset_id: 21,
        employee_id: "7",
        employee_name: "Jane Doe",
        employee_details: {
          user: {
            email: "jane@company.com",
          },
        },
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Request Return/i })
    );
    const dialog = await screen.findByRole("dialog");
    const checkboxes = await screen.findAllByRole("checkbox");
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Request Return/i })
    );

    await waitFor(() => {
      expect(mockRequestAssetReturn).toHaveBeenCalledWith(
        100,
        expect.objectContaining({
          checklist: expect.any(Array),
          return_checklist: expect.any(Array),
        }),
        "test-token"
      );
    });
    expect(mockApproveAssetReturn).not.toHaveBeenCalled();
  });

  it("approves return directly when HR returns someone else's asset", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 22,
        name: "Team Assigned Laptop",
        category: "laptops",
        serial_number: "SN-TEAM",
        asset_tag: "AT-TEAM",
        status: "active",
        condition: "good",
        assigned_to: "8",
        assigned_employee_name: "John Doe",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 101,
        asset_id: 22,
        employee_id: "8",
        employee_name: "John Doe",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Approve Return/i })
    );
    const dialog = await screen.findByRole("dialog");
    const checkboxes = await screen.findAllByRole("checkbox");
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Approve Return/i })
    );

    await waitFor(() => {
      expect(mockApproveAssetReturn).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          checklist: expect.any(Array),
          return_checklist: expect.any(Array),
        }),
        "test-token"
      );
    });
    expect(mockRequestAssetReturn).not.toHaveBeenCalled();
  });

  it("shows assignment history tab and requests assignment data", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 41,
        name: "Any Device",
        asset_tag: "AT-41",
        category: "laptops",
        serial_number: "SN-41",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);
    await screen.findByText("Any Device");

    expect(
      screen.getByRole("tab", { name: /Assignment History/i })
    ).toBeInTheDocument();
    expect(mockListAssignments).toHaveBeenCalledWith("test-token");
  });

  it("renders pending return queue details from backend return request payload", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([]);
    mockListPendingReturnRequests.mockResolvedValueOnce([
      {
        assignment_id: 501,
        asset: {
          id: 71,
          asset_id: "AST-071",
          name: "MacBook Air M3",
        },
        employee: {
          id: 42,
          user: {
            first_name: "Alex",
            last_name: "Morgan",
            email: "alex.morgan@example.com",
          },
        },
        requested_by: {
          id: 42,
          user: {
            first_name: "Alex",
            last_name: "Morgan",
          },
        },
        return_request_status: "pending",
        return_requested_at: "2026-04-29T14:30:00Z",
        return_description: "Device is ready for handover.",
        assignment_details: {
          id: 501,
          asset_id: 71,
          return_checklist: [
            {
              id: "physical",
              label: "Physical condition check",
              required: true,
              checked: true,
              notes: "No visible damage.",
            },
            {
              id: "charger",
              label: "Original charger included",
              required: false,
              checked: false,
            },
          ],
        },
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );

    expect(await screen.findByText(/Alex Morgan/)).toBeInTheDocument();
    expect(
      screen.getByText(/requested return for MacBook Air M3/)
    ).toBeInTheDocument();
    expect(screen.getByText(/AST-071/)).toBeInTheDocument();
    expect(
      screen.getByText("Device is ready for handover.")
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Rejection reason")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /View details/i }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Return Request Details")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Physical condition check")
    ).toBeInTheDocument();
    expect(within(dialog).getByText("No visible damage.")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Original charger included")
    ).toBeInTheDocument();
    const rejectionReasonInput =
      within(dialog).getByLabelText(/Rejection Reason/i);
    fireEvent.change(rejectionReasonInput, {
      target: { value: "Missing charger handoff confirmation." },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Reject return/i })
    );

    await waitFor(() => {
      expect(mockRejectAssetReturn).toHaveBeenCalledWith(
        501,
        { reason: "Missing charger handoff confirmation." },
        "test-token"
      );
    });
  });

  it("renders pending return checklist from nested return_requested payload", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([]);
    mockListPendingReturnRequests.mockResolvedValueOnce([
      {
        assignment_id: 502,
        asset: {
          id: 72,
          asset_id: "AST-072",
          name: "ThinkPad Return",
        },
        employee: {
          id: 43,
          user: {
            first_name: "Mira",
            last_name: "Kovac",
          },
        },
        requested_by: {
          id: 43,
          user: {
            first_name: "Mira",
            last_name: "Kovac",
          },
        },
        return_requested: {
          notes: "Returning before role change.",
          checklist: [
            {
              id: "data",
              label: "Data wiped/backed up",
              required: true,
              checked: true,
              notes: "Backup completed.",
            },
          ],
        },
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /View details/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByText(/No checklist was submitted/i)
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText("Data wiped/backed up")
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Backup completed.")).toBeInTheDocument();
  });

  it("approves a pending return when backend returns a nested assignment object", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([]);
    mockListPendingReturnRequests.mockResolvedValueOnce([
      {
        id: 602,
        assignment: {
          id: 552,
          asset_id: 72,
          employee_id: "hr-2",
          employee_name: "HR Assignee",
        },
        asset: {
          id: 72,
          asset_id: "AST-552",
          name: "HR Return Laptop",
        },
        employee: {
          id: 52,
          user: {
            first_name: "HR",
            last_name: "Assignee",
          },
        },
        return_requested: {
          notes: "Ready for HR handoff.",
        },
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /View details/i })
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Approve return/i })
    );

    await waitFor(() => {
      expect(mockApproveAssetReturn).toHaveBeenCalledWith(
        552,
        {},
        "test-token"
      );
    });
  });

  it("requires a rejection reason before rejecting a pending return", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([]);
    mockListPendingReturnRequests.mockResolvedValueOnce([
      {
        assignment_id: 503,
        asset: {
          id: 73,
          asset_id: "AST-073",
          name: "Surface Laptop",
        },
        employee: {
          id: 44,
          user: {
            first_name: "Sam",
            last_name: "Lee",
          },
        },
        requested_by: {
          id: 44,
          user: {
            first_name: "Sam",
            last_name: "Lee",
          },
        },
        return_checklist: [
          {
            id: "physical",
            label: "Physical condition check",
            required: true,
            checked: true,
          },
        ],
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /View details/i })
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Reject return/i })
    );

    expect(
      await screen.findByText("Rejection reason is required.")
    ).toBeInTheDocument();
    expect(mockRejectAssetReturn).not.toHaveBeenCalled();
  });

  it("keeps assignment history visible when asset record is no longer in inventory", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 401,
        asset_id: 999,
        asset_details: {
          id: 999,
          name: "Deleted ThinkPad",
          asset_id: "AT-999",
        },
        employee_id: "u-11",
        employee_name: "History User",
        assigned_date: "2026-04-01",
        is_active: false,
        returned_date: "2026-04-03",
        condition: "good",
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );

    expect(await screen.findByText("Deleted ThinkPad")).toBeInTheDocument();
    expect(screen.getByText("AT-999")).toBeInTheDocument();
    expect(screen.getByText("History User")).toBeInTheDocument();
  });

  it("shows assignment condition from asset details when assignment has no return condition", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 403,
        asset_id: 654,
        asset_details: {
          id: 654,
          name: "Condition Source Laptop",
          asset_id: "AT-654",
          condition: "excellent",
        },
        employee_id: "u-13",
        employee_name: "Condition User",
        assigned_date: "2026-04-01",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );

    expect(
      await screen.findByText("Condition Source Laptop")
    ).toBeInTheDocument();
    expect(screen.getByText("excellent")).toBeInTheDocument();
    expect(screen.queryByText("unknown")).toBeNull();
  });

  it("opens assignment details and printable assignment form from history actions", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 655,
        name: "Form Laptop",
        asset_id: "AT-655",
        category: "laptops",
        serial_number: "SN-655",
        condition: "good",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 404,
        asset_id: 655,
        asset_details: {
          id: 655,
          name: "Form Laptop",
          asset_id: "AT-655",
          condition: "good",
        },
        employee_id: "u-14",
        employee_name: "Form User",
        employee_details: {
          user: {
            email: "form.user@example.com",
          },
        },
        assigned_date: "2026-04-01",
        assigned_by: "HR Manager",
        is_active: true,
        notes: "Issued for onboarding.",
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Form Laptop");

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );
    fireEvent.pointerDown(
      await screen.findByLabelText(/Assignment actions for Form User/i),
      { button: 0, ctrlKey: false }
    );
    fireEvent.click(await screen.findByText("View Details"));

    let dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Assignment Details")).toBeInTheDocument();
    expect(within(dialog).getByText("HR Manager")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Issued for onboarding.")
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getAllByRole("button", { name: /Close/i })[0]
    );
    await waitFor(() => {
      expect(screen.queryByText("Assignment Details")).toBeNull();
    });

    fireEvent.pointerDown(
      await screen.findByLabelText(/Assignment actions for Form User/i),
      { button: 0, ctrlKey: false }
    );
    fireEvent.click(await screen.findByText("Assignment Form"));

    dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Asset Assignment Form")
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Assignment #404")).toBeInTheDocument();
    expect(within(dialog).getByText("SN-655")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Employee Signature \/ Date/i)
    ).toBeInTheDocument();
  });

  it("filters assignment history by asset, employee, and status", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 405,
        asset_id: 701,
        asset_details: {
          id: 701,
          name: "MacBook Filter",
          asset_id: "AT-701",
          condition: "good",
        },
        employee_id: "u-15",
        employee_name: "Alice Filter",
        assigned_date: "2026-04-01",
        is_active: true,
      },
      {
        id: 406,
        asset_id: 702,
        asset_details: {
          id: 702,
          name: "ThinkPad Filter",
          asset_id: "AT-702",
          condition: "good",
        },
        employee_id: "u-16",
        employee_name: "Bob Filter",
        assigned_date: "2026-03-01",
        returned_date: "2026-03-10",
        is_active: false,
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );

    expect(await screen.findByText("MacBook Filter")).toBeInTheDocument();
    expect(screen.getByText("ThinkPad Filter")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Asset$/i), {
      target: { value: "thinkpad" },
    });
    expect(screen.queryByText("MacBook Filter")).toBeNull();
    expect(screen.getByText("ThinkPad Filter")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Employee$/i), {
      target: { value: "alice" },
    });
    expect(
      await screen.findByText("No matching assignments")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Asset$/i), {
      target: { value: "" },
    });
    expect(await screen.findByText("MacBook Filter")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/^Status$/i));
    fireEvent.click(await screen.findByRole("option", { name: /^Returned$/i }));

    expect(screen.queryByText("MacBook Filter")).toBeNull();
    expect(
      await screen.findByText("No matching assignments")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Employee$/i), {
      target: { value: "" },
    });
    expect(await screen.findByText("ThinkPad Filter")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Filter")).toBeNull();
  });

  it("shows a deleted-asset fallback label when assignment metadata has no asset details", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 402,
        asset_id: 321,
        employee_id: "u-12",
        employee_name: "Fallback User",
        assigned_date: "2026-04-01",
        is_active: true,
        condition: "good",
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText(/No assets found/i);

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );

    expect(await screen.findByText("Deleted Asset #321")).toBeInTheDocument();
    expect(screen.getByText("ID-321")).toBeInTheDocument();
  });

  it("continues rendering assets when assignment API fails", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 51,
        name: "Resilient Asset",
        asset_tag: "AT-51",
        category: "laptops",
        serial_number: "SN-51",
      },
    ]);
    mockListAssignments.mockRejectedValueOnce(new Error("Assignments down"));

    render(<AssetsModule />);

    expect(await screen.findByText("Resilient Asset")).toBeInTheDocument();
    expect(screen.queryByText("Assignments down")).toBeNull();
  });

  it("does not allow assign action for assets marked unavailable by backend assignment", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 62,
        name: "Already Assigned Laptop",
        asset_tag: "AT-62",
        category: "laptops",
        serial_number: "SN-62",
        status: "active",
        is_available: false,
        current_assignment: {
          employee: 101,
          employee_name: "Assigned Employee",
          assigned_at: "2026-04-01T10:00:00Z",
        },
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);

    render(<AssetsModule />);
    await screen.findByText("Already Assigned Laptop");

    expect(
      withinAssetCard("Already Assigned Laptop").queryByRole("button", {
        name: /Assign Asset/i,
      })
    ).toBeNull();
  });

  it("opens the assign dialog from the quick action when an assignable asset exists", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 61,
        name: "Assignable Laptop",
        asset_tag: "AT-61",
        category: "laptops",
        serial_number: "SN-61",
        status: "active",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);
    mockListAssignableUsers.mockResolvedValueOnce([
      { id: "101", name: "Alex Employee" },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Assignable Laptop");

    fireEvent.click(
      withinAssetCard("Assignable Laptop").getByRole("button", {
        name: /Assign Asset/i,
      })
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Choose an asset and assign it to an employee/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Asset$/i)).toBeInTheDocument();
    expect(mockListAssignableUsers).toHaveBeenCalledWith("test-token");
  });

  it("updates asset views immediately after assigning an asset", async () => {
    sessionRole = "HR";
    mockListAssets.mockResolvedValueOnce([
      {
        id: 63,
        name: "Freshly Assigned Laptop",
        asset_tag: "AT-63",
        category: "laptops",
        serial_number: "SN-63",
        status: "active",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([]);
    mockListAssignableUsers.mockResolvedValueOnce([
      { id: "101", name: "Alex Employee" },
    ]);
    mockAssignAssetToEmployee.mockResolvedValueOnce({
      id: 963,
      asset_id: 63,
      employee_id: "101",
      employee_name: "Alex Employee",
      assigned_date: "2026-05-13",
      is_active: true,
    });
    mockListAssets.mockResolvedValueOnce([
      {
        id: 63,
        name: "Freshly Assigned Laptop",
        asset_tag: "AT-63",
        category: "laptops",
        serial_number: "SN-63",
        status: "active",
      },
    ]);
    mockListAssignments.mockResolvedValueOnce([
      {
        id: 963,
        asset_id: 63,
        employee_id: "101",
        employee_name: "Alex Employee",
        assigned_date: "2026-05-13",
        is_active: true,
      },
    ]);

    render(<AssetsModule />);
    await screen.findByText("Freshly Assigned Laptop");

    fireEvent.click(
      withinAssetCard("Freshly Assigned Laptop").getByRole("button", {
        name: /Assign Asset/i,
      })
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText(/Employee/i));
    fireEvent.click(
      await screen.findByRole("option", { name: "Alex Employee" })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Assign Asset/i })
    );

    await waitFor(() => {
      expect(mockAssignAssetToEmployee).toHaveBeenCalledWith(
        {
          asset: 63,
          employee: 101,
          notes: undefined,
        },
        "test-token"
      );
    });

    const updatedCard = withinAssetCard("Freshly Assigned Laptop");
    expect(await updatedCard.findByText("Alex Employee")).toBeInTheDocument();
    expect(updatedCard.getByRole("button", { name: /Return/i })).toBeEnabled();

    fireEvent.mouseDown(
      screen.getByRole("tab", { name: /Assignment History/i })
    );
    expect(await screen.findByText("Alex Employee")).toBeInTheDocument();
    expect(screen.getByText("Freshly Assigned Laptop")).toBeInTheDocument();
  });
});
