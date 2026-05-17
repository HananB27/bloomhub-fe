interface CountBadgeProps {
  count: number;
  label?: string;
}

/** Tabular-num pill displayed next to a page title. */
export function CountBadge({ count, label }: CountBadgeProps) {
  return (
    <span
      aria-label={label ?? `${count} total`}
      className="inline-flex h-6 min-w-7 items-center justify-center rounded-md bg-zinc-100 px-2 text-sm font-semibold tabular-nums text-zinc-700"
    >
      {count}
    </span>
  );
}
