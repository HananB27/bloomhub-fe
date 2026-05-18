import {
  MoreHorizontal,
  Eye,
  Pencil,
  RefreshCcw,
  Copy,
  Share2,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import type { Project, ProjectActionKind } from "../types";

interface ProjectActionMenuProps {
  project: Project;
  onAction: (action: ProjectActionKind, project: Project) => void;
  variant?: "card" | "row";
}

export function ProjectActionMenu({
  project,
  onAction,
  variant = "row",
}: ProjectActionMenuProps) {
  const triggerSize = variant === "card" ? "h-[26px] w-[26px]" : "h-7 w-7";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerSize}
          aria-label={`Actions for ${project.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-[180px]"
      >
        <DropdownMenuItem onSelect={() => onAction("open", project)}>
          <Eye className="mr-2 h-3.5 w-3.5" /> Open
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("edit", project)}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("status", project)}>
          <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Update status
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction("duplicate", project)}>
          <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("share", project)}>
          <Share2 className="mr-2 h-3.5 w-3.5" /> Share link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction("archive", project)}>
          <Archive className="mr-2 h-3.5 w-3.5" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onAction("delete", project)}
          className="text-red-600 focus:bg-red-50 focus:text-red-700"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
