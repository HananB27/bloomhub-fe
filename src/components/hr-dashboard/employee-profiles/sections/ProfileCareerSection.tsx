import { TrendingUp, Award } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { Field, FieldEmpty, FieldValue, ProfileSection } from "../atoms";

interface ProfileCareerSectionProps {
  profile: EmployeeProfileData;
}

/** Career path & CPF level summary. Edits flow through compensation/HR module. */
export function ProfileCareerSection({ profile }: ProfileCareerSectionProps) {
  return (
    <ProfileSection id="career" kicker="Progression" title="Career path & CPF">
      <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
        <Field label="CPF level" span="col-span-12 sm:col-span-6">
          {profile.cpf_level ? (
            <FieldValue>
              <Award size={14} aria-hidden />
              {profile.cpf_level}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Career level" span="col-span-12 sm:col-span-6">
          {profile.career_level ? (
            <FieldValue>
              <TrendingUp size={14} aria-hidden />
              {profile.career_level}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
      </div>
    </ProfileSection>
  );
}
