import { describe, expect, it } from "vitest";
import {
  canAssetAction,
  isHrLikeRole,
  resolveAssetRole,
  type AssetRole,
  type AssetPermissionAction,
} from "@/lib/permissions/assets-permissions";

describe("assets-permissions", () => {
  it("resolves common role labels", () => {
    expect(resolveAssetRole("HR Manager")).toBe("hr_manager");
    expect(resolveAssetRole("manager")).toBe("manager");
    expect(resolveAssetRole("ADMIN")).toBe("admin");
    expect(resolveAssetRole("SUPER_ADMIN")).toBe("admin");
    expect(resolveAssetRole("unknown")).toBe("employee");
  });

  it("identifies hr-like roles", () => {
    expect(isHrLikeRole("hr")).toBe(true);
    expect(isHrLikeRole("HR Manager")).toBe(true);
    expect(isHrLikeRole("admin")).toBe(true);
    expect(isHrLikeRole("SUPER_ADMIN")).toBe(true);
    expect(isHrLikeRole("manager")).toBe(false);
    expect(isHrLikeRole("employee")).toBe(false);
    expect(isHrLikeRole(undefined)).toBe(false);
  });

  it("grants employee own-only capabilities", () => {
    expect(canAssetAction("employee", "view_own_assets")).toBe(true);
    expect(canAssetAction("employee", "view_all_assets")).toBe(false);
    expect(canAssetAction("employee", "assign_assets")).toBe(false);
  });

  it("grants hr broad capabilities", () => {
    const expected: AssetPermissionAction[] = [
      "view_all_assets",
      "assign_assets",
      "process_asset_return",
      "configure_asset_types",
      "export_inventory",
    ];

    expected.forEach((action) => {
      expect(canAssetAction("hr", action)).toBe(true);
    });
  });

  it("treats the backend assignment permission alias as equivalent", () => {
    expect(canAssetAction("hr", "assign_assets_to_employees")).toBe(true);
    expect(canAssetAction("manager", "assign_assets_to_employees")).toBe(false);
  });

  it("enforces the role-action matrix", () => {
    const allActions: AssetPermissionAction[] = [
      "view_own_assets",
      "view_team_assets",
      "view_all_assets",
      "assign_assets",
      "assign_assets_to_employees",
      "update_asset_condition",
      "track_warranty",
      "initiate_asset_return",
      "process_asset_return",
      "log_asset_lost",
      "generate_qr_codes",
      "view_asset_history",
      "configure_asset_types",
      "export_inventory",
    ];

    const expectedByRole: Record<AssetRole, AssetPermissionAction[]> = {
      employee: [
        "view_own_assets",
        "update_asset_condition",
        "initiate_asset_return",
        "log_asset_lost",
        "view_asset_history",
      ],
      manager: [
        "view_own_assets",
        "view_team_assets",
        "update_asset_condition",
        "initiate_asset_return",
        "log_asset_lost",
        "view_asset_history",
      ],
      hr: allActions,
      hr_manager: allActions,
      admin: allActions,
    };

    (Object.keys(expectedByRole) as AssetRole[]).forEach((role) => {
      const allowed = new Set(expectedByRole[role]);

      allActions.forEach((action) => {
        expect(canAssetAction(role, action)).toBe(allowed.has(action));
      });
    });
  });
});
