import {
  Clock,
  DollarSign,
  Inbox,
  Plane,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardKpi } from "@/types/dashboard";

const ICON_MAP: Record<DashboardKpi["icon"], LucideIcon> = {
  users: Users,
  plane: Plane,
  inbox: Inbox,
  star: Star,
  "user-plus": UserPlus,
  clock: Clock,
  dollar: DollarSign,
};

const TONE_CLASSES: Record<NonNullable<DashboardKpi["tone"]>, string> = {
  accent: "bg-indigo-50 text-indigo-700",
  warning: "bg-amber-50 text-amber-700",
};

const SUB_TONE_CLASSES: Record<
  NonNullable<DashboardKpi["sub"]>["tone"],
  string
> = {
  up: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  flat: "bg-gray-100 text-gray-600",
};

interface Props {
  kpi: DashboardKpi;
}

export function KpiCard({ kpi }: Props) {
  const Icon = ICON_MAP[kpi.icon];
  const tone = kpi.tone ?? "accent";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-grid h-8 w-8 place-items-center rounded-lg ${TONE_CLASSES[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        {kpi.sub && (
          <span
            className={`rounded px-1.5 py-[3px] text-[11px] font-semibold ${SUB_TONE_CLASSES[kpi.sub.tone]}`}
          >
            {kpi.sub.text}
          </span>
        )}
      </div>
      <div className="font-mono text-[28px] font-semibold leading-none tracking-tight text-gray-900">
        {kpi.value}
      </div>
      <div className="mt-2 text-[12.5px] text-gray-600">{kpi.label}</div>
    </div>
  );
}
