import { useMemo, useState } from "react";
import { TrendingUp, Award, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { cpfLevelsApi, type CPFLevel } from "@/lib/api/modules/cpf-levels";
import { Field, FieldEmpty, FieldValue, ProfileSection } from "../atoms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

interface ProfileCareerSectionProps {
  profile: EmployeeProfileData;
  editMode: boolean;
  canEditAll: boolean;
  cpfLevels: string[];
  cpfLevelObjects: CPFLevel[];
  onCpfLevelsChange: () => Promise<CPFLevel[]> | void;
  onEmployeeChange: (employee: EmployeeProfileData) => void;
}

/** Career path & CPF — CPF drives career_level via admin-managed mapping. */
export function ProfileCareerSection({
  profile,
  editMode,
  canEditAll,
  cpfLevels,
  cpfLevelObjects,
  onCpfLevelsChange,
  onEmployeeChange,
}: ProfileCareerSectionProps) {
  const cpfMap = useMemo(() => {
    const map = new Map<string, CPFLevel>();
    for (const entry of cpfLevelObjects) map.set(entry.code, entry);
    return map;
  }, [cpfLevelObjects]);

  const codes = useMemo(() => {
    const fromObjects = cpfLevelObjects.map((c) => c.code);
    return Array.from(
      new Set(
        [profile.cpf_level, ...fromObjects, ...cpfLevels].filter(
          (v): v is string => !!v
        )
      )
    );
  }, [profile.cpf_level, cpfLevelObjects, cpfLevels]);

  const canEditCpf = editMode && canEditAll && codes.length > 0;

  const currentCpf = profile.cpf_level || null;
  const mappedEntry = currentCpf ? cpfMap.get(currentCpf) : undefined;
  const derivedCareerLevel =
    mappedEntry?.career_level ?? profile.career_level ?? null;
  const needsCareerLevelSetup =
    canEditCpf && !!currentCpf && !mappedEntry?.career_level;

  const [careerDraft, setCareerDraft] = useState("");
  const [isSavingCareer, setIsSavingCareer] = useState(false);

  const labelForCode = (code: string): string => {
    const entry = cpfMap.get(code);
    if (!entry) return code;
    return entry.display_name ? `${entry.display_name} (${code})` : code;
  };

  const handleCpfChange = (value: string) => {
    const entry = cpfMap.get(value);
    onEmployeeChange({
      ...profile,
      cpf_level: value,
      career_level: entry?.career_level ?? profile.career_level ?? "",
    });
  };

  const handleSaveCareerLevel = async () => {
    if (!currentCpf) return;
    const trimmed = careerDraft.trim();
    if (!trimmed) {
      toast.error("Enter a career level name");
      return;
    }
    try {
      setIsSavingCareer(true);
      await cpfLevelsApi.update(currentCpf, { career_level: trimmed });
      await onCpfLevelsChange();
      onEmployeeChange({ ...profile, career_level: trimmed });
      setCareerDraft("");
      toast.success(`Career level set for ${currentCpf}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save career level"
      );
    } finally {
      setIsSavingCareer(false);
    }
  };

  return (
    <ProfileSection id="career" kicker="Progression" title="Career path & CPF">
      <div className="grid grid-cols-12 gap-x-[22px] gap-y-[18px]">
        <Field label="CPF level" span="col-span-12 sm:col-span-6">
          {canEditCpf ? (
            <Select
              value={currentCpf || undefined}
              onValueChange={handleCpfChange}
            >
              <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-white">
                <SelectValue placeholder="Assign CPF level" />
              </SelectTrigger>
              <SelectContent>
                {codes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {labelForCode(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : currentCpf ? (
            <FieldValue>
              <Award size={14} aria-hidden />
              {labelForCode(currentCpf)}
            </FieldValue>
          ) : (
            <FieldEmpty />
          )}
        </Field>
        <Field label="Career level" span="col-span-12 sm:col-span-6">
          {derivedCareerLevel ? (
            <FieldValue>
              <TrendingUp size={14} aria-hidden />
              {derivedCareerLevel}
            </FieldValue>
          ) : needsCareerLevelSetup ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-600">
                No career level set for {currentCpf}. Define it here — applies
                to every employee at this CPF.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={careerDraft}
                  onChange={(e) => setCareerDraft(e.target.value)}
                  placeholder="e.g. Mid, Senior"
                  className="h-10"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveCareerLevel}
                  disabled={isSavingCareer || !careerDraft.trim()}
                >
                  {isSavingCareer ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <FieldEmpty />
          )}
        </Field>
      </div>
    </ProfileSection>
  );
}
