import { Folder } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { formatDate } from "@/utils";
import { Chip, ProfileSection } from "../atoms";
import { EmptyState } from "../atoms/EmptyState";

interface ProfileProjectsSectionProps {
  profile: EmployeeProfileData;
}

/** Assigned projects list — chips per project plus tabular history. */
export function ProfileProjectsSection({
  profile,
}: ProfileProjectsSectionProps) {
  const projects = profile.assigned_projects ?? [];
  if (projects.length === 0) {
    return (
      <ProfileSection id="projects" kicker="Allocations" title="Projects">
        <EmptyState
          icon={<Folder size={32} aria-hidden />}
          title="No projects assigned"
          description="This employee isn't allocated to any active projects yet."
        />
      </ProfileSection>
    );
  }

  const active = projects.filter(
    (p) => (p.status ?? "").toLowerCase() !== "ended"
  );
  const past = projects.filter(
    (p) => (p.status ?? "").toLowerCase() === "ended"
  );

  return (
    <ProfileSection id="projects" kicker="Allocations" title="Projects">
      {active.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {active.map((p) => (
            <Chip key={p.id} variant="project">
              {p.project_name}
              {p.role ? <span className="opacity-70"> · {p.role}</span> : null}
            </Chip>
          ))}
        </div>
      ) : null}
      {past.length > 0 ? (
        <details>
          <summary className="mb-2 cursor-pointer text-xs font-semibold tracking-wider uppercase text-zinc-500">
            Past projects ({past.length})
          </summary>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-zinc-50">
              <tr>
                {(["Project", "Role", "Period"] as const).map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-zinc-200 px-3 py-2 text-left text-[11px] font-semibold text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {past.map((p) => (
                <tr key={p.id} className="hover:bg-[#fafaf9]">
                  <td className="border-b border-zinc-200 px-3 py-2.5">
                    {p.project_name}
                  </td>
                  <td className="border-b border-zinc-200 px-3 py-2.5 text-zinc-500">
                    {p.role || "—"}
                  </td>
                  <td className="ep-mono border-b border-zinc-200 px-3 py-2.5 text-xs text-zinc-500">
                    {formatDate(p.start_date)}
                    {p.end_date ? ` – ${formatDate(p.end_date)}` : " – present"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </ProfileSection>
  );
}
