"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleStop,
  MoreHorizontal,
  Plus,
  Trash2,
  UserPen,
} from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { MemberAvatar } from "../atoms";
import {
  apiAssignmentToMember,
  assignmentStatus,
  fmtDate,
  fmtRelative,
  isAssignmentActive,
} from "../projectsHelpers";
import { projectApi } from "@/lib/api/modules/projects";
import type { Project, ProjectMember } from "../types";

interface ProjectMembersSectionProps {
  project: Project;
  onAddMember?: () => void;
  onEditAssignment?: (assignment: ProjectMember) => void;
  onEndAssignment?: (assignment: ProjectMember) => void;
  onDeleteAssignment?: (assignment: ProjectMember) => void;
}

export function ProjectMembersSection({
  project,
  onAddMember,
  onEditAssignment,
  onEndAssignment,
  onDeleteAssignment,
}: ProjectMembersSectionProps) {
  const [members, setMembers] = useState<ProjectMember[]>(project.members);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      projectApi
        .listAssignments(project.api_id, { signal })
        .then((list) => setMembers(list.map(apiAssignmentToMember)))
        .catch(() => {
          setMembers(project.members);
        })
        .finally(() => setLoading(false));
    },
    [project.api_id, project.members]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, project.members]);

  const { active, ended } = useMemo(() => {
    const a: ProjectMember[] = [];
    const e: ProjectMember[] = [];
    for (const m of members) {
      (isAssignmentActive(m) ? a : e).push(m);
    }
    return { active: a, ended: e };
  }, [members]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-6 py-[22px]">
      <div className="mb-[18px] flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="mb-1 text-[11px] font-medium text-gray-700">Team</div>
          <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
            Assignments · {active.length} active
            {ended.length ? (
              <span className="ml-1.5 text-[13px] font-normal text-gray-600">
                · {ended.length} ended
              </span>
            ) : null}
            {loading ? (
              <span className="ml-2 text-[11px] text-gray-500">loading…</span>
            ) : null}
          </h2>
        </div>
        {onAddMember ? (
          <Button variant="outline" onClick={onAddMember}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign employee
          </Button>
        ) : null}
      </div>

      <AssignmentTable
        title="Active"
        rows={active}
        emptyText="No active assignments."
        onEditAssignment={onEditAssignment}
        onEndAssignment={onEndAssignment}
      />

      {ended.length ? (
        <div className="mt-6">
          <AssignmentTable
            title="Ended"
            rows={ended}
            emptyText=""
            onEditAssignment={onEditAssignment}
            onDeleteAssignment={onDeleteAssignment}
          />
        </div>
      ) : null}
    </section>
  );
}

interface AssignmentTableProps {
  title: string;
  rows: ProjectMember[];
  emptyText: string;
  onEditAssignment?: (assignment: ProjectMember) => void;
  onEndAssignment?: (assignment: ProjectMember) => void;
  onDeleteAssignment?: (assignment: ProjectMember) => void;
}

function AssignmentTable({
  title,
  rows,
  emptyText,
  onEditAssignment,
  onEndAssignment,
  onDeleteAssignment,
}: AssignmentTableProps) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-600">
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-[13px] text-gray-600">
          {emptyText}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const status = assignmentStatus(m);
              const updatedAt = m.updated_at ?? m.created_at;
              return (
                <TableRow key={m.assignment_id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <MemberAvatar name={m.name} size={28} color={m.color} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {m.name}
                        </div>
                        {m.notes ? (
                          <div className="truncate text-[11px] text-gray-600">
                            {m.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-800">{m.role}</TableCell>
                  <TableCell className="text-gray-800">
                    {m.allocation}%
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {fmtDate(m.start_date)} →{" "}
                    {m.end_date ? fmtDate(m.end_date) : "Ongoing"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        status === "Active"
                          ? "inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
                          : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                      }
                    >
                      {status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[11px] text-gray-600">
                    <div className="text-gray-500">
                      {fmtRelative(updatedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-gray-300 bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                          aria-label={`Actions for ${m.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditAssignment ? (
                          <DropdownMenuItem
                            onSelect={() => onEditAssignment(m)}
                          >
                            <UserPen className="mr-2 h-3.5 w-3.5" /> Edit
                            assignment
                          </DropdownMenuItem>
                        ) : null}
                        {onEndAssignment && status === "Active" ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50 focus:text-red-700"
                              onSelect={() => onEndAssignment(m)}
                            >
                              <CircleStop className="mr-2 h-3.5 w-3.5" /> End
                              assignment
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        {onDeleteAssignment && status === "Ended" ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50 focus:text-red-700"
                              onSelect={() => onDeleteAssignment(m)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              record
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
