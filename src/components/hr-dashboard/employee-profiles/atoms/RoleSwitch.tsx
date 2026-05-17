import { cn } from "../../ui/utils";

export type ProfileViewerRole = "hr" | "manager" | "employee";

export const PROFILE_VIEWER_ROLE_LABELS: Record<ProfileViewerRole, string> = {
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

interface RoleSwitchProps {
  value: ProfileViewerRole;
  options?: readonly ProfileViewerRole[];
  onChange: (next: ProfileViewerRole) => void;
  label?: string;
}

const DEFAULT_OPTIONS: readonly ProfileViewerRole[] = [
  "hr",
  "manager",
  "employee",
];

/**
 * Header role switcher. Lets HR users preview the page as Manager / Employee
 * for permission QA without leaving the page.
 */
export function RoleSwitch({
  value,
  options = DEFAULT_OPTIONS,
  onChange,
  label = "View as",
}: RoleSwitchProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white py-1 pr-1 pl-3"
    >
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      <div className="flex gap-0.5">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              )}
            >
              {PROFILE_VIEWER_ROLE_LABELS[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
