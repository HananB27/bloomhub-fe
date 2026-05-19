import { cn } from "../../ui/utils";
import { STATUS_META } from "../projectsData";
import type { ProjectStatus } from "../types";

interface ProgressBarProps {
  value: number;
  status: ProjectStatus;
  className?: string;
}

export function ProgressBar({ value, status, className }: ProgressBarProps) {
  const c = STATUS_META[status];
  return (
    <div
      className={cn(
        "h-1.5 overflow-hidden rounded-full bg-gray-100",
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${value}%`, background: c.dot }}
      />
    </div>
  );
}
