import type { ReactNode } from "react";

interface ProfileSectionProps {
  id: string;
  anchor?: string;
  kicker?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Section wrapper for the profile detail body. D-17 a11y — `<section>` with
 * `aria-labelledby` pointing at the heading id. Sticky-rail scroll-spy keys
 * off `anchor` (defaults to `id`).
 */
export function ProfileSection({
  id,
  anchor,
  kicker,
  title,
  action,
  children,
}: ProfileSectionProps) {
  const headingId = `${id}-h`;
  return (
    <section
      id={anchor ?? id}
      aria-labelledby={headingId}
      className="scroll-mt-[100px] rounded-2xl border border-zinc-200 bg-white p-[22px_24px]"
    >
      <header className="mb-[18px] flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          {kicker ? (
            <div className="mb-1 text-[11px] font-medium text-zinc-500">
              {kicker}
            </div>
          ) : null}
          <h2
            id={headingId}
            className="m-0 text-[17px] font-semibold tracking-tight text-zinc-900"
          >
            {title}
          </h2>
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
