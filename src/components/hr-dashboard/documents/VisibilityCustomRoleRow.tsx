"use client";

import {
  DocumentAccessRole,
  DOCUMENT_ACCESS_ROLE_DESCRIPTIONS,
  DOCUMENT_ACCESS_ROLE_LABELS,
} from "@/lib/documents/documentsHelpers";

interface VisibilityCustomRoleRowProps {
  role: DocumentAccessRole;
  checked: boolean;
  disabled?: boolean;
  onToggle: (role: DocumentAccessRole) => void;
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
}: VisibilityCustomRoleRowProps) {
  const id = visibilityCustomRoleInputId(role);
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
