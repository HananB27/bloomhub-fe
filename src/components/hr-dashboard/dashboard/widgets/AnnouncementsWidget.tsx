import { ChevronRight } from "lucide-react";

import { formatRelativeTimestamp } from "@/utils";
import type { AnnouncementItem } from "@/types/dashboard";

import { DashboardCard } from "./DashboardCard";

/* ----------------------------------------------------------------------------
 * AnnouncementsWidget — VISUAL REDESIGN (props + data unchanged)
 *
 * Changes: tag chip moved to a neutral zinc tone to match the module's badges
 * (the old indigo clashed with the refreshed palette); rows gained a small
 * type-dot and a tighter, more scannable hierarchy. Logic is untouched.
 * -------------------------------------------------------------------------- */

interface Props {
  items: AnnouncementItem[];
  onViewBoard?: () => void;
}

// Soft tints keyed off the tag text so each category reads distinctly.
function tagTone(tag: string): string {
  const key = (tag || "").toLowerCase();
  if (key.includes("urgent")) return "border-rose-200 bg-rose-50 text-rose-700";
  if (key.includes("celebrat"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (key.includes("news")) return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}

export function AnnouncementsWidget({ items, onViewBoard }: Props) {
  return (
    <DashboardCard
      title="Announcements"
      action={
        <button
          type="button"
          onClick={onViewBoard}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-zinc-100 hover:text-gray-900"
        >
          Board
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    >
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-500">No announcements yet.</div>
      ) : (
        <div className="flex flex-col">
          {items.map((a) => (
            <div
              key={a.id}
              className="-mx-2 rounded-lg border-b border-zinc-100 px-2 py-3 transition last:border-b-0 hover:bg-zinc-50"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wider ${tagTone(
                    a.tag
                  )}`}
                >
                  {a.tag}
                </span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {formatRelativeTimestamp(a.date)}
                </span>
              </div>
              <div className="text-[13.5px] font-semibold leading-snug text-gray-900">
                {a.title}
              </div>
              {a.body && (
                <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {a.body}
                </div>
              )}
              <div className="mt-1.5 text-[11.5px] font-medium text-gray-400">
                {a.authorName}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
