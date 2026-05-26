import type { ProjectStatus, ProjectType } from "@/lib/api/modules/projects";

const CLIENTS_KEY = "bh.projects.clients";
const DEFAULTS_KEY = "bh.projects.defaults";

export interface ProjectAdminDefaults {
  default_status: ProjectStatus;
  default_project_type: ProjectType;
  default_app_stack: string;
  require_lead: boolean;
}

const FALLBACK_CLIENTS = [
  "Internal",
  "Acme Logistics",
  "Northwind Retail",
  "BlueWave Studios",
  "Lumen Health",
];

const FALLBACK_DEFAULTS: ProjectAdminDefaults = {
  default_status: "active",
  default_project_type: "client",
  default_app_stack: "",
  require_lead: true,
};

function safeRead(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("bh.admin.projects.updated"));
  } catch {
    /* ignore */
  }
}

export function getProjectClients(): string[] {
  const stored = safeRead(CLIENTS_KEY);
  if (Array.isArray(stored) && stored.every((s) => typeof s === "string")) {
    return stored as string[];
  }
  return [...FALLBACK_CLIENTS];
}

export function setProjectClients(clients: string[]): void {
  const cleaned = Array.from(
    new Set(clients.map((c) => c.trim()).filter(Boolean))
  );
  safeWrite(CLIENTS_KEY, cleaned);
}

export function addProjectClient(name: string): string[] {
  const next = Array.from(
    new Set([...getProjectClients(), name.trim()])
  ).filter(Boolean);
  setProjectClients(next);
  return next;
}

export function removeProjectClient(name: string): string[] {
  const next = getProjectClients().filter((c) => c !== name);
  setProjectClients(next);
  return next;
}

export function renameProjectClient(
  oldName: string,
  newName: string
): string[] {
  const trimmed = newName.trim();
  if (!trimmed) return getProjectClients();
  const next = getProjectClients().map((c) => (c === oldName ? trimmed : c));
  setProjectClients(Array.from(new Set(next)));
  return getProjectClients();
}

export function getProjectDefaults(): ProjectAdminDefaults {
  const stored = safeRead(DEFAULTS_KEY) as Partial<ProjectAdminDefaults> | null;
  if (!stored || typeof stored !== "object") return { ...FALLBACK_DEFAULTS };
  return {
    ...FALLBACK_DEFAULTS,
    ...stored,
  };
}

export function setProjectDefaults(next: ProjectAdminDefaults): void {
  safeWrite(DEFAULTS_KEY, next);
}

export function onProjectAdminSettingsChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("bh.admin.projects.updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("bh.admin.projects.updated", handler);
    window.removeEventListener("storage", handler);
  };
}
