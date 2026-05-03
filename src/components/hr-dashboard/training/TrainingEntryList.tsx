"use client";

import React from "react";
import {
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/hr-dashboard/ui/table";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Badge } from "@/components/hr-dashboard/ui/badge";
import type { TrainingEntry } from "@/types/training";
import { formatDate } from "@/utils";

interface TrainingEntryListProps {
  entries: TrainingEntry[];
  isLoading?: boolean;
  onEdit?: (entry: TrainingEntry) => void;
  onDelete?: (entry: TrainingEntry) => void;
  isDeleting?: Record<number, boolean>;
  canEdit?: boolean;
  canDelete?: boolean;
}

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    color: "bg-green-50 text-green-700",
    label: "Completed",
  },
  "in-progress": {
    icon: Clock,
    color: "bg-blue-50 text-blue-700",
    label: "In Progress",
  },
  planned: {
    icon: AlertCircle,
    color: "bg-yellow-50 text-yellow-700",
    label: "Planned",
  },
} as const;

const DEFAULT_STATUS = {
  icon: AlertCircle,
  color: "bg-gray-50 text-gray-700",
  label: "Unknown",
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  course: "Course",
  workshop: "Workshop",
  conference: "Conference",
  certification: "Certification",
  seminar: "Seminar",
  other: "Other",
};

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
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading training entries...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-12">
        <p className="text-sm text-gray-500">
          No training entries found. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow className="border-b border-gray-200 hover:bg-gray-50">
            <TableHead className="py-3 font-semibold text-gray-900">
              Course
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-900">
              Provider
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-900">
              Type
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-900">
              Date
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-900">
              Status
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-900">
              Cost
            </TableHead>
            {(canEdit || canDelete) && (
              <TableHead className="py-3 text-right font-semibold text-gray-900">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const statusConfig =
              STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] ||
              DEFAULT_STATUS;
            const StatusIcon = statusConfig.icon;

            return (
              <TableRow
                key={entry.id}
                className="border-b border-gray-200 transition-colors hover:bg-gray-50"
              >
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">
                      {entry.courseTitle}
                    </p>
                    {entry.employeeName && (
                      <p className="text-xs text-gray-500">
                        {entry.employeeName}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {entry.provider}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="secondary">
                    {TRAINING_TYPE_LABELS[entry.trainingType] ||
                      entry.trainingType}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(entry.trainingDate)}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-700">
                  {entry.cost
                    ? `$${typeof entry.cost === "number" ? entry.cost.toFixed(2) : parseFloat(entry.cost).toFixed(2)}`
                    : "—"}
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit && onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(entry)}
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(entry)}
                          disabled={isDeleting[entry.id]}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Delete entry"
                        >
                          {isDeleting[entry.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
