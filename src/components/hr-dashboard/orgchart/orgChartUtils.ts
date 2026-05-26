import type {
  LayoutDirection,
  LayoutEdge,
  LayoutNode,
  OrgDepartment,
  OrgEmployee,
  OrgFilters,
  OrgProject,
} from "./types";

export const NODE_W_NORMAL = 256;
export const NODE_H_NORMAL = 96;
export const NODE_W_COMPACT = 220;
export const NODE_H_COMPACT = 76;

const HSPACING_TB = 28;
const VSPACING_TB = 90;
const HSPACING_LR = 90;
const VSPACING_LR = 22;

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] ?? "")
    .join("")
    .toUpperCase();

export const isCompactEmp = (e: OrgEmployee) => !e.isManager;

const nodeSize = (e: OrgEmployee) =>
  isCompactEmp(e)
    ? { w: NODE_W_COMPACT, h: NODE_H_COMPACT }
    : { w: NODE_W_NORMAL, h: NODE_H_NORMAL };

interface TreeNode {
  emp: OrgEmployee;
  children: TreeNode[];
  subtreePrimary: number;
  primary: number;
  depth: number;
}

/**
 * Returns ALL roots (the input may be a forest after filtering, since
 * removing managers from the visible set can leave their reports orphaned in
 * multiple disconnected subtrees). Each returned node is a real employee
 * whose manager is not in the visible set (or has no manager at all).
 */
export function buildTree(employees: OrgEmployee[]): TreeNode[] {
  const byId: Record<number, TreeNode> = {};
  employees.forEach((e) => {
    byId[e.id] = {
      emp: e,
      children: [],
      subtreePrimary: 0,
      primary: 0,
      depth: 0,
    };
  });

  const idSet = new Set(employees.map((e) => e.id));
  const roots: TreeNode[] = [];
  employees.forEach((e) => {
    if (e.managerId == null || !idSet.has(e.managerId)) {
      roots.push(byId[e.id]);
    } else {
      byId[e.managerId].children.push(byId[e.id]);
    }
  });

  Object.values(byId).forEach((n) => {
    n.children.sort((a, b) => {
      if (a.emp.isManager !== b.emp.isManager) return a.emp.isManager ? -1 : 1;
      return a.emp.name.localeCompare(b.emp.name);
    });
  });

  // Stable root order: managers first, then by name.
  roots.sort((a, b) => {
    if (a.emp.isManager !== b.emp.isManager) return a.emp.isManager ? -1 : 1;
    return a.emp.name.localeCompare(b.emp.name);
  });

  return roots;
}

export function tidyLayout(
  rootOrRoots: TreeNode | TreeNode[] | null,
  direction: LayoutDirection = "TB",
  opts: { forceCompact?: boolean } = {}
): { nodes: LayoutNode[]; width: number; height: number } {
  if (!rootOrRoots) return { nodes: [], width: 0, height: 0 };
  const roots = Array.isArray(rootOrRoots) ? rootOrRoots : [rootOrRoots];
  if (roots.length === 0) return { nodes: [], width: 0, height: 0 };

  // If filtering produced a forest, wrap in a synthetic root so the layout
  // routine can lay out every subtree side-by-side. Synthetic node is
  // sentinel-only — stripped from the emitted output.
  const SYNTHETIC_ID = -1;
  const root: TreeNode =
    roots.length === 1
      ? roots[0]
      : {
          emp: {
            id: SYNTHETIC_ID,
            name: "",
            role: "",
            deptId: "",
            managerId: null,
            isManager: true,
            status: "active",
            email: "",
            phone: "",
            location: "",
            startDate: "",
            skills: [],
          },
          children: roots,
          subtreePrimary: 0,
          primary: 0,
          depth: 0,
        };

  const isVertical = direction === "TB" || direction === "BT";
  const HSPACE = isVertical ? HSPACING_TB : HSPACING_LR;
  const VSPACE = isVertical ? VSPACING_TB : VSPACING_LR;

  // Synthetic root sentinel: 0×0 so it doesn't displace layout.
  // forceCompact: shrink every node (including managers) to the compact
  // dimensions so the whole tree uses less screen real estate.
  const sizeOf = (n: TreeNode) => {
    if (n.emp.id === SYNTHETIC_ID) return { w: 0, h: 0 };
    if (opts.forceCompact) {
      return { w: NODE_W_COMPACT, h: NODE_H_COMPACT };
    }
    return nodeSize(n.emp);
  };

  // Pass 1: subtree extent along the sibling axis
  function widthPass(node: TreeNode) {
    const { w, h } = sizeOf(node);
    const ownPrimary = isVertical ? w : h;
    if (node.children.length === 0) {
      node.subtreePrimary = ownPrimary;
      return;
    }
    let total = 0;
    node.children.forEach((c, i) => {
      widthPass(c);
      total += c.subtreePrimary;
      if (i > 0) total += HSPACE;
    });
    node.subtreePrimary = Math.max(ownPrimary, total);
  }
  widthPass(root);

  // Pass 2: assign primary-axis positions
  function placePass(node: TreeNode, primaryStart: number, depth: number) {
    const { w, h } = sizeOf(node);
    const ownPrimary = isVertical ? w : h;
    node.depth = depth;

    if (node.children.length === 0) {
      node.primary = primaryStart + (node.subtreePrimary - ownPrimary) / 2;
      return;
    }

    let childrenTotal = 0;
    node.children.forEach((c, i) => {
      childrenTotal += c.subtreePrimary;
      if (i > 0) childrenTotal += HSPACE;
    });
    let cursor = primaryStart + (node.subtreePrimary - childrenTotal) / 2;
    node.children.forEach((c) => {
      placePass(c, cursor, depth + 1);
      cursor += c.subtreePrimary + HSPACE;
    });
    const first = node.children[0];
    const last = node.children[node.children.length - 1];
    const lastSize = isVertical ? sizeOf(last).w : sizeOf(last).h;
    const childMid = (first.primary + (last.primary + lastSize)) / 2;
    node.primary = childMid - ownPrimary / 2;
  }
  placePass(root, 0, 0);

  // Pass 3: secondary-axis extents per depth
  const levelExtents: number[] = [];
  function levelPass(node: TreeNode) {
    const { w, h } = sizeOf(node);
    const sec = isVertical ? h : w;
    levelExtents[node.depth] = Math.max(levelExtents[node.depth] || 0, sec);
    node.children.forEach(levelPass);
  }
  levelPass(root);

  const levelStarts: number[] = [0];
  for (let i = 0; i < levelExtents.length; i++) {
    levelStarts[i + 1] = levelStarts[i] + levelExtents[i] + VSPACE;
  }
  const totalSecondary = levelStarts[levelExtents.length] - VSPACE;

  // Pass 4: emit (skip synthetic root sentinel)
  const out: LayoutNode[] = [];
  function emit(node: TreeNode) {
    const { w, h } = sizeOf(node);
    if (node.emp.id !== SYNTHETIC_ID) {
      let x: number, y: number;
      if (direction === "TB") {
        x = node.primary;
        y = levelStarts[node.depth];
      } else if (direction === "BT") {
        x = node.primary;
        y = totalSecondary - levelStarts[node.depth] - h;
      } else if (direction === "LR") {
        y = node.primary;
        x = levelStarts[node.depth];
      } else {
        y = node.primary;
        x = totalSecondary - levelStarts[node.depth] - w;
      }
      out.push({
        id: node.emp.id,
        emp: node.emp,
        x,
        y,
        w,
        h,
        depth: node.depth,
      });
    }
    node.children.forEach(emit);
  }
  emit(root);

  if (out.length === 0) return { nodes: [], width: 0, height: 0 };

  const minX = Math.min(...out.map((n) => n.x));
  const minY = Math.min(...out.map((n) => n.y));
  const maxX = Math.max(...out.map((n) => n.x + n.w));
  const maxY = Math.max(...out.map((n) => n.y + n.h));
  out.forEach((n) => {
    n.x -= minX;
    n.y -= minY;
  });
  return { nodes: out, width: maxX - minX, height: maxY - minY };
}

export function buildEdges(employees: OrgEmployee[]): LayoutEdge[] {
  return employees
    .filter((e) => e.managerId != null)
    .map((e) => ({
      id: `e-${e.managerId}-${e.id}`,
      source: e.managerId as number,
      target: e.id,
      colorEmp: e,
    }));
}

interface Point {
  x: number;
  y: number;
}

export function edgePath(s: Point, t: Point, direction: LayoutDirection) {
  const r = 8;
  if (direction === "TB" || direction === "BT") {
    const midY = (s.y + t.y) / 2;
    const dir = t.y > s.y ? 1 : -1;
    if (Math.abs(s.x - t.x) < 1) {
      return `M ${s.x},${s.y} L ${t.x},${t.y}`;
    }
    return [
      `M ${s.x},${s.y}`,
      `L ${s.x},${midY - r * dir}`,
      `Q ${s.x},${midY} ${s.x + (t.x > s.x ? r : -r)},${midY}`,
      `L ${t.x - (t.x > s.x ? r : -r)},${midY}`,
      `Q ${t.x},${midY} ${t.x},${midY + r * dir}`,
      `L ${t.x},${t.y}`,
    ].join(" ");
  }
  const midX = (s.x + t.x) / 2;
  const dir = t.x > s.x ? 1 : -1;
  if (Math.abs(s.y - t.y) < 1) {
    return `M ${s.x},${s.y} L ${t.x},${t.y}`;
  }
  return [
    `M ${s.x},${s.y}`,
    `L ${midX - r * dir},${s.y}`,
    `Q ${midX},${s.y} ${midX},${s.y + (t.y > s.y ? r : -r)}`,
    `L ${midX},${t.y - (t.y > s.y ? r : -r)}`,
    `Q ${midX},${t.y} ${midX + r * dir},${t.y}`,
    `L ${t.x},${t.y}`,
  ].join(" ");
}

export function nodePorts(n: LayoutNode, direction: LayoutDirection) {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  if (direction === "TB")
    return { src: { x: cx, y: n.y + n.h }, tgt: { x: cx, y: n.y } };
  if (direction === "BT")
    return { src: { x: cx, y: n.y }, tgt: { x: cx, y: n.y + n.h } };
  if (direction === "LR")
    return { src: { x: n.x + n.w, y: cy }, tgt: { x: n.x, y: cy } };
  return { src: { x: n.x, y: cy }, tgt: { x: n.x + n.w, y: cy } };
}

export function applyFilters(
  employees: OrgEmployee[],
  { search, deptIds, projectId }: OrgFilters,
  projects: OrgProject[],
  _departments?: OrgDepartment[]
) {
  let visible = new Set(employees.map((e) => e.id));
  const byId = Object.fromEntries(employees.map((e) => [e.id, e]));

  if (deptIds.length > 0) {
    const depts = new Set(deptIds);
    // Strict match: only employees whose primary department is in the
    // selected set. Executives are no longer auto-included nor are managers
    // up the chain — picking "Engineering" yields engineers only. The tidy
    // tree falls back to the topmost remaining node as root, so sub-trees
    // (e.g. CTO + engineering org) still render rooted correctly when the
    // CTO themselves is tagged as Engineering.
    //
    // TODO[multi-dept]: when the backend supports multi-department
    // membership (e.g. a CTO tagged as both Executive AND Engineering),
    // extend the match to check that membership array.
    visible = new Set(
      employees.filter((e) => depts.has(e.deptId)).map((e) => e.id)
    );
  }

  if (projectId) {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      const members = new Set(proj.memberIds);
      const expand = new Set(members);
      members.forEach((mId) => {
        let cur: OrgEmployee | undefined = byId[mId];
        while (cur && cur.managerId != null) {
          expand.add(cur.managerId);
          cur = byId[cur.managerId];
        }
      });
      visible = new Set([...visible].filter((id) => expand.has(id)));
    }
  }

  const highlighted = new Set<number>();
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    employees.forEach((e) => {
      if (
        visible.has(e.id) &&
        (e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
      ) {
        highlighted.add(e.id);
      }
    });
  }

  return { visible, highlighted };
}

export function deptOf(
  e: OrgEmployee,
  departments: OrgDepartment[]
): OrgDepartment {
  return (
    departments.find((d) => d.id === e.deptId) ??
    departments.find((d) => d.id === "exec") ??
    departments[0]
  );
}

export function reportsOf(id: number, employees: OrgEmployee[]) {
  return employees.filter((e) => e.managerId === id);
}

export function managerOf(emp: OrgEmployee, employees: OrgEmployee[]) {
  if (emp.managerId == null) return null;
  return employees.find((e) => e.id === emp.managerId) ?? null;
}

export function computeStats(employees: OrgEmployee[]) {
  const managers = employees.filter((e) => e.isManager).length;
  const ics = employees.length - managers;
  const reportsBy: Record<number, number> = {};
  employees.forEach((e) => {
    if (e.managerId != null) {
      reportsBy[e.managerId] = (reportsBy[e.managerId] || 0) + 1;
    }
  });
  const reportCounts = Object.values(reportsBy);
  const avg =
    managers > 0 ? reportCounts.reduce((a, b) => a + b, 0) / managers : 0;
  const span = reportCounts.length > 0 ? Math.max(...reportCounts) : 0;
  return {
    avgTeamSize: avg.toFixed(1),
    mgmtRatio: `1 : ${(ics / Math.max(managers, 1)).toFixed(1)}`,
    span: String(span),
    remote: String(
      employees.filter(
        (e) => /remote/i.test(e.location) || e.status === "remote"
      ).length
    ),
    onLeave: String(employees.filter((e) => e.status === "onLeave").length),
  };
}

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function tenure(iso?: string) {
  if (!iso) return "";
  const start = new Date(iso);
  const ms = Date.now() - start.getTime();
  const yrs = ms / (365.25 * 86_400_000);
  if (yrs < 1) return `${Math.max(0, Math.round(yrs * 12))} mo`;
  return `${Math.floor(yrs * 10) / 10} yr`;
}

export const STATUS_META: Record<string, { color: string; label: string }> = {
  active: { color: "#22c55e", label: "Active" },
  onLeave: { color: "#f59e0b", label: "On leave" },
  remote: { color: "#3b82f6", label: "Remote" },
};
