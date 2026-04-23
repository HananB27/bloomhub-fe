import { formatCurrency } from "@/utils";
import type { EmployeeProfileChangeHistoryItem } from "@/lib/api/employees";

export enum ProfileHistoryField {
  Role = "role",
  Salary = "salary",
  Cpf = "cpf",
  CpfLevel = "cpf_level",
  Department = "department",
  ManagerIds = "manager_ids",
  Managers = "managers",
  EmploymentStatus = "employment_status",
  CareerLevel = "career_level",
  StartDate = "start_date",
}

const PROFILE_HISTORY_FIELD_LABELS: Record<string, string> = {
  [ProfileHistoryField.Cpf]: "CPF Level",
  [ProfileHistoryField.CpfLevel]: "CPF Level",
  [ProfileHistoryField.Role]: "Role",
  [ProfileHistoryField.Salary]: "Salary",
  [ProfileHistoryField.EmploymentStatus]: "Employment Status",
  [ProfileHistoryField.ManagerIds]: "Managers",
  [ProfileHistoryField.Managers]: "Managers",
  [ProfileHistoryField.CareerLevel]: "Career Level",
  [ProfileHistoryField.StartDate]: "Start Date",
  [ProfileHistoryField.Department]: "Department",
};

export const TRACKED_PROFILE_HISTORY_FIELDS = new Set<string>(
  Object.values(ProfileHistoryField)
);

export function filterTrackedProfileHistoryEntries(
  history: EmployeeProfileChangeHistoryItem[]
): EmployeeProfileChangeHistoryItem[] {
  return history.filter((entry) =>
    TRACKED_PROFILE_HISTORY_FIELDS.has(entry.field)
  );
}

export function profileHistoryFieldLabel(field: string): string {
  return PROFILE_HISTORY_FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

export function profileHistoryValueText(
  field: string,
  value: unknown,
  currency: string = "USD"
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === ProfileHistoryField.Salary) {
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(amount)) return formatCurrency(amount, currency);
  }
  if (typeof value === "object") {
    const valueRecord = value as Record<string, unknown>;
    if (
      typeof valueRecord.value === "string" ||
      typeof valueRecord.value === "number"
    ) {
      return String(valueRecord.value);
    }
    if (Array.isArray(valueRecord.names)) {
      const names = valueRecord.names.filter(
        (name): name is string => typeof name === "string"
      );
      return names.length > 0 ? names.join(", ") : "—";
    }
    if (typeof valueRecord.name === "string") return valueRecord.name;
    return JSON.stringify(value);
  }
  return String(value);
}
