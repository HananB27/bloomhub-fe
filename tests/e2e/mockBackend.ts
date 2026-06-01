import { expect, type Page } from "@playwright/test";

type Role = "employee" | "admin";

interface MockSession {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  accessToken: string;
  expires: string;
}

interface MockBackendState {
  role: Role;
  session: MockSession;
  profile: Record<string, unknown>;
  employees: Record<string, unknown>[];
  leavePolicies: Record<string, unknown>[];
  leaveBalances: Record<string, unknown>[];
  leaveRequests: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  documentVersions: Record<string, Record<string, unknown>[]>;
  trainingEntries: Record<string, unknown>[];
  bonuses: Record<string, unknown>[];
  compensationOverview: Record<string, unknown>;
  projects: Record<string, unknown>[];
  projectAssignments: Record<string, Record<string, unknown>[]>;
  assets: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  aiSessions: Record<string, unknown>[];
  nextIds: {
    leaveRequest: number;
    trainingEntry: number;
    bonus: number;
    project: number;
    projectAssignment: number;
    asset: number;
    assignment: number;
    aiSession: number;
    document: number;
  };
}

function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return {
    status,
    contentType: "application/json",
    headers: extraHeaders,
    body: JSON.stringify(data),
  };
}

function lastSegment(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function parseIdFromPath(url: string, marker: string): string {
  const pathname = new URL(url).pathname;
  const match = pathname.match(new RegExp(`${marker}/(\\d+)`));
  return match?.[1] ?? lastSegment(url);
}

function createEmployees() {
  const base = nowIso();
  return [
    {
      id: 1,
      employee_id: "EMP-001",
      username: "jdoe",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@bloomhub.test",
      phone_number: "+38761111111",
      start_date: "2024-01-15",
      employment_status: "active",
      role: { id: 1, name: "Software Engineer" },
      department: "Engineering",
      managers: [4],
      manager_names: "Priya Singh",
      current_salary: 7800,
      current_net_salary: 6200,
      current_total_monthly: 6200,
      currency: "BAM",
      is_active: true,
      avatar: null,
      career_level: "Senior",
      cpf_level: "L4",
      emergency_contact_name: "Jane Doe",
      emergency_contact_phone: "+38761222333",
      tech_tags: [
        { id: 4, name: "TypeScript" },
        { id: 9, name: "Next.js" },
      ],
      created_at: base,
      updated_at: base,
      assigned_projects: [
        {
          id: 11,
          project_id: 201,
          project_name: "Atlas Platform",
          role: "Contributor",
          start_date: "2025-01-15",
          status: "active",
        },
      ],
    },
    {
      id: 2,
      employee_id: "EMP-002",
      username: "sjohnson",
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah.johnson@bloomhub.test",
      phone_number: "+38762222222",
      start_date: "2023-05-01",
      employment_status: "active",
      role: { id: 2, name: "Product Manager" },
      department: "Product",
      managers: [4],
      manager_names: "Priya Singh",
      current_salary: 8400,
      current_net_salary: 6800,
      current_total_monthly: 6800,
      currency: "BAM",
      is_active: true,
      avatar: null,
      career_level: "Lead",
      cpf_level: "L5",
      emergency_contact_name: "Mike Johnson",
      emergency_contact_phone: "+38762222333",
      tech_tags: [{ id: 14, name: "GraphQL" }],
      created_at: base,
      updated_at: base,
      assigned_projects: [],
    },
    {
      id: 3,
      employee_id: "EMP-003",
      username: "mchen",
      first_name: "Michael",
      last_name: "Chen",
      email: "michael.chen@bloomhub.test",
      phone_number: "+38763333333",
      start_date: "2022-09-12",
      employment_status: "active",
      role: { id: 3, name: "Developer Advocate" },
      department: "Engineering",
      managers: [4],
      manager_names: "Priya Singh",
      current_salary: 7100,
      current_net_salary: 5800,
      current_total_monthly: 5800,
      currency: "BAM",
      is_active: true,
      avatar: null,
      career_level: "Mid",
      cpf_level: "L3",
      emergency_contact_name: "Nina Chen",
      emergency_contact_phone: "+38763333444",
      tech_tags: [{ id: 6, name: "Python" }],
      created_at: base,
      updated_at: base,
      assigned_projects: [],
    },
    {
      id: 4,
      employee_id: "EMP-004",
      username: "psingh",
      first_name: "Priya",
      last_name: "Singh",
      email: "priya.singh@bloomhub.test",
      phone_number: "+38764444444",
      start_date: "2021-02-02",
      employment_status: "active",
      role: { id: 4, name: "Engineering Manager" },
      department: "Engineering",
      managers: [],
      manager_names: "",
      current_salary: 10200,
      current_net_salary: 8200,
      current_total_monthly: 8200,
      currency: "BAM",
      is_active: true,
      avatar: null,
      career_level: "Director",
      cpf_level: "L6",
      emergency_contact_name: "Arjun Singh",
      emergency_contact_phone: "+38764444555",
      tech_tags: [{ id: 11, name: "Docker" }],
      created_at: base,
      updated_at: base,
      assigned_projects: [],
    },
  ];
}

function createLeaves() {
  const base = nowIso();
  return [
    {
      id: 501,
      employee_id: 1,
      employee_name: "John Doe",
      employee_avatar: null,
      leave_type: "vacation",
      leave_type_display: "Vacation",
      start_date: "2026-06-15",
      end_date: "2026-06-19",
      days: 5,
      reason: "Summer reset",
      status: "pending",
      status_display: "Pending",
      covering_employee_id: 2,
      covering_employee_name: "Sarah Johnson",
      submitted_date: "2026-06-01",
      lead_approver_id: null,
      lead_approver_name: null,
      lead_approved_date: null,
      lead_approval_comments: "",
      approver_id: null,
      approver_name: null,
      approved_date: null,
      approval_comments: "",
      rejection_reason: "",
      created_at: base,
      updated_at: base,
    },
  ];
}

function createLeavePolicies() {
  return [
    {
      id: 1,
      leave_type: "vacation",
      leave_type_display: "Vacation",
      allocated_days_per_year: 25,
      max_carryover_days: 5,
      requires_approval: true,
      requires_covering_employee: true,
      min_notice_in_days: 2,
      max_consecutive_days: 20,
      is_active: true,
    },
    {
      id: 2,
      leave_type: "sick",
      leave_type_display: "Sick Leave",
      allocated_days_per_year: 10,
      max_carryover_days: 0,
      requires_approval: false,
      requires_covering_employee: false,
      min_notice_in_days: 0,
      max_consecutive_days: 10,
      is_active: true,
    },
  ];
}

function createLeaveBalances() {
  return [
    {
      id: 1,
      employee_id: 1,
      employee_name: "John Doe",
      employee_avatar: null,
      leave_type: "vacation",
      leave_type_display: "Vacation",
      allocated: 25,
      used: 8,
      remaining: 17,
      carryover: 2,
      year: 2026,
      last_updated: nowIso(),
    },
    {
      id: 2,
      employee_id: 1,
      employee_name: "John Doe",
      employee_avatar: null,
      leave_type: "sick",
      leave_type_display: "Sick Leave",
      allocated: 10,
      used: 1,
      remaining: 9,
      carryover: 0,
      year: 2026,
      last_updated: nowIso(),
    },
  ];
}

function createDocuments() {
  const base = nowIso();
  return [
    {
      id: 101,
      name: "Employment Agreement",
      title: "Employment Agreement",
      description: "Standard employment agreement for new hires.",
      category: "contracts",
      file_name: "employment-agreement.pdf",
      original_filename: "employment-agreement.pdf",
      file_size: 846_302,
      mime_type: "application/pdf",
      uploaded_by_name: "Priya Singh",
      uploaded_at: base,
      updated_at: base,
      last_modified: base,
      expiry_date: null,
      signature_status: "not_required",
      is_confidential: true,
      tags: ["hr", "contract"],
      allowed_roles: ["employee", "manager", "hr", "admin"],
      visibility_scope: "roles",
      current_version: "1.0",
      version_count: 2,
      signers: [],
      from_template: false,
      template_id: null,
      project_id: null,
      project_name: null,
    },
  ];
}

function createDocumentVersions() {
  const base = nowIso();
  return {
    101: [
      {
        id: 1001,
        version: "1.0",
        uploaded_at: base,
        uploaded_by_name: "Priya Singh",
        file_size: 846_302,
        notes: "Initial upload",
      },
      {
        id: 1002,
        version: "1.1",
        uploaded_at: base,
        uploaded_by_name: "Priya Singh",
        file_size: 846_302,
        notes: "Prepared for e-signature request",
      },
    ],
  };
}

function createTrainingEntries() {
  const base = nowIso();
  return [
    {
      id: 701,
      employee_id: 1,
      employee_name: "John Doe",
      course_title: "Advanced TypeScript",
      provider: "Frontend Masters",
      training_date: "2026-05-10",
      training_type: "course",
      training_type_display: "Course",
      cost: 320,
      description: "Deep dive into advanced type patterns.",
      certificate_link: "https://example.com/certificates/ts",
      status: "completed",
      created_at: base,
      updated_at: base,
    },
  ];
}

function createCompensationOverview() {
  return {
    stats: {
      totalMonthly: 242_500,
      avgSalary: 8_083,
      medianSalary: 7_800,
      pendingReviews: 4,
      overdueReviews: 1,
      totalEmployees: 30,
      monthlyDeltaPct: 2.8,
      avgYoyPct: 8.5,
      medianQoqPct: 3.2,
    },
    bands: [
      { label: "< 4k", count: 4, pct: 13.3 },
      { label: "4k - 6k", count: 8, pct: 26.7 },
      { label: "6k - 8k", count: 10, pct: 33.3 },
      { label: "8k - 10k", count: 6, pct: 20 },
      { label: "> 10k", count: 2, pct: 6.7 },
    ],
    mix: [
      { name: "Base", pct: 82, color: "indigo" },
      { name: "Bonuses", pct: 9, color: "emerald" },
      { name: "Benefits", pct: 6, color: "amber" },
      { name: "Other", pct: 3, color: "violet" },
    ],
    employees: [
      {
        id: 1,
        name: "John Doe",
        title: "Software Engineer",
        dept: "Engineering",
        salary: 7800,
        bonus: 250,
        last: "2026-05-01",
        next: "2026-06-01",
        status: "Active",
        color: "indigo",
      },
      {
        id: 2,
        name: "Sarah Johnson",
        title: "Product Manager",
        dept: "Product",
        salary: 8400,
        bonus: 500,
        last: "2026-05-01",
        next: "2026-06-01",
        status: "Active",
        color: "rose",
      },
      {
        id: 4,
        name: "Priya Singh",
        title: "Engineering Manager",
        dept: "Engineering",
        salary: 10200,
        bonus: 900,
        last: "2026-05-01",
        next: "2026-06-01",
        status: "Active",
        color: "gray",
      },
    ],
  };
}

function createProjects() {
  const base = nowIso();
  return [
    {
      id: 201,
      name: "Atlas Platform",
      description: "Internal platform modernization program.",
      client: "Internal",
      app_stack: "Next.js, TypeScript, PostgreSQL",
      project_type: "internal",
      status: "active",
      stage: "delivery",
      stage_note: "On track for Q3 release.",
      start_date: "2025-01-15",
      end_date: null,
      owner_id: 4,
      created_at: base,
      updated_at: base,
      assignment_summary: {
        total_assignments: 1,
        active_assignments: 1,
        active_members: 1,
      },
      active_members_count: 1,
      active_members: [
        {
          id: 3001,
          project_id: 201,
          project_name: "Atlas Platform",
          user_profile_id: 1,
          employee_name: "John Doe",
          role: "Contributor",
          allocation_percentage: 50,
          weekly_allocation_hours: "20.00",
          active_projects_count: 1,
          start_date: "2025-01-15",
          end_date: null,
          status: "active",
          notes: "",
          created_at: base,
          updated_at: base,
        },
      ],
    },
  ];
}

function createAssets() {
  const base = nowIso();
  return [
    {
      id: 401,
      asset_id: "AST-401",
      name: "MacBook Pro 14",
      category: "laptops",
      serial_number: "SN-401",
      asset_tag: "AT-401",
      brand: "Apple",
      manufacturer: "Apple",
      model: "MacBook Pro 14",
      description: "Primary engineering laptop.",
      image: null,
      purchase_date: "2025-02-01",
      purchase_price: 3200,
      warranty: "3 years",
      warranty_until: "2028-02-01",
      status: "available",
      condition: "good",
      current_assignment: null,
      is_available: true,
      location: "Sarajevo HQ",
      assigned_to: null,
      assigned_employee_name: null,
      assigned_date: null,
      last_maintenance: "2026-04-15",
      next_maintenance: "2026-10-15",
      created_at: base,
      updated_at: base,
      specifications: {
        cpu: "M3 Pro",
        ram: "18GB",
        storage: "512GB",
      },
      qr_code_payload: "asset:401",
      qr_code_url: "/api/assets/401/qr-code/",
      capabilities: {
        can_view: true,
        can_update: true,
        can_delete: true,
        can_assign: true,
        can_request_return: true,
        can_process_return: true,
        can_view_history: true,
        can_update_condition: true,
        can_generate_qr_code: true,
        can_log_replacement: true,
      },
    },
  ];
}

function createAssignments() {
  const base = nowIso();
  return [
    {
      id: 9001,
      asset: 401,
      asset_id: 401,
      employee: 1,
      employee_id: "1",
      employee_name: "John Doe",
      assigned_at: base,
      assigned_date: "2026-05-20",
      returned_at: null,
      returned_date: null,
      return_request_status: "none",
      return_requested_by: null,
      return_requested_at: null,
      return_reviewed_by: null,
      return_reviewed_at: null,
      return_rejection_reason: null,
      return_description: null,
      return_checklist: [],
      return_requested: null,
      assigned_by: "Priya Singh",
      return_condition: null,
      notes: "Assigned for local development.",
      condition: "good",
      asset_details: {
        id: 401,
        name: "MacBook Pro 14",
        asset_id: "AST-401",
        condition: "good",
      },
      employee_details: {
        id: 1,
        full_name: "John Doe",
        user: {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@bloomhub.test",
          username: "jdoe",
        },
      },
      assigned_by_details: {
        id: 4,
        full_name: "Priya Singh",
        user: {
          first_name: "Priya",
          last_name: "Singh",
          email: "priya.singh@bloomhub.test",
          username: "psingh",
        },
      },
      is_active: true,
    },
  ];
}

function createAiSessions() {
  const base = nowIso();
  return [
    {
      id: 1,
      session_id: 1,
      title: "Leave planning",
      created_at: base,
      updated_at: base,
      last_message: "show my leave balance",
      messages: [],
    },
  ];
}

export function createMockBackend(role: Role = "employee") {
  const session: MockSession = {
    user: {
      name: role === "admin" ? "Priya Singh" : "John Doe",
      email:
        role === "admin"
          ? "priya.singh@bloomhub.test"
          : "john.doe@bloomhub.test",
      image: null,
    },
    accessToken: role === "admin" ? "mock-admin-token" : "mock-employee-token",
    expires: "2099-12-31T23:59:59.999Z",
  };

  const state: MockBackendState = {
    role,
    session,
    profile: {
      id: role === "admin" ? 4 : 1,
      username: role === "admin" ? "psingh" : "jdoe",
      career_level: role === "admin" ? "Director" : "Senior",
      is_staff: role === "admin",
      is_superuser: role === "admin",
      is_manager: true,
    },
    employees: createEmployees(),
    leavePolicies: createLeavePolicies(),
    leaveBalances: createLeaveBalances(),
    leaveRequests: createLeaves(),
    documents: createDocuments(),
    documentVersions: createDocumentVersions(),
    trainingEntries: createTrainingEntries(),
    bonuses: [
      {
        id: 801,
        user_profile: 1,
        employee_name: "John Doe",
        bonus_type: "performance",
        bonus_type_display: "Performance",
        amount: "250",
        currency: "BAM",
        effective_date: "2026-05-01",
        reason: "Strong sprint delivery",
        created_by: 4,
        created_by_name: "Priya Singh",
        created_at: nowIso(),
      },
    ],
    compensationOverview: createCompensationOverview(),
    projects: createProjects(),
    projectAssignments: {
      201: createProjects()[0].active_members ?? [],
    },
    assets: createAssets(),
    assignments: createAssignments(),
    aiSessions: createAiSessions(),
    nextIds: {
      leaveRequest: 600,
      trainingEntry: 800,
      bonus: 900,
      project: 300,
      projectAssignment: 4000,
      asset: 500,
      assignment: 9100,
      aiSession: 2,
      document: 200,
    },
  };

  const install = async (page: Page) => {
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = request.url();
      const method = request.method();
      const pathname = new URL(url).pathname;
      const bodyText = request.postData() || "";
      const body = bodyText ? tryParseJson(bodyText) : {};

      if (pathname === "/api/auth/session") {
        await route.fulfill(json(state.session));
        return;
      }

      if (pathname === "/api/auth/profile/") {
        await route.fulfill(json(state.profile));
        return;
      }

      if (pathname === "/api/leave-policies/") {
        await route.fulfill(json(state.leavePolicies));
        return;
      }

      if (pathname === "/api/leave-balances/") {
        await route.fulfill(json(state.leaveBalances));
        return;
      }

      if (pathname === "/api/leave-requests/capabilities/") {
        await route.fulfill(
          json({
            can_approve_requests: state.role === "admin",
            can_hr_approve: state.role === "admin",
            can_adjust_balances: state.role === "admin",
            can_configure_leave_types: state.role === "admin",
          })
        );
        return;
      }

      if (pathname === "/api/leave-requests/team-members/") {
        await route.fulfill(
          json(
            state.employees
              .filter((emp) => emp.id !== 1)
              .map((emp) => ({
                id: String(emp.id),
                name: `${emp.first_name} ${emp.last_name}`,
                avatarUrl: emp.avatar ?? undefined,
              }))
          )
        );
        return;
      }

      if (pathname === "/api/leave-requests/team-calendar/") {
        await route.fulfill(
          json(
            state.leaveRequests
              .filter((requestItem) => requestItem.status === "approved")
              .map((requestItem) => ({
                id: String(requestItem.id),
                employeeId: String(requestItem.employee_id),
                employeeName: requestItem.employee_name,
                leaveType: requestItem.leave_type,
                startDate: requestItem.start_date,
                endDate: requestItem.end_date,
                status: requestItem.status,
              }))
          )
        );
        return;
      }

      if (pathname === "/api/auth/permissions/") {
        await route.fulfill(json({ permissions: 0 }));
        return;
      }

      if (pathname === "/api/leave-requests/" && method === "GET") {
        await route.fulfill(json(state.leaveRequests));
        return;
      }

      if (pathname === "/api/leave-requests/" && method === "POST") {
        const coveringEmployee = state.employees.find(
          (emp) => String(emp.id) === String(body.covering_employee_id)
        );
        const created = {
          id: state.nextIds.leaveRequest++,
          employee_id: 1,
          employee_name: "John Doe",
          employee_avatar: null,
          leave_type: body.leave_type,
          leave_type_display: labelForLeaveType(body.leave_type),
          start_date: body.start_date,
          end_date: body.end_date,
          days: daysBetween(body.start_date, body.end_date),
          reason: body.reason,
          status: "pending",
          status_display: "Pending",
          covering_employee_id: body.covering_employee_id ?? null,
          covering_employee_name: coveringEmployee
            ? `${coveringEmployee.first_name} ${coveringEmployee.last_name}`
            : null,
          submitted_date: nowIso(),
          lead_approver_id: null,
          lead_approver_name: null,
          lead_approved_date: null,
          lead_approval_comments: "",
          approver_id: null,
          approver_name: null,
          approved_date: null,
          approval_comments: "",
          rejection_reason: "",
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        state.leaveRequests = [created, ...state.leaveRequests];
        await route.fulfill(json(created, 201));
        return;
      }

      if (pathname.match(/^\/api\/leave-requests\/\d+\/approve\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/leave-requests"));
        const updated = state.leaveRequests.find((item) => item.id === id);
        if (updated) {
          updated.status = "lead_approved";
          updated.status_display = "Lead Approved";
          updated.lead_approver_id = state.profile.id as number;
          updated.lead_approver_name = `${state.session.user.name}`;
          updated.lead_approved_date = nowIso();
          updated.lead_approval_comments = body.comments ?? "";
        }
        await route.fulfill(json(updated ?? {}));
        return;
      }

      if (pathname.match(/^\/api\/leave-requests\/\d+\/hr-approve\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/leave-requests"));
        const updated = state.leaveRequests.find((item) => item.id === id);
        if (updated) {
          updated.status = "approved";
          updated.status_display = "Approved";
          updated.approver_id = state.profile.id as number;
          updated.approver_name = `${state.session.user.name}`;
          updated.approved_date = nowIso();
          updated.approval_comments = body.comments ?? "";
        }
        await route.fulfill(json(updated ?? {}));
        return;
      }

      if (pathname.match(/^\/api\/leave-requests\/\d+\/reject\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/leave-requests"));
        const updated = state.leaveRequests.find((item) => item.id === id);
        if (updated) {
          updated.status = "rejected";
          updated.status_display = "Rejected";
          updated.rejection_reason = body.reason ?? "";
        }
        await route.fulfill(json(updated ?? {}));
        return;
      }

      if (pathname.match(/^\/api\/leave-requests\/\d+\/cancel\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/leave-requests"));
        const updated = state.leaveRequests.find((item) => item.id === id);
        if (updated) {
          updated.status = "cancelled";
          updated.status_display = "Cancelled";
        }
        await route.fulfill(json(updated ?? {}));
        return;
      }

      if (pathname === "/api/employees/" && method === "GET") {
        await route.fulfill(
          json({ results: state.employees, count: state.employees.length })
        );
        return;
      }

      if (pathname === "/api/employees/profile-page-bundle/") {
        await route.fulfill({ status: 404, body: "" });
        return;
      }

      if (pathname === "/api/employees/" && method === "POST") {
        const created = {
          id: state.nextIds.project++,
          employee_id: `EMP-${state.nextIds.project}`,
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          phone_number: body.phone_number ?? "",
          start_date: body.start_date ?? isoDaysFromNow(0),
          employment_status: body.employment_status ?? "active",
          role: body.role ?? null,
          role_name: body.role_name ?? "",
          department: body.department ?? "",
          is_active: true,
          created_at: nowIso(),
          updated_at: nowIso(),
          tech_tags: [],
        };
        state.employees = [created, ...state.employees];
        await route.fulfill(json(created, 201));
        return;
      }

      if (pathname === "/api/employees/email-availability/") {
        await route.fulfill(
          json({ email: body.email ?? "test@example.com", available: true })
        );
        return;
      }

      if (
        pathname.match(/^\/api\/employees\/\d+\/cvs\/$/) &&
        method === "GET"
      ) {
        await route.fulfill(json([]));
        return;
      }

      if (
        pathname.match(/^\/api\/employees\/\d+\/profile-change-history\/$/) &&
        method === "GET"
      ) {
        await route.fulfill(json([]));
        return;
      }

      if (pathname.match(/^\/api\/employees\/\d+\/$/) && method === "GET") {
        const id = Number(lastSegment(url));
        const employee = state.employees.find((item) => item.id === id);
        await route.fulfill(json(employee ?? {}));
        return;
      }

      if (pathname.match(/^\/api\/employees\/\d+\/profile-modal-bundle\/$/)) {
        await route.fulfill({ status: 404, body: "" });
        return;
      }

      if (pathname.match(/^\/api\/employees\/\d+\/$/) && method === "PATCH") {
        const id = Number(lastSegment(url));
        const employee = state.employees.find((item) => item.id === id);
        if (employee) {
          Object.assign(employee, body);
          employee.updated_at = nowIso();
        }
        await route.fulfill(json(employee ?? {}));
        return;
      }

      if (pathname === "/api/bonuses/" && method === "GET") {
        await route.fulfill(json(state.bonuses));
        return;
      }

      if (pathname === "/api/bonuses/" && method === "POST") {
        const employee = state.employees.find(
          (emp) => emp.id === Number(body.user_profile)
        );
        const created = {
          id: state.nextIds.bonus++,
          user_profile: body.user_profile,
          employee_name: employee
            ? `${employee.first_name} ${employee.last_name}`
            : "Employee",
          bonus_type: body.bonus_type,
          bonus_type_display: labelForBonusType(body.bonus_type),
          amount: String(body.amount),
          currency: body.currency ?? "BAM",
          effective_date: body.effective_date,
          reason: body.reason,
          created_by: state.profile.id,
          created_by_name: state.session.user.name,
          created_at: nowIso(),
        };
        state.bonuses = [created, ...state.bonuses];
        await route.fulfill(json(created, 201));
        return;
      }

      if (
        pathname.match(/^\/api\/employees\/\d+\/bonuses\/$/) &&
        method === "GET"
      ) {
        const employeeId = Number(pathname.split("/")[3]);
        await route.fulfill(
          json(
            state.bonuses.filter((bonus) => bonus.user_profile === employeeId)
          )
        );
        return;
      }

      if (pathname === "/api/compensation/overview/") {
        await route.fulfill(json(state.compensationOverview));
        return;
      }

      if (pathname === "/api/training-entries/" && method === "GET") {
        await route.fulfill(json({ results: state.trainingEntries }));
        return;
      }

      if (pathname === "/api/training-entries/" && method === "POST") {
        const employee = state.employees.find(
          (emp) => emp.id === Number(body.employee_id ?? 1)
        );
        const created = {
          id: state.nextIds.trainingEntry++,
          employee_id: body.employee_id ?? 1,
          employee_name: employee
            ? `${employee.first_name} ${employee.last_name}`
            : "John Doe",
          course_title: body.course_title,
          provider: body.provider,
          training_date: body.training_date,
          training_type: body.training_type,
          training_type_display: labelForTrainingType(body.training_type),
          cost: body.cost ?? null,
          description: body.description ?? "",
          certificate_link: body.certificate_link ?? "",
          status: "planned",
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        state.trainingEntries = [created, ...state.trainingEntries];
        await route.fulfill(json(created, 201));
        return;
      }

      if (
        pathname.match(/^\/api\/training-entries\/\d+\/$/) &&
        method === "PUT"
      ) {
        const id = Number(lastSegment(url));
        const entry = state.trainingEntries.find((item) => item.id === id);
        if (entry) {
          Object.assign(entry, body, {
            training_type_display: labelForTrainingType(
              body.training_type ?? entry.training_type
            ),
            updated_at: nowIso(),
          });
        }
        await route.fulfill(json(entry ?? {}));
        return;
      }

      if (
        pathname.match(/^\/api\/training-entries\/\d+\/$/) &&
        method === "DELETE"
      ) {
        const id = Number(lastSegment(url));
        state.trainingEntries = state.trainingEntries.filter(
          (item) => item.id !== id
        );
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      if (pathname === "/api/documents/" && method === "GET") {
        await route.fulfill(json(state.documents));
        return;
      }

      if (pathname.match(/^\/api\/documents\/\d+\/$/) && method === "GET") {
        const id = Number(lastSegment(url));
        const doc = state.documents.find((item) => item.id === id);
        await route.fulfill(json(doc ?? {}));
        return;
      }

      if (pathname.match(/^\/api\/documents\/\d+\/request-signature\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/documents"));
        const doc = state.documents.find((item) => item.id === id);
        if (doc) {
          doc.signature_status = "pending";
          const signers = Array.isArray(body.signers) ? body.signers : [];
          doc.signers = signers.map((signer, index) => {
            const signerRecord = signer as Record<string, unknown>;
            return {
              id: index + 1,
              name: signerRecord.name,
              email: signerRecord.email,
              status: "pending",
              requested_at: nowIso(),
            };
          });
          doc.version_count = Number(doc.version_count ?? 0) + 1;
          doc.current_version = "1.1";
          const existingVersions = state.documentVersions[id] ?? [];
          state.documentVersions[id] = [
            ...existingVersions,
            {
              id: 1000 + existingVersions.length + 1,
              version: "1.1",
              uploaded_at: nowIso(),
              uploaded_by_name: state.session.user.name,
              file_size: doc.file_size,
              notes: "Signature request created a new tracked version",
            },
          ];
        }
        await route.fulfill(json(doc ?? {}));
        return;
      }

      if (pathname.match(/^\/api\/documents\/\d+\/signatures\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/documents"));
        const doc = state.documents.find((item) => item.id === id);
        await route.fulfill(json(doc?.signers ?? []));
        return;
      }

      if (pathname.match(/^\/api\/documents\/\d+\/versions\/$/)) {
        const id = Number(parseIdFromPath(url, "/api/documents"));
        await route.fulfill(json(state.documentVersions[id] ?? []));
        return;
      }

      if (
        pathname.match(/^\/api\/documents\/\d+\/preview\/$/) ||
        pathname.match(/^\/api\/documents\/\d+\/download\/$/)
      ) {
        await route.fulfill(json({ url: "https://example.com/document.pdf" }));
        return;
      }

      if (pathname.match(/^\/api\/documents\/\d+\/send-reminder\/$/)) {
        await route.fulfill(json({ ok: true }));
        return;
      }

      if (pathname === "/api/documents/templates/generated/") {
        await route.fulfill(json([]));
        return;
      }

      if (pathname === "/api/assets/capabilities/") {
        await route.fulfill(
          json({
            permissions: [
              "view_own_assets",
              "view_team_assets",
              "view_all_assets",
              "assign_assets",
              "update_asset_condition",
              "initiate_asset_return",
              "process_asset_return",
              "log_asset_replacement",
              "generate_qr_codes",
              "view_asset_history",
              "configure_asset_types",
              "export_inventory",
            ],
            scope: "all",
            capabilities: {
              can_view_any_assets: true,
              can_create_assets: true,
              can_update_assets: true,
              can_delete_assets: true,
              can_assign_assets: true,
              can_request_return: true,
              can_process_return: true,
              can_export_inventory: true,
              can_view_asset_history: true,
              can_update_asset_condition: true,
              can_generate_qr_codes: true,
              can_log_asset_replacement: true,
            },
          })
        );
        return;
      }

      if (pathname === "/api/user-profiles/") {
        await route.fulfill(
          json(
            state.employees.map((emp) => ({
              id: emp.id,
              full_name: `${emp.first_name} ${emp.last_name}`,
              user: {
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email,
                username: emp.username,
              },
            }))
          )
        );
        return;
      }

      if (pathname === "/api/assets/" && method === "GET") {
        await route.fulfill(json(state.assets));
        return;
      }

      if (pathname === "/api/assets/" && method === "POST") {
        const created = {
          id: state.nextIds.asset++,
          asset_id: `AST-${state.nextIds.asset}`,
          name: body.name,
          category: body.category ?? "other",
          serial_number: body.serial_number ?? "",
          asset_tag: body.asset_tag ?? `AT-${state.nextIds.asset}`,
          brand: body.brand ?? "",
          manufacturer: body.manufacturer ?? "",
          model: body.model ?? "",
          description: body.description ?? "",
          purchase_date: body.purchase_date ?? isoDaysFromNow(0),
          purchase_price: body.purchase_price ?? 0,
          warranty: body.warranty ?? "",
          warranty_until: body.warranty_until ?? null,
          status: body.status ?? "available",
          condition: body.condition ?? "good",
          current_assignment: null,
          is_available: true,
          location: body.location ?? "",
          assigned_to: null,
          assigned_employee_name: null,
          assigned_date: null,
          last_maintenance: null,
          next_maintenance: null,
          specifications: body.specifications ?? {},
          qr_code_payload: `asset:${state.nextIds.asset}`,
          qr_code_url: `/api/assets/${state.nextIds.asset}/qr-code/`,
          capabilities: {
            can_view: true,
            can_update: true,
            can_delete: true,
            can_assign: true,
            can_request_return: true,
            can_process_return: true,
            can_view_history: true,
            can_update_condition: true,
            can_generate_qr_code: true,
            can_log_replacement: true,
          },
        };
        state.assets = [created, ...state.assets];
        await route.fulfill(json(created, 201));
        return;
      }

      if (pathname.match(/^\/api\/assets\/\d+\/$/) && method === "PATCH") {
        const id = Number(lastSegment(url));
        const asset = state.assets.find((item) => item.id === id);
        if (asset) {
          Object.assign(asset, body);
        }
        await route.fulfill(json(asset ?? {}));
        return;
      }

      if (
        pathname.match(/^\/api\/assets\/\d+\/qr-code\/$/) &&
        method === "GET"
      ) {
        await route.fulfill({
          status: 200,
          headers: {
            "content-type": "image/png",
            "content-disposition": 'attachment; filename="asset-401-qr.png"',
          },
          body: Buffer.from("mock-png"),
        });
        return;
      }

      if (pathname === "/api/assignments/" && method === "GET") {
        await route.fulfill(json(state.assignments));
        return;
      }

      if (pathname === "/api/assignments/" && method === "POST") {
        const assetId = Number(body.asset ?? body.asset_id);
        const employeeId = Number(body.employee ?? body.employee_id);
        const employee = state.employees.find((item) => item.id === employeeId);
        const asset = state.assets.find((item) => item.id === assetId);
        const created = {
          id: state.nextIds.assignment++,
          asset: assetId,
          asset_id: assetId,
          employee: employeeId,
          employee_id: String(employeeId),
          employee_name: employee
            ? `${employee.first_name} ${employee.last_name}`
            : "Employee",
          assigned_at: nowIso(),
          assigned_date: body.start_date ?? isoDaysFromNow(0),
          returned_at: null,
          returned_date: null,
          return_request_status: "none",
          return_requested_by: null,
          return_requested_at: null,
          return_reviewed_by: null,
          return_reviewed_at: null,
          return_rejection_reason: null,
          return_description: null,
          return_checklist: [],
          return_requested: null,
          assigned_by: state.session.user.name,
          return_condition: null,
          notes: body.notes ?? "",
          condition: body.condition ?? asset?.condition ?? "good",
          asset_details: asset
            ? {
                id: asset.id,
                name: asset.name,
                asset_id: asset.asset_id,
                condition: asset.condition,
              }
            : null,
          employee_details: employee
            ? {
                id: employee.id,
                full_name: `${employee.first_name} ${employee.last_name}`,
                user: {
                  first_name: employee.first_name,
                  last_name: employee.last_name,
                  email: employee.email,
                  username: employee.username,
                },
              }
            : null,
          assigned_by_details: {
            id: state.profile.id as number,
            full_name: state.session.user.name,
            user: {
              first_name: state.session.user.name.split(" ")[0],
              last_name: state.session.user.name.split(" ")[1] ?? "",
              email: state.session.user.email,
              username: "psingh",
            },
          },
          is_active: true,
        };
        if (asset) {
          asset.status = "assigned";
          asset.is_available = false;
          asset.assigned_to = String(employeeId);
          asset.assigned_employee_name = created.employee_name;
          asset.assigned_date = created.assigned_date;
          asset.current_assignment = {
            id: created.id,
            employee_name: created.employee_name,
            employee_id: employeeId,
          };
        }
        state.assignments = [created, ...state.assignments];
        await route.fulfill(json(created, 201));
        return;
      }

      if (pathname.match(/^\/api\/projects\/\d+\/$/) && method === "GET") {
        const id = Number(lastSegment(url));
        await route.fulfill(
          json(state.projects.find((item) => item.id === id) ?? {})
        );
        return;
      }

      if (pathname.match(/^\/api\/projects\/\d+\/$/) && method === "PATCH") {
        const id = Number(lastSegment(url));
        const project = state.projects.find((item) => item.id === id);
        if (project) {
          Object.assign(project, body, { updated_at: nowIso() });
        }
        await route.fulfill(json(project ?? {}));
        return;
      }

      if (
        pathname.match(/^\/api\/projects\/\d+\/archive\/$/) &&
        method === "POST"
      ) {
        const id = Number(parseIdFromPath(url, "/api/projects"));
        const project = state.projects.find((item) => item.id === id);
        if (project) {
          project.status = "archived";
          project.updated_at = nowIso();
        }
        await route.fulfill(json(project ?? {}));
        return;
      }

      if (
        pathname.match(/^\/api\/projects\/\d+\/reactivate\/$/) &&
        method === "POST"
      ) {
        const id = Number(parseIdFromPath(url, "/api/projects"));
        const project = state.projects.find((item) => item.id === id);
        if (project) {
          project.status = "active";
          project.updated_at = nowIso();
        }
        await route.fulfill(json(project ?? {}));
        return;
      }

      if (
        pathname.match(/^\/api\/projects\/\d+\/activity\/$/) &&
        method === "GET"
      ) {
        await route.fulfill(json({ events: [] }));
        return;
      }

      if (pathname === "/api/projects/" && method === "GET") {
        await route.fulfill(
          json({ results: state.projects, count: state.projects.length })
        );
        return;
      }

      if (pathname === "/api/projects/" && method === "POST") {
        const created = {
          id: state.nextIds.project++,
          name: body.name,
          description: body.description ?? null,
          client: body.client ?? "Internal",
          app_stack: body.app_stack ?? null,
          project_type: body.project_type ?? "internal",
          status: body.status ?? "active",
          stage: body.stage ?? "intake",
          stage_note: body.stage_note ?? "",
          start_date: body.start_date ?? isoDaysFromNow(0),
          end_date: body.end_date ?? null,
          owner_id: body.owner_id ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
          assignment_summary: {
            total_assignments: 0,
            active_assignments: 0,
            active_members: 0,
          },
          active_members_count: 0,
          active_members: [],
        };
        state.projects = [created, ...state.projects];
        state.projectAssignments[created.id] = [];
        await route.fulfill(json(created, 201));
        return;
      }

      if (
        pathname.match(/^\/api\/projects\/\d+\/assignments\/$/) &&
        method === "GET"
      ) {
        const id = Number(pathname.split("/")[3]);
        await route.fulfill(json(state.projectAssignments[id] ?? []));
        return;
      }

      if (
        pathname.match(/^\/api\/projects\/\d+\/assignments\/$/) &&
        method === "POST"
      ) {
        const projectId = Number(pathname.split("/")[3]);
        const employee = state.employees.find(
          (item) => item.id === Number(body.user_profile_id)
        );
        const allocationPercentage = Number(body.allocation_percentage ?? 100);
        const created = {
          id: state.nextIds.projectAssignment++,
          project_id: projectId,
          project_name:
            state.projects.find((project) => project.id === projectId)?.name ??
            "Project",
          user_profile_id: Number(body.user_profile_id),
          employee_name: employee
            ? `${employee.first_name} ${employee.last_name}`
            : "Employee",
          role: body.role ?? "Contributor",
          allocation_percentage: allocationPercentage,
          weekly_allocation_hours: String((allocationPercentage / 100) * 40),
          active_projects_count: 1,
          start_date: body.start_date ?? isoDaysFromNow(0),
          end_date: body.end_date ?? null,
          status: body.status ?? "active",
          notes: body.notes ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        state.projectAssignments[projectId] = [
          created,
          ...(state.projectAssignments[projectId] ?? []),
        ];
        const project = state.projects.find((item) => item.id === projectId) as
          | (Record<string, unknown> & {
              active_members?: Record<string, unknown>[];
              active_members_count?: number;
              assignment_summary?: {
                total_assignments: number;
                active_assignments: number;
                active_members: number;
              };
            })
          | undefined;
        if (project) {
          const activeMembers = Array.isArray(project.active_members)
            ? project.active_members
            : [];
          project.active_members = [created, ...activeMembers];
          project.active_members_count = project.active_members.length;
          project.assignment_summary = {
            total_assignments: project.active_members.length,
            active_assignments: project.active_members.length,
            active_members: project.active_members.length,
          };
        }
        await route.fulfill(json(created, 201));
        return;
      }

      if (
        pathname.match(/^\/api\/project-assignments\/\d+\/$/) &&
        method === "PATCH"
      ) {
        const assignmentId = Number(lastSegment(url));
        const found = Object.values(state.projectAssignments)
          .flat()
          .find((item) => item.id === assignmentId);
        if (found) {
          Object.assign(found, body, { updated_at: nowIso() });
        }
        await route.fulfill(json(found ?? {}));
        return;
      }

      if (
        pathname.match(/^\/api\/projects\/\d+\/tech-leads\/$/) &&
        method === "GET"
      ) {
        await route.fulfill(
          json([
            {
              id: 4,
              first_name: "Priya",
              last_name: "Singh",
            },
          ])
        );
        return;
      }

      if (pathname.match(/^\/api\/departments\/$/) && method === "GET") {
        await route.fulfill(json(["Engineering", "Product", "People"]));
        return;
      }

      if (pathname.match(/^\/api\/roles\/$/) && method === "GET") {
        await route.fulfill(
          json([
            { id: 1, name: "Software Engineer" },
            { id: 2, name: "Product Manager" },
            { id: 3, name: "Developer Advocate" },
          ])
        );
        return;
      }

      if (pathname.match(/^\/api\/cpf-levels\/$/) && method === "GET") {
        await route.fulfill(json(["L3", "L4", "L5", "L6"]));
        return;
      }

      if (
        pathname === "/api/return-requests/" &&
        new URL(url).searchParams.get("status") === "pending"
      ) {
        await route.fulfill(json([]));
        return;
      }

      if (pathname === "/api/replacement-logs/" && method === "GET") {
        await route.fulfill(json([]));
        return;
      }

      if (pathname === "/api/scheduled-maintenance/" && method === "GET") {
        await route.fulfill(json([]));
        return;
      }

      if (pathname === "/api/assets/export/" && method === "POST") {
        await route.fulfill(
          json({
            url: "https://example.com/assets.csv",
            filename: "assets.csv",
          })
        );
        return;
      }

      if (pathname === "/api/documents/templates/" && method === "GET") {
        await route.fulfill(json([]));
        return;
      }

      if (
        pathname.match(/^\/api\/documents\/\d+\/archive\/$/) &&
        method === "POST"
      ) {
        await route.fulfill(json({}));
        return;
      }

      if (
        pathname.match(/^\/api\/documents\/\d+\/unarchive\/$/) &&
        method === "POST"
      ) {
        await route.fulfill(json({}));
        return;
      }

      if (pathname === "/api/ai/chat/sessions/" && method === "GET") {
        await route.fulfill(json({ results: state.aiSessions }));
        return;
      }

      if (pathname === "/api/ai/chat/sessions/" && method === "POST") {
        const created = {
          id: state.nextIds.aiSession++,
          session_id: state.nextIds.aiSession,
          title: body.title ?? "New chat",
          created_at: nowIso(),
          updated_at: nowIso(),
          last_message: body.message ?? "",
          messages: [],
        };
        state.aiSessions = [created, ...state.aiSessions];
        await route.fulfill(json(created, 201));
        return;
      }

      if (
        pathname.match(/^\/api\/ai\/chat\/sessions\/\d+\/$/) &&
        method === "GET"
      ) {
        const id = Number(lastSegment(url));
        const session = state.aiSessions.find((item) => item.id === id);
        await route.fulfill(
          json(session ?? { id, session_id: id, messages: [] })
        );
        return;
      }

      if (
        pathname.match(/^\/api\/ai\/chat\/sessions\/\d+\/$/) &&
        method === "DELETE"
      ) {
        const id = Number(lastSegment(url));
        state.aiSessions = state.aiSessions.filter((item) => item.id !== id);
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      if (pathname === "/api/ai/chat/" && method === "POST") {
        const text = String(body.message ?? "");
        const aiModule = inferModuleFromPrompt(text);
        await route.fulfill(
          json({
            session_id: 1,
            message:
              aiModule === "vacations"
                ? "I can help with leave requests."
                : aiModule === "profiles"
                  ? "Opening the employee profile now."
                  : "Here is a quick answer from BloomAI.",
            tool_name: null,
            module: aiModule,
            result: {
              summary: text,
            },
            entities:
              aiModule === "profiles"
                ? [
                    {
                      type: "employee",
                      id: 1,
                      name: "John Doe",
                      email: "john.doe@bloomhub.test",
                      url: "/employee/1",
                    },
                  ]
                : [],
            entity_spans: [],
            requires_confirmation: false,
            requires_input: false,
            pending_confirmation: null,
            ui_action_type: null,
            ui_action: null,
          })
        );
        return;
      }

      if (pathname.match(/^\/api\/auth\/callback\//)) {
        await route.fulfill(
          json(
            {
              ok: true,
              status: 200,
              url: "/",
              error: null,
            },
            200,
            {
              "set-cookie": `next-auth.session-token=${state.session.accessToken}; Path=/; HttpOnly`,
            }
          )
        );
        return;
      }

      if (pathname === "/api/auth/csrf") {
        await route.fulfill(json({ csrfToken: "mock-csrf-token" }));
        return;
      }

      await route.continue();
    });
  };

  return { state, install };
}

function tryParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function daysBetween(start?: unknown, end?: unknown): number {
  if (typeof start !== "string" || typeof end !== "string") return 0;
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

function labelForLeaveType(value: unknown): string {
  const key = String(value ?? "");
  const labels: Record<string, string> = {
    vacation: "Vacation",
    sick: "Sick Leave",
    wfh: "Work From Home",
    personal: "Personal",
    maternity: "Maternity",
    paternity: "Paternity",
    bereavement: "Bereavement",
    unpaid: "Unpaid Leave",
  };
  return labels[key] ?? key;
}

function labelForBonusType(value: unknown): string {
  const key = String(value ?? "");
  const labels: Record<string, string> = {
    performance: "Performance",
    retention: "Retention",
    referral: "Referral",
    project: "Project",
    education: "Education",
    spot: "Spot",
  };
  return labels[key] ?? key;
}

function labelForTrainingType(value: unknown): string {
  const key = String(value ?? "");
  const labels: Record<string, string> = {
    course: "Course",
    workshop: "Workshop",
    conference: "Conference",
    certification: "Certification",
    seminar: "Seminar",
    other: "Other",
  };
  return labels[key] ?? key;
}

function inferModuleFromPrompt(prompt: string): string | null {
  const text = prompt.toLowerCase();
  if (text.includes("leave")) return "vacations";
  if (text.includes("employee") || text.includes("profile")) return "profiles";
  if (text.includes("asset")) return "assets";
  return null;
}

export async function waitForDocumentState(
  state: MockBackendState,
  predicate: (docs: Record<string, unknown>[]) => boolean
) {
  await expect
    .poll(() => predicate(state.documents), { timeout: 10_000 })
    .toBe(true);
}
