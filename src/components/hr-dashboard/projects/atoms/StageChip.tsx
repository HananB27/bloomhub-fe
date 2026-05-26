import { cn } from "../../ui/utils";
import { STAGE_BY_ID } from "../projectsData";
import type { ProjectStageId } from "../types";

interface StageChipProps {
  stage: ProjectStageId;
  variant?: "soft" | "text";
  className?: string;
}

export function StageChip({
  stage,
  variant = "soft",
  className,
}: StageChipProps) {
  const s = STAGE_BY_ID[stage];
  if (!s) return null;
  if (variant === "text") {
    return (
      <span
        className={cn(
          "inline-flex items-center whitespace-nowrap text-xs font-medium",
          className
        )}
        style={{ color: s.color }}
      >
        <span
          aria-hidden
          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: s.color }}
        />
        {s.label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
      style={{ background: s.soft, color: s.color }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.color }}
      />
      {s.label}
    </span>
  );
}
