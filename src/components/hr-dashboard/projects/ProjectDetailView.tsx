"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import { ProjectRail } from "./ProjectRail";
import {
  ProjectActivitySection,
  ProjectDocumentsSection,
  ProjectMembersSection,
  ProjectOverviewSection,
} from "./sections";
import { isAssignmentActive } from "./projectsHelpers";
import { projectApi } from "@/lib/api/modules/projects";
import type { ProjectActivityEvent } from "./types";
import type {
  Project,
  ProjectActionKind,
  ProjectMember,
  ProjectStageId,
} from "./types";

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onAction: (
    action: ProjectActionKind,
    project: Project,
    ctx?: { stage?: ProjectStageId }
  ) => void;
  onAddMember?: (project: Project) => void;
  onEditAssignment?: (project: Project, assignment: ProjectMember) => void;
  onEndAssignment?: (project: Project, assignment: ProjectMember) => void;
  onDeleteAssignment?: (project: Project, assignment: ProjectMember) => void;
  onOpenDocument?: (documentId: string | number) => void;
}

export function ProjectDetailView({
  project,
  onBack,
  onAction,
  onAddMember,
  onEditAssignment,
  onEndAssignment,
  onDeleteAssignment,
  onOpenDocument,
}: ProjectDetailViewProps) {
  const [tab, setTab] = useState("overview");
  const [activity, setActivity] = useState<ProjectActivityEvent[]>([]);
  const documents: never[] = [];

  useEffect(() => {
    const controller = new AbortController();
    projectApi
      .getActivity(project.api_id, { signal: controller.signal })
      .then((events) => setActivity(events))
      .catch(() => setActivity([]));
    return () => controller.abort();
  }, [project.api_id, project.last_activity, project.members.length]);
  const activeMemberCount = project.members.filter((m) =>
    isAssignmentActive(m)
  ).length;

  return (
    <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-start gap-0 px-8 pt-7 md:grid-cols-[1fr_280px]">
      <main className="min-w-0 pr-0 md:pr-8">
        <ProjectDetailHeader
          project={project}
          onBack={onBack}
          onAction={onAction}
        />

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="!h-auto w-full !justify-start !gap-6 !rounded-none !border-b !border-gray-200 !bg-transparent !p-0">
            {[
              { id: "overview", l: "Overview" },
              { id: "members", l: `Members · ${activeMemberCount}` },
              { id: "documents", l: "Documents" },
              { id: "activity", l: "Activity" },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="!-mb-px !flex-none !rounded-none !border-0 !border-b-2 !border-transparent !bg-transparent !px-1 !py-2.5 !text-[13px] !font-medium !text-gray-500 !shadow-none transition-colors hover:!text-gray-900 data-[state=active]:!border-gray-900 data-[state=active]:!bg-transparent data-[state=active]:!font-semibold data-[state=active]:!text-gray-900 data-[state=active]:!shadow-none"
              >
                {t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-[18px] flex flex-col gap-3.5">
            <TabsContent value="overview" className="m-0">
              <ProjectOverviewSection
                project={project}
                onEditStage={(stage) => onAction("status", project, { stage })}
              />
            </TabsContent>
            <TabsContent value="members" className="m-0">
              <ProjectMembersSection
                project={project}
                onAddMember={
                  onAddMember ? () => onAddMember(project) : undefined
                }
                onEditAssignment={
                  onEditAssignment
                    ? (a) => onEditAssignment(project, a)
                    : undefined
                }
                onEndAssignment={
                  onEndAssignment
                    ? (a) => onEndAssignment(project, a)
                    : undefined
                }
                onDeleteAssignment={
                  onDeleteAssignment
                    ? (a) => onDeleteAssignment(project, a)
                    : undefined
                }
              />
            </TabsContent>
            <TabsContent value="documents" className="m-0">
              <ProjectDocumentsSection
                project={project}
                documents={documents}
                onOpenDocument={onOpenDocument}
              />
            </TabsContent>
            <TabsContent value="activity" className="m-0">
              <ProjectActivitySection events={activity} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <ProjectRail project={project} />
    </div>
  );
}
