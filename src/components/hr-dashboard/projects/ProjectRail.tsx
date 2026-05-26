"use client";

import { Calendar, Clock, FileText } from "lucide-react";
import { MemberAvatar, ProjectIcon, StatusPill } from "./atoms";
import { fmtDate } from "./projectsHelpers";
import type { Project } from "./types";

interface ProjectRailProps {
  project: Project;
}

export function ProjectRail({ project }: ProjectRailProps) {
  return (
    <aside className="sticky top-7 overflow-hidden self-start rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-[22px] py-6">
        <ProjectIcon size="lg" />
        <div className="mt-2.5 text-[17px] font-semibold tracking-tight text-gray-900">
          {project.name}
        </div>
        <div className="mt-1 text-[13px] text-gray-700">{project.client}</div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <StatusPill status={project.status} />
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <RailRow icon={<Calendar className="h-3.5 w-3.5" />}>
            {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
          </RailRow>
          <RailRow icon={<Clock className="h-3.5 w-3.5" />}>
            {project.hours_logged.toLocaleString()}h logged
          </RailRow>
          <RailRow icon={<FileText className="h-3.5 w-3.5" />}>
            {project.document_count} documents
          </RailRow>
        </div>
      </div>
      <div className="px-[18px] py-3.5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-700">
          Members
        </div>
        <div className="flex flex-col gap-2">
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5">
              <MemberAvatar name={m.name} size={28} color={m.color} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-gray-900">
                  {m.name}
                </div>
                <div className="text-[11px] text-gray-700">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function RailRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}
