"use client";

import React from "react";
import {
  GraduationCap,
  Wrench,
  Users,
  Award,
  BookOpen,
  FileText,
  Edit,
  Trash2,
  Loader2,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import type { TrainingEntry } from "@/types/training";
import { formatDate } from "@/lib/utils/date";

interface TrainingEntryListProps {
  entries: TrainingEntry[];
  isLoading?: boolean;
  onEdit?: (entry: TrainingEntry) => void;
  onDelete?: (entry: TrainingEntry) => void;
  isDeleting?: Record<number, boolean>;
  canEdit?: boolean;
  canDelete?: boolean;
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    tileClass: string;
    badgeClass: string;
    Icon: React.ElementType;
  }
> = {
  course: {
    label: "Course",
    tileClass: "bg-indigo-50 text-indigo-700",
    badgeClass: "bg-indigo-50 text-indigo-700",
    Icon: GraduationCap,
  },
  workshop: {
    label: "Workshop",
    tileClass: "bg-amber-50 text-amber-700",
    badgeClass: "bg-amber-50 text-amber-700",
    Icon: Wrench,
  },
  conference: {
    label: "Conference",
    tileClass: "bg-sky-50 text-sky-700",
    badgeClass: "bg-sky-50 text-sky-700",
    Icon: Users,
  },
  certification: {
    label: "Certification",
    tileClass: "bg-emerald-50 text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-700",
    Icon: Award,
  },
  seminar: {
    label: "Seminar",
    tileClass: "bg-rose-50 text-rose-700",
    badgeClass: "bg-rose-50 text-rose-700",
    Icon: BookOpen,
  },
  other: {
    label: "Other",
    tileClass: "bg-slate-100 text-slate-600",
    badgeClass: "bg-slate-100 text-slate-600",
    Icon: FileText,
  },
};

const STATUS_CONFIG: Record<string, { label: string; pillClass: string }> = {
  completed: { label: "Completed", pillClass: "bg-green-50 text-green-700" },
  "in-progress": {
    label: "In progress",
    pillClass: "bg-blue-50 text-blue-700",
  },
  planned: { label: "Planned", pillClass: "bg-slate-100 text-slate-600" },
};

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-emerald-600",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-sky-600",
];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const GRID = "minmax(0,1.7fr) 160px 120px 110px 90px 150px 72px";

export function TrainingEntryList({
  entries,
  isLoading = false,
  onEdit,
  onDelete,
  isDeleting = {},
  canEdit = true,
  canDelete = true,
}: TrainingEntryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading training entries...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-14 text-center">
        <h3 className="mb-1.5 text-base font-semibold text-gray-900">
          No training entries found
        </h3>
        <p className="text-sm text-gray-500">
          Log a course, conference, certification, or seminar to start building
          a learning history.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div
        className="grid items-center gap-4 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
        style={{ gridTemplateColumns: GRID }}
      >
        <div role="columnheader">Training</div>
        <div role="columnheader">Employee</div>
        <div role="columnheader">Date</div>
        <div role="columnheader">Status</div>
        <div role="columnheader">Cost</div>
        <div role="columnheader">Certificate</div>
        <div role="columnheader" />
      </div>

      {/* Rows */}
      <div className="rounded-b-lg border border-gray-200 bg-white">
        {entries.map((entry, idx) => {
          const typeConfig =
            TYPE_CONFIG[entry.trainingType] ?? TYPE_CONFIG.other;
          const statusConfig = STATUS_CONFIG[entry.status] ?? {
            label: entry.status,
            pillClass: "bg-gray-100 text-gray-600",
          };
          const TypeIcon = typeConfig.Icon;
          const showBorder = idx < entries.length - 1;

          return (
            <div
              key={entry.id}
              className={`grid items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50/70 ${showBorder ? "border-b border-gray-200" : ""}`}
              style={{ gridTemplateColumns: GRID }}
            >
              {/* Training name + type */}
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeConfig.tileClass}`}
                >
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13.5px] font-medium text-gray-900">
                      {entry.courseTitle}
                    </p>
                    {entry.certificateLink && (
                      <Award className="h-3 w-3 shrink-0 text-green-600" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{entry.provider}</span>
                    <span className="opacity-40">·</span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-medium ${typeConfig.badgeClass}`}
                    >
                      {typeConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employee */}
              <div className="flex min-w-0 items-center gap-2.5">
                {entry.employeeName ? (
                  <>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${getAvatarColor(entry.employeeName)}`}
                    >
                      {getInitials(entry.employeeName)}
                    </div>
                    <span className="truncate text-[13px] font-medium text-gray-800">
                      {entry.employeeName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Date */}
              <div>
                <div className="text-[12.5px] text-gray-900">
                  {formatDate(entry.trainingDate)}
                </div>
                {entry.completedAt && (
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    Done {formatDate(entry.completedAt)}
                  </div>
                )}
              </div>

              {/* Status pill */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${statusConfig.pillClass}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusConfig.label}
                </span>
              </div>

              {/* Cost */}
              <div className="font-mono text-[13px] font-medium text-gray-900">
                {entry.cost ? (
                  `$${typeof entry.cost === "number" ? entry.cost.toFixed(2) : parseFloat(entry.cost).toFixed(2)}`
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              {/* Certificate */}
              <div>
                {entry.certificateLink ? (
                  <a
                    href={entry.certificateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-[11.5px] font-medium text-green-700 hover:underline"
                    style={{ background: "rgb(240 253 244)" }}
                    title="View certificate"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Certificate
                  </a>
                ) : (
                  <span className="text-[11.5px] text-gray-400">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {canEdit && onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(entry)}
                    className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
                {canDelete && onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(entry)}
                    disabled={isDeleting[entry.id]}
                    className="h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    {isDeleting[entry.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
