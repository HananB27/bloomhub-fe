import { ChevronRight } from "lucide-react";

import { formatDateShort } from "@/utils";
import type { OnboardingItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";
import { InitialsAvatar } from "./InitialsAvatar";
import { ProgressBar } from "./ProgressBar";

interface Props {
  items: OnboardingItem[];
  onViewAll?: () => void;
}

const KIND_TAG_CLASSES: Record<OnboardingItem["kind"], string> = {
  Onboarding: "bg-indigo-50 text-indigo-700",
  Offboarding: "bg-orange-50 text-orange-700",
};

const KIND_BAR_CLASSES: Record<OnboardingItem["kind"], string> = {
  Onboarding: "bg-indigo-500",
  Offboarding: "bg-orange-500",
};

export function OnboardingTrackerWidget({ items, onViewAll }: Props) {
  return (
    <DashboardCard
      title="Onboarding & offboarding"
      kicker="In progress"
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">
          No active on/offboarding journeys.
        </div>
      ) : (
        <div>
          {items.map((o) => {
            const date = o.kind === "Offboarding" ? o.endDate : o.startDate;
            const dateLabel = o.kind === "Offboarding" ? "exits" : "starts";
            return (
              <div
                key={o.id}
                className="flex items-center gap-3 border-b border-gray-200 py-3.5 last:border-b-0 last:pb-0"
              >
                <InitialsAvatar name={o.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-gray-900">
                      {o.name}
                    </span>
                    <span
                      className={`rounded px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wider ${KIND_TAG_CLASSES[o.kind]}`}
                    >
                      {o.kind}
                    </span>
                  </div>
                  <div className="my-1.5 text-[11.5px] text-gray-600">
                    {o.role}
                    {date ? ` · ${dateLabel} ${formatDateShort(date)}` : ""}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <ProgressBar
                        value={o.done}
                        max={o.total}
                        fillClassName={KIND_BAR_CLASSES[o.kind]}
                      />
                    </div>
                    <span className="whitespace-nowrap font-mono text-[11px] text-gray-600">
                      {o.done}/{o.total}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                    Next
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-gray-700">
                    {o.owner}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
