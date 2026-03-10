import { describe, it, expect } from "vitest";
import {
  HR_MODULES,
  getModuleById,
  type HrModuleId,
} from "@/components/hr-dashboard/hr-modules";

describe("hr-modules", () => {
  describe("HR_MODULES", () => {
    it("has at least 15 modules", () => {
      expect(HR_MODULES.length).toBeGreaterThanOrEqual(15);
    });

    it("each module has id, label, and icon", () => {
      HR_MODULES.forEach((mod) => {
        expect(mod).toHaveProperty("id");
        expect(mod).toHaveProperty("label");
        expect(mod).toHaveProperty("icon");
        expect(typeof mod.id).toBe("string");
        expect(typeof mod.label).toBe("string");
        expect(mod.icon).toBeDefined();
      });
    });

    it("has expected module ids", () => {
      const ids = HR_MODULES.map((m) => m.id);
      expect(ids).toContain("dashboard");
      expect(ids).toContain("vacations");
      expect(ids).toContain("profiles");
      expect(ids).toContain("announcements");
    });
  });

  describe("getModuleById", () => {
    it("returns module for valid id", () => {
      const mod = getModuleById("dashboard");
      expect(mod).toBeDefined();
      expect(mod?.id).toBe("dashboard");
      expect(mod?.label).toBe("Dashboard");
    });

    it("returns correct module for vacations", () => {
      const mod = getModuleById("vacations");
      expect(mod?.id).toBe("vacations");
      expect(mod?.label).toBe("Vacations");
    });

    it("returns undefined for invalid id", () => {
      expect(getModuleById("invalid" as HrModuleId)).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(getModuleById("" as HrModuleId)).toBeUndefined();
    });
  });
});
