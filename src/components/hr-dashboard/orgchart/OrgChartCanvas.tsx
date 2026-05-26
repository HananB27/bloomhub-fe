"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  NODE_W_COMPACT,
  applyFilters,
  buildEdges,
  buildTree,
  deptOf,
  edgePath,
  nodePorts,
  tidyLayout,
} from "./orgChartUtils";
import { OrgChartNode } from "./OrgChartNode";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Crosshair,
  Eye,
  FolderKanban,
  Mail,
  Phone,
  Copy,
  MoreVertical,
  Trash2,
} from "lucide-react";

interface NodeActionItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
  separatorBefore?: boolean;
  destructive?: boolean;
}
import type {
  LayoutDirection,
  LayoutNode,
  OrgDepartment,
  OrgEmployee,
  OrgFilters,
  OrgProject,
} from "./types";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.8;

export interface OrgCanvasApi {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: (subset?: Set<number>) => void;
  centerOn: (id: number) => void;
  /**
   * Rasterize the entire diagram (all nodes + edges at natural layout
   * size, 2× DPI, white background, no grid). Returns a PNG data URL.
   * Captures the world layer with transform reset, so the export shows
   * the full tree regardless of current pan/zoom or viewport.
   */
  exportPng: () => Promise<string | null>;
  /** Clear user-drag overrides so nodes snap back to tidy-tree positions. */
  resetPositions: () => void;
}

interface Props {
  employees: OrgEmployee[];
  departments: OrgDepartment[];
  projects: OrgProject[];
  direction: LayoutDirection;
  filters: OrgFilters;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReady?: (api: OrgCanvasApi) => void;
  onViewEmployee?: (id: number) => void;
  onViewProjects?: (id: number) => void;
  onCenterOn?: (id: number) => void;
  onCopyEmail?: (email: string) => void;
  onCopyPhone?: (phone: string) => void;
  onCopyEmployeeId?: (id: number) => void;
  onDeleteEmployee?: (id: number) => void;
  canDeleteEmployee?: boolean;
  /** When true, canvas grows to fill the parent (used in fullscreen mode). */
  fillParent?: boolean;
  /** User render preferences from useChartSettings. */
  animations?: boolean;
  showGrid?: boolean;
  compactNodes?: boolean;
  showDeptPill?: boolean;
  edgeOpacity?: number;
}

interface View {
  tx: number;
  ty: number;
  s: number;
}

export function OrgChartCanvas({
  employees,
  departments,
  projects,
  direction,
  filters,
  selectedId,
  onSelect,
  onReady,
  onViewEmployee,
  onViewProjects,
  onCenterOn,
  onCopyEmail,
  onCopyPhone,
  onCopyEmployeeId,
  onDeleteEmployee,
  canDeleteEmployee = false,
  fillParent = false,
  animations = true,
  showGrid = true,
  compactNodes = false,
  showDeptPill = true,
  edgeOpacity = 0.55,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const zoomIndicatorRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ tx: 0, ty: 0, s: 1 });
  // Live view ref — mirrors `view` but updated synchronously without React
  // re-renders during pan/wheel. Source-of-truth for continuous interaction
  // math (node drag scale, wheel zoom pivot). React state syncs on
  // pointer-up so derived render outputs (edges, fit-view subset, etc.)
  // eventually align.
  const liveViewRef = useRef<View>({ tx: 0, ty: 0, s: 1 });
  useEffect(() => {
    liveViewRef.current = view;
    // Keep DOM in sync when React-driven view changes (fit, center,
    // programmatic zoom). Pan/wheel skip setState and mutate DOM directly.
    applyViewToDom(view);
    // applyViewToDom is stable (useCallback w/ []).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  // Drives DOM mutations directly during pan/wheel — bypasses React render
  // cycle. ~60fps with 40+ Radix-wrapped nodes vs ~30fps when setState fires
  // on every pointermove.
  const applyViewToDom = useCallback((v: View) => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
    }
    if (backgroundRef.current) {
      backgroundRef.current.style.backgroundPosition = `${v.tx % (24 * v.s)}px ${v.ty % (24 * v.s)}px`;
      backgroundRef.current.style.backgroundSize = `${24 * v.s}px ${24 * v.s}px`;
    }
    if (zoomIndicatorRef.current) {
      zoomIndicatorRef.current.textContent = `${Math.round(v.s * 100)}%`;
    }
  }, []);
  // Tracks whether the next view update should ease (programmatic motion:
  // fit, center, toolbar zoom buttons) or snap (continuous user motion:
  // wheel zoom, drag pan, node drag).
  const [viewAnimating, setViewAnimating] = useState(false);
  const animateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setViewSmooth = useCallback((updater: (v: View) => View) => {
    setViewAnimating(true);
    setView(updater);
    if (animateTimeoutRef.current) clearTimeout(animateTimeoutRef.current);
    animateTimeoutRef.current = setTimeout(() => setViewAnimating(false), 380);
  }, []);
  const setViewInstant = useCallback((updater: (v: View) => View) => {
    if (animateTimeoutRef.current) {
      clearTimeout(animateTimeoutRef.current);
      animateTimeoutRef.current = null;
    }
    setViewAnimating(false);
    setView(updater);
  }, []);
  const [overrides, setOverrides] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [dragNodeId, setDragNodeId] = useState<number | null>(null);
  const dragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
    moved: boolean;
    lastX?: number;
    lastY?: number;
  } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; view: View } | null>(
    null
  );
  // Per-node DOM refs for direct transform mutations during node drag.
  const nodeWrapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Per-edge SVG path refs — for live `d` updates during drag so edges
  // follow the moving node without waiting for React commit.
  const edgeRefs = useRef<Record<string, SVGPathElement | null>>({});

  const { visible, highlighted } = useMemo(
    () => applyFilters(employees, filters, projects, departments),
    [employees, filters, projects, departments]
  );

  const layout = useMemo(() => {
    const visibleEmps = employees.filter((e) => visible.has(e.id));
    const root = buildTree(visibleEmps);
    return tidyLayout(root, direction, { forceCompact: compactNodes });
  }, [employees, visible, direction, compactNodes]);

  useEffect(() => {
    setOverrides({});
  }, [direction]);

  const positionedNodes: LayoutNode[] = useMemo(
    () =>
      layout.nodes.map((n) => {
        const o = overrides[n.id];
        return o ? { ...n, x: o.x, y: o.y } : n;
      }),
    [layout, overrides]
  );
  const nodeById = useMemo(
    () => Object.fromEntries(positionedNodes.map((n) => [n.id, n])),
    [positionedNodes]
  );

  const edges = useMemo(() => {
    return buildEdges(employees)
      .filter((e) => visible.has(e.source) && visible.has(e.target))
      .map((e) => {
        const s = nodeById[e.source];
        const t = nodeById[e.target];
        if (!s || !t) return null;
        const ports = {
          src: nodePorts(s, direction).src,
          tgt: nodePorts(t, direction).tgt,
        };
        const dept = deptOf(e.colorEmp, departments);
        const path = edgePath(ports.src, ports.tgt, direction);
        return { ...e, path, color: dept.color, deptId: dept.id };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [employees, visible, nodeById, direction, departments]);

  const fitView = useCallback(
    (subset?: Set<number>) => {
      if (!wrapperRef.current) return;
      const wrap = wrapperRef.current.getBoundingClientRect();
      const target = subset
        ? positionedNodes.filter((n) => subset.has(n.id))
        : positionedNodes;
      if (target.length === 0) return;
      const minX = Math.min(...target.map((n) => n.x));
      const minY = Math.min(...target.map((n) => n.y));
      const maxX = Math.max(...target.map((n) => n.x + n.w));
      const maxY = Math.max(...target.map((n) => n.y + n.h));
      const w = maxX - minX;
      const h = maxY - minY;
      const padding = 60;
      const sx = (wrap.width - padding * 2) / Math.max(1, w);
      const sy = (wrap.height - padding * 2) / Math.max(1, h);
      const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(sx, sy)));
      const tx = wrap.width / 2 - (minX + w / 2) * s;
      const ty = wrap.height / 2 - (minY + h / 2) * s;
      setViewSmooth(() => ({ tx, ty, s }));
    },
    [positionedNodes, setViewSmooth]
  );

  const fittedRef = useRef(false);
  useEffect(() => {
    if (!fittedRef.current && positionedNodes.length > 0) {
      fitView();
      fittedRef.current = true;
    }
  }, [positionedNodes, fitView]);

  useEffect(() => {
    if (fittedRef.current) requestAnimationFrame(() => fitView());
    // intentional: re-fit on direction OR filter change so the visible set
    // is centered after every reflow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, filters.search, filters.projectId, filters.deptIds.join(",")]);

  // Stable imperative API published once; reads latest state from refs to
  // avoid a feedback loop with the parent's setState.
  const latestRef = useRef({ view, nodeById, positionedNodes, edges });
  useEffect(() => {
    latestRef.current = { view, nodeById, positionedNodes, edges };
  }, [view, nodeById, positionedNodes, edges]);
  const fitViewRef = useRef(fitView);
  useEffect(() => {
    fitViewRef.current = fitView;
  }, [fitView]);
  useEffect(() => {
    if (!onReady) return;
    /**
     * Zoom around the viewport center (NOT the world origin) so the part of
     * the chart the user is currently looking at stays put. Without this,
     * top-left scaling visually slides everything down-right on zoom-in.
     */
    const zoomBy = (factor: number) => {
      if (!wrapperRef.current) return;
      const wrap = wrapperRef.current.getBoundingClientRect();
      const px = wrap.width / 2;
      const py = wrap.height / 2;
      setViewSmooth((v) => {
        const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.s * factor));
        const tx = px - (px - v.tx) * (s / v.s);
        const ty = py - (py - v.ty) * (s / v.s);
        return { tx, ty, s };
      });
    };

    onReady({
      resetPositions: () => setOverrides({}),
      zoomIn: () => zoomBy(1.2),
      zoomOut: () => zoomBy(1 / 1.2),
      fitView: (subset) => fitViewRef.current(subset),
      centerOn: (id) => {
        const { view: v, nodeById: nb } = latestRef.current;
        const n = nb[id];
        if (!n || !wrapperRef.current) return;
        const wrap = wrapperRef.current.getBoundingClientRect();
        const s = Math.max(0.9, v.s);
        setViewSmooth(() => ({
          s,
          tx: wrap.width / 2 - (n.x + n.w / 2) * s,
          ty: wrap.height / 2 - (n.y + n.h / 2) * s,
        }));
      },
      exportPng: async () => {
        if (!worldRef.current) return null;
        const nodes = latestRef.current.positionedNodes;
        if (nodes.length === 0) return null;
        const minX = Math.min(...nodes.map((n) => n.x));
        const minY = Math.min(...nodes.map((n) => n.y));
        const maxX = Math.max(...nodes.map((n) => n.x + n.w));
        const maxY = Math.max(...nodes.map((n) => n.y + n.h));
        const PAD = 48;
        const width = maxX - minX + PAD * 2;
        const height = maxY - minY + PAD * 2;
        // Lazy-load to keep main bundle small.
        const { toPng } = await import("html-to-image");
        return toPng(worldRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#ffffff",
          width,
          height,
          // Override world's live transform on the cloned export node so the
          // full diagram is captured at natural size — current pan/zoom is
          // ignored. Pad via translate so the bounding box is centered.
          style: {
            transform: `translate(${PAD - minX}px, ${PAD - minY}px)`,
            transformOrigin: "0 0",
            transition: "none",
          },
          filter: (el) => {
            // Strip anything explicitly marked + Radix portals (none should
            // be inside world, but defensive).
            const node = el as HTMLElement;
            if (node.hasAttribute?.("data-no-export")) return false;
            if (node.hasAttribute?.("data-radix-portal")) return false;
            return true;
          },
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React's `onWheel` attaches a passive listener so preventDefault() inside
  // it is a no-op — the page still scrolls. Attach a non-passive native
  // listener instead, so wheel-over-canvas zooms without scrolling the page.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let commitTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const v = liveViewRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.s * factor));
      const tx = px - (px - v.tx) * (s / v.s);
      const ty = py - (py - v.ty) * (s / v.s);
      const next = { tx, ty, s };
      liveViewRef.current = next;
      applyViewToDom(next);
      // Debounced React commit so background derived state (edge re-fits,
      // fit-on-filter effect) eventually sees the final zoom value without
      // forcing a re-render per wheel tick.
      if (commitTimer) clearTimeout(commitTimer);
      commitTimer = setTimeout(() => setViewInstant(() => next), 150);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => {
      if (commitTimer) clearTimeout(commitTimer);
      el.removeEventListener("wheel", handler);
    };
  }, [setViewInstant, applyViewToDom]);

  const onBackgroundPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // React synthetic events bubble through the React tree even when the
    // DOM target lives in a Portal (e.g. Radix menus mount to body). Without
    // this check the canvas would `setPointerCapture` on every menu-item
    // click, eating the pointerup that fires the item's onSelect/onClick.
    const target = e.target as Node;
    if (!wrapperRef.current?.contains(target)) return;
    if ((e.target as HTMLElement).closest("[data-emp-id]")) return;
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      view: liveViewRef.current,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      const startView = panRef.current.view;
      const next = {
        ...startView,
        tx: startView.tx + dx,
        ty: startView.ty + dy,
      };
      liveViewRef.current = next;
      applyViewToDom(next);
    }
    if (dragRef.current) {
      // Use liveViewRef for current scale (state may be stale during pan).
      const s = liveViewRef.current.s;
      const dx = (e.clientX - dragRef.current.startX) / s;
      const dy = (e.clientY - dragRef.current.startY) / s;
      const nx = dragRef.current.startNodeX + dx;
      const ny = dragRef.current.startNodeY + dy;
      const id = dragRef.current.id;
      // Direct DOM mutation on the dragged node — skip React reconciliation
      // of 40+ siblings on every pointermove.
      const wrap = nodeWrapRefs.current[id];
      if (wrap) {
        wrap.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
      }
      // Also update any edge whose endpoint is this node — write d attribute
      // directly so arrows follow the cursor in real time. React state would
      // only commit on pointer-up.
      const node = latestRef.current.nodeById[id];
      if (node) {
        const draggedSnapshot = { ...node, x: nx, y: ny };
        latestRef.current.edges.forEach((edge) => {
          if (edge.source !== id && edge.target !== id) return;
          const srcN =
            edge.source === id
              ? draggedSnapshot
              : latestRef.current.nodeById[edge.source];
          const tgtN =
            edge.target === id
              ? draggedSnapshot
              : latestRef.current.nodeById[edge.target];
          if (!srcN || !tgtN) return;
          const src = nodePorts(srcN, direction).src;
          const tgt = nodePorts(tgtN, direction).tgt;
          const d = edgePath(src, tgt, direction);
          const path = edgeRefs.current[edge.id];
          if (path) path.setAttribute("d", d);
        });
      }
      dragRef.current.lastX = nx;
      dragRef.current.lastY = ny;
      if (Math.hypot(dx, dy) > 4) dragRef.current.moved = true;
    }
  };

  const onPointerUp = () => {
    if (panRef.current) {
      // Commit final pan position to React state for derived consumers.
      setViewInstant(() => liveViewRef.current);
      panRef.current = null;
    }
    if (dragRef.current) {
      const wasMoved = dragRef.current.moved;
      const id = dragRef.current.id;
      // Capture refs BEFORE nulling — React 18 batches setOverrides and the
      // updater may run after we've already cleared dragRef.current.
      const finalX = dragRef.current.lastX;
      const finalY = dragRef.current.lastY;
      dragRef.current = null;
      setDragNodeId(null);
      if (wasMoved && finalX != null && finalY != null) {
        setOverrides((o) => ({ ...o, [id]: { x: finalX, y: finalY } }));
      } else if (!wasMoved) {
        onSelect(id);
      }
    }
  };

  const onNodePointerDown =
    (id: number) => (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const n = nodeById[id];
      if (!n) return;
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: n.x,
        startNodeY: n.y,
        moved: false,
      };
      setDragNodeId(id);
    };

  const searchActive = !!filters.search?.trim();

  return (
    <div
      ref={wrapperRef}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => {
        // Background right-click: kill the native browser menu. When the
        // right-click hits a node, the per-node Radix ContextMenu handles
        // it and we leave the event alone. NOTE: previously we wrapped
        // this in an outer Radix ContextMenu for canvas-wide actions,
        // but nested Radix Roots fought over their DismissableLayer
        // outside-pointerdown listeners and swallowed item clicks on the
        // inner menu. Toolbar already exposes Fit/Zoom/Reset so the
        // outer menu was redundant.
        if (!(e.target as HTMLElement).closest("[data-emp-id]")) {
          e.preventDefault();
        }
      }}
      className={`relative select-none overflow-hidden bg-[#fbfbfa] dark:bg-gray-950 ${
        fillParent ? "h-full min-h-0 flex-1" : "h-[660px]"
      }`}
      style={{ touchAction: "none" }}
    >
      {showGrid && (
        <div
          ref={backgroundRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle, #d6d3cf 1px, transparent 1px)",
            backgroundPosition: `${view.tx % (24 * view.s)}px ${view.ty % (24 * view.s)}px`,
            backgroundSize: `${24 * view.s}px ${24 * view.s}px`,
          }}
        />
      )}

      <div
        ref={worldRef}
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
          transition:
            animations && viewAnimating
              ? "transform 360ms cubic-bezier(.4,0,.2,1)"
              : undefined,
        }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={layout.width + 200}
          height={layout.height + 200}
        >
          <defs>
            {departments.map((d) => (
              <marker
                key={d.id}
                id={`org-arrow-${d.id}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={d.color} opacity="0.85" />
              </marker>
            ))}
          </defs>
          {edges.map((e) => {
            const isFaded =
              searchActive &&
              !highlighted.has(e.target) &&
              !highlighted.has(e.source);
            return (
              <path
                key={e.id}
                ref={(el) => {
                  edgeRefs.current[e.id] = el;
                }}
                d={e.path}
                stroke={e.color}
                strokeWidth={1.5}
                strokeOpacity={
                  isFaded ? Math.min(0.18, edgeOpacity) : edgeOpacity
                }
                fill="none"
                markerEnd={`url(#org-arrow-${e.deptId})`}
              />
            );
          })}
        </svg>

        {positionedNodes.map((n) => {
          const isCompact = n.w === NODE_W_COMPACT;
          const reportCount = employees.filter(
            (e) => e.managerId === n.id
          ).length;
          const items: NodeActionItem[] = [
            {
              key: "open",
              label: "Open details",
              icon: Eye,
              onSelect: () => onSelect(n.id),
            },
            {
              key: "profile",
              label: "View employee profile",
              icon: Eye,
              onSelect: () => onViewEmployee?.(n.id),
            },
            {
              key: "projects",
              label: "View projects",
              icon: FolderKanban,
              onSelect: () => onViewProjects?.(n.id),
            },
            {
              key: "center",
              label: "Center on chart",
              icon: Crosshair,
              onSelect: () => onCenterOn?.(n.id),
            },
            {
              key: "email",
              label: "Copy email",
              icon: Mail,
              onSelect: () => onCopyEmail?.(n.emp.email),
              disabled: !n.emp.email,
              separatorBefore: true,
            },
            {
              key: "phone",
              label: "Copy phone",
              icon: Phone,
              onSelect: () => onCopyPhone?.(n.emp.phone),
              disabled: !n.emp.phone,
            },
            {
              key: "id",
              label: "Copy employee ID",
              icon: Copy,
              onSelect: () => {
                if (typeof window !== "undefined") {
                  void navigator.clipboard?.writeText(String(n.id));
                  onCopyEmployeeId?.(n.id);
                }
              },
              separatorBefore: true,
            },
          ];

          if (canDeleteEmployee && onDeleteEmployee) {
            items.push({
              key: "delete",
              label: "Delete employee",
              icon: Trash2,
              onSelect: () => onDeleteEmployee(n.id),
              separatorBefore: true,
              destructive: true,
            });
          }

          return (
            <ContextMenu key={n.id}>
              <ContextMenuTrigger asChild>
                <div
                  ref={(el) => {
                    nodeWrapRefs.current[n.id] = el;
                  }}
                  className="group absolute left-0 top-0"
                  style={{
                    width: n.w,
                    height: n.h,
                    transform: `translate3d(${n.x}px, ${n.y}px, 0)`,
                    transition:
                      animations && dragNodeId !== n.id
                        ? "transform 360ms cubic-bezier(.4,0,.2,1)"
                        : undefined,
                    cursor: dragNodeId === n.id ? "grabbing" : "grab",
                  }}
                >
                  <OrgChartNode
                    emp={n.emp}
                    departments={departments}
                    reportCount={reportCount}
                    isCompact={isCompact}
                    isHighlighted={searchActive && highlighted.has(n.id)}
                    isDimmed={searchActive && !highlighted.has(n.id)}
                    isSelected={selectedId === n.id}
                    showDeptPill={showDeptPill}
                    animations={animations}
                    onPointerDown={onNodePointerDown(n.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Employee actions"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-md border border-transparent bg-white/0 text-gray-400 opacity-0 transition-all hover:border-gray-200 hover:bg-white hover:text-gray-900 focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {items.map((it) => (
                        <Fragment key={it.key}>
                          {it.separatorBefore && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            disabled={it.disabled}
                            variant={it.destructive ? "destructive" : "default"}
                            onClick={(e) => {
                              if (it.disabled) return;
                              e.stopPropagation();
                              it.onSelect();
                            }}
                          >
                            <it.icon className="h-3.5 w-3.5" />
                            {it.label}
                          </DropdownMenuItem>
                        </Fragment>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                {items.map((it) => (
                  <Fragment key={it.key}>
                    {it.separatorBefore && <ContextMenuSeparator />}
                    <ContextMenuItem
                      disabled={it.disabled}
                      variant={it.destructive ? "destructive" : "default"}
                      onClick={(e) => {
                        if (it.disabled) return;
                        e.stopPropagation();
                        it.onSelect();
                      }}
                    >
                      <it.icon className="h-3.5 w-3.5" />
                      {it.label}
                    </ContextMenuItem>
                  </Fragment>
                ))}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      <div
        ref={zoomIndicatorRef}
        className="pointer-events-none absolute bottom-3 left-3 rounded border border-gray-200 bg-white/90 px-2 py-1 text-[11px] font-mono text-gray-600 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-300"
      >
        {Math.round(view.s * 100)}%
      </div>
    </div>
  );
}
