"use client";

import { useEffect, useMemo, useState } from "react";
import { filterAndSortProjects, uniqueClients } from "./projectsHelpers";
import type { Project, ProjectsListFilters, ProjectsListView } from "./types";

const DEFAULT_FILTERS: ProjectsListFilters = {
  status: "All",
  client: "All",
  sort: "Newest",
};

export function useProjectsListView(projects: Project[]) {
  const [view, setView] = useState<ProjectsListView>("grid");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProjectsListFilters>(DEFAULT_FILTERS);

  const setFilter = <K extends keyof ProjectsListFilters>(
    key: K,
    value: ProjectsListFilters[K]
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const clearAll = () => {
    setSearch("");
    setFilters(DEFAULT_FILTERS);
  };

  const clients = useMemo(() => uniqueClients(projects), [projects]);
  const filtered = useMemo(
    () => filterAndSortProjects(projects, search, filters),
    [projects, search, filters]
  );

  // ⌘K / Ctrl+K focuses the toolbar search input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const input = document.querySelector<HTMLInputElement>(
          "[data-projects-search] input"
        );
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    view,
    setView,
    search,
    setSearch,
    filters,
    setFilter,
    clearAll,
    clients,
    filtered,
  };
}
