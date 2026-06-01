"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DatePicker } from "../DatePicker";
import {
  benefitCatalogApi,
  type BenefitCatalogEntry,
  type BenefitTypeId,
} from "@/lib/api/compensation";

const BENEFIT_TYPES: { value: BenefitTypeId; label: string }[] = [
  { value: "transport", label: "Transport allowance" },
  { value: "meal", label: "Meal allowance" },
  { value: "recreation", label: "Recreation" },
  { value: "health", label: "Private health" },
  { value: "education", label: "Education stipend" },
  { value: "equipment", label: "Equipment allowance" },
  { value: "remote_work", label: "Remote-work stipend" },
  { value: "phone", label: "Phone / data" },
  { value: "other", label: "Other" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDecimal(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtBam(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return "—";
  return `BAM ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function BenefitsCatalogSubTab() {
  const [entries, setEntries] = useState<BenefitCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editName, setEditName] = useState("");

  // Create form
  const [newType, setNewType] = useState<BenefitTypeId>("transport");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(todayIso());
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await benefitCatalogApi.list();
      setEntries(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load benefits";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeTotal = entries
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + (parseFloat(b.monthly_amount) || 0), 0);

  const handleStartEdit = (entry: BenefitCatalogEntry) => {
    setEditingId(entry.id);
    setEditAmount(entry.monthly_amount);
    setEditName(entry.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditName("");
  };

  const handleSaveEdit = async (entry: BenefitCatalogEntry) => {
    const amount = parseDecimal(editAmount);
    if (amount <= 0) {
      toast.error("Monthly amount must be greater than 0");
      return;
    }
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const updated = await benefitCatalogApi.update(entry.id, {
        monthly_amount: amount,
        name: editName.trim(),
      });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
      handleCancelEdit();
      toast.success("Benefit updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update benefit"
      );
    }
  };

  const handleToggleActive = async (entry: BenefitCatalogEntry) => {
    try {
      const updated = await benefitCatalogApi.update(entry.id, {
        is_active: !entry.is_active,
      });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle benefit"
      );
    }
  };

  const handleRemove = async (entry: BenefitCatalogEntry) => {
    if (
      !window.confirm(
        `Remove "${entry.name}"? Hard delete — it will stop applying to all employees immediately.`
      )
    ) {
      return;
    }
    try {
      await benefitCatalogApi.remove(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Benefit removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove benefit"
      );
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    const amount = parseDecimal(newAmount);
    if (amount <= 0) {
      toast.error("Monthly amount must be greater than 0");
      return;
    }
    setCreating(true);
    try {
      const created = await benefitCatalogApi.create({
        benefit_type: newType,
        name: newName.trim(),
        monthly_amount: amount,
        effective_date: newDate,
        is_active: true,
        currency: "BAM",
      });
      setEntries((prev) => [...prev, created]);
      setNewType("transport");
      setNewName("");
      setNewAmount("");
      setNewDate(todayIso());
      toast.success("Benefit added to catalog");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create benefit"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Benefits catalog</CardTitle>
              <p className="mt-1 text-xs text-gray-700">
                Global benefit list. Every active entry applies to every
                employee. Total monthly per employee:{" "}
                <strong className="font-mono text-gray-900">
                  {fmtBam(activeTotal)}
                </strong>
                .
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-700">
              Loading catalog…
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-700">
              No benefits in catalog yet. Add the first one below.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const isEditing = editingId === e.id;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(ev) => setEditName(ev.target.value)}
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {e.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-800">
                        {e.benefit_type_display}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={editAmount}
                            onChange={(ev) => setEditAmount(ev.target.value)}
                            className="w-32"
                          />
                        ) : (
                          <span className="font-mono">
                            {fmtBam(e.monthly_amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-800">
                        {e.effective_date}
                        {e.end_date ? ` → ${e.end_date}` : ""}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={e.is_active}
                          onCheckedChange={() => handleToggleActive(e)}
                          aria-label={`Toggle ${e.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleSaveEdit(e)}
                              aria-label="Save"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleCancelEdit}
                              aria-label="Cancel"
                            >
                              <X className="h-4 w-4 text-gray-700" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleStartEdit(e)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleRemove(e)}
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3">
          <Plus className="h-4 w-4 text-gray-800" />
          <h3 className="text-sm font-semibold text-gray-900">Add benefit</h3>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="cat-type"
                className="text-xs font-semibold text-gray-700"
              >
                Type
              </Label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType(v as BenefitTypeId)}
              >
                <SelectTrigger
                  id="cat-type"
                  className="h-9 rounded-lg border-gray-300 bg-white text-sm text-gray-900"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFIT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="cat-amount"
                className="text-xs font-semibold text-gray-700"
              >
                Monthly (BAM)
              </Label>
              <Input
                id="cat-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="e.g. 200"
                className="h-9 rounded-lg border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="cat-name"
                className="text-xs font-semibold text-gray-700"
              >
                Name
              </Label>
              <Input
                id="cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Topli obrok, MultiSport, Mobilni paket"
                className="h-9 rounded-lg border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Effective date
              </Label>
              <DatePicker
                mode="single"
                value={newDate}
                onChange={(d) => setNewDate(d)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {creating ? "Adding…" : "Add benefit"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
