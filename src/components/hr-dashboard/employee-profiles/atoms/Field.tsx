import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "../../ui/utils";

interface FieldProps {
  label: string;
  /** Tailwind grid span class, e.g. "col-span-6". Defaults to span-12. */
  span?: string;
  children: ReactNode;
  className?: string;
}

/** D-06 12-col field row. Label + value slot. */
export function Field({
  label,
  span = "col-span-12",
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn(span, className)}>
      <div className="mb-1.5 text-xs font-medium text-zinc-500">{label}</div>
      {children}
    </div>
  );
}

interface FieldValueProps {
  children: ReactNode;
  mono?: boolean;
  className?: string;
}

export function FieldValue({ children, mono, className }: FieldValueProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900",
        mono && "ep-mono",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Empty-state pill — D-06 grey chip when value is null. */
export function FieldEmpty({ children = "Not set" }: { children?: ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 text-xs rounded-md bg-zinc-100 text-zinc-500">
      {children}
    </span>
  );
}

interface FieldRestrictedProps {
  label?: ReactNode;
  className?: string;
}

/** D-10 restricted field cue — dashed outline + lock icon. */
export function FieldRestricted({
  label = "Restricted",
  className,
}: FieldRestrictedProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium",
        "rounded-md border border-dashed border-zinc-300",
        "bg-zinc-50 text-zinc-500 cursor-not-allowed",
        className
      )}
      aria-label="Restricted field"
    >
      <Lock size={12} aria-hidden />
      {label}
    </span>
  );
}
