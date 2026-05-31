"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Cake, Gift, Loader2 } from "lucide-react";
import {
  CelebrationAccessDeniedError,
  celebrationsApi,
  type UpcomingCelebration,
} from "@/lib/api/celebrations";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ProfileSection, RestrictedBlock } from "./atoms";

type WidgetVariant = "section" | "card";

interface UpcomingCelebrationsWidgetProps {
  variant?: WidgetVariant;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatEventDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function eventCopy(item: UpcomingCelebration): {
  label: string;
  icon: typeof Cake;
  badgeClass: string;
} {
  if (item.event_type === "anniversary") {
    return {
      label: "Work anniversary",
      icon: Gift,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  return {
    label: "Birthday",
    icon: Cake,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  };
}

function daysUntilLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function UpcomingCelebrationsBody() {
  const [items, setItems] = useState<UpcomingCelebration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCelebrations() {
      try {
        setLoading(true);
        setError(null);
        setForbidden(false);
        const data = await celebrationsApi.upcoming(
          { days: 30, type: "all" },
          { signal: controller.signal }
        );
        setItems(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof CelebrationAccessDeniedError) {
          setForbidden(true);
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load upcoming celebrations"
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCelebrations();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-sm text-zinc-500"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading celebrations...
      </div>
    );
  }

  if (forbidden) {
    return (
      <RestrictedBlock
        title="Celebrations unavailable"
        description="You do not have permission to view upcoming celebrations."
      />
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No upcoming celebrations.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const copy = eventCopy(item);
        const EventIcon = copy.icon;

        return (
          <div
            key={`${item.event_type}-${item.employee.id}-${item.event_date}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
          >
            <Avatar className="h-10 w-10">
              {item.employee.avatar_url ? (
                <AvatarImage
                  src={item.employee.avatar_url}
                  alt={item.employee.full_name}
                />
              ) : null}
              <AvatarFallback className="text-xs font-semibold">
                {initials(item.employee.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {item.employee.full_name}
                </p>
                <Badge variant="outline" className={copy.badgeClass}>
                  <EventIcon className="mr-1 h-3 w-3" aria-hidden />
                  {copy.label}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {formatEventDate(item.event_date)}
                </span>
                <span>{daysUntilLabel(item.days_until)}</span>
                {item.event_type === "anniversary" &&
                item.anniversary_years !== null ? (
                  <span>{item.anniversary_years} years</span>
                ) : null}
                {item.employee.department ? (
                  <span>{item.employee.department}</span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function UpcomingCelebrationsWidget({
  variant = "section",
}: UpcomingCelebrationsWidgetProps) {
  if (variant === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" aria-hidden />
            Upcoming Celebrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UpcomingCelebrationsBody />
        </CardContent>
      </Card>
    );
  }

  return (
    <ProfileSection id="celebrations" kicker="People" title="Celebrations">
      <UpcomingCelebrationsBody />
    </ProfileSection>
  );
}
