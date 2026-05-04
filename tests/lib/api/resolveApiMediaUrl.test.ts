import { describe, expect, it } from "vitest";
import { resolveApiMediaUrl } from "@/lib/api/helpers/resolveApiMediaUrl";

describe("resolveApiMediaUrl", () => {
  it("prefixes same-origin path with API base", () => {
    expect(resolveApiMediaUrl("/media/x.png")).toMatch(/^https?:\/\//u);
    expect(resolveApiMediaUrl("/media/x.png")).toContain("/media/x.png");
  });

  it("leaves absolute https URLs unchanged", () => {
    const u = "https://cdn.example.com/a.pdf";
    expect(resolveApiMediaUrl(u)).toBe(u);
  });
});
