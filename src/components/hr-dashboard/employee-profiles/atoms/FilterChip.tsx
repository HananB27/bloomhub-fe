import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

/** Active-filter chip with built-in remove button. */
export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 py-0.5 pr-1 pl-2.5 text-xs text-indigo-700">
      <span>
        <strong className="font-semibold">{label}:</strong> {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-md bg-white/60 text-indigo-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <X size={12} aria-hidden />
      </button>
    </span>
  );
}
