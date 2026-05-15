import { cn } from "../../ui/utils";

/**
 * Employment status presentation map. Backed by `is_active` only today —
 * Probation / OnLeave are reserved values for when BE surfaces them.
 */
export type EmployeeStatusKey =
  | "active"
  | "on_leave"
  | "probation"
  | "inactive";

interface StatusVisual {
  bg: string;
  fg: string;
  dot: string;
  label: string;
}

const EMPLOYEE_STATUS_VISUALS: Record<EmployeeStatusKey, StatusVisual> = {
  active: { bg: "#f0fdf4", fg: "#15803d", dot: "#22c55e", label: "Active" },
  on_leave: { bg: "#eff6ff", fg: "#1d4ed8", dot: "#3b82f6", label: "On leave" },
  probation: {
    bg: "#fffbeb",
    fg: "#b45309",
    dot: "#f59e0b",
    label: "Probation",
  },
  inactive: { bg: "#fef2f2", fg: "#b91c1c", dot: "#ef4444", label: "Inactive" },
};

export function getEmployeeStatusVisual(key: EmployeeStatusKey): StatusVisual {
  return EMPLOYEE_STATUS_VISUALS[key];
}

interface StatusPillProps {
  status: EmployeeStatusKey;
  className?: string;
}

/** Rounded status pill with leading colour dot. */
export function StatusPill({ status, className }: StatusPillProps) {
  const v = EMPLOYEE_STATUS_VISUALS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ background: v.bg, color: v.fg }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: v.dot }}
      />
      {v.label}
    </span>
  );
}
