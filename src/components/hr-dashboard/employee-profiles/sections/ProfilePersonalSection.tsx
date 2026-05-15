import { Mail, Phone, Cake, MapPin } from "lucide-react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import {
  Field,
  FieldEmpty,
  FieldInput,
  FieldRestricted,
  FieldValue,
  ProfileSection,
} from "../atoms";
import type { ProfileViewerAccess } from "../sectionPermissions";

interface ProfilePersonalSectionProps {
  profile: EmployeeProfileData;
  access: ProfileViewerAccess;
  editMode?: boolean;
  canEditAll?: boolean;
  currentUserId?: number | null;
  onEmployeeChange?: (employee: EmployeeProfileData) => void;
}

/** D-18 birth date — full for HR, month+day only otherwise. */
function formatBirthDate(
  value: string | undefined,
  full: boolean
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (full) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function ProfilePersonalSection({
  profile,
  access,
  editMode = false,
  canEditAll = false,
  currentUserId = null,
  onEmployeeChange,
}: ProfilePersonalSectionProps) {
  const showFullBirth = access.birth_date.visibility === "visible";
  const birthDateText = formatBirthDate(profile.birth_date, showFullBirth);
  const addressRestricted = access.address.visibility === "restricted";
  const isSelf = currentUserId !== null && currentUserId === profile.id;
  const canEdit = editMode && (canEditAll || isSelf);
  const apply = (patch: Partial<EmployeeProfileData>) =>
    onEmployeeChange?.({ ...profile, ...patch });

  return (
    <ProfileSection id="personal" kicker="About" title="Personal information">
      <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
        <Field label="First name" span="col-span-12 sm:col-span-4">
          {canEdit ? (
            <FieldInput
              value={profile.first_name ?? ""}
              onChange={(e) => apply({ first_name: e.target.value })}
              placeholder="First name"
            />
          ) : profile.first_name ? (
            <FieldValue>{profile.first_name}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Last name" span="col-span-12 sm:col-span-4">
          {canEdit ? (
            <FieldInput
              value={profile.last_name ?? ""}
              onChange={(e) => apply({ last_name: e.target.value })}
              placeholder="Last name"
            />
          ) : profile.last_name ? (
            <FieldValue>{profile.last_name}</FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Email" span="col-span-12 sm:col-span-4">
          {canEdit ? (
            <FieldInput
              type="email"
              value={profile.email ?? ""}
              onChange={(e) => apply({ email: e.target.value })}
              placeholder="name@bloomteq.com"
            />
          ) : profile.email ? (
            <FieldValue>
              <Mail size={14} aria-hidden />
              {profile.email}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Phone" span="col-span-12 sm:col-span-4">
          {canEdit ? (
            <FieldInput
              type="tel"
              value={profile.phone_number ?? ""}
              onChange={(e) => apply({ phone_number: e.target.value })}
              placeholder="+387 …"
            />
          ) : profile.phone_number ? (
            <FieldValue>
              <Phone size={14} aria-hidden />
              {profile.phone_number}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field
          label={showFullBirth ? "Birth date" : "Birthday"}
          span="col-span-12 sm:col-span-4"
        >
          {access.birth_date.visibility === "restricted" ? (
            <FieldRestricted />
          ) : canEdit && access.birth_date.editable ? (
            <FieldInput
              type="date"
              value={profile.birth_date ?? ""}
              onChange={(e) => apply({ birth_date: e.target.value })}
            />
          ) : birthDateText ? (
            <FieldValue>
              <Cake size={14} aria-hidden />
              {birthDateText}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Address" span="col-span-12">
          {addressRestricted ? (
            <FieldRestricted />
          ) : canEdit && access.address.editable ? (
            <FieldInput
              value={profile.address ?? ""}
              onChange={(e) => apply({ address: e.target.value })}
              placeholder="Street, City, Country"
            />
          ) : profile.address ? (
            <FieldValue>
              <MapPin size={14} aria-hidden />
              {profile.address}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
      </div>
    </ProfileSection>
  );
}
