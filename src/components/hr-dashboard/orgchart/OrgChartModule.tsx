"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { requestOpenEmployee, requestProjectsSearch } from "./crossModuleNav";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { employeeApi } from "@/lib/api/modules/employees";
import { invalidateOrgChartCache } from "./useOrgChartData";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Building,
  Crown,
  Folder,
  GripVertical,
  Hand,
  MapPin,
  Network,
  Users,
  ZoomIn,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { OrgChartCanvas, type OrgCanvasApi } from "./OrgChartCanvas";
import { OrgChartToolbar, OrgFilterChips } from "./OrgChartToolbar";
import { OrgChartEmployeeSheet } from "./OrgChartEmployeeSheet";
import { OrgChartSidebar } from "./OrgChartSidebar";
import { OrgChartDirectory } from "./OrgChartDirectory";
import { OrgChartTeams } from "./OrgChartTeams";
import { useChartSettings } from "./useChartSettings";
import { ChartSettingsDialog } from "./ChartSettingsDialog";
import { applyFilters, computeStats } from "./orgChartUtils";
import { useOrgChartData } from "./useOrgChartData";
import type { LayoutDirection, OrgFilters } from "./types";
import { Loader2 } from "lucide-react";

interface OrgChartModuleProps {
  onNavigate?: (moduleId: string) => void;
}

export function OrgChartModule({ onNavigate }: OrgChartModuleProps = {}) {
  const { employees, departments, projects, loading, error } =
    useOrgChartData();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"orgchart" | "directory" | "teams">(
    "orgchart"
  );
  const [direction, setDirection] = useState<LayoutDirection>("TB");
  const [search, setSearch] = useState("");
  const [deptIds, setDeptIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [api, setApi] = useState<OrgCanvasApi | null>(null);
  const { isAdmin } = useAdminAccess();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartSettingsOpen, setChartSettingsOpen] = useState(false);
  const {
    settings: chartSettings,
    update: updateChartSetting,
    reset: resetChartSettings,
  } = useChartSettings();

  const onToggleFullscreen = () => {
    const node = canvasContainerRef.current;
    if (!node) return;
    if (!document.fullscreenElement) {
      void node.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const employeeToDelete = useMemo(
    () =>
      deleteConfirmId != null
        ? (employees.find((e) => e.id === deleteConfirmId) ?? null)
        : null,
    [deleteConfirmId, employees]
  );

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setIsDeleting(true);
      await employeeApi.deleteEmployee(employeeToDelete.id);
      invalidateOrgChartCache();
      toast.success(`Deleted ${employeeToDelete.name}`);
      setDeleteConfirmId(null);
      // Force reload of cached snapshot — easiest via hard refresh of state
      // by reloading window. Cleaner: re-fetch in useOrgChartData, but
      // cache-only mount means we need a key bump. Quick path: location
      // reload of just this module by remount via key.
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete employee"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filters: OrgFilters = useMemo(
    () => ({ search, deptIds, projectId }),
    [search, deptIds, projectId]
  );

  const { visible } = useMemo(
    () => applyFilters(employees, filters, projects, departments),
    [employees, filters, projects, departments]
  );

  const sidebarStats = useMemo(() => computeStats(employees), [employees]);

  const stats = useMemo(() => {
    const totalDepts = departments.filter((d) => d.id !== "exec").length;
    return {
      total: employees.length,
      departments: totalDepts,
      managers: employees.filter((e) => e.isManager).length,
      remote: employees.filter(
        (e) => e.status === "remote" || /remote/i.test(e.location)
      ).length,
    };
  }, [employees, departments]);

  const selected = useMemo(
    () =>
      selectedId != null ? employees.find((e) => e.id === selectedId) : null,
    [selectedId, employees]
  );

  const onLegendClick = (id: string) =>
    setDeptIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const onExport = async (kind: "png" | "pdf") => {
    if (!api) {
      toast.error("Chart not ready yet — try again in a moment.");
      return;
    }
    try {
      toast.info(`Generating ${kind.toUpperCase()}…`);
      const dataUrl = await api.exportPng();
      if (!dataUrl) {
        toast.error("Nothing to export — chart is empty.");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const baseName = `bloomhub-orgchart-${stamp}`;

      if (kind === "png") {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${baseName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("PNG exported");
        return;
      }

      // PDF: lazy-load jspdf, embed full-resolution PNG, size page to image.
      const { jsPDF } = await import("jspdf");
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load chart image"));
      });
      const orientation = img.width > img.height ? "l" : "p";
      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [img.width, img.height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${baseName}.pdf`);
      toast.success("PDF exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Organization Chart
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Interactive team structure and employee directory.
            </p>
          </div>
          {/* Fullscreen + Export moved into the chart toolbar — keep page
              header lean. Filter button removed (duplicated the toolbar's
              All departments / All projects controls). */}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Total Employees"
            value={stats.total}
            sub="Active workforce"
          />
          <StatCard
            icon={<Building className="h-3.5 w-3.5" />}
            label="Departments"
            value={stats.departments}
            sub="Business units"
          />
          <StatCard
            icon={<Crown className="h-3.5 w-3.5" />}
            label="Managers"
            value={stats.managers}
            sub="Leadership roles"
          />
          <StatCard
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Remote Workers"
            value={stats.remote}
            sub="Working remotely"
          />
        </div>
      </header>

      {/* Body grid */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="w-full"
          >
            <div className="mb-3 flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-800">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger value="orgchart" className="gap-1.5 text-xs">
                  <Network className="h-3 w-3" />
                  Org Chart
                </TabsTrigger>
                <TabsTrigger value="directory" className="gap-1.5 text-xs">
                  <Users className="h-3 w-3" />
                  Directory
                </TabsTrigger>
                <TabsTrigger value="teams" className="gap-1.5 text-xs">
                  <Folder className="h-3 w-3" />
                  Teams
                </TabsTrigger>
              </TabsList>
              <span className="ml-auto px-3 font-mono text-[11px] text-gray-500">
                {visible.size === employees.length
                  ? `${employees.length} people · ${stats.departments} departments`
                  : `${visible.size} of ${employees.length} visible`}
              </span>
            </div>

            {tab === "orgchart" && (
              <div
                ref={canvasContainerRef}
                className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${
                  isFullscreen ? "h-screen w-screen rounded-none" : ""
                }`}
              >
                <OrgChartToolbar
                  search={search}
                  onSearch={setSearch}
                  deptIds={deptIds}
                  onDeptChange={setDeptIds}
                  projectId={projectId}
                  onProjectChange={setProjectId}
                  direction={direction}
                  onDirection={setDirection}
                  api={api}
                  onExport={onExport}
                  onToggleFullscreen={onToggleFullscreen}
                  isFullscreen={isFullscreen}
                  departments={departments}
                  projects={projects}
                />
                <OrgFilterChips
                  search={search}
                  onSearch={setSearch}
                  deptIds={deptIds}
                  onDeptChange={setDeptIds}
                  projectId={projectId}
                  onProjectChange={setProjectId}
                  departments={departments}
                  projects={projects}
                  visibleCount={visible.size}
                  totalCount={employees.length}
                />
                {loading ? (
                  <div className="flex h-[660px] items-center justify-center bg-[#fbfbfa] dark:bg-gray-950">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading org chart…
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-[660px] flex-col items-center justify-center gap-2 bg-[#fbfbfa] px-6 text-center dark:bg-gray-950">
                    <div className="text-sm font-medium text-red-600">
                      {error}
                    </div>
                    <p className="text-xs text-gray-500">
                      Please retry or contact support.
                    </p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="flex h-[660px] flex-col items-center justify-center gap-2 bg-[#fbfbfa] px-6 text-center dark:bg-gray-950">
                    <Network className="h-7 w-7 text-gray-400" />
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      No employees yet
                    </div>
                    <p className="max-w-sm text-xs text-gray-500">
                      Add your first employee to start building the organization
                      chart.
                    </p>
                  </div>
                ) : (
                  <OrgChartCanvas
                    employees={employees}
                    departments={departments}
                    projects={projects}
                    direction={direction}
                    filters={filters}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onReady={setApi}
                    fillParent={isFullscreen}
                    animations={chartSettings.animations}
                    showGrid={chartSettings.showGrid}
                    compactNodes={chartSettings.compactNodes}
                    showDeptPill={chartSettings.showDeptPill}
                    edgeOpacity={chartSettings.edgeOpacity}
                    onViewEmployee={(id) => {
                      requestOpenEmployee(id);
                      onNavigate?.("profiles");
                    }}
                    onViewProjects={(id) => {
                      const emp = employees.find((e) => e.id === id);
                      requestProjectsSearch(emp?.name ?? "");
                      onNavigate?.("projects");
                    }}
                    onCenterOn={(id) => api?.centerOn(id)}
                    onCopyEmail={(v) => {
                      void navigator.clipboard?.writeText(v);
                      toast.success("Email copied");
                    }}
                    onCopyPhone={(v) => {
                      void navigator.clipboard?.writeText(v);
                      toast.success("Phone copied");
                    }}
                    onCopyEmployeeId={(id) =>
                      toast.success(`Employee ID #${id} copied`)
                    }
                    canDeleteEmployee={isAdmin}
                    onDeleteEmployee={(id) => setDeleteConfirmId(id)}
                  />
                )}
                {/* Footer micro-legend */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-3.5 py-2.5 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-wrap items-center gap-3.5">
                    <span className="inline-flex items-center gap-1">
                      <Hand className="h-3 w-3" /> Drag to pan
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ZoomIn className="h-3 w-3" /> Scroll to zoom
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GripVertical className="h-3 w-3" /> Drag node to
                      reposition
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3.5">
                    <Legend dot="#22c55e" label="Active" />
                    <Legend dot="#f59e0b" label="On leave" />
                    <Legend dot="#3b82f6" label="Remote" />
                    <span className="inline-flex items-center gap-1">
                      <Crown className="h-3 w-3 text-amber-600" /> Manager
                    </span>
                  </div>
                </div>
              </div>
            )}

            {tab === "directory" && (
              <OrgChartDirectory
                employees={employees}
                departments={departments}
                onOpen={setSelectedId}
              />
            )}
            {tab === "teams" && (
              <OrgChartTeams
                employees={employees}
                departments={departments}
                projects={projects}
                onOpen={setSelectedId}
              />
            )}
          </Tabs>
        </div>

        <OrgChartSidebar
          departments={departments}
          activeDepts={deptIds}
          onLegendClick={onLegendClick}
          onAddEmployee={() => onNavigate?.("profiles")}
          onManageDepartments={
            isAdmin ? () => onNavigate?.("admin") : undefined
          }
          canManageDepartments={isAdmin}
          onExport={onExport}
          onChartSettings={() => setChartSettingsOpen(true)}
          stats={sidebarStats}
        />
      </div>

      {selected && (
        <OrgChartEmployeeSheet
          employee={selected}
          employees={employees}
          departments={departments}
          onClose={() => setSelectedId(null)}
          onSelect={(id) => setSelectedId(id)}
          onCenterOn={(id) => api?.centerOn(id)}
          onNavigateProfile={(id) => {
            requestOpenEmployee(id);
            onNavigate?.("profiles");
          }}
          onNavigateProjects={(id) => {
            const emp = employees.find((e) => e.id === id);
            requestProjectsSearch(emp?.name ?? "");
            onNavigate?.("projects");
          }}
        />
      )}

      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToDelete
                ? `This will permanently delete ${employeeToDelete.name} and all linked data (assignments, CVs, history). This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : "Delete employee"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChartSettingsDialog
        open={chartSettingsOpen}
        onOpenChange={setChartSettingsOpen}
        settings={chartSettings}
        onChange={updateChartSetting}
        onReset={resetChartSettings}
        onResetPositions={() => {
          api?.resetPositions();
          toast.success("Node positions reset");
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: dot }}
      />
      {label}
    </span>
  );
}
