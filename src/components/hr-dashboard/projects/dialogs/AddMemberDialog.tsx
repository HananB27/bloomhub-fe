"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { cn } from "../../ui/utils";
import { employeeApi } from "@/lib/api/modules/employees";
import type { EmployeeProfileData } from "@/lib/api/helpers/transformers";
import { MemberAvatar } from "../atoms";
import type { AvatarColor, MemberRole, Project, ProjectMember } from "../types";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onAdd: (member: ProjectMember) => void;
}

const PALETTE: AvatarColor[] = ["gray", "green", "indigo", "rose", "orange"];

function colorFor(id: number): AvatarColor {
  return PALETTE[Math.abs(id) % PALETTE.length];
}

function fullName(e: EmployeeProfileData): string {
  const n = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim();
  return n || e.username || e.email || `Employee #${e.id}`;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  project,
  onAdd,
}: AddMemberDialogProps) {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [role, setRole] = useState<MemberRole>("Contributor");
  const reqId = useRef(0);

  useEffect(() => {
    if (!open) return;
    const myReq = ++reqId.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      employeeApi
        .listEmployees(
          { search: search || undefined, is_active: true, page_size: 50 },
          { signal: controller.signal }
        )
        .then((res) => {
          if (myReq !== reqId.current) return;
          setEmployees(res.results);
        })
        .catch((err: unknown) => {
          if (myReq !== reqId.current) return;
          if ((err as { name?: string })?.name === "AbortError") return;
          setError(
            err instanceof Error ? err.message : "Failed to load employees."
          );
          setEmployees([]);
        })
        .finally(() => {
          if (myReq !== reqId.current) return;
          setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedId(null);
      setRole("Contributor");
      setError(null);
    }
  }, [open]);

  const existingIds = useMemo(
    () => new Set(project.members.map((m) => m.id)),
    [project.members]
  );

  const handleAdd = () => {
    const emp = employees.find((e) => e.id === selectedId);
    if (!emp) return;
    onAdd({
      id: emp.id,
      name: fullName(emp),
      role,
      color: colorFor(emp.id),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            Add member to {project.name}
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            Pick an employee, assign a project role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
            <Search className="h-3.5 w-3.5 text-gray-500" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 border-0 bg-transparent px-0 text-[13px] text-gray-900 shadow-none placeholder:text-gray-500 focus-visible:ring-0"
            />
          </div>

          <div className="max-h-[280px] overflow-y-auto rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-gray-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading
                employees…
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-[13px] text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : employees.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-gray-700">
                No employees match your search.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {employees.map((e) => {
                  const already = existingIds.has(e.id);
                  const selected = selectedId === e.id;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={already}
                        onClick={() => setSelectedId(e.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                          already
                            ? "cursor-not-allowed opacity-50"
                            : selected
                              ? "bg-gray-100"
                              : "hover:bg-gray-50"
                        )}
                      >
                        <MemberAvatar
                          name={fullName(e)}
                          size={28}
                          color={colorFor(e.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-gray-900">
                            {fullName(e)}
                          </div>
                          <div className="truncate text-[11px] text-gray-700">
                            {e.role?.name || e.department || e.email}
                          </div>
                        </div>
                        {already ? (
                          <span className="text-[11px] font-medium text-gray-500">
                            Already on project
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="member-role"
              className="text-[12px] font-medium text-gray-700"
            >
              Role on project
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as MemberRole)}
            >
              <SelectTrigger id="member-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Contributor">Contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedId === null}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
