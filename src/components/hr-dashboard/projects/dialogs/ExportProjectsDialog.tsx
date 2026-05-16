"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { cn } from "../../ui/utils";

type ExportFormat = "csv" | "xlsx";
type ExportScope = "all" | "filtered";

export interface ExportProjectsValues {
  format: ExportFormat;
  scope: ExportScope;
  columns: string[];
}

interface ExportProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount: number;
  filteredCount: number;
  onConfirm: (values: ExportProjectsValues) => void;
}

const COLUMNS: { id: string; label: string }[] = [
  { id: "name", label: "Name & code" },
  { id: "client", label: "Client" },
  { id: "status", label: "Status" },
  { id: "stage", label: "Stage" },
  { id: "progress", label: "Progress" },
  { id: "members", label: "Members" },
  { id: "hours", label: "Hours logged" },
  { id: "dates", label: "Start & end dates" },
  { id: "technologies", label: "Technologies" },
];

const DEFAULT_COLUMNS = COLUMNS.map((c) => c.id);

export function ExportProjectsDialog({
  open,
  onOpenChange,
  totalCount,
  filteredCount,
  onConfirm,
}: ExportProjectsDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [scope, setScope] = useState<ExportScope>(
    filteredCount === totalCount ? "all" : "filtered"
  );
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);

  const toggle = (id: string) =>
    setColumns((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    );

  const handleConfirm = () => {
    onConfirm({ format, scope, columns });
    onOpenChange(false);
  };

  const count = scope === "all" ? totalCount : filteredCount;
  const disabled = columns.length === 0 || count === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Export projects</DialogTitle>
          <DialogDescription className="text-gray-700">
            Choose a format, scope, and the columns you want included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <Label className="text-[12px] font-medium text-gray-700">
              Format
            </Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="grid grid-cols-2 gap-2"
            >
              <FormatTile
                value="csv"
                active={format === "csv"}
                icon={<FileText className="h-4 w-4" />}
                label="CSV"
                hint=".csv · works in Excel, Sheets"
              />
              <FormatTile
                value="xlsx"
                active={format === "xlsx"}
                icon={<FileSpreadsheet className="h-4 w-4" />}
                label="Excel"
                hint=".xlsx · keeps formatting"
              />
            </RadioGroup>
          </section>

          <section className="space-y-2">
            <Label className="text-[12px] font-medium text-gray-700">
              Scope
            </Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as ExportScope)}
              className="flex flex-col gap-2"
            >
              <ScopeRow
                value="all"
                active={scope === "all"}
                label={`All projects (${totalCount})`}
              />
              <ScopeRow
                value="filtered"
                active={scope === "filtered"}
                label={`Current filtered view (${filteredCount})`}
                disabled={filteredCount === 0}
              />
            </RadioGroup>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] font-medium text-gray-700">
                Columns
              </Label>
              <button
                type="button"
                onClick={() =>
                  setColumns(
                    columns.length === COLUMNS.length ? [] : DEFAULT_COLUMNS
                  )
                }
                className="text-[12px] font-medium text-gray-700 hover:text-gray-900"
              >
                {columns.length === COLUMNS.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3">
              {COLUMNS.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-800"
                >
                  <Checkbox
                    checked={columns.includes(c.id)}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={disabled}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export {count} project{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FormatTileProps {
  value: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
}

function FormatTile({ value, active, icon, label, hint }: FormatTileProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
        active
          ? "border-gray-900 bg-gray-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <RadioGroupItem value={value} className="mt-0.5" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">
          {icon}
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-gray-700">{hint}</div>
      </div>
    </label>
  );
}

interface ScopeRowProps {
  value: string;
  active: boolean;
  label: string;
  disabled?: boolean;
}

function ScopeRow({ value, active, label, disabled }: ScopeRowProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition-colors",
        active ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <RadioGroupItem value={value} disabled={disabled} />
      <span
        className={cn(
          "font-medium",
          active ? "text-gray-900" : "text-gray-800"
        )}
      >
        {label}
      </span>
    </label>
  );
}
