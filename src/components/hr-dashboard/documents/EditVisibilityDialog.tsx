"use client";

import { useEffect, useState } from "react";
import {
  documentsApi,
  type EmployeeDocument,
} from "@/lib/api/modules/documents";
import {
  DocumentVisibilitySettings,
  presetFromVisibility,
} from "@/lib/documents/documentVisibilityPresets";
import {
  DOCUMENT_VISIBILITY_DIALOG_DESCRIPTION_FALLBACK,
  DOCUMENT_VISIBILITY_DIALOG_DESCRIPTION_PREFIX,
  DOCUMENT_VISIBILITY_DIALOG_TITLE,
} from "@/lib/documents/documentVisibilityHelpers";
import {
  notifyApiError,
  notifySuccess,
  NotificationMessages,
} from "@/utils/notificationHelpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DocumentVisibilitySelector } from "./DocumentVisibilitySelector";

interface EditVisibilityDialogProps {
  open: boolean;
  doc: EmployeeDocument | null;
  onClose: () => void;
  onSaved: (updated: EmployeeDocument) => void;
}

const DIALOG_CONTENT_CLASSES =
  "!max-w-[460px] !min-h-0 !p-0 !gap-0 overflow-hidden";
const DIALOG_HEADER_CLASSES = "px-5 pt-5 pb-3 border-b border-gray-100 gap-1";
const DIALOG_BODY_CLASSES = "px-5 py-4 max-h-[60vh] overflow-y-auto";
const DIALOG_FOOTER_CLASSES = "px-5 py-3 border-t border-gray-100 gap-2";
const DIALOG_TITLE_CLASSES = "text-[15px] font-semibold text-gray-900";
const DIALOG_DESCRIPTION_CLASSES = "text-[12.5px] text-gray-500";
const DIALOG_BUTTON_CANCEL_CLASSES =
  "text-[13px] font-medium text-gray-700 border border-gray-200 rounded-md px-3.5 py-1.5 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50";
const DIALOG_BUTTON_PRIMARY_CLASSES =
  "text-[13px] font-medium text-white bg-gray-800 rounded-md px-3.5 py-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

function describeDialog(doc: EmployeeDocument | null): string {
  const target = doc
    ? `“${doc.name}”`
    : DOCUMENT_VISIBILITY_DIALOG_DESCRIPTION_FALLBACK;
  return `${DOCUMENT_VISIBILITY_DIALOG_DESCRIPTION_PREFIX} ${target}.`;
}

function settingsFromDocument(
  doc: EmployeeDocument | null
): DocumentVisibilitySettings | null {
  if (!doc) return null;
  return {
    scope: doc.visibilityScope,
    allowedRoles: doc.allowedRoles,
    preset: presetFromVisibility(doc.visibilityScope, doc.allowedRoles),
  };
}

export function EditVisibilityDialog({
  open,
  doc,
  onClose,
  onSaved,
}: EditVisibilityDialogProps) {
  const [settings, setSettings] = useState<DocumentVisibilitySettings | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(settingsFromDocument(doc));
    }
  }, [open, doc]);

  const handleSave = async () => {
    if (!doc || !settings) return;
    setIsSaving(true);
    try {
      const updated = await documentsApi.updateVisibility(doc.id, {
        scope: settings.scope,
        allowedRoles: settings.allowedRoles,
      });
      notifySuccess(NotificationMessages.UPDATED_SUCCESS);
      onSaved(updated);
      onClose();
    } catch (e) {
      notifyApiError(e as Error);
    } finally {
      setIsSaving(false);
    }
  };

  const cannotSave =
    isSaving ||
    !settings ||
    (settings.scope === "roles" && settings.allowedRoles.length === 0);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={DIALOG_CONTENT_CLASSES}>
        <DialogHeader className={DIALOG_HEADER_CLASSES}>
          <DialogTitle className={DIALOG_TITLE_CLASSES}>
            {DOCUMENT_VISIBILITY_DIALOG_TITLE}
          </DialogTitle>
          <DialogDescription className={DIALOG_DESCRIPTION_CLASSES}>
            {describeDialog(doc)}
          </DialogDescription>
        </DialogHeader>
        <div className={DIALOG_BODY_CLASSES}>
          {settings && (
            <DocumentVisibilitySelector
              value={settings}
              onChange={setSettings}
              disabled={isSaving}
            />
          )}
        </div>
        <DialogFooter className={DIALOG_FOOTER_CLASSES}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={DIALOG_BUTTON_CANCEL_CLASSES}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={cannotSave}
            onClick={handleSave}
            className={DIALOG_BUTTON_PRIMARY_CLASSES}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
