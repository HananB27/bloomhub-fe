import { cn } from "../../ui/utils";
import { STATUS_META } from "../projectsData";
import type { ProjectStatus } from "../types";

interface StatusPillProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const v = STATUS_META[status];
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
      {status}
    </span>
  );
}
