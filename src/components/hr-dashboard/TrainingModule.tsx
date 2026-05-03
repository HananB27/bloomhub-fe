"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import {
  TrainingEntryForm,
  TrainingFilters,
  TrainingEntryList,
} from "./training";
import type { TrainingEntry, TrainingEntryFilters } from "@/types/training";
import { fetchTrainingEntries, deleteTrainingEntry } from "@/lib/api/training";
import { Plus, Loader2, AlertCircle } from "lucide-react";

export function TrainingModule() {
  const { data: session } = useSession() as {
    data: { accessToken?: string; user?: { name?: string } } | null;
  };
  const accessToken = session?.accessToken;

  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [filters, setFilters] = useState<TrainingEntryFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrainingEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrainingEntry | null>(null);

  const loadTrainingEntries = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchTrainingEntries(accessToken, filters);
      setEntries(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load training entries";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    loadTrainingEntries();
  }, [accessToken, filters, loadTrainingEntries]);

  const handleDeleteEntry = (entry: TrainingEntry) => {
    setDeleteTarget(entry);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !accessToken) return;

    setIsDeleting((prev) => ({ ...prev, [deleteTarget.id]: true }));
    setDeleteConfirmOpen(false);

    try {
      await deleteTrainingEntry(deleteTarget.id, accessToken);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Training entry deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete training entry";
      toast.error(errorMessage);
    } finally {
      setIsDeleting((prev) => ({ ...prev, [deleteTarget.id]: false }));
      setDeleteTarget(null);
    }
  };

  const handleEditEntry = (entry: TrainingEntry) => {
    setEditingEntry(entry);
    setShowFormDialog(true);
  };

  const handleFormSuccess = (entry: TrainingEntry) => {
    if (editingEntry) {
      // For updates, reload the entries to ensure fresh data
      toast.success("Training entry updated successfully");
      loadTrainingEntries();
    } else {
      // For creates, add to the top of the list
      setEntries((prev) => [entry, ...prev]);
      toast.success("Training entry created successfully");
    }
    setShowFormDialog(false);
    setEditingEntry(null);
  };

  const handleFormCancel = () => {
    setShowFormDialog(false);
    setEditingEntry(null);
  };

  const handleAddTraining = () => {
    setEditingEntry(null);
    setShowFormDialog(true);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Training & Development
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track professional development
          </p>
        </div>
        <Button onClick={handleAddTraining} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Training
        </Button>
      </div>

      {/* Filters Section */}
      <TrainingFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {entries.length === 0
              ? "No Entries Yet"
              : `Training Entries (${entries.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingEntryList
            entries={entries}
            isLoading={isLoading}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            isDeleting={isDeleting}
            canEdit={true}
            canDelete={true}
          />
        </CardContent>
      </Card>

      {/* Form Dialog Modal */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Training Entry" : "Add New Training Entry"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the details of your training entry"
                : "Record a new training course or event"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            {!accessToken ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Authentication error. Please refresh and try again.</span>
              </div>
            ) : (
              <TrainingEntryForm
                accessToken={accessToken}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                editingEntry={editingEntry || undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training entry? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-900">
              {deleteTarget?.courseTitle}
            </p>
            <p className="text-sm text-gray-600">{deleteTarget?.provider}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
