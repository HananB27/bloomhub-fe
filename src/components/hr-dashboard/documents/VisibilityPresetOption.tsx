"use client";

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
  compact: "text-[11px] text-gray-500 leading-tight",
};

export function VisibilityPresetOption({
  preset,
  checked,
  disabled,
  density = "default",
}: VisibilityPresetOptionProps) {
  const definition = DOCUMENT_VISIBILITY_PRESETS[preset];
  const id = visibilityPresetInputId(preset);
  const stateClasses = checked ? ROW_CHECKED_CLASSES : ROW_UNCHECKED_CLASSES;
  const disabledClasses = disabled ? ROW_DISABLED_CLASSES : "";
  const paddingClasses = ROW_PADDING_BY_DENSITY[density];

  if (density === "compact") {
    return (
      <label
        htmlFor={id}
        className={`${ROW_BASE_CLASSES} ${paddingClasses} ${stateClasses} ${disabledClasses}`}
      >
        <RadioGroupItem id={id} value={preset} />
        <div className="flex flex-1 min-w-0 items-baseline gap-2">
          <span className={LABEL_CLASSES_BY_DENSITY.compact}>
            {definition.label}
          </span>
          <span
            className={`${DESCRIPTION_CLASSES_BY_DENSITY.compact} truncate`}
          >
            {definition.description}
          </span>
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
