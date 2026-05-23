"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Download,
  Expand,
  Filter,
  FolderKanban,
  Image as ImageIcon,
  Maximize2,
  Minimize,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { LayoutDirection, OrgDepartment, OrgProject } from "./types";
import type { OrgCanvasApi } from "./OrgChartCanvas";

const LAYOUT_OPTIONS: {
  id: LayoutDirection;
  label: string;
  short: string;
  Icon: typeof ArrowDown;
}[] = [
  { id: "TB", label: "Top → Down", short: "TB", Icon: ArrowDown },
  { id: "BT", label: "Bottom → Up", short: "BT", Icon: ArrowUp },
  { id: "LR", label: "Left → Right", short: "LR", Icon: ArrowRight },
  { id: "RL", label: "Right → Left", short: "RL", Icon: ArrowLeft },
];

interface ToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  deptIds: string[];
  onDeptChange: (ids: string[]) => void;
  projectId: string | null;
  onProjectChange: (id: string | null) => void;
  direction: LayoutDirection;
  onDirection: (d: LayoutDirection) => void;
  api: OrgCanvasApi | null;
  onExport: (kind: "png" | "pdf") => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  departments: OrgDepartment[];
  projects: OrgProject[];
}

export function OrgChartToolbar({
  search,
  onSearch,
  deptIds,
  onDeptChange,
  projectId,
  onProjectChange,
  direction,
  onDirection,
  api,
  onExport,
  onToggleFullscreen,
  isFullscreen,
  departments,
  projects,
}: ToolbarProps) {
  const visibleDepts = departments.filter((d) => d.id !== "exec");
  const deptLabel =
    deptIds.length === 0
      ? "All departments"
      : deptIds.length === 1
        ? (departments.find((d) => d.id === deptIds[0])?.name ?? "1 department")
        : `${deptIds.length} departments`;
  const proj = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative min-w-[200px] max-w-[360px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-8 pl-8 pr-7 text-sm"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 text-xs ${deptIds.length > 0 ? "border-gray-900 bg-gray-50 dark:bg-gray-900" : ""}`}
            >
              <Filter className="h-3 w-3" />
              {deptLabel}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <div className="flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <span>Departments</span>
              {deptIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onDeptChange([])}
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium normal-case text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>
            {visibleDepts.map((d) => {
              const checked = deptIds.includes(d.id);
              return (
                <DropdownMenuItem
                  key={d.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    onDeptChange(
                      checked
                        ? deptIds.filter((x) => x !== d.id)
                        : [...deptIds, d.id]
                    );
                  }}
                  className="gap-2"
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] bg-white ${
                      checked ? "border-gray-900" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <Check
                        className="h-3 w-3 text-gray-900"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded"
                    style={{ background: d.color }}
                  />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="font-mono text-[11px] text-gray-500">
                    {d.count}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 text-xs ${projectId ? "border-gray-900 bg-gray-50 dark:bg-gray-900" : ""}`}
            >
              <FolderKanban className="h-3 w-3" />
              {proj ? proj.name : "All projects"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuItem
              onSelect={() => onProjectChange(null)}
              className="gap-2"
            >
              <span
                className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-[1.5px] ${
                  !projectId ? "border-gray-900" : "border-gray-300"
                }`}
              >
                {!projectId && (
                  <span className="block h-[6px] w-[6px] rounded-full bg-gray-900" />
                )}
              </span>
              <span className="flex-1">All projects</span>
            </DropdownMenuItem>
            {projects.map((p) => {
              const on = projectId === p.id;
              return (
                <DropdownMenuItem
                  key={p.id}
                  onSelect={() => onProjectChange(p.id)}
                  className="gap-2"
                >
                  <span
                    className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-[1.5px] ${
                      on ? "border-gray-900" : "border-gray-300"
                    }`}
                  >
                    {on && (
                      <span className="block h-[6px] w-[6px] rounded-full bg-gray-900" />
                    )}
                  </span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="font-mono text-[11px] text-gray-500">
                    {p.memberIds.length}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        role="radiogroup"
        aria-label="Layout direction"
        className="inline-flex gap-px rounded-md bg-gray-100 p-0.5 dark:bg-gray-900"
      >
        {LAYOUT_OPTIONS.map((opt) => {
          const { Icon } = opt;
          const active = direction === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              title={opt.label}
              aria-pressed={active}
              onClick={() => onDirection(opt.id)}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-mono">{opt.short}</span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="inline-flex gap-px rounded-md bg-gray-100 p-0.5 dark:bg-gray-900">
          <button
            type="button"
            title="Zoom out"
            onClick={() => api?.zoomOut()}
            className="grid h-7 w-7 place-items-center rounded text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Zoom in"
            onClick={() => api?.zoomIn()}
            className="grid h-7 w-7 place-items-center rounded text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Fit view"
            onClick={() => api?.fitView()}
            className="grid h-7 w-7 place-items-center rounded text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          className="h-8 gap-1.5 text-xs"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="h-3 w-3" />
          ) : (
            <Expand className="h-3 w-3" />
          )}
          {isFullscreen ? "Exit" : "Fullscreen"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Download className="h-3 w-3" />
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onSelect={() => onExport("png")}
              className="gap-2"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="flex-1">Export as PNG</span>
              <span className="rounded bg-gray-100 px-1.5 font-mono text-[10px] text-gray-500">
                2×
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onExport("pdf")}
              className="gap-2"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="flex-1">Export as PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface ChipsProps {
  search: string;
  onSearch: (v: string) => void;
  deptIds: string[];
  onDeptChange: (ids: string[]) => void;
  projectId: string | null;
  onProjectChange: (id: string | null) => void;
  departments: OrgDepartment[];
  projects: OrgProject[];
  visibleCount: number;
  totalCount: number;
}

export function OrgFilterChips({
  search,
  onSearch,
  deptIds,
  onDeptChange,
  projectId,
  onProjectChange,
  departments,
  projects,
  visibleCount,
  totalCount,
}: ChipsProps) {
  const hasFilters = !!search || deptIds.length > 0 || !!projectId;
  if (!hasFilters && visibleCount === totalCount) return null;
  const proj = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-3.5 py-2.5 dark:border-gray-700 dark:bg-gray-900">
      <span className="text-xs text-gray-600 dark:text-gray-400">
        Showing{" "}
        <strong className="font-semibold text-gray-900 dark:text-gray-100">
          {visibleCount}
        </strong>{" "}
        of {totalCount} people
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {search && (
          <span className="inline-flex items-center gap-1.5 rounded bg-gray-100 py-0.5 pl-2.5 pr-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Search className="h-2.5 w-2.5" />“{search}”
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearch("")}
              className="inline-grid h-4 w-4 place-items-center rounded bg-white/60 hover:bg-white"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {deptIds.map((id) => {
          const d = departments.find((x) => x.id === id);
          if (!d) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded py-0.5 pl-2.5 pr-1 text-xs font-medium"
              style={{ background: d.soft, color: d.color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: d.color }}
              />
              {d.name}
              <button
                type="button"
                aria-label={`Remove ${d.name}`}
                onClick={() => onDeptChange(deptIds.filter((x) => x !== id))}
                className="inline-grid h-4 w-4 place-items-center rounded bg-white/60 hover:bg-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          );
        })}
        {proj && (
          <span className="inline-flex items-center gap-1.5 rounded bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-indigo-700">
            <FolderKanban className="h-2.5 w-2.5" />
            {proj.name}
            <button
              type="button"
              aria-label="Clear project filter"
              onClick={() => onProjectChange(null)}
              className="inline-grid h-4 w-4 place-items-center rounded bg-white/60 hover:bg-white"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              onSearch("");
              onDeptChange([]);
              onProjectChange(null);
            }}
            className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
