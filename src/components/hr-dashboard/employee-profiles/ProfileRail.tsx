import { Mail, Phone, Lock } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { cn } from "../ui/utils";
import { EmployeeAvatar } from "./atoms/EmployeeAvatar";
import { StatusPill } from "./atoms/StatusPill";
import { deriveEmployeeStatus } from "./employeesListHelpers";
import type { ProfileSectionNavItem } from "./useProfileSectionNav";

interface ProfileRailProps {
  profile: EmployeeProfileData;
  sections: readonly ProfileSectionNavItem[];
  activeId: string;
  onJump: (id: string) => void;
}

/**
 * D-01 sticky left rail. Identity card (avatar + name + role + status +
 * tenure + quick contact rows) plus profile section TOC. Scroll-spy active.
 */
export function ProfileRail({
  profile,
  sections,
  activeId,
  onJump,
}: ProfileRailProps) {
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const tenure = computeYearsOfService(profile.start_date);
  return (
    <aside
      style={{ position: "sticky", top: "1rem", alignSelf: "flex-start" }}
      className="z-10 w-full shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:w-[280px]"
    >
      <div className="border-b border-zinc-200 px-[22px] py-6 text-left">
        <EmployeeAvatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          src={profile.avatar}
          size={84}
        />
        <div className="mt-3.5 text-[17px] font-semibold leading-tight tracking-tight">
          {fullName}
        </div>
        {profile.role?.name ? (
          <div className="mt-1 text-[13px] text-zinc-500">
            {profile.role.name}
          </div>
        ) : null}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <StatusPill status={deriveEmployeeStatus(profile)} />
          {tenure !== null ? (
            <span className="ep-mono text-[11px] text-zinc-500">
              {tenure}y at Bloomteq
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          {profile.email ? (
            <a
              href={`mailto:${profile.email}`}
              title={profile.email}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <Mail size={13} aria-hidden />
              <span className="truncate">{profile.email}</span>
            </a>
          ) : null}
          {profile.phone_number ? (
            <a
              href={`tel:${profile.phone_number}`}
              title={profile.phone_number}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <Phone size={13} aria-hidden />
              <span className="truncate">{profile.phone_number}</span>
            </a>
          ) : null}
        </div>
      </div>
      <nav className="px-2 pt-2 pb-3.5" aria-label="Profile sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onJump(section.id)}
            aria-current={activeId === section.id ? "true" : undefined}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-[13px] font-medium text-zinc-700 transition-colors",
              "hover:bg-zinc-100 hover:text-zinc-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
              activeId === section.id &&
                "bg-amber-50 font-semibold text-zinc-900"
            )}
          >
            <span>{section.label}</span>
            {section.locked ? <Lock size={11} aria-label="Restricted" /> : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}

/** Whole-year tenure based on start_date. Returns null when unknown. */
function computeYearsOfService(startDate: string | undefined): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}
