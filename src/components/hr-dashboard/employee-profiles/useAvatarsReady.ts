import { useEffect, useState } from "react";
import type { EmployeeProfileData } from "@/lib/api/employees";

/**
 * Preload every employee avatar URL and report when the batch is fully
 * resolved. Returns `true` once each image has either loaded or errored —
 * lets the list view keep the skeleton up until the page can render without
 * pop-in.
 *
 * Empty avatar URLs are ignored (initials fallback renders synchronously).
 */
export function useAvatarsReady(employees: EmployeeProfileData[]): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setReady(true);
      return;
    }
    const urls = employees
      .map((e) => e.avatar)
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    setReady(false);
    let cancelled = false;
    // Minimum visible skeleton window so the page never appears to "snap" in
    // when avatars happen to be cached.
    const MIN_SHOW_MS = 500;
    const startedAt = Date.now();
    const finish = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, remaining);
    };
    if (urls.length === 0) {
      finish();
      return () => {
        cancelled = true;
      };
    }
    let remaining = urls.length;
    const onDone = () => {
      remaining -= 1;
      if (!cancelled && remaining <= 0) finish();
    };
    const handles: HTMLImageElement[] = urls.map((url) => {
      const img = new Image();
      img.onload = onDone;
      img.onerror = onDone;
      img.src = url;
      return img;
    });
    return () => {
      cancelled = true;
      handles.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [employees]);

  return ready;
}
