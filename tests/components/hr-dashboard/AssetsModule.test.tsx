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
const mockRequestAssetReturn = vi.fn();
const mockApproveAssetReturn = vi.fn();
const mockRejectAssetReturn = vi.fn();
const mockListPendingReturnRequests = vi.fn();
const mockCreateAsset = vi.fn();
const mockExportAssetsCsv = vi.fn();
const mockGetAssetCapabilities = vi.fn();

let sessionRole = "Employee";

function getMockAssetCapabilities(role: string) {
  const isAssetAdmin = ["HR", "SUPER_ADMIN", "Admin"].includes(role);

  return {
    permissions: isAssetAdmin
      ? [
          "view_own_assets",
          "view_team_assets",
          "view_all_assets",
          "assign_assets",
          "update_asset_condition",
          "initiate_asset_return",
          "process_asset_return",
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
  listAssets: (...args: unknown[]) => mockListAssets(...args),
  listAssignments: (...args: unknown[]) => mockListAssignments(...args),
  listAssignableUsers: (...args: unknown[]) => mockListAssignableUsers(...args),
  requestAssetReturn: (...args: unknown[]) => mockRequestAssetReturn(...args),
  approveAssetReturn: (...args: unknown[]) => mockApproveAssetReturn(...args),
  rejectAssetReturn: (...args: unknown[]) => mockRejectAssetReturn(...args),
  listPendingReturnRequests: (...args: unknown[]) =>
    mockListPendingReturnRequests(...args),
  createAsset: (...args: unknown[]) => mockCreateAsset(...args),
  exportAssetsCsv: (...args: unknown[]) => mockExportAssetsCsv(...args),
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
  const categoryTrigger = within(dialog).getByRole("combobox");
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
    mockRequestAssetReturn.mockResolvedValue({ id: 1, is_active: true });
    mockApproveAssetReturn.mockResolvedValue({ id: 1, is_active: false });
    mockRejectAssetReturn.mockResolvedValue({ id: 1, is_active: true });
    mockListPendingReturnRequests.mockResolvedValue([]);
    mockCreateAsset.mockResolvedValue({});
    mockExportAssetsCsv.mockResolvedValue({
      blob: new Blob(["asset_id,name\nAST-1,Device\n"], { type: "text/csv" }),
      filename: "asset_export.csv",
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
      withinAssetCard("Already Assigned Laptop").getByRole("button", {
        name: /Assign Asset/i,
      })
    ).toBeDisabled();
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
});
