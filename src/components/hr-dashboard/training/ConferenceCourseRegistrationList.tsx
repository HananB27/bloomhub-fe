"use client";

import React from "react";
import { Edit, Loader2, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { formatDate } from "@/utils";
import type { ConferenceCourseRegistration } from "@/types/conferenceCourseRegistration";
import {
  CONFERENCE_COURSE_REGISTRATION_STATUS_LABELS,
  CONFERENCE_COURSE_REGISTRATION_STATUS_PILL_CLASSES,
} from "@/types/conferenceCourseRegistration";

interface ConferenceCourseRegistrationListProps {
  registrations: ConferenceCourseRegistration[];
  isLoading?: boolean;
  onEdit?: (registration: ConferenceCourseRegistration) => void;
  onDelete?: (registration: ConferenceCourseRegistration) => void;
  isDeleting?: Record<number, boolean>;
  canEdit?: boolean;
  canDelete?: boolean;
}

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

const GRID = "minmax(0,1.7fr) 180px 130px 120px minmax(0,1.2fr) 72px";

export function ConferenceCourseRegistrationList({
  registrations,
  isLoading = false,
  onEdit,
  onDelete,
  isDeleting = {},
  canEdit = true,
  canDelete = true,
}: ConferenceCourseRegistrationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading registrations...</p>
        </div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-14 text-center">
        <h3 className="mb-1.5 text-base font-semibold text-gray-900">
          No registrations yet
        </h3>
        <p className="text-sm text-gray-500">
          Track conference and course sign-ups, attendance, and cancellations
          from one place.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="grid items-center gap-4 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
        style={{ gridTemplateColumns: GRID }}
      >
        <div role="columnheader">Name</div>
        <div role="columnheader">Employee</div>
        <div role="columnheader">Date</div>
        <div role="columnheader">Status</div>
        <div role="columnheader">Notes</div>
        <div role="columnheader" />
      </div>

      <div className="rounded-b-lg border border-gray-200 bg-white">
        {registrations.map((reg, idx) => {
          const pillClass =
            CONFERENCE_COURSE_REGISTRATION_STATUS_PILL_CLASSES[reg.status] ??
            "bg-gray-100 text-gray-600";
          const statusLabel =
            CONFERENCE_COURSE_REGISTRATION_STATUS_LABELS[reg.status] ??
            reg.statusDisplay ??
            reg.status;
          const showBorder = idx < registrations.length - 1;

          return (
            <div
              key={reg.id}
              className={`grid items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50/70 ${
                showBorder ? "border-b border-gray-200" : ""
              }`}
              style={{ gridTemplateColumns: GRID }}
            >
              {/* Name */}
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-gray-900">
                    {reg.name}
                  </p>
                </div>
              </div>

              {/* Employee */}
              <div className="flex min-w-0 items-center gap-2.5">
                {reg.employeeName ? (
                  <>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${getAvatarColor(reg.employeeName)}`}
                    >
                      {getInitials(reg.employeeName)}
                    </div>
                    <span className="truncate text-[13px] font-medium text-gray-800">
                      {reg.employeeName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Date */}
              <div className="text-[12.5px] text-gray-900">
                {formatDate(reg.date)}
              </div>

              {/* Status */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${pillClass}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel}
                </span>
              </div>

              {/* Notes */}
              <div className="min-w-0">
                {reg.notes ? (
                  <p
                    className="truncate text-[12.5px] text-gray-600"
                    title={reg.notes}
                  >
                    {reg.notes}
                  </p>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {canEdit && onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(reg)}
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
                    onClick={() => onDelete(reg)}
                    disabled={isDeleting[reg.id]}
                    className="h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    {isDeleting[reg.id] ? (
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
