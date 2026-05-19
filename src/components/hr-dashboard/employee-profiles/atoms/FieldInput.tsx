import type { InputHTMLAttributes } from "react";
import { cn } from "../../ui/utils";

type FieldInputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Bordered text input sized to match the design's edit-mode field.
 * Renders inside <Field> so the label/grid wrapper stays consistent.
 */
export function FieldInput({ className, ...props }: FieldInputProps) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 transition-colors",
        "placeholder:text-zinc-400",
        "focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/10",
        "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
        className
      )}
    />
  );
}
