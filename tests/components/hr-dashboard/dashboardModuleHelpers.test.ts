import { describe, expect, it } from "vitest";

import {
  buildEmployeeKpis,
  buildHrKpis,
  buildManagerKpis,
  DASHBOARD_PERSONA_CTA_LABELS,
  DASHBOARD_PERSONA_SUBTITLES,
  resolveAllowedPersonas,
  resolveDefaultPersona,
} from "@/components/hr-dashboard/dashboard/dashboardModuleHelpers";
import type {
  EmployeeDashboardData,
  HrDashboardData,
  ManagerDashboardData,
} from "@/types/dashboard";

describe("dashboardModuleHelpers", () => {
  describe("resolveAllowedPersonas", () => {
    it("returns only employee for non-admin non-manager", () => {
      expect(
        resolveAllowedPersonas({ isAdmin: false, isManager: false })
      ).toEqual(["employee"]);
    });

    it("returns manager+employee for manager", () => {
      expect(
        resolveAllowedPersonas({ isAdmin: false, isManager: true })
      ).toEqual(["manager", "employee"]);
    });

    it("returns all personas for admin", () => {
      expect(
        resolveAllowedPersonas({ isAdmin: true, isManager: false })
      ).toEqual(["hr", "manager", "employee"]);
    });
  });

  describe("resolveDefaultPersona", () => {
    it("hr for admin", () => {
      expect(resolveDefaultPersona({ isAdmin: true, isManager: true })).toBe(
        "hr"
      );
    });
    it("manager for non-admin manager", () => {
      expect(resolveDefaultPersona({ isAdmin: false, isManager: true })).toBe(
        "manager"
      );
    });
    it("employee otherwise", () => {
      expect(resolveDefaultPersona({ isAdmin: false, isManager: false })).toBe(
        "employee"
      );
    });
  });

  describe("buildHrKpis", () => {
    it("returns zero values when data is null", () => {
      const kpis = buildHrKpis(null);
      expect(kpis).toHaveLength(4);
      expect(kpis[0].value).toBe(0);
      expect(kpis[2].sub).toBeUndefined();
    });

    it("returns warning sub when there are pending approvals", () => {
      const data: HrDashboardData = {
        headcount: { total: 142, byDepartment: [], deltaThisMonth: 4 },
        pendingApprovals: { items: [], total: 9 },
        outToday: [],
        onboarding: [],
        celebrations: [],
        announcements: [],
      };
      const kpis = buildHrKpis(data);
      expect(kpis[0].value).toBe(142);
      expect(kpis[0].sub).toEqual({ text: "+4 this month", tone: "up" });
      expect(kpis[2].value).toBe(9);
      expect(kpis[2].sub).toEqual({ text: "Action needed", tone: "warning" });
    });
  });

  describe("buildManagerKpis", () => {
    it("flags pending approvals", () => {
      const data: ManagerDashboardData = {
        teamSize: 6,
        teamPending: [
          {
            id: "1",
            employeeId: 1,
            employeeName: "X",
            leaveType: "vacation",
            startDate: "2026-06-10",
            endDate: "2026-06-12",
            days: 3,
            status: "pending",
            reason: "",
            submittedDate: "2026-06-01T00:00:00Z",
          },
        ],
        teamOut: [],
        teamReviews: [],
        teamTime: [],
        celebrations: [],
        announcements: [],
      };
      const kpis = buildManagerKpis(data);
      expect(kpis[0].value).toBe(6);
      expect(kpis[2].sub?.tone).toBe("warning");
    });
  });

  describe("buildEmployeeKpis", () => {
    it("computes remaining vacation + training", () => {
      const data: EmployeeDashboardData = {
        balance: {
          vacationUsed: 6,
          vacationTotal: 25,
          sickUsed: 2,
          wfhUsed: 8,
        },
        myRequests: [],
        hoursThisWeek: { logged: 30, expected: 40 },
        projects: [],
        nextReview: null,
        training: {
          budgetTotal: 2000,
          budgetUsed: 800,
          currency: "EUR",
          items: [],
        },
        openRoles: [],
        outToday: [],
        celebrations: [],
        announcements: [],
      };
      const kpis = buildEmployeeKpis(data);
      expect(kpis[0].value).toBe(19);
      expect(kpis[1].value).toBe("30/40");
      expect(kpis[3].value).toBe("€1,200");
    });
  });

  it("exposes a label + subtitle per persona", () => {
    expect(Object.keys(DASHBOARD_PERSONA_CTA_LABELS)).toEqual([
      "hr",
      "manager",
      "employee",
    ]);
    expect(DASHBOARD_PERSONA_SUBTITLES.hr).toContain("Bloomteq");
  });
});
