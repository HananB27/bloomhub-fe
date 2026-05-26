import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../ui/utils";
import { EditModePill, EDIT_MODE_HEADER_CLASS } from "./atoms/EditModePill";
import { formatDate } from "@/utils";

interface ProfilePageHeaderProps {
  profile: EmployeeProfileData;
  edit: boolean;
  dirty: boolean;
  saving?: boolean;
  canEdit: boolean;
  canDelete?: boolean;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onBack?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

/**
 * Profile detail page header. D-05 amber tint while editing. Shows breadcrumb,
 * role switcher (HR-only), name, subtitle, and primary actions (edit / save /
 * cancel). Save is also mirrored in the sticky SaveFooter (D-12).
 */
export function ProfilePageHeader({
  profile,
  edit,
  dirty,
  saving = false,
  canEdit,
  canDelete = canEdit,
  onEnterEdit,
  onCancelEdit,
  onSave,
  onBack,
  onExport,
  onDelete,
}: ProfilePageHeaderProps) {
  const fullName = `${profile.first_name} ${profile.last_name}`;

  return (
    <header
      className={cn(
        "-mx-4 mb-7 rounded-2xl px-4 pt-2 pb-[22px] transition-colors",
        edit && EDIT_MODE_HEADER_CLASS
      )}
    >
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1.5"
              aria-label="Back to all employees"
            >
              <ChevronLeft size={13} aria-hidden />
              All employees
            </Button>
          ) : null}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-zinc-500"
          >
            <button
              type="button"
              onClick={onBack}
              className="hover:text-zinc-900 focus-visible:outline-none focus-visible:underline"
            >
              Employees
            </button>
            <ChevronRight size={12} aria-hidden />
            <span className="font-medium text-zinc-900">{fullName}</span>
          </nav>
        </div>
      </div>

      <div className="mt-[18px] flex items-end justify-between gap-6">
        <div>
          <h1 className="m-0 text-[28px] leading-tight font-bold tracking-tight text-zinc-900">
            {fullName}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {[
              profile.role?.name,
              profile.department,
              profile.start_date && `Started ${formatDate(profile.start_date)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {edit ? (
            <>
              <EditModePill />
              <Button
                variant="outline"
                onClick={onCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving || !dirty}>
                Save changes
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More actions"
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onSelect={() => onExport?.()}
                    disabled={!onExport}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export employee
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDelete?.()}
                    disabled={!canDelete || !onDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete employee
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {canEdit ? (
                <Button onClick={onEnterEdit} className="gap-1.5">
                  <Pencil size={13} aria-hidden />
                  Edit profile
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
