import { EditableInput } from "../ui/editable-form";
import type { EmployeeProfileData } from "@/lib/api/employees";

interface ProfileEmergencyContactSectionProps {
  selectedEmployee: EmployeeProfileData;
  canEditAll: boolean;
  currentUserId: number | null;
  editMode: boolean;
  onEmployeeChange: (employee: EmployeeProfileData) => void;
}

export function ProfileEmergencyContactSection({
  selectedEmployee,
  canEditAll,
  currentUserId,
  editMode,
  onEmployeeChange,
}: ProfileEmergencyContactSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
          Emergency Contact
        </h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          SECTION 05
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <EditableInput
          label="Contact Name"
          value={selectedEmployee.emergency_contact_name}
          onChange={(value) =>
            onEmployeeChange({
              ...selectedEmployee,
              emergency_contact_name: value,
            })
          }
          disabled={!canEditAll && currentUserId !== selectedEmployee.id}
          isEditing={editMode}
          placeholder="Full name"
        />
        <EditableInput
          label="Contact Phone"
          value={selectedEmployee.emergency_contact_phone}
          onChange={(value) =>
            onEmployeeChange({
              ...selectedEmployee,
              emergency_contact_phone: value.slice(0, 30),
            })
          }
          disabled={!canEditAll && currentUserId !== selectedEmployee.id}
          isEditing={editMode}
          placeholder="+XXXXXXXXXXX"
          maxLength={30}
        />
      </div>
    </div>
  );
}
