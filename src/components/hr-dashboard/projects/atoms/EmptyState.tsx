import { type ReactNode } from "react";
import { cn } from "../../ui/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  tone = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto my-6 max-w-[520px] rounded-xl border border-dashed border-gray-300 bg-white px-8 py-16 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto mb-[18px] inline-flex h-[72px] w-[72px] items-center justify-center rounded-full",
          tone === "danger"
            ? "bg-red-50 text-red-700"
            : "bg-gray-100 text-gray-500"
        )}
      >
        {icon}
      </div>
      <h3 className="m-0 text-lg font-semibold tracking-tight text-gray-900">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-[36ch] text-[13px] leading-[1.55] text-gray-500">
        {description}
      </p>
      {actions ? (
        <div className="mt-[22px] inline-flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
