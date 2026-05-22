// Lightweight cross-module navigation channel.
//
// The HR dashboard switches modules via `setActiveModule(id)` at the App
// level, but does not pass arbitrary payloads between modules. When the org
// chart needs to ask another module to focus a specific entity (open this
// employee, filter by that name), it stashes a one-shot request here.
//
// The receiving module consumes the request on mount and clears it, so
// re-entering the module later does not re-trigger the action.

const OPEN_EMPLOYEE_KEY = "bloomhub:orgchart:openEmployeeId";
const PROJECTS_FILTER_KEY = "bloomhub:orgchart:projectsSearch";
const OPEN_PROJECT_KEY = "bloomhub:orgchart:openProjectId";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function requestOpenEmployee(id: number) {
  safeStorage()?.setItem(OPEN_EMPLOYEE_KEY, String(id));
}

export function consumeOpenEmployeeRequest(): number | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(OPEN_EMPLOYEE_KEY);
  if (!raw) return null;
  s.removeItem(OPEN_EMPLOYEE_KEY);
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function requestProjectsSearch(query: string) {
  safeStorage()?.setItem(PROJECTS_FILTER_KEY, query);
}

export function consumeProjectsSearchRequest(): string | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(PROJECTS_FILTER_KEY);
  if (raw == null) return null;
  s.removeItem(PROJECTS_FILTER_KEY);
  return raw;
}

export function requestOpenProject(id: number | string) {
  safeStorage()?.setItem(OPEN_PROJECT_KEY, String(id));
}

export function consumeOpenProjectRequest(): string | null {
  const s = safeStorage();
  if (!s) return null;
  const raw = s.getItem(OPEN_PROJECT_KEY);
  if (!raw) return null;
  s.removeItem(OPEN_PROJECT_KEY);
  return raw;
}
