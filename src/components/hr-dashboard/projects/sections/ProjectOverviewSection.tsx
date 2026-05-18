"use client";

import { Pencil } from "lucide-react";
import { Button } from "../../ui/button";
import { ProgressBar, TechBadge } from "../atoms";
import { ProjectStageTrack } from "../ProjectStageTrack";
import { fmtDate, fmtRelative } from "../projectsHelpers";
import type { Project, ProjectStageId } from "../types";

interface ProjectOverviewSectionProps {
  project: Project;
  onEditStage: (stage?: ProjectStageId) => void;
}

export function ProjectOverviewSection({
  project,
  onEditStage,
}: ProjectOverviewSectionProps) {
  return (
    <div className="space-y-3.5">
      <Section
        kicker="Lifecycle"
        title="Stage"
        action={
          <Button variant="ghost" size="sm" onClick={() => onEditStage()}>
            <Pencil className="mr-1 h-3 w-3" /> Edit
          </Button>
        }
      >
        <ProjectStageTrack project={project} onEdit={(s) => onEditStage(s)} />
        {project.stage_note ? (
          <div className="mt-3.5 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-[12px] text-gray-600">
            {project.stage_note}
          </div>
        ) : null}
      </Section>

      <Section kicker="About" title="Description">
        <p className="text-[14px] leading-relaxed text-gray-600">
          {project.description}
        </p>
      </Section>

      <Section kicker="Progress" title="Status & timeline">
        <div className="grid grid-cols-12 gap-4">
          <Field span={4} label="Completion">
            <div className="flex items-center gap-2.5">
              <div className="flex-1">
                <ProgressBar value={project.progress} status={project.status} />
              </div>
              <span className="font-mono font-semibold">
                {project.progress}%
              </span>
            </div>
          </Field>
          <Field span={4} label="Hours logged">
            <span className="font-mono font-medium">
              {project.hours_logged.toLocaleString()}h
            </span>
          </Field>
          <Field span={4} label="Last activity">
            <span className="font-medium">
              {fmtDate(project.last_activity)} ·{" "}
              {fmtRelative(project.last_activity)}
            </span>
          </Field>
          <Field span={6} label="Start date">
            <span className="font-medium">{fmtDate(project.start_date)}</span>
          </Field>
          <Field span={6} label="End date">
            <span className="font-medium">{fmtDate(project.end_date)}</span>
          </Field>
        </div>
      </Section>

      <Section kicker="Toolbelt" title="Technologies">
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.length === 0 ? (
            <span className="text-[12px] text-gray-700">
              No technologies tagged yet.
            </span>
          ) : (
            project.technologies.map((t) => <TechBadge key={t} name={t} />)
          )}
        </div>
      </Section>
    </div>
  );
}

interface SectionProps {
  kicker: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ kicker, title, action, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white px-6 py-[22px]">
      <div className="mb-[18px] flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="mb-1 text-[11px] font-medium text-gray-700">
            {kicker}
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface FieldProps {
  span: number;
  label: string;
  children: React.ReactNode;
}

function Field({ span, label, children }: FieldProps) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div className="mb-1.5 text-[12px] font-medium text-gray-700">
        {label}
      </div>
      <div className="text-[14px] text-gray-900">{children}</div>
    </div>
  );
}
