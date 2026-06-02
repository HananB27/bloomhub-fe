"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cpfLevelsApi, type CPFLevel } from "@/lib/api/modules/cpf-levels";

interface RowDraft {
  display_name: string;
  career_level: string;
}

export function CPFLevelsSubTab() {
  const [levels, setLevels] = useState<CPFLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<RowDraft>({
    display_name: "",
    career_level: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cpfLevelsApi.list();
      setLevels(data.sort((a, b) => a.code.localeCompare(b.code)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load CPF levels"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (level: CPFLevel) => {
    setEditingCode(level.code);
    setDraft({
      display_name: level.display_name ?? "",
      career_level: level.career_level ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setDraft({ display_name: "", career_level: "" });
  };

  const saveEdit = async (code: string) => {
    try {
      setSaving(true);
      const updated = await cpfLevelsApi.update(code, {
        display_name: draft.display_name.trim() || null,
        career_level: draft.career_level.trim() || null,
      });
      setLevels((prev) => prev.map((l) => (l.code === code ? updated : l)));
      cancelEdit();
      toast.success(`Updated ${code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle>CPF levels</CardTitle>
            <p className="mt-1 text-xs text-gray-700">
              Set a display name and career level per CPF code. Career level
              applies automatically to every employee at that CPF.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-700">
              Loading CPF levels…
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : levels.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-700">
              No CPF levels configured.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead>Career level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => {
                  const isEditing = editingCode === level.code;
                  return (
                    <TableRow key={level.code}>
                      <TableCell className="font-mono font-medium">
                        {level.code}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={draft.display_name}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                display_name: e.target.value,
                              }))
                            }
                            placeholder="e.g. Mid Engineer"
                            className="h-9"
                          />
                        ) : (
                          <span className="text-sm">
                            {level.display_name ?? (
                              <span className="text-gray-400">—</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={draft.career_level}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                career_level: e.target.value,
                              }))
                            }
                            placeholder="e.g. Mid"
                            className="h-9"
                          />
                        ) : (
                          <span className="text-sm">
                            {level.career_level ?? (
                              <span className="text-gray-400">—</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={saving}
                              onClick={() => saveEdit(level.code)}
                              aria-label="Save"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={cancelEdit}
                              aria-label="Cancel"
                              disabled={saving}
                            >
                              <X className="h-4 w-4 text-gray-700" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => startEdit(level)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
