import { Briefcase, Calendar, Users } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { formatDate } from "@/utils";
import {
  Field,
  FieldEmpty,
  FieldValue,
  ProfileSection,
  StatusPill,
} from "../atoms";
import { deriveEmployeeStatus } from "../employeesListHelpers";

interface ProfileEmploymentSectionProps {
  profile: EmployeeProfileData;
}

/** Employment summary — role, dept, status, manager, start date. */
export function ProfileEmploymentSection({
  profile,
}: ProfileEmploymentSectionProps) {
  const status = deriveEmployeeStatus(profile);
  return (
    <ProfileSection id="employment" kicker="At Bloomteq" title="Employment">
      <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
        <Field label="Role" span="col-span-12 sm:col-span-6">
          {profile.role?.name ? (
            <FieldValue>
              <Briefcase size={14} aria-hidden />
              {profile.role.name}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Department" span="col-span-12 sm:col-span-6">
          {profile.department ? (
            <FieldValue>{profile.department}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Status" span="col-span-12 sm:col-span-4">
          <StatusPill status={status} />
        </Field>
        <Field label="Start date" span="col-span-12 sm:col-span-4">
          {profile.start_date ? (
            <FieldValue mono>
              <Calendar size={14} aria-hidden />
              {formatDate(profile.start_date)}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Manager" span="col-span-12 sm:col-span-4">
          {profile.manager_names ? (
            <FieldValue>
              <Users size={14} aria-hidden />
              {profile.manager_names}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Employee ID" span="col-span-12 sm:col-span-4">
          {profile.employee_id ? (
            <FieldValue mono>{profile.employee_id}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
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
