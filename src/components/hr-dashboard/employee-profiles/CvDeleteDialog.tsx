import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { EmployeeCVVersion } from "@/lib/api/modules/employee-cvs";

interface CvDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingDelete: EmployeeCVVersion | null;
  isDeleting: boolean;
  onConfirmDelete: () => void;
}

export function CvDeleteDialog({
  open,
  onOpenChange,
  pendingDelete,
  isDeleting,
  onConfirmDelete,
}: CvDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-zinc-200 bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-zinc-900">
            Delete CV version?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-zinc-600">
            {`This will permanently delete "${pendingDelete?.file_name || "this CV version"}". This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isDeleting} type="button">
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
