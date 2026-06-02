import type { ReactNode } from "react";

interface Props {
  title: string;
  kicker?: string;
  action?: ReactNode;
  count?: number | string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  kicker,
  action,
  count,
  children,
  footer,
  className = "",
}: Props) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}
    >
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          {kicker && (
            <div className="text-[11px] font-medium text-gray-600">
              {kicker}
            </div>
          )}
          <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
            {title}
          </h3>
        </div>
        {count !== undefined ? (
          <span className="inline-grid h-[22px] min-w-[24px] place-items-center rounded bg-gray-100 px-2 font-mono text-xs font-semibold text-gray-700">
            {count}
          </span>
        ) : (
          action
        )}
      </div>
      <div>{children}</div>
      {footer}
    </section>
  );
}
