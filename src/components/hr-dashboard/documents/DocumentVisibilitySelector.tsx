"use client";

import { useEffect, useState } from "react";
import { DocumentAccessRole } from "@/lib/documents/documentsHelpers";
import {
  DocumentVisibilityPreset,
  DocumentVisibilitySettings,
  ORDERED_DOCUMENT_VISIBILITY_PRESETS,
  presetFromVisibility,
  visibilityFromPreset,
} from "@/lib/documents/documentVisibilityPresets";
import { CUSTOM_PRESET_HELPER_TEXT } from "@/lib/documents/documentVisibilityHelpers";
import { RadioGroup } from "../ui/radio-group";
import {
  VisibilityPresetOption,
  type VisibilityDensity,
} from "./VisibilityPresetOption";
import { VisibilityCustomRoleRow } from "./VisibilityCustomRoleRow";

const CUSTOM_ROLE_OPTIONS: DocumentAccessRole[] = [
  DocumentAccessRole.Employee,
  DocumentAccessRole.Manager,
  DocumentAccessRole.Staff,
];

interface DocumentVisibilitySelectorProps {
  value: DocumentVisibilitySettings;
  onChange: (settings: DocumentVisibilitySettings) => void;
  disabled?: boolean;
  /** Visual density of the rows. `compact` is for tighter contexts like the template builder. */
  density?: VisibilityDensity;
}

function nextRolesOnToggle(
  currentRoles: DocumentAccessRole[],
  role: DocumentAccessRole
): DocumentAccessRole[] {
  const has = currentRoles.includes(role);
  const next = has
    ? currentRoles.filter((existing) => existing !== role)
    : [...currentRoles, role];
  return next.length > 0 ? next : [DocumentAccessRole.Employee];
}

export function DocumentVisibilitySelector({
  value,
  onChange,
  disabled,
  density = "default",
}: DocumentVisibilitySelectorProps) {
  // Track custom mode locally so picking "Custom" sticks even when the role
  // selection happens to coincide with another named preset's roles.
  const derivedPreset = presetFromVisibility(value.scope, value.allowedRoles);
  const [customMode, setCustomMode] = useState(derivedPreset === "custom");

  useEffect(() => {
    if (derivedPreset === "custom" && !customMode) {
      setCustomMode(true);
    }
    // If the value flips to a non-roles scope, leave custom mode.
    if (value.scope !== "roles" && customMode) {
      setCustomMode(false);
    }
  }, [derivedPreset, customMode, value.scope]);

  const currentPreset: DocumentVisibilityPreset =
    customMode && value.scope === "roles" ? "custom" : derivedPreset;

  const handlePresetChange = (next: string) => {
    const preset = next as DocumentVisibilityPreset;
    if (preset === "custom") {
      setCustomMode(true);
      onChange({
        preset: "custom",
        scope: "roles",
        allowedRoles:
          value.allowedRoles.length > 0
            ? value.allowedRoles
            : [DocumentAccessRole.Employee],
      });
      return;
    }
    setCustomMode(false);
    onChange(visibilityFromPreset(preset));
  };

  const handleToggleCustomRole = (role: DocumentAccessRole) => {
    onChange({
      preset: "custom",
      scope: "roles",
      allowedRoles: nextRolesOnToggle(value.allowedRoles, role),
    });
  };
  const isCompact = density === "compact";

  return (
    <div className={isCompact ? "space-y-3" : "space-y-2"}>
      <RadioGroup
        value={currentPreset}
        onValueChange={handlePresetChange}
        disabled={disabled}
        className={
          isCompact
            ? "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3"
            : "gap-1.5"
        }
      >
        {ORDERED_DOCUMENT_VISIBILITY_PRESETS.map((preset) => (
          <VisibilityPresetOption
            key={preset}
            preset={preset}
            checked={currentPreset === preset}
            disabled={disabled}
            density={density}
            // "Custom" sits on its own row in the grid; span the full width so
            // it doesn't look stranded under the other tiles.
            fullWidth={isCompact && preset === "custom"}
          />
        ))}
      </RadioGroup>

      {currentPreset === "custom" && (
        <div
          className={
            isCompact
              ? "rounded-md border border-gray-200 bg-gray-50/70 p-3"
              : "px-3 py-2.5 border border-gray-200 rounded-md bg-gray-50/50 space-y-1.5"
          }
        >
          <div
            className={
              isCompact
                ? "mb-2 text-[11.5px] font-medium text-gray-600"
                : "text-[11px] text-gray-500 mb-1"
            }
          >
            {CUSTOM_PRESET_HELPER_TEXT}
          </div>
          <div className={isCompact ? "grid gap-2 sm:grid-cols-3" : ""}>
            {CUSTOM_ROLE_OPTIONS.map((role) => (
              <VisibilityCustomRoleRow
                key={role}
                role={role}
                checked={value.allowedRoles.includes(role)}
                disabled={disabled}
                onToggle={handleToggleCustomRole}
                density={density}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
