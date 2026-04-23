import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface ProfileDialogSaveControlsProps {
  editMode: boolean;
  saveError: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileDialogSaveControls({
  editMode,
  saveError,
  isSaving,
  onCancel,
  onSave,
}: ProfileDialogSaveControlsProps) {
  if (!editMode) return null;

  return (
    <>
      {saveError ? (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        </div>
      ) : null}
      <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 mt-6 bg-white sticky bottom-0 -mx-8 px-8 pb-8 z-40">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          className="text-gray-600 hover:text-zinc-900 font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="gap-2 bg-zinc-800 hover:bg-zinc-900 text-white border-none shadow-lg shadow-zinc-900/10 px-10 h-12 rounded-xl transition-all active:scale-95"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </>
  );
}
