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
  EmployeeId = "employee_id",
  IsActive = "is_active",
  Currency = "currency",
  DisplayName = "display_name",
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
  [ProfileHistoryField.EmployeeId]: "Employee ID",
  [ProfileHistoryField.IsActive]: "Status",
  [ProfileHistoryField.Currency]: "Currency",
  [ProfileHistoryField.DisplayName]: "Display Name",
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
  if (field === ProfileHistoryField.IsActive) {
    if (typeof value === "boolean") return value ? "Active" : "Inactive";
    if (value === "true" || value === 1) return "Active";
    if (value === "false" || value === 0) return "Inactive";
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
