"use client";

import { fmtDate, fmtRelative } from "../projectsHelpers";
import type { ProjectActivityEvent } from "../types";

interface ProjectActivitySectionProps {
  events: ProjectActivityEvent[];
}

export function ProjectActivitySection({
  events,
}: ProjectActivitySectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white px-6 py-[22px]">
      <div className="mb-[18px] border-b border-gray-200 pb-4">
        <div className="mb-1 text-[11px] font-medium text-gray-700">
          Audit log
        </div>
        <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
          Activity
        </h2>
      </div>
      <div className="relative flex flex-col gap-1">
        <span
          aria-hidden
          className="absolute bottom-2 left-[5px] top-2 w-px bg-gray-200"
        />
        {events.map((e) => (
          <div key={e.id} className="relative flex items-start gap-3.5 py-2">
            <span
              aria-hidden
              className="z-[1] mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-gray-300 bg-white"
            />
            <div className="flex-1">
              <div className="text-[13px]">
                <strong className="font-semibold text-gray-900">
                  {e.actor}
                </strong>{" "}
                <span className="text-gray-700">{e.message}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-gray-600">
                {fmtDate(e.at)} · {fmtRelative(e.at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
