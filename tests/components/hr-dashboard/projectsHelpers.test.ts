import { describe, expect, it } from "vitest";
import { apiAssignmentToMember } from "@/components/hr-dashboard/projects/projectsHelpers";
import type { ProjectAssignment } from "@/lib/api/modules/projects";

describe("projectsHelpers", () => {
  it("uses project assignment allocation_percentage instead of even split", () => {
    const member = apiAssignmentToMember({
      id: 3,
      project_id: 2,
      project_name: "Baaa",
      user_profile_id: 1,
      employee_name: "Johnas Doe",
      role: "Contributor",
      allocation_percentage: 20,
      weekly_allocation_hours: "8.00",
      active_projects_count: 2,
      start_date: "2026-05-26",
      end_date: null,
      status: "active",
      notes: null,
      created_at: "2026-05-26T21:57:33.024673Z",
      updated_at: "2026-05-26T22:38:53.386639Z",
    } satisfies ProjectAssignment);

    expect(member.allocation).toBe(20);
  });
});
