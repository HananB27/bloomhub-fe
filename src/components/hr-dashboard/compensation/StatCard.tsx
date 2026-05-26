import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  badge: ReactNode;
  caption: string;
  delayMs?: number;
}

export function StatCard({
  icon,
  label,
  value,
  badge,
  caption,
  delayMs = 0,
}: StatCardProps) {
  return (
    <div
      className="comp-rise flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-white p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
        <span className="shrink-0 text-[#6b7280]">{icon}</span>
        {label}
      </div>
      <div className="comp-mono mt-0.5 text-[26px] font-bold leading-[1.1] tracking-tight text-[#171717]">
        {value}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
        {badge}
        <span>{caption}</span>
      </div>
    </div>
  );
}

interface StatBadgeProps {
  tone: "up" | "down" | "warn" | "neutral";
  children: ReactNode;
}

export function StatBadge({ tone, children }: StatBadgeProps) {
  const styles: Record<StatBadgeProps["tone"], string> = {
    up: "bg-[#f0fdf4] text-[#16a34a]",
    down: "bg-[#fef2f2] text-[#dc2626]",
    warn: "bg-[#fffbeb] text-[#b45309]",
    neutral: "bg-[#f3f4f6] text-[#4b5563]",
  };
  return (
    <span
      className={`comp-mono inline-flex items-center gap-1 rounded px-1.5 py-px text-[11px] font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
