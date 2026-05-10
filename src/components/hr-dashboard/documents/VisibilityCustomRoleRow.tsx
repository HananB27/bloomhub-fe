"use client";

import {
  DocumentAccessRole,
  DOCUMENT_ACCESS_ROLE_DESCRIPTIONS,
  DOCUMENT_ACCESS_ROLE_LABELS,
} from "@/lib/documents/documentsHelpers";
import type { VisibilityDensity } from "./VisibilityPresetOption";

interface VisibilityCustomRoleRowProps {
  role: DocumentAccessRole;
  checked: boolean;
  disabled?: boolean;
  onToggle: (role: DocumentAccessRole) => void;
  density?: VisibilityDensity;
}

const VISIBILITY_CUSTOM_ROLE_INPUT_ID_PREFIX = "doc-visibility-role-";

export function visibilityCustomRoleInputId(role: DocumentAccessRole): string {
  return `${VISIBILITY_CUSTOM_ROLE_INPUT_ID_PREFIX}${role}`;
}

export function VisibilityCustomRoleRow({
  role,
  checked,
  disabled,
  onToggle,
  density = "default",
}: VisibilityCustomRoleRowProps) {
  const id = visibilityCustomRoleInputId(role);
  if (density === "compact") {
    return (
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-2 rounded-md border bg-white px-3 py-2 text-[12.5px] transition-colors ${
          checked
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 rounded border-gray-300 accent-gray-800"
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(role)}
        />
        <span className="min-w-0">
          <span className="block font-medium leading-tight text-gray-900">
            {DOCUMENT_ACCESS_ROLE_LABELS[role]}
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
            {DOCUMENT_ACCESS_ROLE_DESCRIPTIONS[role]}
          </span>
        </span>
      </label>
    );
  }

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer text-[12.5px] text-gray-800 py-0.5"
    >
      <input
        id={id}
        type="checkbox"
        className="rounded border-gray-300 accent-gray-800"
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(role)}
      />
      <span className="font-medium">{DOCUMENT_ACCESS_ROLE_LABELS[role]}</span>
      <span className="text-[11px] text-gray-500">
        · {DOCUMENT_ACCESS_ROLE_DESCRIPTIONS[role]}
      </span>
    </label>
  );
}
