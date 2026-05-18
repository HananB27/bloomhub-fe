"use client";

import { Archive, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { cn } from "../../ui/utils";
import type { Project } from "../types";

interface ConfirmActionDialogProps {
  action: "archive" | "delete";
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmActionDialog({
  action,
  project,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps) {
  const isDelete = action === "delete";
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-gray-200 bg-white text-gray-900">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full",
            isDelete ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
          )}
        >
          {isDelete ? (
            <Trash2 className="h-[18px] w-[18px]" />
          ) : (
            <Archive className="h-[18px] w-[18px]" />
          )}
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">
            {isDelete ? "Delete" : "Archive"} {project.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700">
            {isDelete ? (
              <>
                This will permanently delete <strong>{project.name}</strong> and
                all its linked data. This action cannot be undone.
              </>
            ) : (
              <>
                You can restore <strong>{project.name}</strong> later from the
                Archived filter. Time logs and documents will be preserved.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              isDelete ? "bg-red-600 text-white hover:bg-red-700" : undefined
            }
          >
            {isDelete ? (
              <>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete project
              </>
            ) : (
              <>
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive project
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
