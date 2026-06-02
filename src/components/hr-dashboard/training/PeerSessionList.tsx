"use client";

import React from "react";
import { Edit, Loader2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/hr-dashboard/ui/button";
import { formatDate } from "@/utils";
import type { PeerSession } from "@/types/peerSession";

interface PeerSessionListProps {
  sessions: PeerSession[];
  isLoading?: boolean;
  onEdit?: (session: PeerSession) => void;
  onDelete?: (session: PeerSession) => void;
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

const GRID = "minmax(0,1.7fr) 180px 130px 110px minmax(0,1.2fr) 72px";

export function PeerSessionList({
  sessions,
  isLoading = false,
  onEdit,
  onDelete,
  isDeleting = {},
  canEdit = true,
  canDelete = true,
}: PeerSessionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading peer sessions...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-14 text-center">
        <h3 className="mb-1.5 text-base font-semibold text-gray-900">
          No peer sessions yet
        </h3>
        <p className="text-sm text-gray-500">
          Log peer-led sessions to track knowledge sharing and incentive
          eligibility.
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
        <div role="columnheader">Topic</div>
        <div role="columnheader">Employee</div>
        <div role="columnheader">Date</div>
        <div role="columnheader">Duration</div>
        <div role="columnheader">Notes</div>
        <div role="columnheader" />
      </div>

      <div className="rounded-b-lg border border-gray-200 bg-white">
        {sessions.map((s, idx) => {
          const showBorder = idx < sessions.length - 1;
          return (
            <div
              key={s.id}
              className={`grid items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50/70 ${
                showBorder ? "border-b border-gray-200" : ""
              }`}
              style={{ gridTemplateColumns: GRID }}
            >
              {/* Topic */}
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-gray-900">
                    {s.topic}
                  </p>
                </div>
              </div>

              {/* Employee */}
              <div className="flex min-w-0 items-center gap-2.5">
                {s.employeeName ? (
                  <>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${getAvatarColor(s.employeeName)}`}
                    >
                      {getInitials(s.employeeName)}
                    </div>
                    <span className="truncate text-[13px] font-medium text-gray-800">
                      {s.employeeName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Date */}
              <div className="text-[12.5px] text-gray-900">
                {formatDate(s.sessionDate)}
              </div>

              {/* Duration */}
              <div className="text-[12.5px] text-gray-700">
                {s.durationMinutes ? `${s.durationMinutes} min` : "—"}
              </div>

              {/* Notes */}
              <div className="min-w-0">
                {s.description ? (
                  <p
                    className="truncate text-[12.5px] text-gray-600"
                    title={s.description}
                  >
                    {s.description}
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
                    onClick={() => onEdit(s)}
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
                    onClick={() => onDelete(s)}
                    disabled={isDeleting[s.id]}
                    className="h-7 w-7 p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    {isDeleting[s.id] ? (
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
