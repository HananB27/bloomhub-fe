"use client";

import type { ComponentType } from "react";
import {
  FolderKanban,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import {
  DOCUMENT_VISIBILITY_PRESETS,
  DocumentVisibilityPreset,
} from "@/lib/documents/documentVisibilityPresets";
import { RadioGroupItem } from "../ui/radio-group";

export type VisibilityDensity = "default" | "compact";

interface VisibilityPresetOptionProps {
  preset: DocumentVisibilityPreset;
  checked: boolean;
  disabled?: boolean;
  density?: VisibilityDensity;
  /** Span the full grid width (compact density only). */
  fullWidth?: boolean;
}

const VISIBILITY_PRESET_INPUT_ID_PREFIX = "doc-visibility-preset-";

export function visibilityPresetInputId(
  preset: DocumentVisibilityPreset
): string {
  return `${VISIBILITY_PRESET_INPUT_ID_PREFIX}${preset}`;
}

const ROW_BASE_CLASSES =
  "flex items-center gap-3 border rounded-md cursor-pointer transition-colors";
const ROW_CHECKED_CLASSES = "border-gray-800 bg-gray-50";
const ROW_UNCHECKED_CLASSES = "border-gray-200 hover:border-gray-300";
const ROW_DISABLED_CLASSES = "opacity-60 cursor-not-allowed";

const ROW_PADDING_BY_DENSITY: Record<VisibilityDensity, string> = {
  default: "px-3 py-2",
  compact: "px-2.5 py-1.5",
};

const LABEL_CLASSES_BY_DENSITY: Record<VisibilityDensity, string> = {
  default: "text-[13px] font-medium text-gray-900 leading-tight",
  compact: "text-[12.5px] font-medium text-gray-900 leading-tight",
};

const DESCRIPTION_CLASSES_BY_DENSITY: Record<VisibilityDensity, string> = {
  default: "text-[11.5px] text-gray-500 leading-tight mt-0.5",
  compact: "text-[11.5px] text-gray-500 leading-snug",
};

const VISIBILITY_PRESET_ICONS = {
  only_me: User,
  project_group: FolderKanban,
  everyone: Users,
  managers_and_above: UserCheck,
  hr_and_above: ShieldCheck,
  admin_only: LockKeyhole,
  custom: Settings2,
} satisfies Record<
  DocumentVisibilityPreset,
  ComponentType<{ className?: string }>
>;

export function VisibilityPresetOption({
  preset,
  checked,
  disabled,
  density = "default",
  fullWidth = false,
}: VisibilityPresetOptionProps) {
  const definition = DOCUMENT_VISIBILITY_PRESETS[preset];
  const id = visibilityPresetInputId(preset);
  const stateClasses = checked ? ROW_CHECKED_CLASSES : ROW_UNCHECKED_CLASSES;
  const disabledClasses = disabled ? ROW_DISABLED_CLASSES : "";
  const paddingClasses = ROW_PADDING_BY_DENSITY[density];
  const Icon = VISIBILITY_PRESET_ICONS[preset];
  const fullWidthClass = fullWidth ? "col-span-full" : "";

  if (density === "compact") {
    return (
      <label
        htmlFor={id}
        className={`group relative flex min-h-[74px] cursor-pointer gap-3 rounded-md border bg-white p-3 transition-colors ${fullWidthClass} ${
          checked
            ? "border-gray-900 bg-gray-50 shadow-[inset_0_0_0_1px_#111827]"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
        } ${disabledClasses}`}
      >
        <RadioGroupItem id={id} value={preset} className="sr-only" />
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
            checked
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-500 group-hover:text-gray-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className={LABEL_CLASSES_BY_DENSITY.compact}>
              {definition.label}
            </span>
            <span
              aria-hidden="true"
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                checked ? "bg-gray-900" : "bg-gray-200"
              }`}
            />
          </div>
          <div className={`${DESCRIPTION_CLASSES_BY_DENSITY.compact} mt-1`}>
            {definition.description}
          </div>
        </div>
      </label>
    );
  }

  return (
    <label
      htmlFor={id}
      className={`${ROW_BASE_CLASSES} ${paddingClasses} ${stateClasses} ${disabledClasses}`}
    >
      <RadioGroupItem id={id} value={preset} />
      <div className="flex-1 min-w-0">
        <div className={LABEL_CLASSES_BY_DENSITY.default}>
          {definition.label}
        </div>
        <div className={DESCRIPTION_CLASSES_BY_DENSITY.default}>
          {definition.description}
        </div>
      </div>
    </label>
  );
}
