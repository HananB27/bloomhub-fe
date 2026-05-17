import { cn } from "../../ui/utils";

interface SkeletonCardProps {
  /** Number of skeleton cards to render. */
  count?: number;
}

/** Grid-view skeleton card. Matches `ee-card` layout. */
export function SkeletonCard({ count = 8 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="rounded-2xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="ep-shimmer h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="ep-shimmer h-2.5 w-3/4 rounded-md" />
              <div className="ep-shimmer h-2.5 w-1/2 rounded-md" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="ep-shimmer h-4 w-14 rounded-full" />
            <div className="ep-shimmer h-4 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}

/** Table-row skeleton — used inside <tbody>. */
export function SkeletonRow({
  cols = 6,
  rows = 6,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="p-3.5">
              <div
                className={cn(
                  "ep-shimmer h-2.5 rounded-md",
                  c === 0 ? "w-32" : "w-20"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
