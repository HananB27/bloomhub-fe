import type { ReactNode } from "react";
import { cn } from "../../ui/utils";

export type ChipVariant =
  | "tech"
  | "language"
  | "project"
  | "manager"
  | "neutral";

const CHIP_VARIANT_CLASSES: Record<ChipVariant, string> = {
  tech: "bg-zinc-100 text-zinc-700",
  language: "bg-emerald-50 text-emerald-700",
  project: "bg-indigo-50 text-indigo-700",
  manager: "bg-white border border-zinc-200 rounded-full pl-1 pr-2.5 py-1",
  neutral: "bg-zinc-100 text-zinc-700",
};

interface ChipProps {
  variant?: ChipVariant;
  children: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
}

/** D-19 / chip atoms (tech, lang, project, manager). Rounded `--ep-radius-xs`. */
export function Chip({
  variant = "neutral",
  children,
  leadingIcon,
  trailingIcon,
  className,
}: ChipProps) {
  const isPill = variant === "manager";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        !isPill && "px-2.5 py-1 rounded-md",
        CHIP_VARIANT_CLASSES[variant],
        className
      )}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </span>
  );
}

interface AddChipProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

/** Dashed-outline add-chip companion to Chip. */
export function AddChip({ onClick, children, className }: AddChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium",
        "rounded-md border border-dashed border-zinc-300",
        "text-zinc-500 hover:text-zinc-900 hover:border-[var(--ep-fg)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        "transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
