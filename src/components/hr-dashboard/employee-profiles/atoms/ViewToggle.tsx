import { LayoutGrid, List } from "lucide-react";
import { cn } from "../../ui/utils";

export type ProfilesListView = "grid" | "table";

interface ViewToggleProps {
  value: ProfilesListView;
  onChange: (next: ProfilesListView) => void;
}

/** Grid/table view toggle on the list page toolbar. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="List view"
      className="inline-flex gap-0.5 rounded-lg bg-zinc-100 p-1"
    >
      {(["grid", "table"] as const).map((option) => {
        const active = option === value;
        const Icon = option === "grid" ? LayoutGrid : List;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
              active
                ? "bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <Icon size={13} aria-hidden />
            {option === "grid" ? "Grid" : "Table"}
          </button>
        );
      })}
    </div>
  );
}
