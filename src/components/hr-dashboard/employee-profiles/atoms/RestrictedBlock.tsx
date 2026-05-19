import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface RestrictedBlockProps {
  title?: string;
  description?: ReactNode;
}

/**
 * D-10 large restricted state — used for whole sections the active role
 * (Manager / Employee) cannot view. Visible cue, not silent hide.
 */
export function RestrictedBlock({
  title = "Restricted section",
  description = "You do not have permission to view this content. Contact HR if you need access.",
}: RestrictedBlockProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-zinc-500"
      role="status"
    >
      <Lock size={18} aria-hidden className="mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-semibold text-zinc-700">{title}</div>
        <div className="mt-0.5 text-xs text-zinc-500">{description}</div>
      </div>
    </div>
  );
}
