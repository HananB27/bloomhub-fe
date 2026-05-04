export type AssetRole = "employee" | "manager" | "hr" | "hr_manager" | "admin";

export type AssetPermissionAction =
  | "view_own_assets"
  | "view_team_assets"
  | "view_all_assets"
  | "assign_assets"
  | "assign_assets_to_employees"
  | "update_asset_condition"
  | "track_warranty"
  | "initiate_asset_return"
  | "process_asset_return"
  | "log_asset_lost"
  | "generate_qr_codes"
  | "view_asset_history"
  | "configure_asset_types"
  | "export_inventory";

const ROLE_PERMISSIONS: Record<
  AssetRole,
  ReadonlySet<AssetPermissionAction>
> = {
  employee: new Set<AssetPermissionAction>([
    "view_own_assets",
    "update_asset_condition",
    "initiate_asset_return",
    "log_asset_lost",
    "view_asset_history",
  ]),
  manager: new Set<AssetPermissionAction>([
    "view_own_assets",
    "view_team_assets",
    "update_asset_condition",
    "initiate_asset_return",
    "log_asset_lost",
    "view_asset_history",
  ]),
  hr: new Set<AssetPermissionAction>([
    "view_own_assets",
    "view_team_assets",
    "view_all_assets",
    "assign_assets",
    "update_asset_condition",
    "track_warranty",
    "initiate_asset_return",
    "process_asset_return",
    "log_asset_lost",
    "generate_qr_codes",
    "view_asset_history",
    "configure_asset_types",
    "export_inventory",
  ]),
  hr_manager: new Set<AssetPermissionAction>([
    "view_own_assets",
    "view_team_assets",
    "view_all_assets",
    "assign_assets",
    "update_asset_condition",
    "track_warranty",
    "initiate_asset_return",
    "process_asset_return",
    "log_asset_lost",
    "generate_qr_codes",
    "view_asset_history",
    "configure_asset_types",
    "export_inventory",
  ]),
  admin: new Set<AssetPermissionAction>([
    "view_own_assets",
    "view_team_assets",
    "view_all_assets",
    "assign_assets",
    "update_asset_condition",
    "track_warranty",
    "initiate_asset_return",
    "process_asset_return",
    "log_asset_lost",
    "generate_qr_codes",
    "view_asset_history",
    "configure_asset_types",
    "export_inventory",
  ]),
};

function toNormalizedRoleValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeAssetPermissionAction(
  action: AssetPermissionAction
): Exclude<AssetPermissionAction, "assign_assets_to_employees"> {
  if (action === "assign_assets_to_employees") {
    return "assign_assets";
  }

  return action;
}

export function resolveAssetRole(value?: string | null): AssetRole {
  if (!value) {
    return "employee";
  }

  const normalized = toNormalizedRoleValue(value);

  if (
    normalized === "admin" ||
    normalized === "administrator" ||
    normalized === "super_admin" ||
    normalized === "superadmin" ||
    normalized === "super_user" ||
    normalized === "superuser"
  ) {
    return "admin";
  }

  if (normalized === "hr" || normalized === "human_resources") {
    return "hr";
  }

  if (normalized === "hr_manager" || normalized === "human_resources_manager") {
    return "hr_manager";
  }

  if (normalized === "manager" || normalized === "team_manager") {
    return "manager";
  }

  return "employee";
}

export function canAssetAction(
  role: AssetRole,
  action: AssetPermissionAction
): boolean {
  return ROLE_PERMISSIONS[role].has(normalizeAssetPermissionAction(action));
}

export function isHrLikeRole(value?: string | null): boolean {
  const role = resolveAssetRole(value);
  return role === "hr" || role === "hr_manager" || role === "admin";
}
