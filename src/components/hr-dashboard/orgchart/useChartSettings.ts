"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * User-facing render preferences for the org chart. Persisted to
 * localStorage so settings stick across reloads.
 */
export interface ChartSettings {
  /** Smooth CSS transitions on node moves + view changes. Disable for max FPS. */
  animations: boolean;
  /** Show the radial-dot background grid. */
  showGrid: boolean;
  /** Force all nodes (including managers) to render in compact size. */
  compactNodes: boolean;
  /** Show department pill on node cards. */
  showDeptPill: boolean;
  /** Edge stroke opacity 0..1. */
  edgeOpacity: number;
}

const STORAGE_KEY = "bloomhub:orgchart:settings";

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  animations: true,
  showGrid: true,
  compactNodes: false,
  showDeptPill: true,
  edgeOpacity: 0.55,
};

function read(): ChartSettings {
  if (typeof window === "undefined") return DEFAULT_CHART_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHART_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ChartSettings>;
    return { ...DEFAULT_CHART_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_CHART_SETTINGS;
  }
}

export function useChartSettings() {
  const [settings, setSettings] = useState<ChartSettings>(
    DEFAULT_CHART_SETTINGS
  );

  // Hydrate from localStorage on mount (avoids SSR mismatch).
  useEffect(() => {
    setSettings(read());
  }, []);

  const update = useCallback(
    <K extends keyof ChartSettings>(key: K, value: ChartSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota / private-mode errors.
        }
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    setSettings(DEFAULT_CHART_SETTINGS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  return { settings, update, reset };
}
