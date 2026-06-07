import { useMemo, type ChangeEvent, type RefObject } from "react";
import type {
  EmployeeProfileData,
  EmployeeProfileChangeHistoryItem,
} from "@/lib/api/employees";
import type { EmployeeCVVersion } from "@/lib/api/modules/employee-cvs";
import type { CPFLevel } from "@/lib/api/modules/cpf-levels";
import type { CompensationPolicy } from "@/lib/api/compensation";
import type { Manager } from "@/lib/api/managers";
import type { TechnologyTag } from "@/types/technology-tags";
import { ProfileDetailShell } from "./ProfileDetailShell";
import { getViewerAccess } from "./sectionPermissions";
import {
  ProfilePersonalSection,
  ProfileEmploymentSection,
  ProfileCareerSection,
  ProfileCompensationSection,
  ProfileProjectsSection,
} from "./sections";
import { ProfileTechnologySection } from "./ProfileTechnologySection";
import { ProfileEmergencyContactSection } from "./ProfileEmergencyContactSection";
import { ProfileCvSection } from "./ProfileCvSection";
import { ProfileHistorySection } from "./ProfileHistorySection";
import { UpcomingCelebrationsWidget } from "./UpcomingCelebrationsWidget";
import type { ProfileSectionNavItem } from "./useProfileSectionNav";
import type { ProfileViewerRole } from "./atoms/RoleSwitch";
import { ProfileSection } from "./atoms/ProfileSection";

interface ProfilesDetailViewProps {
  profile: EmployeeProfileData;
  cpfLevels: string[];
  cpfLevelObjects: CPFLevel[];
  onCpfLevelsChange: () => Promise<CPFLevel[]> | void;
  rolesList: { id: number; name: string }[];
  departments: string[];
  managersList: Manager[];
  compensationPolicies: CompensationPolicy[];
  allTechnologyTags: TechnologyTag[];
  canEditAll: boolean;
  currentUserId: number | null;
  /** True while the page is in inline edit mode. */
  editMode: boolean;
  /** True when the working copy diverges from the saved profile. */
  dirty: boolean;
  /** Save in flight — disables actions. */
  isSaving: boolean;
  onEmployeeChange: (employee: EmployeeProfileData) => void;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  cvVersions: EmployeeCVVersion[];
  isLoadingCVs: boolean;
  canUploadCV: boolean;
  cvAddMode: "file" | "link";
  onCvAddModeChange: (mode: "file" | "link") => void;
  cvFileInputRef: RefObject<HTMLInputElement | null>;
  isUploadingCV: boolean;
  onCvFilePicked: (event: ChangeEvent<HTMLInputElement>) => void;
  cvLinkDraft: string;
  onCvLinkDraftChange: (value: string) => void;
  isAddingCvLink: boolean;
  onAddCvLink: () => void;
  onCVAccess: (cv: EmployeeCVVersion) => void;
  onCVPreview: (cv: EmployeeCVVersion) => void;
  onDeleteCV: (cv: EmployeeCVVersion) => void;
  isLoadingProfileHistory: boolean;
  profileHistoryError: string | null;
  profileHistory: EmployeeProfileChangeHistoryItem[];
  onBack: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  onOpenProject?: (projectId: number) => void;
  introDraft?: IntroAnnouncementDraft;
  onIntroDraftChange?: (draft: IntroAnnouncementDraft) => void;
}

interface IntroAnnouncementDraft {
  enabled: boolean;
  title: string;
  body: string;
  scheduledDate: string;
  scheduledTime: string;
}

function defaultIntroTitle(profile: EmployeeProfileData) {
  return `Welcome ${profile.first_name} ${profile.last_name}`.trim();
}

/**
 * Resolve the effective viewer role from the real session — HR admins see
 * everything, an employee on their own profile sees the self view, anyone
 * else falls back to manager. No client-side role switcher; auth drives it.
 */
function resolveViewerRole(
  canEditAll: boolean,
  currentUserId: number | null,
  profileId: number
): ProfileViewerRole {
  if (canEditAll) return "hr";
  if (currentUserId !== null && currentUserId === profileId) return "employee";
  return "manager";
}

/**
 * Profile detail page. Read + inline-edit live in the same shell — no modal
 * dialog. Edit mode is opened/closed by the parent (`ProfilesModule`) which
 * owns the working copy and save flow.
 */
export function ProfilesDetailView({
  profile,
  cpfLevels,
  cpfLevelObjects,
  onCpfLevelsChange,
  rolesList,
  departments,
  managersList,
  compensationPolicies,
  allTechnologyTags,
  canEditAll,
  currentUserId,
  editMode,
  dirty,
  isSaving,
  onEmployeeChange,
  onEnterEdit,
  onCancelEdit,
  onSave,
  cvVersions,
  isLoadingCVs,
  canUploadCV,
  cvAddMode,
  onCvAddModeChange,
  cvFileInputRef,
  isUploadingCV,
  onCvFilePicked,
  cvLinkDraft,
  onCvLinkDraftChange,
  isAddingCvLink,
  onAddCvLink,
  onCVAccess,
  onCVPreview,
  onDeleteCV,
  isLoadingProfileHistory,
  profileHistoryError,
  profileHistory,
  onBack,
  onExport,
  onDelete,
  canDelete,
  onOpenProject,
  introDraft,
  onIntroDraftChange,
}: ProfilesDetailViewProps) {
  const viewerRole = resolveViewerRole(canEditAll, currentUserId, profile.id);
  const access = getViewerAccess(viewerRole);
  const isSelf = currentUserId !== null && currentUserId === profile.id;
  const canEdit = canEditAll || isSelf;

  const sections = useMemo<ProfileSectionNavItem[]>(
    () => [
      { id: "personal", label: "Personal information" },
      {
        id: "emergency",
        label: "Emergency contact",
        locked: access.emergency.visibility === "restricted",
      },
      { id: "employment", label: "Employment" },
      ...(editMode && canEditAll
        ? [{ id: "intro-announcement", label: "Intro announcement" }]
        : []),
      { id: "celebrations", label: "Celebrations" },
      { id: "career", label: "Career path & CPF" },
      {
        id: "compensation",
        label: "Compensation",
        locked: access.salary.visibility === "restricted",
      },
      { id: "tech", label: "Technology & skills" },
      { id: "projects", label: "Projects" },
      { id: "cv", label: "CV / Resume" },
      { id: "history", label: "Change history" },
    ],
    [
      access.emergency.visibility,
      access.salary.visibility,
      canEditAll,
      editMode,
    ]
  );

  return (
    <ProfileDetailShell
      profile={profile}
      sections={sections}
      edit={editMode}
      dirty={dirty}
      saving={isSaving}
      canEdit={canEdit}
      canDelete={canDelete ?? canEditAll}
      onEnterEdit={onEnterEdit}
      onCancelEdit={onCancelEdit}
      onSave={onSave}
      onBack={onBack}
      onExport={onExport}
      onDelete={onDelete}
    >
      <ProfilePersonalSection
        profile={profile}
        access={access}
        editMode={editMode}
        canEditAll={canEditAll}
        currentUserId={currentUserId}
        onEmployeeChange={onEmployeeChange}
      />
      <ProfileEmergencyContactSection
        selectedEmployee={profile}
        canEditAll={canEditAll}
        currentUserId={currentUserId}
        editMode={editMode}
        onEmployeeChange={onEmployeeChange}
        access={access}
      />
      <ProfileEmploymentSection
        profile={profile}
        editMode={editMode}
        canEditAll={canEditAll}
        rolesList={rolesList}
        departments={departments}
        managersList={managersList}
        onEmployeeChange={onEmployeeChange}
      />
      {editMode && canEditAll && introDraft && onIntroDraftChange ? (
        <ProfileSection
          id="intro-announcement"
          kicker="Announcements"
          title="Introduction Announcement"
        >
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={introDraft.enabled}
                onChange={(event) =>
                  onIntroDraftChange({
                    ...introDraft,
                    enabled: event.target.checked,
                  })
                }
              />
              <span>
                <span className="block font-semibold text-zinc-900">
                  Publish introduction announcement
                </span>
                <span className="block text-sm text-zinc-500">
                  Submit these fields only when enabled.
                </span>
              </span>
            </label>
            {introDraft.enabled ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    Title
                  </span>
                  <input
                    className="h-10 rounded-lg border border-zinc-300 px-3 text-sm"
                    value={introDraft.title || defaultIntroTitle(profile)}
                    onChange={(event) =>
                      onIntroDraftChange({
                        ...introDraft,
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    Body
                  </span>
                  <textarea
                    className="min-h-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    value={introDraft.body}
                    onChange={(event) =>
                      onIntroDraftChange({
                        ...introDraft,
                        body: event.target.value,
                      })
                    }
                    placeholder="<p>Please welcome Jane to Engineering.</p>"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    Schedule date
                  </span>
                  <input
                    type="date"
                    className="h-10 rounded-lg border border-zinc-300 px-3 text-sm"
                    value={introDraft.scheduledDate}
                    onChange={(event) =>
                      onIntroDraftChange({
                        ...introDraft,
                        scheduledDate: event.target.value,
                        scheduledTime:
                          event.target.value && !introDraft.scheduledTime
                            ? "09:00"
                            : introDraft.scheduledTime,
                      })
                    }
                    placeholder="dd. mm. yyyy."
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    Schedule time
                  </span>
                  <input
                    type="time"
                    className="h-10 rounded-lg border border-zinc-300 px-3 text-sm"
                    value={introDraft.scheduledTime}
                    disabled={!introDraft.scheduledDate}
                    onChange={(event) =>
                      onIntroDraftChange({
                        ...introDraft,
                        scheduledTime: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            ) : null}
          </div>
        </ProfileSection>
      ) : null}
      <UpcomingCelebrationsWidget />
      <ProfileCareerSection
        profile={profile}
        editMode={editMode}
        canEditAll={canEditAll}
        cpfLevels={cpfLevels}
        cpfLevelObjects={cpfLevelObjects}
        onCpfLevelsChange={onCpfLevelsChange}
        onEmployeeChange={onEmployeeChange}
      />
      <ProfileCompensationSection
        profile={profile}
        access={access}
        compensationPolicies={compensationPolicies}
      />
      <ProfileTechnologySection
        selectedEmployee={profile}
        allTechnologyTags={allTechnologyTags}
        editMode={editMode}
        canEditAll={canEditAll}
        currentUserId={currentUserId}
        onEmployeeChange={onEmployeeChange}
      />
      <ProfileProjectsSection profile={profile} onOpenProject={onOpenProject} />
      <ProfileCvSection
        editMode={editMode}
        canUploadCV={canUploadCV}
        cvAddMode={cvAddMode}
        onCvAddModeChange={onCvAddModeChange}
        cvFileInputRef={cvFileInputRef}
        isUploadingCV={isUploadingCV}
        onCvFilePicked={onCvFilePicked}
        cvLinkDraft={cvLinkDraft}
        onCvLinkDraftChange={onCvLinkDraftChange}
        isAddingCvLink={isAddingCvLink}
        onAddCvLink={onAddCvLink}
        isLoadingCVs={isLoadingCVs}
        cvVersions={cvVersions}
        onCVAccess={onCVAccess}
        onCVPreview={onCVPreview}
        onDeleteCV={onDeleteCV}
      />
      <ProfileHistorySection
        isLoading={isLoadingProfileHistory}
        error={profileHistoryError}
        history={profileHistory}
        currency={profile.currency}
      />
    </ProfileDetailShell>
  );
}
