import type { UserTemplateSnippetDto } from "@/lib/api/modules/templateSnippets";

export const USER_TEMPLATE_SNIPPETS_STORAGE_KEY =
  "bloomhub_user_template_snippets_v1";

export function loadLocalUserSnippets(): UserTemplateSnippetDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_TEMPLATE_SNIPPETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as UserTemplateSnippetDto[];
  } catch {
    return [];
  }
}

export function saveLocalUserSnippets(rows: UserTemplateSnippetDto[]): void {
  try {
    localStorage.setItem(
      USER_TEMPLATE_SNIPPETS_STORAGE_KEY,
      JSON.stringify(rows)
    );
  } catch {
    /* ignore quota */
  }
}

// ─── Built-in snippet overrides ──────────────────────────────────────────────
// Built-in snippets are hardcoded constants (TEMPLATE_EDITOR_SNIPPETS). Users
// can edit a built-in's label / html; the edit is stored as an override here
// and applied at render time. Reset removes the override.

export const BUILTIN_SNIPPET_OVERRIDES_STORAGE_KEY =
  "bloomhub_builtin_snippet_overrides_v1";

export type BuiltinSnippetOverride = {
  label: string;
  html: string;
  updated_at: string;
};

export type BuiltinSnippetOverrideMap = Record<string, BuiltinSnippetOverride>;

export function loadBuiltinSnippetOverrides(): BuiltinSnippetOverrideMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BUILTIN_SNIPPET_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return parsed as BuiltinSnippetOverrideMap;
  } catch {
    return {};
  }
}

export function saveBuiltinSnippetOverrides(
  map: BuiltinSnippetOverrideMap
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      BUILTIN_SNIPPET_OVERRIDES_STORAGE_KEY,
      JSON.stringify(map)
    );
  } catch {
    /* ignore quota */
  }
}
