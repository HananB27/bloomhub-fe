import type { ReactNode } from "react";
import type { EmployeeProfileData } from "@/lib/api/employees";
import { ProfileRail } from "./ProfileRail";
import { ProfilePageHeader } from "./ProfilePageHeader";
import { SaveFooter } from "./atoms/SaveFooter";
import {
  useProfileSectionNav,
  type ProfileSectionNavItem,
} from "./useProfileSectionNav";
interface ProfileDetailShellProps {
  profile: EmployeeProfileData;
  sections: readonly ProfileSectionNavItem[];
  edit: boolean;
  dirty: boolean;
  saving?: boolean;
  canEdit: boolean;
  canDelete?: boolean;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onBack?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  children: ReactNode;
}

/**
 * Two-column profile detail shell (D-01 rail + D-12 save footer). Caller
 * mounts the section list inside `children`, each wrapped in a
 * `<ProfileSection>` whose `anchor` matches an id in `sections`.
 */
export function ProfileDetailShell({
  profile,
  sections,
  edit,
  dirty,
  saving,
  canEdit,
  canDelete,
  onEnterEdit,
  onCancelEdit,
  onSave,
  onBack,
  onExport,
  onDelete,
  children,
}: ProfileDetailShellProps) {
  const { activeId, jumpTo } = useProfileSectionNav(sections);
  return (
    <div className="ep-scope flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex-1">
        <div className="flex w-full flex-col gap-8 px-8 pt-10 pb-24 lg:flex-row lg:items-start">
          <ProfileRail
            profile={profile}
            sections={sections}
            activeId={activeId}
            onJump={jumpTo}
          />
          <main className="min-w-0 flex-1">
            <ProfilePageHeader
              profile={profile}
              edit={edit}
              dirty={dirty}
              saving={saving}
              canEdit={canEdit}
              canDelete={canDelete}
              onEnterEdit={onEnterEdit}
              onCancelEdit={onCancelEdit}
              onSave={onSave}
              onBack={onBack}
              onExport={onExport}
              onDelete={onDelete}
            />
            <div className="flex flex-col gap-3.5 pt-1">{children}</div>
          </main>
        </div>
      </div>
      <SaveFooter
        visible={edit}
        saving={saving}
        message={dirty ? "You have unsaved changes" : "No changes yet"}
        onCancel={onCancelEdit}
        onSave={onSave}
      />
    </div>
  );
}
