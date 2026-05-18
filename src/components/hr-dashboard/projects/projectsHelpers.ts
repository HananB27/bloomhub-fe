import type { Project, ProjectsListFilters } from "./types";

export function fmtDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtRelative(
  iso: string | undefined | null,
  now: Date = new Date()
): string {
  if (!iso) return "";
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)}w ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}mo ago`;
  return `${Math.floor(diff / 86400 / 365)}y ago`;
}

export function filterAndSortProjects(
  projects: Project[],
  search: string,
  filters: ProjectsListFilters
): Project[] {
  let list = projects;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }
  if (filters.status !== "All")
    list = list.filter((p) => p.status === filters.status);
  if (filters.client !== "All")
    list = list.filter((p) => p.client === filters.client);
  const sorted = [...list];
  switch (filters.sort) {
    case "Oldest":
      sorted.sort((a, b) => a.start_date.localeCompare(b.start_date));
      break;
    case "Name (A-Z)":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "Progress":
      sorted.sort((a, b) => b.progress - a.progress);
      break;
    default:
      sorted.sort((a, b) => b.last_activity.localeCompare(a.last_activity));
  }
  return sorted;
}

export function uniqueClients(projects: Project[]): string[] {
  return Array.from(new Set(projects.map((p) => p.client)));
}

export function activeFilterCount(
  search: string,
  filters: ProjectsListFilters
): number {
  let n = 0;
  if (search) n++;
  if (filters.status !== "All") n++;
  if (filters.client !== "All") n++;
  return n;
}
