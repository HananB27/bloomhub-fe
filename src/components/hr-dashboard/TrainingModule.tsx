"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
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
import {
  Plus,
  Loader2,
  AlertCircle,
  GraduationCap,
  CheckCircle,
  Clock,
  Award,
} from "lucide-react";

export function TrainingModule() {
  const { data: session } = useSession() as {
    data: { accessToken?: string; user?: { name?: string } } | null;
  };
  const accessToken = session?.accessToken;

  const [allEntries, setAllEntries] = useState<TrainingEntry[]>([]);
  const [filters, setFilters] = useState<TrainingEntryFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrainingEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrainingEntry | null>(null);

  // Fetch without the search term — employee-name search is done client-side
  // so we can match across title, provider, and employee name in one pass.
  const loadTrainingEntries = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const { search: _search, ...apiFilters } = filters;
      const data = await fetchTrainingEntries(accessToken, apiFilters);
      setAllEntries(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load training entries";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters]);

  // Client-side search across title, provider, and employee name
  const entries = useMemo(() => {
    if (!filters.search) return allEntries;
    const q = filters.search.toLowerCase();
    return allEntries.filter(
      (e) =>
        e.courseTitle.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q) ||
        e.employeeName?.toLowerCase().includes(q)
    );
  }, [allEntries, filters.search]);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    loadTrainingEntries();
  }, [accessToken, filters, loadTrainingEntries]);

  const stats = useMemo(() => {
    const completed = allEntries.filter((e) => e.status === "completed").length;
    const inProgress = allEntries.filter(
      (e) => e.status === "in-progress"
    ).length;
    const planned = allEntries.filter((e) => e.status === "planned").length;
    const certifications = allEntries.filter(
      (e) => e.trainingType === "certification" && e.status === "completed"
    ).length;
    return {
      total: allEntries.length,
      completed,
      inProgress,
      planned,
      certifications,
    };
  }, [allEntries]);

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
      setAllEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Training entry deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast.error(msg);
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
      toast.success("Training entry updated");
      loadTrainingEntries();
    } else {
      setAllEntries((prev) => [entry, ...prev]);
      toast.success("Training entry added");
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">
            Training &amp; Development
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track learning, certifications, conferences, and professional growth
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={handleAddTraining} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Training
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      {!isLoading && entries.length > 0 && (
        <div className="grid grid-cols-4 divide-x divide-gray-200 rounded-lg border border-gray-200 bg-white">
          <StatCell
            icon={<GraduationCap className="h-3 w-3" />}
            label="Total Trainings"
            value={stats.total}
            trend={`${stats.completed} done · ${stats.inProgress} in progress`}
          />
          <StatCell
            icon={<CheckCircle className="h-3 w-3" />}
            label="Completed"
            value={stats.completed}
            trend={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate`}
          />
          <StatCell
            icon={<Clock className="h-3 w-3" />}
            label="In Progress"
            value={stats.inProgress}
            trend={`${stats.planned} planned upcoming`}
            urgentTrend={stats.planned > 0}
          />
          <StatCell
            icon={<Award className="h-3 w-3" />}
            label="Certifications"
            value={stats.certifications}
            trend="earned"
          />
        </div>
      )}

      {/* Toolbar: filters + count */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-3">
          <TrainingFilters
            filters={filters}
            onFiltersChange={setFilters}
            isLoading={isLoading}
          />
          {!isLoading && (
            <span className="shrink-0 font-mono text-[11px] text-gray-400">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <TrainingEntryList
        entries={entries}
        isLoading={isLoading}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        isDeleting={isDeleting}
        canEdit={true}
        canDelete={true}
      />

      {/* Add / Edit dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Training Entry" : "Add Training Entry"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the details of this training entry."
                : "Log a course, conference, certification, or seminar."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {!accessToken ? (
              <div className="flex items-center justify-center gap-2 py-8 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Authentication error. Please refresh.
                </span>
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

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              {deleteTarget?.courseTitle}
            </p>
            <p className="text-xs text-gray-500">{deleteTarget?.provider}</p>
          </div>
          <div className="flex justify-end gap-2">
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

function StatCell({
  icon,
  label,
  value,
  trend,
  urgentTrend = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend: string;
  urgentTrend?: boolean;
}) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[22px] font-semibold tracking-tight text-gray-900">
        {value}
      </div>
      <div
        className={`mt-0.5 text-[11px] ${urgentTrend ? "font-medium text-amber-600" : "text-gray-400"}`}
      >
        {trend}
      </div>
    </div>
  );
}
