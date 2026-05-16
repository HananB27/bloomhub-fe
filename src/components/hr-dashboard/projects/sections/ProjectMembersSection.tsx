"use client";

import { MoreHorizontal, Plus, Trash2, UserCheck, UserPen } from "lucide-react";
import { toast } from "sonner";
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
import type { Project } from "../types";

interface ProjectMembersSectionProps {
  project: Project;
  onAddMember?: () => void;
}

export function ProjectMembersSection({
  project,
  onAddMember,
}: ProjectMembersSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white px-6 py-[22px]">
      <div className="mb-[18px] flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="mb-1 text-[11px] font-medium text-gray-700">Team</div>
          <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
            Members · {project.members.length}
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            onAddMember
              ? onAddMember()
              : toast.info("Add member", {
                  description: "Member picker would open here.",
                })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add member
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role on project</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {project.members.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <MemberAvatar name={m.name} size={28} color={m.color} />
                  <span className="font-medium text-gray-900">{m.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-800">{m.role}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Actions for ${m.name}`}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() =>
                        toast.info(`Open profile`, { description: m.name })
                      }
                    >
                      <UserCheck className="mr-2 h-3.5 w-3.5" /> View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        toast.info("Change role", { description: m.name })
                      }
                    >
                      <UserPen className="mr-2 h-3.5 w-3.5" /> Change role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                      onSelect={() =>
                        toast.warning("Member removed", { description: m.name })
                      }
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
