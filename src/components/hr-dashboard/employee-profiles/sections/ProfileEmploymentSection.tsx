import { useMemo } from "react";
import { Briefcase, Calendar, Users } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import type { Manager } from "@/lib/api/managers";
import { formatDate } from "@/utils";
import {
  Field,
  FieldEmpty,
  FieldValue,
  ProfileSection,
  StatusPill,
} from "../atoms";
import { deriveEmployeeStatus } from "../employeesListHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { DatePicker } from "../../DatePicker";

interface ProfileEmploymentSectionProps {
  profile: EmployeeProfileData;
  editMode: boolean;
  canEditAll: boolean;
  rolesList: { id: number; name: string }[];
  departments: string[];
  managersList: Manager[];
  onEmployeeChange: (employee: EmployeeProfileData) => void;
}

/** Employment summary — fully editable for HR in edit mode. */
export function ProfileEmploymentSection({
  profile,
  editMode,
  canEditAll,
  rolesList,
  departments,
  managersList,
  onEmployeeChange,
}: ProfileEmploymentSectionProps) {
  const status = deriveEmployeeStatus(profile);
  const canEdit = editMode && canEditAll;

  const roleOptions = useMemo(() => {
    const seen = new Set<number>();
    const out: { id: number; name: string }[] = [];
    if (profile.role?.id && profile.role.name) {
      out.push({ id: profile.role.id, name: profile.role.name });
      seen.add(profile.role.id);
    }
    for (const r of rolesList) {
      if (!seen.has(r.id) && r.name) {
        out.push(r);
        seen.add(r.id);
      }
    }
    return out;
  }, [profile.role?.id, profile.role?.name, rolesList]);

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    if (profile.department) set.add(profile.department);
    for (const d of departments) if (d) set.add(d);
    return Array.from(set);
  }, [profile.department, departments]);

  const managerIds: number[] = Array.isArray(profile.manager_ids)
    ? (profile.manager_ids as number[])
    : [];

  const managerLabel = (m: Manager) =>
    `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() ||
    m.email ||
    `#${m.id}`;

  const selectedManagerLabels = managerIds
    .map((id) => managersList.find((m) => m.id === id))
    .filter((m): m is Manager => !!m)
    .map(managerLabel)
    .join(", ");

  const handleRoleChange = (idStr: string) => {
    const id = parseInt(idStr, 10);
    const match = roleOptions.find((r) => r.id === id);
    if (!match) return;
    onEmployeeChange({
      ...profile,
      role: { ...(profile.role ?? {}), id: match.id, name: match.name },
    });
  };

  const handleDeptChange = (value: string) => {
    onEmployeeChange({ ...profile, department: value });
  };

  const handleStatusChange = (value: string) => {
    onEmployeeChange({ ...profile, is_active: value === "active" });
  };

  const handleStartDateChange = (value: string) => {
    onEmployeeChange({ ...profile, start_date: value });
  };

  return (
    <ProfileSection id="employment" kicker="At Bloomteq" title="Employment">
      <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
        <Field label="Role" span="col-span-12 sm:col-span-6">
          {canEdit ? (
            <Select
              value={profile.role?.id ? String(profile.role.id) : undefined}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : profile.role?.name ? (
            <FieldValue>
              <Briefcase size={14} aria-hidden />
              {profile.role.name}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Department" span="col-span-12 sm:col-span-6">
          {canEdit ? (
            <Select
              value={profile.department || undefined}
              onValueChange={handleDeptChange}
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {deptOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : profile.department ? (
            <FieldValue>{profile.department}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Status" span="col-span-12 sm:col-span-4">
          {canEdit ? (
            <Select
              value={profile.is_active === false ? "inactive" : "active"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <StatusPill status={status} />
          )}
        </Field>
        <Field label="Start date" span="col-span-12 sm:col-span-4">
          {canEdit ? (
            <DatePicker
              mode="single"
              value={profile.start_date || ""}
              onChange={handleStartDateChange}
              size="compact"
            />
          ) : profile.start_date ? (
            <FieldValue mono>
              <Calendar size={14} aria-hidden />
              {formatDate(profile.start_date)}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Manager" span="col-span-12 sm:col-span-4">
          {profile.manager_names || selectedManagerLabels ? (
            <FieldValue>
              <Users size={14} aria-hidden />
              {profile.manager_names || selectedManagerLabels}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
          {canEdit ? (
            <p className="mt-1 text-xs text-gray-500">
              Derived from project assignments — not editable here.
            </p>
          ) : null}
        </Field>
        <Field label="Employee ID" span="col-span-12 sm:col-span-4">
          {profile.employee_id ? (
            <FieldValue mono>{profile.employee_id}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
          {canEdit ? (
            <p className="mt-1 text-xs text-gray-500">
              Assigned automatically by the system.
            </p>
          ) : null}
        </Field>
        <Field label="Username" span="col-span-12 sm:col-span-4">
          {profile.username ? (
            <FieldValue mono>{profile.username}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
      </div>
    </ProfileSection>
  );
}
