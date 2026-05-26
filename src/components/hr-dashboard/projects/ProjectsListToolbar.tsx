"use client";

import { Search, X, Filter, LayoutGrid, List } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";
import { PROJECT_STATUSES } from "./projectsData";
import { activeFilterCount } from "./projectsHelpers";
import type {
  ProjectsListFilters,
  ProjectsListView,
  ProjectStatus,
} from "./types";

interface ProjectsListToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  view: ProjectsListView;
  onView: (v: ProjectsListView) => void;
  filters: ProjectsListFilters;
  onFilter: <K extends keyof ProjectsListFilters>(
    key: K,
    value: ProjectsListFilters[K]
  ) => void;
  onClearAll: () => void;
  clients: string[];
  resultCount: number;
  totalCount: number;
}

const SORT_OPTIONS: ProjectsListFilters["sort"][] = [
  "Newest",
  "Oldest",
  "Name (A-Z)",
  "Progress",
];

export function ProjectsListToolbar({
  search,
  onSearch,
  view,
  onView,
  filters,
  onFilter,
  onClearAll,
  clients,
  resultCount,
  totalCount,
}: ProjectsListToolbarProps) {
  const active = activeFilterCount(search, filters);
  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div
          data-projects-search
          className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg bg-gray-100 px-3 transition-shadow focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300"
        >
          <Search className="h-3.5 w-3.5 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search projects by name, code, or client…"
            className="h-9 border-0 bg-transparent px-0 text-[13px] text-gray-900 shadow-none placeholder:text-gray-500 focus-visible:ring-0"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="rounded p-0.5 text-gray-500 hover:bg-black/5 hover:text-gray-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
              ⌘K
            </kbd>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => onFilter("status", v as ProjectStatus | "All")}
            options={["All", ...PROJECT_STATUSES]}
          />
          <FilterSelect
            label="Client"
            value={filters.client}
            onChange={(v) => onFilter("client", v)}
            options={["All", ...clients]}
          />
          <FilterSelect
            label="Sort"
            value={filters.sort}
            onChange={(v) => onFilter("sort", v as ProjectsListFilters["sort"])}
            options={SORT_OPTIONS}
          />
        </div>

        <div className="ml-auto inline-flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
          <ToggleBtn
            active={view === "grid"}
            onClick={() => onView("grid")}
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
            label="Grid"
          />
          <ToggleBtn
            active={view === "list"}
            onClick={() => onView("list")}
            icon={<List className="h-3.5 w-3.5" />}
            label="List"
          />
        </div>
      </div>

      {active > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-gray-200 px-1 pt-2.5">
          <span className="text-[12px]">
            <span className="font-mono font-semibold text-gray-900">
              {resultCount}
            </span>
            <span className="text-gray-700"> of {totalCount} projects</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {search ? (
              <ActiveChip
                label={`Search: "${search}"`}
                onRemove={() => onSearch("")}
              />
            ) : null}
            {filters.status !== "All" ? (
              <ActiveChip
                label={`Status: ${filters.status}`}
                onRemove={() => onFilter("status", "All")}
              />
            ) : null}
            {filters.client !== "All" ? (
              <ActiveChip
                label={`Client: ${filters.client}`}
                onRemove={() => onFilter("client", "All")}
              />
            ) : null}
            <button
              type="button"
              onClick={onClearAll}
              className="rounded px-2 py-1 text-[12px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Clear all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-gray-500 transition-colors hover:border-gray-300">
      <Filter className="h-3 w-3" />
      <span className="text-[12px] font-medium">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-auto min-w-0 border-0 bg-transparent px-1 py-0 text-[12px] font-medium text-gray-900 shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((o) => o !== "")
            .map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ToggleBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ToggleBtn({ active, onClick, icon, label }: ToggleBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-3 py-1 text-[12px] font-medium transition-all",
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
}

function ActiveChip({ label, onRemove }: ActiveChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-indigo-50 px-2.5 py-0.5 text-[12px] text-indigo-700">
      <strong className="font-semibold">{label}</strong>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="h-4 w-4 rounded bg-white/60 p-0 text-indigo-700 hover:bg-white"
      >
        <X className="h-2.5 w-2.5" />
      </Button>
    </span>
  );
}
