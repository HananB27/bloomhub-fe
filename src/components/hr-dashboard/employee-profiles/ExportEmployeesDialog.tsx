import { useMemo, useState } from "react";
import { Download, FileText, Loader2, LockKeyhole } from "lucide-react";
import type {
  EmployeeExportFormat,
  EmployeeExportPayload,
  EmployeeProfileData,
} from "@/lib/api/employees";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { cn } from "../ui/utils";
import {
  ALL_FILTER_SENTINEL,
  type EmployeesListFilters,
} from "./employeesListHelpers";

interface ExportEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeProfileData[];
  filteredEmployees: EmployeeProfileData[];
  search: string;
  filters: EmployeesListFilters;
  activeFilterCount: number;
  isExporting?: boolean;
  onExport: (payload: EmployeeExportPayload) => Promise<void>;
}

interface ExportColumn {
  key: string;
  label: string;
  group: "Identity" | "Job" | "Sensitive (HR-only)";
  defaultSelected: boolean;
  sensitive?: boolean;
}

const EXPORT_COLUMNS: ExportColumn[] = [
  {
    key: "first_name",
    label: "First name",
    group: "Identity",
    defaultSelected: true,
  },
  {
    key: "last_name",
    label: "Last name",
    group: "Identity",
    defaultSelected: true,
  },
  {
    key: "email",
    label: "Work email",
    group: "Identity",
    defaultSelected: true,
  },
  {
    key: "phone_number",
    label: "Phone",
    group: "Identity",
    defaultSelected: false,
  },
  { key: "role", label: "Job title", group: "Job", defaultSelected: true },
  {
    key: "department",
    label: "Department",
    group: "Job",
    defaultSelected: true,
  },
  { key: "team", label: "Team", group: "Job", defaultSelected: true },
  { key: "location", label: "Location", group: "Job", defaultSelected: true },
  {
    key: "employment_status",
    label: "Status",
    group: "Job",
    defaultSelected: true,
  },
  {
    key: "start_date",
    label: "Start date",
    group: "Job",
    defaultSelected: true,
  },
  {
    key: "salary",
    label: "Salary",
    group: "Sensitive (HR-only)",
    defaultSelected: false,
    sensitive: true,
  },
  {
    key: "address",
    label: "Home address",
    group: "Sensitive (HR-only)",
    defaultSelected: false,
    sensitive: true,
  },
  {
    key: "birth_date",
    label: "Date of birth",
    group: "Sensitive (HR-only)",
    defaultSelected: false,
    sensitive: true,
  },
  {
    key: "emergency_contact",
    label: "Emergency contact",
    group: "Sensitive (HR-only)",
    defaultSelected: false,
    sensitive: true,
  },
];

const FORMAT_OPTIONS: {
  value: EmployeeExportFormat;
  label: string;
  description: string;
}[] = [
  {
    value: "csv",
    label: "CSV",
    description: "Spreadsheet-friendly, one row per employee",
  },
  {
    value: "xlsx",
    label: "XLSX",
    description: "Excel workbook with formatted columns",
  },
  {
    value: "json",
    label: "JSON",
    description: "Machine-readable, includes nested fields",
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Printable directory with logo and headers",
  },
];

const DEFAULT_COLUMNS = EXPORT_COLUMNS.filter(
  (column) => column.defaultSelected
).map((column) => column.key);

export function ExportEmployeesDialog({
  open,
  onOpenChange,
  employees,
  filteredEmployees,
  search,
  filters,
  activeFilterCount,
  isExporting = false,
  onExport,
}: ExportEmployeesDialogProps) {
  const [format, setFormat] = useState<EmployeeExportFormat>("csv");
  const [scope, setScope] = useState<"all" | "filtered">("all");
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scopedRows =
    scope === "filtered" ? filteredEmployees.length : employees.length;
  const selectedCount = columns.length;
  const filename = useMemo(() => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `bloomhub-employees-${scope}-${date}.${format}`;
  }, [format, scope]);

  const hasFilteredScope = activeFilterCount > 0;

  const toggleColumn = (column: string, checked: boolean) => {
    setColumns((current) =>
      checked
        ? [...new Set([...current, column])]
        : current.filter((c) => c !== column)
    );
    setError(null);
  };

  const setGroup = (group: ExportColumn["group"], selected: boolean) => {
    const keys = EXPORT_COLUMNS.filter((column) => column.group === group).map(
      (column) => column.key
    );
    setColumns((current) =>
      selected
        ? [...new Set([...current, ...keys])]
        : current.filter((column) => !keys.includes(column))
    );
  };

  const handleExport = async () => {
    if (columns.length === 0) {
      setError("Select at least one column to export.");
      return;
    }

    const exportFilters: EmployeeExportPayload["filters"] = {};
    if (scope === "filtered") {
      if (search.trim()) exportFilters.search = search.trim();
      if (filters.department !== ALL_FILTER_SENTINEL) {
        exportFilters.department = filters.department;
      }
      if (filters.status !== ALL_FILTER_SENTINEL) {
        exportFilters.status = filters.status;
      }
    }

    try {
      await onExport({
        format,
        scope,
        columns,
        include_header: includeHeader,
        filename,
        filters: Object.keys(exportFilters).length ? exportFilters : undefined,
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export employees."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ep-scope grid max-h-[92vh] max-w-4xl gap-0 overflow-hidden rounded-[24px] p-0">
        <DialogTitle className="sr-only">Export employees</DialogTitle>
        <DialogDescription className="sr-only">
          Export employee directory data.
        </DialogDescription>
        <header className="border-b border-zinc-200 px-8 py-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Export
          </p>
          <h2 className="m-0 text-3xl font-bold tracking-tight text-zinc-900">
            Export employees
          </h2>
        </header>

        <div className="max-h-[64vh] overflow-y-auto px-8 py-6">
          <SectionTitle label="Format" />
          <div className="grid grid-cols-2 gap-3">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={cn(
                  "grid grid-cols-[90px_1fr] rounded-lg border p-4 text-left transition",
                  format === option.value
                    ? "border-zinc-400 ring-2 ring-zinc-300"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <strong className="text-base text-zinc-900">
                  {option.label}
                </strong>
                <span className="text-sm text-zinc-500">
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <Separator />
          <SectionTitle label="Scope" />
          <RadioGroup
            value={scope}
            onValueChange={(value) => setScope(value as "all" | "filtered")}
          >
            <ScopeOption
              value="all"
              label="All employees"
              description="Everyone in the directory"
              count={employees.length}
              selected={scope === "all"}
            />
            <ScopeOption
              value="filtered"
              label="Current filter results"
              description={
                hasFilteredScope
                  ? "Only employees matching the active filters"
                  : "No active filters - nothing to scope to"
              }
              count={hasFilteredScope ? filteredEmployees.length : 0}
              selected={scope === "filtered"}
              disabled={!hasFilteredScope}
            />
          </RadioGroup>

          <Separator />
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle label="Columns" className="mb-0" />
            <span className="text-sm text-zinc-500">
              <strong>{selectedCount}</strong> selected
            </span>
          </div>

          <div className="space-y-4">
            {(["Identity", "Job", "Sensitive (HR-only)"] as const).map(
              (group) => (
                <ColumnGroup
                  key={group}
                  group={group}
                  columns={EXPORT_COLUMNS.filter(
                    (column) => column.group === group
                  )}
                  selectedColumns={columns}
                  onToggle={toggleColumn}
                  onSetGroup={setGroup}
                />
              )
            )}
          </div>

          <Separator />
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4">
            <Checkbox
              className="border-zinc-300 data-[state=checked]:border-slate-500 data-[state=checked]:bg-slate-500"
              checked={includeHeader}
              onCheckedChange={(checked) => setIncludeHeader(checked === true)}
            />
            <span className="font-medium text-zinc-900">
              Include header row
            </span>
          </label>

          <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
            <FileText size={16} aria-hidden />
            {filename}
          </div>
          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-zinc-200 px-8 py-5">
          <p className="text-sm text-zinc-500">
            <strong className="text-zinc-900">{scopedRows}</strong> rows x{" "}
            <strong className="text-zinc-900">{selectedCount}</strong> columns
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={handleExport}
              disabled={isExporting || selectedCount === 0}
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <Download size={16} aria-hidden />
              )}
              Export {format.toUpperCase()}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500",
        className
      )}
    >
      {label}
    </h3>
  );
}

function Separator() {
  return <div className="my-6 h-px bg-zinc-200" />;
}

function ScopeOption({
  value,
  label,
  description,
  count,
  selected,
  disabled,
}: {
  value: string;
  label: string;
  description: string;
  count: number;
  selected: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-4 rounded-lg border p-4",
        selected ? "border-zinc-400 ring-1 ring-zinc-300" : "border-zinc-200",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <RadioGroupItem
        value={value}
        disabled={disabled}
        className="border-zinc-300 text-slate-500"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-zinc-900">{label}</span>
        <span className="block text-sm text-zinc-500">{description}</span>
      </span>
      <span className="rounded-md bg-zinc-100 px-2 py-1 text-sm font-bold text-zinc-700">
        {count}
      </span>
    </label>
  );
}

function ColumnGroup({
  group,
  columns,
  selectedColumns,
  onToggle,
  onSetGroup,
}: {
  group: ExportColumn["group"];
  columns: ExportColumn[];
  selectedColumns: string[];
  onToggle: (column: string, checked: boolean) => void;
  onSetGroup: (group: ExportColumn["group"], selected: boolean) => void;
}) {
  const allSelected = columns.every((column) =>
    selectedColumns.includes(column.key)
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border",
        group === "Sensitive (HR-only)"
          ? "border-yellow-300 bg-yellow-50"
          : "border-zinc-200 bg-white"
      )}
    >
      <header className="flex items-center justify-between border-b border-inherit px-4 py-3">
        <div className="flex items-center gap-2">
          <h4 className="m-0 font-semibold text-zinc-900">{group}</h4>
          {group === "Sensitive (HR-only)" ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-yellow-300 bg-white px-2 py-0.5 text-xs font-semibold text-yellow-700">
              <LockKeyhole size={12} aria-hidden />
              HR-only
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          onClick={() => onSetGroup(group, !allSelected)}
        >
          {allSelected ? "Clear" : "Select all"}
        </button>
      </header>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-4 py-4">
        {columns.map((column) => (
          <label key={column.key} className="flex items-center gap-3">
            <Checkbox
              className="border-zinc-300 data-[state=checked]:border-slate-500 data-[state=checked]:bg-slate-500"
              checked={selectedColumns.includes(column.key)}
              onCheckedChange={(checked) =>
                onToggle(column.key, checked === true)
              }
            />
            <span className="font-medium text-zinc-900">{column.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
