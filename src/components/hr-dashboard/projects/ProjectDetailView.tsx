"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import { ProjectRail } from "./ProjectRail";
import {
  ProjectActivitySection,
  ProjectDocumentsSection,
  ProjectMembersSection,
  ProjectOverviewSection,
} from "./sections";
import { PROJECT_ACTIVITY, PROJECT_DOCUMENTS } from "./projectsData";
import type { Project, ProjectActionKind, ProjectStageId } from "./types";

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onAction: (
    action: ProjectActionKind,
    project: Project,
    ctx?: { stage?: ProjectStageId }
  ) => void;
  onAddMember?: (project: Project) => void;
  onOpenDocument?: (documentId: string | number) => void;
}

export function ProjectDetailView({
  project,
  onBack,
  onAction,
  onAddMember,
  onOpenDocument,
}: ProjectDetailViewProps) {
  const [tab, setTab] = useState("overview");
  const activity = PROJECT_ACTIVITY[project.id] ?? [
    {
      id: "g1",
      at: project.last_activity,
      actor: "Aida Salihović",
      message: "Last updated",
    },
    {
      id: "g0",
      at: `${project.start_date}T09:00:00Z`,
      actor: "Aida Salihović",
      message: `Created project ${project.name}`,
    },
  ];
  const documents = PROJECT_DOCUMENTS[project.id] ?? [];

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
              { id: "members", l: `Members · ${project.members.length}` },
              { id: "documents", l: `Documents · ${documents.length}` },
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
