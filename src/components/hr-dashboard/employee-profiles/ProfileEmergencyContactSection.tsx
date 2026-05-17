import type { EmployeeProfileData } from "@/lib/api/employees";
import { EditableInput } from "../ui/editable-form";
import { ProfileSection, RestrictedBlock } from "./atoms";
import type { ProfileViewerAccess } from "./sectionPermissions";

interface ProfileEmergencyContactSectionProps {
  selectedEmployee: EmployeeProfileData;
  canEditAll: boolean;
  currentUserId: number | null;
  editMode: boolean;
  onEmployeeChange: (employee: EmployeeProfileData) => void;
  /** Optional viewer-role access; absent = no role-based gating. */
  access?: ProfileViewerAccess;
}

export function ProfileEmergencyContactSection({
  selectedEmployee,
  canEditAll,
  currentUserId,
  editMode,
  onEmployeeChange,
  access,
}: ProfileEmergencyContactSectionProps) {
  const restricted = access?.emergency.visibility === "restricted";
  const disabled = !canEditAll && currentUserId !== selectedEmployee.id;
  return (
    <ProfileSection
      id="emergency"
      kicker="In case of"
      title="Emergency contact"
    >
      {restricted ? (
        <RestrictedBlock
          title="Restricted"
          description="Emergency contact details are only visible to HR administrators and the employee."
        />
      ) : (
        <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
          <div className="col-span-12 sm:col-span-6">
            <EditableInput
              label="Contact Name"
              value={selectedEmployee.emergency_contact_name}
              onChange={(value) =>
                onEmployeeChange({
                  ...selectedEmployee,
                  emergency_contact_name: value,
                })
              }
              disabled={disabled}
              isEditing={editMode}
              placeholder="Full name"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <EditableInput
              label="Contact Phone"
              value={selectedEmployee.emergency_contact_phone}
              onChange={(value) =>
                onEmployeeChange({
                  ...selectedEmployee,
                  emergency_contact_phone: value.slice(0, 30),
                })
              }
              disabled={disabled}
              isEditing={editMode}
              placeholder="+XXXXXXXXXXX"
              maxLength={30}
            />
          </div>
        </div>
      )}
    </ProfileSection>
  );
}
