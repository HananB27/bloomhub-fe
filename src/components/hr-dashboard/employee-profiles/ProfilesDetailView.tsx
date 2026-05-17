import { useMemo, type ChangeEvent, type RefObject } from "react";
import type {
  EmployeeProfileData,
  EmployeeProfileChangeHistoryItem,
} from "@/lib/api/employees";
import type { EmployeeCVVersion } from "@/lib/api/modules/employee-cvs";
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
import type { ProfileSectionNavItem } from "./useProfileSectionNav";
import type { ProfileViewerRole } from "./atoms/RoleSwitch";

interface ProfilesDetailViewProps {
  profile: EmployeeProfileData;
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
    [access.emergency.visibility, access.salary.visibility]
  );

  return (
    <ProfileDetailShell
      profile={profile}
      sections={sections}
      edit={editMode}
      dirty={dirty}
      saving={isSaving}
      canEdit={canEdit}
      onEnterEdit={onEnterEdit}
      onCancelEdit={onCancelEdit}
      onSave={onSave}
      onBack={onBack}
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
      <ProfileEmploymentSection profile={profile} />
      <ProfileCareerSection profile={profile} />
      <ProfileCompensationSection profile={profile} access={access} />
      <ProfileTechnologySection
        selectedEmployee={profile}
        allTechnologyTags={allTechnologyTags}
        editMode={editMode}
        canEditAll={canEditAll}
        currentUserId={currentUserId}
        onEmployeeChange={onEmployeeChange}
      />
      <ProfileProjectsSection profile={profile} />
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
