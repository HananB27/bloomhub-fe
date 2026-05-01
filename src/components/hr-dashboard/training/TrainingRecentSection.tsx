"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight, Plus, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/hr-dashboard/ui/card";
import { Button } from "@/components/hr-dashboard/ui/button";
import { Badge } from "@/components/hr-dashboard/ui/badge";
import type { TrainingEntry } from "@/types/training";
import { fetchTrainingEntries } from "@/lib/api/training";
import { formatDate } from "@/utils";

interface TrainingRecentSectionProps {
  employeeId: number;
  accessToken: string;
  isOwnProfile?: boolean;
}

export function TrainingRecentSection({
  employeeId: _employeeId,
  accessToken,
  isOwnProfile = false,
}: TrainingRecentSectionProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentTraining = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all training entries (filtered by backend for this employee)
      const data = await fetchTrainingEntries(accessToken, {});
      // Take the 5 most recent entries
      setEntries(data.slice(0, 5));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load training entries";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadRecentTraining();
  }, [loadRecentTraining]);

  const getStatusColor = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "planned":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "planned":
        return "Planned";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Training & Development
          </CardTitle>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/training")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Training
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading training history...
          </div>
        ) : error ? (
          <div className="flex gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No training records yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {entry.courseTitle}
                    </h4>
                    <Badge
                      variant={getStatusColor(entry.status)}
                      className="shrink-0"
                    >
                      {getStatusDisplay(entry.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{entry.provider}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(entry.trainingDate)}
                    {entry.completedAt &&
                      ` • Completed: ${formatDate(entry.completedAt)}`}
                  </p>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full gap-2 mt-4"
              onClick={() => router.push("/training")}
            >
              View All Training
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
