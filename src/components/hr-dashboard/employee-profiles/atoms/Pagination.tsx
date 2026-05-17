import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../ui/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  totalLabel?: string;
  onChange: (next: number) => void;
}

/** Compact numbered pager — used on list view. */
export function Pagination({
  page,
  pageCount,
  totalLabel,
  onChange,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = buildPageList(page, pageCount);
  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1"
    >
      {totalLabel ? (
        <div className="text-xs text-zinc-500">
          <strong className="font-semibold text-zinc-900">{totalLabel}</strong>
        </div>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <PageButton
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          ariaLabel="Previous page"
        >
          <ChevronLeft size={14} aria-hidden />
        </PageButton>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-2 text-xs text-zinc-500">
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onChange(p)}
              ariaLabel={`Page ${p}`}
              ariaCurrent={p === page ? "page" : undefined}
            >
              {p}
            </PageButton>
          )
        )}
        <PageButton
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          ariaLabel="Next page"
        >
          <ChevronRight size={14} aria-hidden />
        </PageButton>
      </div>
    </nav>
  );
}

interface PageButtonProps {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
  ariaCurrent?: "page" | undefined;
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ariaLabel,
  ariaCurrent,
}: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        active
          ? "border-[var(--ep-primary)] bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900",
        disabled && "cursor-not-allowed text-[#d1d5db] hover:text-[#d1d5db]"
      )}
    >
      {children}
    </button>
  );
}

/** Build truncated page list: 1 … n-1 n n+1 … last. */
function buildPageList(page: number, count: number): (number | "ellipsis")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) out.push("ellipsis");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < count - 1) out.push("ellipsis");
  out.push(count);
  return out;
}
