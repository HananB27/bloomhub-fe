"use client";

import {
  Calculator,
  Check,
  Inbox,
  ListFilter,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { cn } from "../ui/utils";
import { STAGES } from "./projectsData";
import type { Project, ProjectStageId } from "./types";

const STAGE_ICONS: Record<
  ProjectStageId,
  React.ComponentType<{ className?: string }>
> = {
  intake: Inbox,
  scoping: Search,
  triage: ListFilter,
  estimation: Calculator,
  review_approval: ShieldCheck,
  proposal_sent: Send,
  kickoff: Rocket,
  delivery: Truck,
};

interface ProjectStageTrackProps {
  project: Project;
  onEdit?: (stage: ProjectStageId) => void;
  canEdit?: boolean;
}

export function ProjectStageTrack({
  project,
  onEdit,
  canEdit = true,
}: ProjectStageTrackProps) {
  const currentIdx = STAGES.findIndex((s) => s.id === project.stage);
  const isCompleted = project.status === "Completed";
  return (
    <ol className="relative flex items-start justify-between gap-0" role="list">
      <span
        aria-hidden
        className="absolute left-3 right-3 top-3 h-0.5 bg-gray-200"
      />
      {STAGES.map((s, i) => {
        const Icon = STAGE_ICONS[s.id];
        const isCurrent = i === currentIdx && !isCompleted;
        const isDone = isCompleted ? true : i < currentIdx;
        const interactive = canEdit && Boolean(onEdit);
        return (
          <li
            key={s.id}
            className={cn(
              "z-[1] flex flex-1 flex-col items-center gap-1.5 text-[11px]",
              interactive && "cursor-pointer",
              isCurrent ? "font-semibold text-gray-900" : "text-gray-800"
            )}
            onClick={interactive ? () => onEdit?.(s.id) : undefined}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onEdit?.(s.id);
                    }
                  }
                : undefined
            }
          >
            <div
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full border-2 border-gray-400 bg-white text-gray-700 transition-colors",
                isDone && "border-green-600 bg-green-600 text-white"
              )}
              style={
                isCurrent
                  ? { background: s.color, borderColor: s.color, color: "#fff" }
                  : undefined
              }
            >
              {isDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <Icon className="h-2.5 w-2.5" />
              )}
            </div>
            <div className="text-center leading-tight">
              <div className="font-medium">{s.shortLabel}</div>
              {isCurrent ? (
                <div className="mt-px font-mono text-[9px] font-medium uppercase tracking-wider text-gray-700">
                  current
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
