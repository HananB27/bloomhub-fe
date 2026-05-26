import { cn } from "../../ui/utils";

export interface SortToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SortToggleProps<T extends string> {
  value: T;
  options: readonly SortToggleOption<T>[];
  onChange: (next: T) => void;
  ariaLabel: string;
}

/** Small grey pill toggle used in section headers (e.g. CV list sort). */
export function SortToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SortToggleProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex gap-0 rounded-md bg-zinc-100 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
              active
                ? "bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
