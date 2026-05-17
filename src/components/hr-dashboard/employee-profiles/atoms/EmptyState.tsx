import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** List-view empty state — dashed-outline card centered in body. */
export function EmptyState({
  icon,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="mx-auto my-6 max-w-[520px] rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center"
    >
      {icon ? (
        <div className="mx-auto mb-4 grid h-[72px] w-[72px] place-items-center rounded-full bg-zinc-100 text-zinc-500">
          {icon}
        </div>
      ) : null}
      <h3 className="m-0 text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      ) : null}
      {actions ? (
        <div className="mt-5 inline-flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
