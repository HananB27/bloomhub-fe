import { TrendingUp, Award } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { Field, FieldEmpty, FieldValue, ProfileSection } from "../atoms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface ProfileCareerSectionProps {
  profile: EmployeeProfileData;
  editMode: boolean;
  canEditAll: boolean;
  cpfLevels: string[];
  onEmployeeChange: (employee: EmployeeProfileData) => void;
}

/** Career path & CPF level summary. Edits flow through compensation/HR module. */
export function ProfileCareerSection({
  profile,
  editMode,
  canEditAll,
  cpfLevels,
  onEmployeeChange,
}: ProfileCareerSectionProps) {
  const levels = Array.from(
    new Set([profile.cpf_level, ...cpfLevels].filter(Boolean))
  ) as string[];
  const canEditCpf = editMode && canEditAll && levels.length > 0;

  return (
    <ProfileSection id="career" kicker="Progression" title="Career path & CPF">
      <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
        <Field label="CPF level" span="col-span-12 sm:col-span-6">
          {canEditCpf ? (
            <Select
              value={profile.cpf_level || undefined}
              onValueChange={(value) =>
                onEmployeeChange({ ...profile, cpf_level: value })
              }
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white">
                <SelectValue placeholder="Assign CPF level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : profile.cpf_level ? (
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
