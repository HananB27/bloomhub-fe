import type { AiEntity, AiEntitySpan, AiEntityType } from "@/lib/api/aiChat";
import type { HrModuleId } from "@/components/hr-dashboard/hr-modules";
import { describe, it, expect } from "vitest";

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

export function spliceEntityTokens(
  text: string,
  spans: AiEntitySpan[] | undefined
): LinearToken[] {
  if (!spans || spans.length === 0) {
    return text ? [{ kind: "text", text }] : [];
  }
  const valid = spans
    .filter(
      (s) =>
        Number.isFinite(s.start) &&
        Number.isFinite(s.end) &&
        s.start >= 0 &&
        s.end <= text.length &&
        s.end > s.start
    )
    .sort((a, b) => a.start - b.start);

  const tokens: LinearToken[] = [];
  let cursor = 0;
  for (const span of valid) {
    if (span.start < cursor) continue;
    if (span.start > cursor) {
      tokens.push({ kind: "text", text: text.slice(cursor, span.start) });
    }
    tokens.push({ kind: "entity", entity: span });
    cursor = span.end;
  }
  if (cursor < text.length) {
    tokens.push({ kind: "text", text: text.slice(cursor) });
  }
  return tokens;
}

describe("entityModule", () => {
  it("returns correct module for known entity types", () => {
    expect(entityModule("employee")).toBe("profiles");
    expect(entityModule("leave_request")).toBe("vacations");
    expect(entityModule("asset")).toBe("assets");
    expect(entityModule("document")).toBe("documents");
    expect(entityModule("document_template")).toBe("documents");
    expect(entityModule("time_entry")).toBe("timetracking");
    expect(entityModule("notification")).toBe("dashboard");
  });

  it("returns dashboard for unknown entity types", () => {
    expect(entityModule("unknown" as AiEntityType)).toBe("dashboard");
  });
});

describe("dedupeEntities", () => {
  it("returns empty array for undefined input", () => {
    expect(dedupeEntities(undefined)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(dedupeEntities([])).toEqual([]);
  });

  it("removes duplicate entities with same type and id", () => {
    const entities: AiEntity[] = [
      { type: "employee", id: "1", label: "Alice" },
      { type: "employee", id: "1", label: "Alice" },
      { type: "asset", id: "2", label: "Laptop" },
    ];
    const result = dedupeEntities(entities);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: "employee", id: "1", label: "Alice" });
    expect(result[1]).toEqual({ type: "asset", id: "2", label: "Laptop" });
  });

  it("preserves order of first occurrence", () => {
    const entities: AiEntity[] = [
      { type: "asset", id: "1", label: "Laptop" },
      { type: "employee", id: "2", label: "Bob" },
      { type: "asset", id: "1", label: "Laptop" },
    ];
    const result = dedupeEntities(entities);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("asset");
    expect(result[1].type).toBe("employee");
  });
});

describe("spliceEntityTokens", () => {
  it("returns empty array for empty text and no spans", () => {
    expect(spliceEntityTokens("", undefined)).toEqual([]);
  });

  it("returns text token for non-empty text and no spans", () => {
    expect(spliceEntityTokens("hello", undefined)).toEqual([
      { kind: "text", text: "hello" },
    ]);
  });

  it("returns text token for empty spans array", () => {
    expect(spliceEntityTokens("hello", [])).toEqual([
      { kind: "text", text: "hello" },
    ]);
  });

  it("splices a single entity span correctly", () => {
    const spans: AiEntitySpan[] = [
      { start: 0, end: 5, entity: { type: "employee", id: "1", label: "Alice" } },
    ];
    const result = spliceEntityTokens("Alice is here", spans);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      kind: "entity",
      entity: { start: 0, end: 5, entity: { type: "employee", id: "1", label: "Alice" } },
    });
    expect(result[1]).toEqual({ kind: "text", text: " is here" });
  });

  it("handles multiple non-overlapping spans", () => {
    const spans: AiEntitySpan[] = [
      { start: 0, end: 5, entity: { type: "employee", id: "1", label: "Alice" } },
      { start: 10, end: 13, entity: { type: "asset", id: "2", label: "Laptop" } },
    ];
    const result = spliceEntityTokens("Alice has a Laptop", spans);
    expect(result).toHaveLength(4);
    expect(result[0].kind).toBe("entity");
    expect(result[1]).toEqual({ kind: "text", text: " has a " });
    expect(result[2].kind).toBe("entity");
    expect(result[3]).toEqual({ kind: "text", text: "" });
  });

  it("filters out invalid spans", () => {
    const spans: AiEntitySpan[] = [
      { start: -1, end: 5, entity: { type: "employee", id: "1", label: "Alice" } },
      { start: 0, end: 100, entity: { type: "employee", id: "2", label: "Bob" } },
      { start: 0, end: 0, entity: { type: "employee", id: "3", label: "Charlie" } },
    ];
    const result = spliceEntityTokens("Hello", spans);
    expect(result).toEqual([{ kind: "text", text: "Hello" }]);
  });

  it("skips overlapping spans", () => {
    const spans: AiEntitySpan[] = [
      { start: 0, end: 5, entity: { type: "employee", id: "1", label: "Alice" } },
      { start: 3, end: 8, entity: { type: "employee", id: "2", label: "Bob" } },
    ];
    const result = spliceEntityTokens("Alice Bob", spans);
    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe("entity");
    expect(result[1]).toEqual({ kind: "text", text: " Bob" });
  });

  it("sorts spans by start position", () => {
    const spans: AiEntitySpan[] = [
      { start: 6, end: 9, entity: { type: "asset", id: "2", label: "Laptop" } },
      { start: 0, end: 5, entity: { type: "employee", id: "1", label: "Alice" } },
    ];
    const result = spliceEntityTokens("Alice Laptop", spans);
    expect(result[0].kind).toBe("entity");
    expect((result[0] as EntityToken).entity.entity.label).toBe("Alice");
    expect(result[1]).toEqual({ kind: "text", text: " " });
    expect(result[2].kind).toBe("entity");
    expect((result[2] as EntityToken).entity.entity.label).toBe("Laptop");
  });
});
