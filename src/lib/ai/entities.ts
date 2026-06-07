import type { AiEntity, AiEntitySpan, AiEntityType } from "@/lib/api/aiChat";
import type { HrModuleId } from "@/components/hr-dashboard/hr-modules";

export const ENTITY_TO_MODULE: Record<AiEntityType, HrModuleId> = {
  employee: "profiles",
  leave_request: "vacations",
  asset: "assets",
  document: "documents",
  document_template: "documents",
  time_entry: "timetracking",
  notification: "dashboard",
};

export function entityModule(type: AiEntityType): HrModuleId {
  return ENTITY_TO_MODULE[type] ?? "dashboard";
}

export function dedupeEntities(entities: AiEntity[] | undefined): AiEntity[] {
  if (!entities) return [];
  const seen = new Set<string>();
  const out: AiEntity[] = [];
  for (const e of entities) {
    const key = `${e.type}:${e.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

export interface EntityToken {
  kind: "entity";
  entity: AiEntitySpan;
}

export interface TextToken {
  kind: "text";
  text: string;
}

export type LinearToken = EntityToken | TextToken;

function isValidSpan(span: AiEntitySpan, textLength: number): boolean {
  return (
    Number.isFinite(span.start) &&
    Number.isFinite(span.end) &&
    span.start >= 0 &&
    span.end <= textLength &&
    span.end > span.start
  );
}

function pushTextToken(
  tokens: LinearToken[],
  text: string,
  from: number,
  to: number
): void {
  if (to > from) {
    tokens.push({ kind: "text", text: text.slice(from, to) });
  }
}

function pushEntityToken(tokens: LinearToken[], span: AiEntitySpan): void {
  tokens.push({ kind: "entity", entity: span });
}

export function spliceEntityTokens(
  text: string,
  spans: AiEntitySpan[] | undefined
): LinearToken[] {
  if (!spans || spans.length === 0) {
    return text ? [{ kind: "text", text }] : [];
  }
  const valid = spans
    .filter((s) => isValidSpan(s, text.length))
    .sort((a, b) => a.start - b.start);

  const tokens: LinearToken[] = [];
  let cursor = 0;
  for (const span of valid) {
    if (span.start < cursor) continue;
    pushTextToken(tokens, text, cursor, span.start);
    pushEntityToken(tokens, span);
    cursor = span.end;
  }
  pushTextToken(tokens, text, cursor, text.length);
  return tokens;
}
