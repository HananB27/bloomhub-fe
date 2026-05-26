"use client";

import { Pencil, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  MemberStack,
  ProgressBar,
  ProjectActionMenu,
  ProjectIcon,
  StageChip,
  StatusPill,
} from "./atoms";
import { fmtRelative } from "./projectsHelpers";
import type { Project, ProjectActionKind } from "./types";

interface ProjectsListTableProps {
  projects: Project[];
  onOpen: (id: string) => void;
  onAction: (action: ProjectActionKind, project: Project) => void;
}

export function ProjectsListTable({
  projects,
  onOpen,
  onAction,
}: ProjectsListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow
              key={p.id}
              className="group cursor-pointer"
              onClick={() => onOpen(p.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onOpen(p.id);
              }}
            >
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <ProjectIcon size="sm" />
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-gray-600">{p.code}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-[13px] text-gray-800">
                {p.client}
              </TableCell>
              <TableCell>
                <StatusPill status={p.status} />
              </TableCell>
              <TableCell>
                <StageChip stage={p.stage} variant="text" />
              </TableCell>
              <TableCell style={{ minWidth: 140 }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar value={p.progress} status={p.status} />
                  </div>
                  <span className="min-w-[32px] text-right font-mono text-[11px] font-semibold text-gray-700">
                    {p.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <MemberStack members={p.members} />
              </TableCell>
              <TableCell className="text-[12px] text-gray-700">
                {fmtRelative(p.last_activity)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-0.5 opacity-40 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction("edit", p);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Update status"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction("status", p);
                    }}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </Button>
                  <ProjectActionMenu project={p} onAction={onAction} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
