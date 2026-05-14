"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
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
import type { Certificate } from "@/types/certificates";
import { certificatesApi } from "@/lib/api/modules/certificates";
import { CertificateUploadForm } from "./CertificateUploadForm";
import { CertificateList } from "./CertificateList";

type ExpiryFilter = "all" | "valid" | "expired";

export function CertificatesSection() {
  const [allItems, setAllItems] = useState<Certificate[]>([]);
  const [search, setSearch] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await certificatesApi.list();
      setAllItems(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load certificates";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    let list = allItems;
    if (expiryFilter === "valid") {
      list = list.filter((c) => !c.isExpired);
    } else if (expiryFilter === "expired") {
      list = list.filter((c) => c.isExpired);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.issuer ?? "").toLowerCase().includes(q) ||
          c.employeeName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, search, expiryFilter]);

  const handleAdd = () => setShowFormDialog(true);

  const handleDelete = (certificate: Certificate) => {
    setDeleteTarget(certificate);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting((prev) => ({ ...prev, [deleteTarget.id]: true }));
    setDeleteConfirmOpen(false);
    try {
      await certificatesApi.remove(deleteTarget.id);
      setAllItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Certificate deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast.error(msg);
    } finally {
      setIsDeleting((prev) => ({ ...prev, [deleteTarget.id]: false }));
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = (certificate: Certificate) => {
    setAllItems((prev) => [certificate, ...prev]);
    toast.success("Certificate uploaded");
    setShowFormDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Certificates
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Upload and manage employee certifications. Files are stored securely
            and can be downloaded on demand.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Upload Certificate
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, issuer, or employee…"
              disabled={isLoading}
              style={{ paddingLeft: "2.25rem" }}
              className="w-full rounded-lg border border-transparent bg-gray-50 py-2 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:bg-white disabled:opacity-50"
            />
          </div>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
            disabled={isLoading}
            className="rounded-lg border border-transparent bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:bg-white disabled:opacity-50"
          >
            <option value="all">All certificates</option>
            <option value="valid">Valid only</option>
            <option value="expired">Expired only</option>
          </select>
          {!isLoading && (
            <span className="shrink-0 font-mono text-[11px] text-gray-400">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
      </div>

      <CertificateList
        certificates={items}
        isLoading={isLoading}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        canDelete
      />

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>Upload Certificate</DialogTitle>
            <DialogDescription>
              Attach a PDF or image of the certificate and record its details.
            </DialogDescription>
          </DialogHeader>
          <CertificateUploadForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will also be removed from
              storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              {deleteTarget?.title}
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
