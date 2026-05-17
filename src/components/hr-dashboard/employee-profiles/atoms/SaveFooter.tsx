import { Button } from "../../ui/button";
import { Loader2 } from "lucide-react";

interface SaveFooterProps {
  visible: boolean;
  saving?: boolean;
  message?: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
}

/**
 * D-12 sticky save footer. Pulses warning dot while dirty. Renders inside the
 * page flow with `sticky bottom-0`, so it stays within the module's bounds
 * (no leaking into the app sidebar / chrome) and follows the scroll.
 */
export function SaveFooter({
  visible,
  saving = false,
  message = "You have unsaved changes",
  onCancel,
  onSave,
  saveLabel = "Save changes",
  cancelLabel = "Discard",
}: SaveFooterProps) {
  if (!visible) return null;
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      style={{ left: "var(--ws-sidebar-w, 0px)" }}
      className="fixed right-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-zinc-300 bg-white/95 px-8 py-3.5 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-sm text-zinc-700">
        <span
          aria-hidden
          className="ep-pulse h-2 w-2 rounded-full bg-amber-600"
        />
        {message}
      </div>
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          {cancelLabel}
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
