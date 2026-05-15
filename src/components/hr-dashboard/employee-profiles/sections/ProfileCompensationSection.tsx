import type { EmployeeProfileData } from "@/lib/api/employees";
import {
  Field,
  FieldEmpty,
  FieldValue,
  ProfileSection,
  RestrictedBlock,
} from "../atoms";
import type { ProfileViewerAccess } from "../sectionPermissions";

interface ProfileCompensationSectionProps {
  profile: EmployeeProfileData;
  access: ProfileViewerAccess;
}

function formatSalary(
  amount: number | undefined,
  currency: string | undefined
): string | null {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return null;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

/** D-10 — entire section gated. Salary visible only to HR. */
export function ProfileCompensationSection({
  profile,
  access,
}: ProfileCompensationSectionProps) {
  const isRestricted = access.salary.visibility === "restricted";
  return (
    <ProfileSection
      id="compensation"
      kicker="Confidential"
      title="Compensation"
      action={
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          HR only
        </span>
      }
    >
      {isRestricted ? (
        <RestrictedBlock
          title="Restricted"
          description="Compensation details are only visible to HR administrators."
        />
      ) : (
        <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
          <Field label="Current salary" span="col-span-12 sm:col-span-6">
            {profile.salary ? (
              <FieldValue mono>
                {formatSalary(profile.salary, profile.currency) ?? (
                  <FieldEmpty />
                )}
              </FieldValue>
            ) : (
              <FieldEmpty />
            )}
          </Field>
          <Field label="Currency" span="col-span-12 sm:col-span-6">
            {profile.currency ? (
              <FieldValue mono>{profile.currency}</FieldValue>
            ) : (
              <FieldEmpty />
            )}
          </Field>
        </div>
      )}
    </ProfileSection>
  );
}
