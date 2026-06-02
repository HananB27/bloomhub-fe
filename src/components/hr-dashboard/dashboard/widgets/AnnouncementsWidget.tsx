import { ChevronRight } from "lucide-react";

import { formatRelativeTimestamp } from "@/utils";
import type { AnnouncementItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";

interface Props {
  items: AnnouncementItem[];
  onViewBoard?: () => void;
}

export function AnnouncementsWidget({ items, onViewBoard }: Props) {
  return (
    <DashboardCard
      title="Announcements"
      action={
        <button
          type="button"
          onClick={onViewBoard}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:text-indigo-600"
        >
          Board
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-600">No announcements yet.</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((a) => (
            <div
              key={a.id}
              className="border-b border-gray-200 pb-3.5 last:border-b-0 last:pb-0"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded bg-indigo-50 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                  {a.tag}
                </span>
                <span className="text-[11px] text-gray-600">
                  {formatRelativeTimestamp(a.date)}
                </span>
              </div>
              <div className="text-[13.5px] font-semibold leading-tight text-gray-900">
                {a.title}
              </div>
              {a.body && (
                <div className="mt-1 text-xs text-gray-600">{a.body}</div>
              )}
              <div className="mt-1.5 text-[11.5px] text-gray-600">
                {a.authorName}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
