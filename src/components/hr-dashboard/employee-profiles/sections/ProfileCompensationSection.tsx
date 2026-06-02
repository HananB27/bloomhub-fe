import { useMemo } from "react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import type { CompensationPolicy } from "@/lib/api/compensation";
import {
  Field,
  FieldEmpty,
  FieldValue,
  ProfileSection,
  RestrictedBlock,
} from "../atoms";
import type { ProfileViewerAccess } from "../sectionPermissions";
import { ProfileBonusesBlock } from "./ProfileBonusesBlock";

interface ProfileCompensationSectionProps {
  profile: EmployeeProfileData;
  access: ProfileViewerAccess;
  compensationPolicies: CompensationPolicy[];
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
      currency: currency || "BAM",
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
  compensationPolicies,
}: ProfileCompensationSectionProps) {
  const isRestricted = access.salary.visibility === "restricted";

  const policyForCpf = useMemo(() => {
    if (!profile.cpf_level) return null;
    return (
      compensationPolicies.find((p) => p.cpf_level === profile.cpf_level) ??
      null
    );
  }, [compensationPolicies, profile.cpf_level]);

  const policySalaryRaw =
    profile.current_net_salary ??
    profile.salary ??
    (policyForCpf ? Number(policyForCpf.net_monthly) : undefined);

  const currency = profile.currency || policyForCpf?.currency || "BAM";

  const derivedFromPolicy =
    policyForCpf &&
    (profile.current_net_salary === undefined ||
      profile.current_net_salary === null) &&
    (profile.salary === undefined || profile.salary === null);

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
            {policySalaryRaw !== undefined && policySalaryRaw !== null ? (
              <div className="flex flex-col gap-1">
                <FieldValue mono>
                  {formatSalary(policySalaryRaw, currency) ?? <FieldEmpty />}
                </FieldValue>
                {derivedFromPolicy ? (
                  <span className="text-xs text-gray-500">
                    From CPF policy for {profile.cpf_level}. Saves on next sync.
                  </span>
                ) : null}
              </div>
            ) : (
              <FieldEmpty />
            )}
          </Field>
          <Field label="Currency" span="col-span-12 sm:col-span-6">
            <FieldValue mono>{currency}</FieldValue>
          </Field>
          <ProfileBonusesBlock employeeId={profile.id} />
        </div>
      )}
    </ProfileSection>
  );
}
