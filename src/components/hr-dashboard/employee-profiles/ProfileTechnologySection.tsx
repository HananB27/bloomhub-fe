import type { EmployeeProfileData } from "@/lib/api/employees";
import type { TechnologyTag } from "@/types/technology-tags";
import { TechnologyTagInput } from "./TechnologyTagInput";
import { ProfileSection } from "./atoms";

interface ProfileTechnologySectionProps {
  selectedEmployee: EmployeeProfileData;
  allTechnologyTags: TechnologyTag[];
  editMode: boolean;
  canEditAll: boolean;
  currentUserId: number | null;
  onEmployeeChange: (employee: EmployeeProfileData) => void;
}

export function ProfileTechnologySection({
  selectedEmployee,
  allTechnologyTags,
  editMode,
  canEditAll,
  currentUserId,
  onEmployeeChange,
}: ProfileTechnologySectionProps) {
  const disabled = !canEditAll && currentUserId !== selectedEmployee.id;
  return (
    <ProfileSection id="tech" kicker="Skills" title="Technology & skills">
      <TechnologyTagInput
        selectedTags={selectedEmployee.technology_tags ?? []}
        allTags={allTechnologyTags}
        isEditing={editMode}
        disabled={disabled}
        onTagAdded={(tag) =>
          onEmployeeChange({
            ...selectedEmployee,
            technology_tags: [...(selectedEmployee.technology_tags ?? []), tag],
          })
        }
        onTagRemoved={(tagId) =>
          onEmployeeChange({
            ...selectedEmployee,
            technology_tags: (selectedEmployee.technology_tags ?? []).filter(
              (t) => t.id !== tagId
            ),
          })
        }
      />
    </ProfileSection>
  );
}
