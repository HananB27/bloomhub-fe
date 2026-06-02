"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DatePicker } from "../DatePicker";
import { policyApi, type CompensationPolicy } from "@/lib/api/compensation";
import { cpfLevelsApi } from "@/lib/api/cpf-levels";

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

export function PoliciesSubTab() {
  const [policies, setPolicies] = useState<CompensationPolicy[]>([]);
  const [cpfLevels, setCpfLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state per row
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");

  // Create form
  const [newLevel, setNewLevel] = useState<string>("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(todayIso());
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [policiesData, levels] = await Promise.all([
        policyApi.list(),
        cpfLevelsApi.getAllCPFLevels(),
      ]);
      setPolicies(policiesData);
      setCpfLevels(levels);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load policies";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usedLevels = useMemo(
    () => new Set(policies.map((p) => p.cpf_level)),
    [policies]
  );

  const availableLevels = useMemo(
    () => cpfLevels.filter((l) => !usedLevels.has(l)),
    [cpfLevels, usedLevels]
  );

  const handleStartEdit = (policy: CompensationPolicy) => {
    setEditingId(policy.id);
    setEditAmount(policy.net_monthly);
    setEditDate(policy.effective_date);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditDate("");
  };

  const handleSaveEdit = async (policy: CompensationPolicy) => {
    const amount = parseDecimal(editAmount);
    if (amount <= 0) {
      toast.error("Net monthly must be greater than 0");
      return;
    }
    try {
      const updated = await policyApi.update(policy.id, {
        net_monthly: amount,
        effective_date: editDate,
      });
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? updated : p))
      );
      handleCancelEdit();
      toast.success(`Policy updated for ${policy.cpf_level}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update policy"
      );
    }
  };

  const handleRemove = async (policy: CompensationPolicy) => {
    if (
      !window.confirm(
        `Remove policy for "${policy.cpf_level}"? Employees at this level will have no resolved NET salary until you re-create one.`
      )
    ) {
      return;
    }
    try {
      await policyApi.remove(policy.id);
      setPolicies((prev) => prev.filter((p) => p.id !== policy.id));
      toast.success(`Policy removed for ${policy.cpf_level}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove policy"
      );
    }
  };

  const handleCreate = async () => {
    if (!newLevel) {
      toast.error("Pick a CPF level");
      return;
    }
    const amount = parseDecimal(newAmount);
    if (amount <= 0) {
      toast.error("Net monthly must be greater than 0");
      return;
    }
    setCreating(true);
    try {
      const created = await policyApi.create({
        cpf_level: newLevel,
        net_monthly: amount,
        effective_date: newDate,
        currency: "BAM",
      });
      setPolicies((prev) => [...prev, created]);
      setNewLevel("");
      setNewAmount("");
      setNewDate(todayIso());
      toast.success(`Policy created for ${newLevel}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create policy"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle>NET Salary policies</CardTitle>
            <p className="mt-1 text-xs text-gray-700">
              One NET salary per CPF level. All employees at the same level
              receive the same NET. Changing a policy retroactively affects
              everyone at that level.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-700">
              Loading policies…
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : policies.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-700">
              No policies yet. Add the first one below.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPF level</TableHead>
                  <TableHead>NET monthly</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.cpf_level}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          <span className="font-mono">
                            {fmtBam(p.net_monthly)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <DatePicker
                            mode="single"
                            value={editDate}
                            onChange={(d) => setEditDate(d)}
                          />
                        ) : (
                          <span className="text-sm text-gray-800">
                            {p.effective_date}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {p.employees_count ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleSaveEdit(p)}
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
                              onClick={() => handleStartEdit(p)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleRemove(p)}
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

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add policy</h3>
          <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800">
            {availableLevels.length} CPF level
            {availableLevels.length === 1 ? "" : "s"} without a policy
          </span>
        </div>
        <div className="px-5 py-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,1fr)_180px_220px_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-level"
                className="text-xs font-semibold text-gray-700"
              >
                CPF level
              </Label>
              <Select value={newLevel} onValueChange={setNewLevel}>
                <SelectTrigger
                  id="new-level"
                  className="h-10 rounded-lg border-gray-300 bg-white text-sm text-gray-900"
                >
                  <SelectValue placeholder="Pick a level" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      All CPF levels already have policies
                    </SelectItem>
                  ) : (
                    availableLevels.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="new-amount"
                className="text-xs font-semibold text-gray-700"
              >
                NET monthly (BAM)
              </Label>
              <Input
                id="new-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="h-10 rounded-lg border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400"
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
                size="compact"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || availableLevels.length === 0}
              className="h-10 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white hover:bg-black"
            >
              {creating ? "Adding…" : "Add policy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
