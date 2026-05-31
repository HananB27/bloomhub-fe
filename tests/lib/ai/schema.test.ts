import { describe, expect, it } from "vitest";
import { normalizeFormDataForSchema } from "@/lib/ai/schema";

describe("normalizeFormDataForSchema", () => {
  it("converts local date strings for date inputs", () => {
    expect(
      normalizeFormDataForSchema(
        {
          start_date: "11.06.2026",
          end_date: "16. 06. 2026.",
          leave_type: "vacation",
        },
        {
          properties: {
            start_date: { format: "date" },
            end_date: { type: "string" },
            leave_type: { type: "string" },
          },
        }
      )
    ).toEqual({
      start_date: "2026-06-11",
      end_date: "2026-06-16",
      leave_type: "vacation",
    });
  });

  it("keeps ISO dates and non-date fields unchanged", () => {
    expect(
      normalizeFormDataForSchema(
        {
          start_date: "2026-06-11",
          reason: "11.06.2026",
        },
        { properties: { start_date: { format: "date" } } }
      )
    ).toEqual({
      start_date: "2026-06-11",
      reason: "11.06.2026",
    });
  });
});
