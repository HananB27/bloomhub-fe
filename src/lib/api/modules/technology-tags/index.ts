import { API_BASE_URL } from "../../../config";
import { patch } from "../../helpers/httpClient";
import type { TechnologyTag } from "@/types/technology-tags";
import type { EmployeeProfileData } from "../../helpers/transformers";

const EMPLOYEE_BASE_URL = `${API_BASE_URL}/api/employees`;

const ERROR_MESSAGES = {
  UPDATE_TAGS: "Failed to update technology tags",
} as const;

/**
 * Hardcoded catalogue of technology tags available in the system.
 * The backend TechnologyTag table should contain these entries.
 * IDs here must match the backend PKs — update as needed after
 * running the Django admin seed.
 *
 * This list is used as a fallback until the backend exposes a
 * standalone GET /api/technology-tags/ endpoint.
 */
const DEFAULT_TECHNOLOGY_TAGS: TechnologyTag[] = [
  { id: 1, name: "React" },
  { id: 2, name: "Angular" },
  { id: 3, name: "Vue.js" },
  { id: 4, name: "TypeScript" },
  { id: 5, name: "JavaScript" },
  { id: 6, name: "Python" },
  { id: 7, name: "Django" },
  { id: 8, name: "Node.js" },
  { id: 9, name: "Next.js" },
  { id: 10, name: "PostgreSQL" },
  { id: 11, name: "Docker" },
  { id: 12, name: "AWS" },
  { id: 13, name: "Tailwind CSS" },
  { id: 14, name: "GraphQL" },
  { id: 15, name: "Redis" },
  { id: 16, name: "Git" },
  { id: 17, name: "Java" },
  { id: 18, name: "C#" },
  { id: 19, name: ".NET" },
  { id: 20, name: "Go" },
  { id: 21, name: "Rust" },
  { id: 22, name: "Kubernetes" },
  { id: 23, name: "Flutter" },
  { id: 24, name: "Swift" },
  { id: 25, name: "Kotlin" },
  { id: 26, name: "MongoDB" },
  { id: 27, name: "MySQL" },
];

/**
 * Returns the full tag catalogue.
 * Merges any tags found on employees (from the backend) with the
 * hardcoded defaults so new backend-only tags are never lost.
 */
export function getAllTags(employees: EmployeeProfileData[]): TechnologyTag[] {
  const tagMap = new Map<number, TechnologyTag>();

  for (const tag of DEFAULT_TECHNOLOGY_TAGS) {
    tagMap.set(tag.id, tag);
  }

  for (const emp of employees) {
    for (const tag of emp.technology_tags ?? []) {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag);
      }
    }
  }

  return Array.from(tagMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Persist the full set of tag IDs for an employee via PATCH.
 * The backend `EmployeeProfileSerializer` accepts `tech_tags` as a
 * list of TechnologyTag PKs on the ManyToManyField.
 */
async function updateEmployeeTags(
  employeeId: number | string,
  tagIds: number[]
): Promise<void> {
  await patch<unknown>(
    `${EMPLOYEE_BASE_URL}/${employeeId}/`,
    { tech_tags: tagIds },
    ERROR_MESSAGES.UPDATE_TAGS
  );
}

export const technologyTagsApi = {
  updateEmployeeTags,
  getAllTags,
};
