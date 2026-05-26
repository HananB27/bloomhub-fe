"use client";

import { useEffect, useState } from "react";
import { Building, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { type Department, departmentsApi } from "@/lib/api/modules/departments";
import { invalidateOrgChartCache } from "./orgchart/useOrgChartData";

/**
 * CRUD pane for departments. Lives inside the Admin Panel's Departments tab.
 * Org Chart consumes the same list via departmentsApi, so on save/delete we
 * bust the org-chart cache so the chart reflects the change next view.
 */
export function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    try {
      setLoading(true);
      setError(null);
      const list = await departmentsApi.listDepartments();
      setDepartments(list.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      setIsCreating(true);
      await departmentsApi.createDepartment({ name });
      invalidateOrgChartCache();
      setNewName("");
      toast.success(`Created "${name}"`);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create department"
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveEdit() {
    if (editingId == null) return;
    const name = editName.trim();
    if (!name) return;
    try {
      setIsSaving(true);
      await departmentsApi.updateDepartment(editingId, { name });
      invalidateOrgChartCache();
      toast.success("Department renamed");
      setEditingId(null);
      setEditName("");
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to rename department"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      setIsDeleting(true);
      await departmentsApi.deleteDepartment(target.id);
      invalidateOrgChartCache();
      toast.success(`Deleted "${target.name}"`);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete department"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Departments
        </CardTitle>
        <CardDescription>
          Create, rename, and delete departments. Changes propagate to the Org
          Chart and Employee Profiles automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="New department name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isCreating) void handleCreate();
            }}
            className="max-w-sm"
          />
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
            className="gap-1.5"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading departments…
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : departments.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No departments yet. Create one above to get started.
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                {editingId === d.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSaving)
                          void handleSaveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editName.trim()}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {d.name}
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      #{d.id}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setEditingId(d.id);
                        setEditName(d.name);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-red-600 hover:text-red-700"
                      onClick={() => setDeleteTarget(d)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Permanently delete "${deleteTarget.name}". Employees assigned to this department will be unassigned. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete department"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
