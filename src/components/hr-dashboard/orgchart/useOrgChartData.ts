"use client";

import { useEffect, useState } from "react";
import { employeeApi } from "@/lib/api/modules/employees";
import { departmentsApi } from "@/lib/api/modules/departments";
import { projectApi } from "@/lib/api/modules/projects";
import type {
  OrgDepartment,
  OrgEmployee,
  OrgProject,
  OrgRecentUpdate,
  OrgStatus,
} from "./types";

// Fallback palette — applied positionally if the backend does not yet return
// a per-department color. Once the backend exposes color metadata (see the
// MISSING ENDPOINTS list in the module README), prefer that and drop this.
const DEPT_PALETTE: { color: string; soft: string }[] = [
  { color: "#4f46e5", soft: "#eef2ff" },
  { color: "#ea580c", soft: "#fff7ed" },
  { color: "#7c3aed", soft: "#f5f3ff" },
  { color: "#16a34a", soft: "#f0fdf4" },
  { color: "#e11d48", soft: "#fff1f2" },
  { color: "#d97706", soft: "#fffbeb" },
  { color: "#0891b2", soft: "#ecfeff" },
  { color: "#475569", soft: "#f1f5f9" },
  { color: "#059669", soft: "#ecfdf5" },
  { color: "#171717", soft: "#f3f4f6" },
];

function paletteFor(i: number) {
  return DEPT_PALETTE[i % DEPT_PALETTE.length];
}

function mapStatus(raw: string | undefined, location: string): OrgStatus {
  const v = (raw ?? "").toLowerCase();
  if (v === "on_leave" || v === "onleave") return "onLeave";
  if (v === "remote" || /remote/i.test(location)) return "remote";
  return "active";
}

export interface OrgChartDataState {
  employees: OrgEmployee[];
  departments: OrgDepartment[];
  projects: OrgProject[];
  recentUpdates: OrgRecentUpdate[];
  loading: boolean;
  error: string | null;
}

interface OrgChartSnapshot {
  employees: OrgEmployee[];
  departments: OrgDepartment[];
  projects: OrgProject[];
  recentUpdates: OrgRecentUpdate[];
}

// Module-scoped cache. Lives for the lifetime of the page (until full reload),
// so switching away from the org chart module and back does not refetch.
// Call `invalidateOrgChartCache()` after mutations to force refresh.
let cachedSnapshot: OrgChartSnapshot | null = null;
let inflight: Promise<OrgChartSnapshot> | null = null;

export function invalidateOrgChartCache() {
  cachedSnapshot = null;
  inflight = null;
}

export function useOrgChartData(): OrgChartDataState {
  const [state, setState] = useState<OrgChartDataState>(() =>
    cachedSnapshot
      ? { ...cachedSnapshot, loading: false, error: null }
      : {
          employees: [],
          departments: [],
          projects: [],
          recentUpdates: [],
          loading: true,
          error: null,
        }
  );

  useEffect(() => {
    if (cachedSnapshot) return;
    let cancelled = false;

    async function fetchSnapshot(): Promise<OrgChartSnapshot> {
      const [empResp, deptList, projResp] = await Promise.all([
        // TODO[BHB-orgchart]: a dedicated `GET /api/org-chart/` endpoint
        // returning the full tree in a single roundtrip would replace this
        // list call and avoid the FE having to derive `isManager`.
        employeeApi.listEmployees({ is_active: true, page_size: 500 }),
        departmentsApi.listDepartments(),
        projectApi.list({ page_size: 200 }),
      ]);

      // `GET /api/projects/` omits `active_members`; detail endpoint includes
      // them. Hydrate in parallel so project member counts/filter rosters
      // populate on first load.
      // TODO[BHB-projects]: drop this once list endpoint embeds members.
      const hydratedProjects = await Promise.all(
        projResp.results.map(async (p) => {
          if (p.active_members && p.active_members.length > 0) return p;
          try {
            return await projectApi.get(p.id);
          } catch {
            return p;
          }
        })
      );

      return buildSnapshot(empResp, deptList, {
        ...projResp,
        results: hydratedProjects,
      });
    }

    async function load() {
      try {
        if (!inflight) inflight = fetchSnapshot();
        const snap = await inflight;
        if (cancelled) return;
        cachedSnapshot = snap;
        inflight = null;
        setState({
          ...snap,
          loading: false,
          error: null,
        });
        return;
      } catch (err) {
        inflight = null;
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error:
            err instanceof Error ? err.message : "Failed to load org chart",
        }));
        return;
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

type EmpListResp = Awaited<ReturnType<typeof employeeApi.listEmployees>>;
type DeptListResp = Awaited<ReturnType<typeof departmentsApi.listDepartments>>;
type ProjListResp = Awaited<ReturnType<typeof projectApi.list>>;

function buildSnapshot(
  empResp: EmpListResp,
  deptList: DeptListResp,
  projResp: ProjListResp
): OrgChartSnapshot {
  const deptByName: Record<string, OrgDepartment> = {};
  const departments: OrgDepartment[] = deptList.map((d, i) => {
    const c = paletteFor(i);
    const dept: OrgDepartment = {
      id: String(d.id),
      name: d.name,
      color: c.color,
      soft: c.soft,
      count: 0,
    };
    deptByName[d.name.toLowerCase()] = dept;
    return dept;
  });

  const apiEmployees = empResp.results;

  // Manager derivation: anyone who appears in another employee's
  // manager_ids is a manager. Picks the first listed manager as the
  // primary reporting line, since the chart shows a single tree.
  const isManagerSet = new Set<number>();
  apiEmployees.forEach((e) => {
    (e.manager_ids ?? []).forEach((mid) => isManagerSet.add(mid));
  });

  const employees: OrgEmployee[] = apiEmployees.map((e) => {
    const name = `${e.first_name} ${e.last_name}`.trim();
    const deptName = (e.department ?? "").toLowerCase();
    const dept = deptName ? deptByName[deptName] : undefined;
    if (dept) dept.count += 1;
    const location = (e as { location?: string }).location?.toString() ?? "";
    return {
      id: e.id,
      name,
      role: e.role?.name ?? "—",
      deptId: dept?.id ?? "",
      managerId: e.manager_ids?.[0] ?? null,
      isManager: isManagerSet.has(e.id),
      status: mapStatus(e.employment_status, location),
      email: e.email,
      phone: e.phone_number ?? "",
      location,
      startDate: e.start_date,
      skills: (e.technology_tags ?? []).map((t) => t.name),
    };
  });

  // Projects → memberIds from active_members (ProjectAssignment).
  const projects: OrgProject[] = projResp.results.map((p) => ({
    id: String(p.id),
    name: p.name,
    status: p.status,
    memberIds: (p.active_members ?? []).map((a) => a.user_profile_id),
  }));

  // TODO[BHB-orgchart]: wire to GET /api/org-chart/recent-updates/ once
  // the backend exposes a feed of org changes (hires, promotions,
  // reassignments, leaves).
  const recentUpdates: OrgRecentUpdate[] = [];

  return { employees, departments, projects, recentUpdates };
}
