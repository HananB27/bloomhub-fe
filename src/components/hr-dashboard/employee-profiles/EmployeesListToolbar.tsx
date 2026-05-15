import { useEffect, useRef } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FilterChip, ViewToggle, type ProfilesListView } from "./atoms";
import {
  ALL_FILTER_SENTINEL,
  EMPLOYEES_LIST_SORT_LABELS,
  EMPLOYEES_LIST_SORT_OPTIONS,
  type EmployeesListFilters,
  type EmployeesListSort,
} from "./employeesListHelpers";
import {
  getEmployeeStatusVisual,
  type EmployeeStatusKey,
} from "./atoms/StatusPill";

const STATUS_OPTIONS: readonly (
  | EmployeeStatusKey
  | typeof ALL_FILTER_SENTINEL
)[] = [ALL_FILTER_SENTINEL, "active", "inactive"];

interface EmployeesListToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  view: ProfilesListView;
  onView: (v: ProfilesListView) => void;
  filters: EmployeesListFilters;
  onFilter: <K extends keyof EmployeesListFilters>(
    key: K,
    value: EmployeesListFilters[K]
  ) => void;
  onClearAll: () => void;
  departments: readonly string[];
  resultCount: number;
  totalCount: number;
  activeFilterCount: number;
}

export function EmployeesListToolbar({
  search,
  onSearch,
  view,
  onView,
  filters,
  onFilter,
  onClearAll,
  departments,
  resultCount,
  totalCount,
  activeFilterCount,
}: EmployeesListToolbarProps) {
  return (
    <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={onSearch} />

        <div className="flex flex-wrap gap-1.5">
          <FilterSelect
            label="Department"
            value={filters.department}
            onChange={(v) => onFilter("department", v)}
            options={[ALL_FILTER_SENTINEL, ...departments]}
            renderOption={(v) => (v === ALL_FILTER_SENTINEL ? "All" : v)}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) =>
              onFilter("status", v as EmployeesListFilters["status"])
            }
            options={STATUS_OPTIONS as readonly string[]}
            renderOption={(v) =>
              v === ALL_FILTER_SENTINEL
                ? "All"
                : getEmployeeStatusVisual(v as EmployeeStatusKey).label
            }
          />
          <FilterSelect
            label="Sort"
            value={filters.sort}
            onChange={(v) => onFilter("sort", v as EmployeesListSort)}
            options={EMPLOYEES_LIST_SORT_OPTIONS as readonly string[]}
            renderOption={(v) =>
              EMPLOYEES_LIST_SORT_LABELS[v as EmployeesListSort]
            }
          />
        </div>

        <div className="ml-auto">
          <ViewToggle value={view} onChange={onView} />
        </div>
      </div>

      {activeFilterCount > 0 ? (
        <ActiveFiltersBar
          search={search}
          filters={filters}
          onSearch={onSearch}
          onFilter={onFilter}
          onClearAll={onClearAll}
          resultCount={resultCount}
          totalCount={totalCount}
        />
      ) : null}
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
}

function SearchInput({ value, onChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <label className="group flex h-11 min-w-[280px] flex-1 items-center rounded-lg border border-zinc-200 px-3 text-zinc-500 transition focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-200/70 hover:border-zinc-300 bg-[#F9F9F9]">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition group-focus-within:text-zinc-800">
        <Search size={17} aria-hidden />
      </span>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search by name, role, email…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 rounded-none border-0  px-2 text-sm text-zinc-900 shadow-none outline-none placeholder:text-zinc-500 focus:outline-none focus:ring-0"
        aria-label="Search employees"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X size={15} aria-hidden />
        </button>
      ) : (
        <kbd className="ml-2 shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-500">
          ⌘K
        </kbd>
      )}
    </label>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  renderOption: (v: string) => string;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  renderOption,
}: FilterSelectProps) {
  return (
    <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 transition-colors hover:border-zinc-300">
      <Filter size={12} aria-hidden className="text-zinc-500" />
      <span className="text-xs font-medium text-zinc-500">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={label}
          className="h-7 border-0 bg-transparent p-0 text-xs font-medium text-zinc-900 shadow-none focus:ring-0"
        >
          <SelectValue>{renderOption(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {renderOption(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ChevronDown size={12} aria-hidden className="text-zinc-500" />
    </div>
  );
}

interface ActiveFiltersBarProps {
  search: string;
  filters: EmployeesListFilters;
  onSearch: (v: string) => void;
  onFilter: <K extends keyof EmployeesListFilters>(
    key: K,
    value: EmployeesListFilters[K]
  ) => void;
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
}

function ActiveFiltersBar({
  search,
  filters,
  onSearch,
  onFilter,
  onClearAll,
  resultCount,
  totalCount,
}: ActiveFiltersBarProps) {
  return (
    <div
      role="status"
      className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-zinc-200 px-1 pt-2.5"
    >
      <span className="text-xs">
        <strong className="ep-mono font-semibold text-zinc-900">
          {resultCount}
        </strong>
        <span className="text-zinc-500"> of {totalCount} employees</span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {search ? (
          <FilterChip
            label="Search"
            value={`"${search}"`}
            onRemove={() => onSearch("")}
          />
        ) : null}
        {filters.department !== ALL_FILTER_SENTINEL ? (
          <FilterChip
            label="Department"
            value={filters.department}
            onRemove={() => onFilter("department", ALL_FILTER_SENTINEL)}
          />
        ) : null}
        {filters.status !== ALL_FILTER_SENTINEL ? (
          <FilterChip
            label="Status"
            value={getEmployeeStatusVisual(filters.status).label}
            onRemove={() => onFilter("status", ALL_FILTER_SENTINEL)}
          />
        ) : null}
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
