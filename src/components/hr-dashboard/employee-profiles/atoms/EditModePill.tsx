import { Pencil } from "lucide-react";

/** D-05 amber pill displayed in the header while edit mode is active. */
export function EditModePill() {
  return (
    <span
      aria-live="polite"
      className="mr-1 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
    >
      <Pencil size={12} aria-hidden />
      Editing
    </span>
  );
}

/** D-05 amber tint applied to page-header while editing. */
export const EDIT_MODE_HEADER_CLASS =
  "bg-gradient-to-b from-[#fffbeb] to-transparent border-b border-amber-200";
