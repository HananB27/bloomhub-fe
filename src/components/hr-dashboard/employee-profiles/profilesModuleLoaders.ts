import { departmentsApi } from "@/lib/api/departments";
import { employeeApi, type EmployeeProfileData } from "@/lib/api/employees";
import {
  employeeCVApi,
  type EmployeeCVVersion,
} from "@/lib/api/modules/employee-cvs";
import { cpfLevelsApi, type CPFLevel } from "@/lib/api/modules/cpf-levels";
import { managersApi, type Manager } from "@/lib/api/managers";
import { getUserPermissions } from "@/lib/api/permissions";
import { getStoredUser } from "@/lib/api/tokens";
import { technologyTagsApi } from "@/lib/api/modules/technology-tags";
import type { TechnologyTag } from "@/types/technology-tags";
import type { EmployeeProfileModalBundleApplied } from "@/lib/api/modules/employees/hrProfileBundles";

import { sortCvVersionsDesc } from "./profilesModuleHelpers";

export interface LegacyProfilesPageSnapshot {
  currentUserId: number | null;
  permissionBits: number | bigint;
  employees: EmployeeProfileData[];
  allTechnologyTags: TechnologyTag[];
  departments: string[];
  roles: { id: number; name: string }[];
  projects: {
    id: number;
    name: string;
    leaders?: { id: number; name: string }[];
  }[];
  managers: Manager[];
  cpfLevels: string[];
  cpfLevelObjects: CPFLevel[];
}

export async function fetchLegacyProfilesPageSnapshot(): Promise<LegacyProfilesPageSnapshot> {
  const user = getStoredUser();
  const currentUserId = user && typeof user.id === "number" ? user.id : null;

  const permissionBits = await getUserPermissions();
  const permBitsTyped = permissionBits;

  const data = await employeeApi.listEmployees(undefined);
  const employeeResults = data.results || [];

  let departments: string[];
  try {
    departments = await departmentsApi.getDepartmentsAsStrings();
  } catch {
    const uniqueDepts = Array.from(
      new Set(
        employeeResults
          .map((emp: EmployeeProfileData) => emp.department)
          .filter(Boolean)
      )
    ) as string[];
    departments = uniqueDepts;
  }

  let roles: { id: number; name: string }[] = [];
  let projects: LegacyProfilesPageSnapshot["projects"] = [];
  let cpfLevels: string[] = [];
  let cpfLevelObjects: CPFLevel[] = [];
  let managers: Manager[] = [];

  try {
    roles = await employeeApi.getRoles();
  } catch {
    roles = [];
  }

  try {
    projects = await employeeApi.getProjects();
  } catch {
    projects = [];
  }

  try {
    cpfLevelObjects = await cpfLevelsApi.list();
    cpfLevels = cpfLevelObjects.map((level) => level.code);
  } catch {
    try {
      cpfLevels = await employeeApi.getCPFLevels();
      cpfLevelObjects = cpfLevels.map((code) => ({
        code,
        display_name: null,
        career_level: null,
      }));
    } catch {
      cpfLevels = [];
      cpfLevelObjects = [];
    }
  }

  try {
    managers = await managersApi.getManagersByRole();
  } catch {
    managers = [];
  }

  return {
    currentUserId,
    permissionBits: permBitsTyped,
    employees: employeeResults,
    allTechnologyTags: technologyTagsApi.getAllTags(employeeResults),
    departments,
    roles,
    projects,
    managers,
    cpfLevels,
    cpfLevelObjects,
  };
}

export interface ProfilesDropdownRefs {
  departments: string[];
  roles: { id: number; name: string }[];
  projects: {
    id: number;
    name: string;
    leaders?: { id: number; name: string }[];
  }[];
  managers: Manager[];
}

export async function fetchProfilesDropdownRefs(): Promise<ProfilesDropdownRefs> {
  const results = await Promise.allSettled([
    departmentsApi.getDepartmentsAsStrings(),
    employeeApi.getRoles(),
    employeeApi.getProjects(),
    managersApi.getManagersByRole(),
  ]);

  const [departmentsRes, rolesRes, projectsRes, managersRes] = results;

  let departments: string[] = [];
  if (departmentsRes.status === "fulfilled") {
    departments = departmentsRes.value;
  } else {
    console.error("Error fetching departments:", departmentsRes.reason);
  }

  let roles: { id: number; name: string }[] = [];
  if (rolesRes.status === "fulfilled") {
    roles = rolesRes.value;
  }

  let projects: ProfilesDropdownRefs["projects"] = [];
  if (projectsRes.status === "fulfilled") {
    projects = projectsRes.value;
  }

  let managers: Manager[] = [];
  if (managersRes.status === "fulfilled") {
    managers = managersRes.value;
  } else {
    console.error("Error fetching managers:", managersRes.reason);
  }

  return { departments, roles, projects, managers };
}

export type EmployeeModalFetchResult =
  | {
      kind: "bundle";
      modalBundle: EmployeeProfileModalBundleApplied;
    }
  | {
      kind: "legacy";
      employee: EmployeeProfileData;
      cvVersions: EmployeeCVVersion[];
    };

export async function fetchEmployeeModalOpenPayload(
  employee: EmployeeProfileData
): Promise<EmployeeModalFetchResult> {
  const modalBundle = await employeeApi.loadEmployeeProfileModalBundle(
    employee.id
  );

  if (modalBundle) {
    return {
      kind: "bundle",
      modalBundle,
    };
  }

  const [freshEmployee, rawCvs] = await Promise.all([
    employeeApi.getEmployee(employee.id),
    employeeCVApi.list(employee.id),
  ]);

  return {
    kind: "legacy",
    employee: freshEmployee,
    cvVersions: sortCvVersionsDesc(rawCvs),
  };
}
