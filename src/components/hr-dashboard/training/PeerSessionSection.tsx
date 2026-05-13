"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/hr-dashboard/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/hr-dashboard/ui/alert-dialog";
import { toast } from "sonner";
import type { PeerSession, PeerSessionFilters } from "@/types/peerSession";
import { deletePeerSession, fetchPeerSessions } from "@/lib/api/peerSessions";
import { PeerSessionForm } from "./PeerSessionForm";
import { PeerSessionList } from "./PeerSessionList";

const YEARS = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - i
);

interface PeerSessionSectionProps {
  accessToken: string | undefined;
  onNavigateToCompensation?: () => void;
}

export function PeerSessionSection({
  accessToken,
  onNavigateToCompensation,
}: PeerSessionSectionProps) {
  const [allItems, setAllItems] = useState<PeerSession[]>([]);
  const [filters, setFilters] = useState<PeerSessionFilters>({});
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editing, setEditing] = useState<PeerSession | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PeerSession | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await fetchPeerSessions(accessToken, filters);
      setAllItems(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load peer sessions";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    load();
  }, [accessToken, load]);

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      if (yearFilter === "all") {
        delete next.year;
      } else {
        next.year = yearFilter;
      }
      return next;
    });
  }, [yearFilter]);

  const items = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter(
      (r) =>
        r.topic.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        r.employeeName?.toLowerCase().includes(q)
    );
  }, [allItems, search]);

  const handleAdd = () => {
    setEditing(null);
    setShowFormDialog(true);
  };

  const handleEdit = (session: PeerSession) => {
    setEditing(session);
    setShowFormDialog(true);
  };

  const handleDelete = (session: PeerSession) => {
    setDeleteTarget(session);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !accessToken) return;
    setIsDeleting((prev) => ({ ...prev, [deleteTarget.id]: true }));
    setDeleteConfirmOpen(false);
    try {
      await deletePeerSession(deleteTarget.id, accessToken);
      setAllItems((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Peer session deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast.error(msg);
    } finally {
      setIsDeleting((prev) => ({ ...prev, [deleteTarget.id]: false }));
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = (session: PeerSession) => {
    if (editing) {
      toast.success("Peer session updated");
      load();
    } else {
      setAllItems((prev) => [session, ...prev]);
      toast.success("Peer session logged");
    }
    setShowFormDialog(false);
    setEditing(null);
  };

  const handleFormCancel = () => {
    setShowFormDialog(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Peer-to-Peer Sessions
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Log peer-led sessions to monitor eligibility for incentive programs.
            {onNavigateToCompensation && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onNavigateToCompensation}
                  className="inline-flex items-center gap-0.5 font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  See Compensation
                  <ExternalLink className="h-3 w-3" />
                </button>
              </>
            )}
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Log Session
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, notes, or employee…"
              disabled={isLoading}
              style={{ paddingLeft: "2.25rem" }}
              className="w-full rounded-lg border border-transparent bg-gray-50 py-2 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:bg-white disabled:opacity-50"
            />
          </div>
          <select
            value={yearFilter === "all" ? "" : yearFilter}
            onChange={(e) =>
              setYearFilter(e.target.value ? parseInt(e.target.value) : "all")
            }
            disabled={isLoading}
            className="rounded-lg border border-transparent bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:bg-white disabled:opacity-50"
            style={{ minWidth: 110 }}
          >
            <option value="">All years</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {!isLoading && (
            <span className="shrink-0 font-mono text-[11px] text-gray-400">
              {items.length} {items.length === 1 ? "session" : "sessions"}
            </span>
          )}
        </div>
      </div>

      <PeerSessionList
        sessions={items}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        canEdit
        canDelete
      />

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Peer Session" : "Log Peer Session"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details of this peer-led session."
                : "Record a peer-led session you facilitated or attended."}
            </DialogDescription>
          </DialogHeader>
          {!accessToken ? (
            <div className="flex items-center justify-center gap-2 py-8 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Authentication error. Please refresh.
              </span>
            </div>
          ) : (
            <PeerSessionForm
              accessToken={accessToken}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              editingSession={editing || undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Peer Session</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              {deleteTarget?.topic}
            </p>
            <p className="text-xs text-gray-500">
              {deleteTarget?.employeeName}
            </p>
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

      {isLoading && allItems.length === 0 && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      )}
    </div>
  );
}
