"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  templateSnippetsApi,
  type UserTemplateSnippetDto,
} from "@/lib/api/modules/templateSnippets";
import {
  loadLocalUserSnippets,
  saveLocalUserSnippets,
  loadBuiltinSnippetOverrides,
  saveBuiltinSnippetOverrides,
  type BuiltinSnippetOverrideMap,
} from "@/lib/templateSnippets/userTemplateSnippetsStorage";
import { notifyApiError, notifySuccess } from "@/utils/notificationHelpers";
import {
  isRichTextEffectivelyEmpty,
  richTextToPlainPreview,
  TEMPLATE_EDITOR_SNIPPETS,
  applyBuiltinSnippetOverrides,
  type TemplateEditorSnippet,
} from "./templateEditorHelpers";
import { SnippetRichTextEditor } from "./SnippetRichTextEditor";

export function TemplateSnippetsManageDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<UserTemplateSnippetDto[]>([]);
  const [loading, setLoading] = useState(false);
  // Built-in snippet IDs are represented as `builtin:<id>` in `editingId`
  // to distinguish them from numeric/uuid user-snippet IDs.
  const [editingId, setEditingId] = useState<string | number | "new" | null>(
    null
  );
  const [label, setLabel] = useState("");
  const [html, setHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftVersion, setDraftVersion] = useState(0);
  const [builtinOverrides, setBuiltinOverrides] =
    useState<BuiltinSnippetOverrideMap>({});

  const builtinSnippets: TemplateEditorSnippet[] = applyBuiltinSnippetOverrides(
    TEMPLATE_EDITOR_SNIPPETS,
    builtinOverrides
  );

  const isBuiltinEditingId = (id: string | number | "new" | null): boolean =>
    typeof id === "string" && id.startsWith("builtin:");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setBuiltinOverrides(loadBuiltinSnippetOverrides());
    templateSnippetsApi
      .list()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          saveLocalUserSnippets(data);
        }
      })
      .catch(() => {
        if (!cancelled) setRows(loadLocalUserSnippets());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function startCreate() {
    setEditingId("new");
    setLabel("");
    setHtml("<p><br></p>");
    setDraftVersion((v) => v + 1);
  }

  function startEdit(row: UserTemplateSnippetDto) {
    setEditingId(row.id);
    setLabel(row.label);
    setHtml(row.html);
    setDraftVersion((v) => v + 1);
  }

  function startEditBuiltin(snippet: TemplateEditorSnippet) {
    setEditingId(`builtin:${snippet.id}`);
    setLabel(snippet.label);
    setHtml(snippet.html);
    setDraftVersion((v) => v + 1);
  }

  function resetBuiltin(snippetId: string) {
    if (!builtinOverrides[snippetId]) return;
    const next = { ...builtinOverrides };
    delete next[snippetId];
    setBuiltinOverrides(next);
    saveBuiltinSnippetOverrides(next);
    notifySuccess("Reset to default");
    onSaved();
  }

  function cancelEdit() {
    setEditingId(null);
    setLabel("");
    setHtml("");
  }

  function persistLocal(next: UserTemplateSnippetDto[]) {
    setRows(next);
    saveLocalUserSnippets(next);
  }

  async function saveSnippet() {
    const lb = label.trim();
    const hb = html.trim();
    if (!lb || isRichTextEffectivelyEmpty(hb)) return;
    if (isBuiltinEditingId(editingId)) {
      // Save as a local override of a built-in snippet
      const id = (editingId as string).replace(/^builtin:/, "");
      const next: BuiltinSnippetOverrideMap = {
        ...builtinOverrides,
        [id]: { label: lb, html: hb, updated_at: new Date().toISOString() },
      };
      setBuiltinOverrides(next);
      saveBuiltinSnippetOverrides(next);
      notifySuccess("Built-in snippet updated for you");
      cancelEdit();
      onSaved();
      return;
    }
    setSaving(true);
    try {
      if (editingId === "new") {
        const created = await templateSnippetsApi.create({
          label: lb,
          html: hb,
          sort_order: rows.length,
        });
        persistLocal([...rows, created]);
        notifySuccess("Snippet saved");
      } else if (editingId !== null) {
        const updated = await templateSnippetsApi.update(editingId, {
          label: lb,
          html: hb,
        });
        persistLocal(rows.map((x) => (x.id === editingId ? updated : x)));
        notifySuccess("Snippet updated");
      }
      cancelEdit();
      onSaved();
    } catch (err) {
      try {
        if (editingId === "new") {
          const local: UserTemplateSnippetDto = {
            id: crypto.randomUUID(),
            label: lb,
            html: hb,
            sort_order: rows.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          persistLocal([...rows, local]);
          notifySuccess("Snippet saved on this device");
          cancelEdit();
          onSaved();
        } else if (editingId !== null) {
          persistLocal(
            rows.map((x) =>
              x.id === editingId
                ? {
                    ...x,
                    label: lb,
                    html: hb,
                    updated_at: new Date().toISOString(),
                  }
                : x
            )
          );
          notifySuccess("Snippet updated on this device");
          cancelEdit();
          onSaved();
        }
      } catch {
        notifyApiError(
          err instanceof Error ? err : new Error("Could not save snippet")
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id: number | string) {
    try {
      await templateSnippetsApi.remove(id);
      const next = rows.filter((r) => r.id !== id);
      persistLocal(next);
      notifySuccess("Snippet removed");
      onSaved();
    } catch (err) {
      try {
        const next = rows.filter((r) => r.id !== id);
        persistLocal(next);
        notifySuccess("Snippet removed on this device");
        onSaved();
      } catch {
        notifyApiError(
          err instanceof Error ? err : new Error("Could not delete snippet")
        );
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle className="text-[17px] font-semibold text-slate-900">
            Manage snippets
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500">
            Edit built-in snippets (saved as your overrides) or create your own.
            Custom snippets sync to your account when online; otherwise changes
            fall back to this browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[min(52vh,520px)] overflow-y-auto px-6 py-4 space-y-5">
          {/* Built-in snippets — editable via local overrides */}
          <section>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-700">
              Built-in
            </p>
            <ul className="space-y-2">
              {builtinSnippets.map((sn) => {
                const overridden = !!builtinOverrides[sn.id];
                return (
                  <li
                    key={sn.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {sn.label}
                        </p>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {sn.category}
                        </span>
                        {overridden && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            Edited
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                        {richTextToPlainPreview(sn.html, 120)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => startEditBuiltin(sn)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {overridden && (
                        <button
                          type="button"
                          title="Reset to default"
                          onClick={() => resetBuiltin(sn.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* My snippets — user-created and synced */}
          <section>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-700">
              My snippets
            </p>
            {loading ? (
              <p className="text-[13px] text-slate-500">Loading…</p>
            ) : rows.length === 0 && editingId !== "new" ? (
              <p className="text-[13px] text-slate-500">
                No custom snippets yet. Create one below.
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li
                    key={String(row.id)}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {row.label}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                        {richTextToPlainPreview(row.html, 120)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => startEdit(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => removeRow(row.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {editingId !== null && (
            <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-800">
                {editingId === "new"
                  ? "New snippet"
                  : isBuiltinEditingId(editingId)
                    ? "Edit built-in snippet"
                    : "Edit snippet"}
              </p>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Label
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Company letterhead"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Content
                </label>
                <SnippetRichTextEditor
                  key={`${String(editingId)}-${draftVersion}`}
                  initialHtml={html}
                  onHtmlChange={setHtml}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 border-t border-slate-100 px-6 py-4 sm:justify-between">
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              startCreate();
            }}
            disabled={editingId === "new"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            New snippet
          </button>
          <div className="flex flex-wrap gap-2">
            {editingId !== null && (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    saving || !label.trim() || isRichTextEffectivelyEmpty(html)
                  }
                  onClick={() => void saveSnippet()}
                  className="h-9 rounded-lg border border-gray-800 bg-gray-800 px-4 text-[13px] font-semibold text-white hover:bg-gray-900 disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
