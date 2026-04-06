/**
 * Common UI dialog patterns used across all HR modules.
 * Extracted to reduce repetitive dialog code in DocumentsModule, AssetsModule, etc.
 * Dialog content components should be small, focused, and reusable.
 */

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/hr-dashboard/ui/dialog";
import { Button } from "@/components/hr-dashboard/ui/button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export interface ActionDialogProps extends DialogProps {
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDangerous?: boolean;
}

/**
 * Base dialog wrapper - handles open/close state and common structure.
 */
export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmation dialog - used for destructive actions (delete, archive, etc).
 * Shows confirm/cancel with danger styling on confirm button.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  isDangerous = false,
}: ActionDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDangerous ? "destructive" : "default"}
          onClick={handleConfirm}
          disabled={isLoading}
          className={isLoading ? "opacity-70" : ""}
        >
          {isLoading ? "Processing..." : confirmLabel}
        </Button>
      </div>
    </BaseDialog>
  );
}

/**
 * Form dialog - wraps form content, handles submit/cancel.
 * Used in DocumentsModule, AssetsModule upload dialogs.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  children,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
}: ActionDialogProps) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="space-y-6">
        {children}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}

/**
 * Alert dialog - displays information or warnings.
 * Used for non-critical info, policy notifications, etc.
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onDismiss,
  dismissLabel = "Close",
}: DialogProps & {
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="space-y-6">
        {children}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              onDismiss?.();
              onOpenChange(false);
            }}
          >
            {dismissLabel}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}

/**
 * Dialog footer - standardized footer layout for buttons.
 * Used consistently across action dialogs.
 */
export function DialogFooter({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  isLoading = false,
  isDangerous = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  isDangerous?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button
        variant={isDangerous ? "destructive" : "default"}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
