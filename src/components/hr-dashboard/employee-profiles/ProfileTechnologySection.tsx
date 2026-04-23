import { TechnologyTagInput } from "./TechnologyTagInput";
import type { EmployeeProfileData } from "@/lib/api/employees";
import type { TechnologyTag } from "@/types/technology-tags";

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
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
          Technology & Skills
        </h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          SECTION 03
        </span>
      </div>
      <TechnologyTagInput
        selectedTags={selectedEmployee.technology_tags ?? []}
        allTags={allTechnologyTags}
        isEditing={editMode}
        disabled={!canEditAll && currentUserId !== selectedEmployee.id}
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
    </div>
  );
}
