import { DashboardModule } from "./dashboard";
import { VacationsModule } from "./VacationsModule";
import ProfilesModule from "./ProfilesModule";
import { ProjectsModule } from "./projects";
import { ReviewsModule } from "./ReviewsModule";
import { OnboardingModule } from "./OnboardingModule";
import { TrainingModule } from "./TrainingModule";
import { CompensationModule } from "./compensation";
import { FeedbackModule } from "./FeedbackModule";
import { TimeTrackingModule } from "./TimeTrackingModule";
import { MobilityModule } from "./MobilityModule";
import { DocumentsModule } from "./DocumentsModule";
import { AssetsModule } from "./AssetsModule";
import { OrgChartModule } from "./OrgChartModule";
import { AnalyticsModule } from "./AnalyticsModule";
import { AnnouncementsModule } from "./AnnouncementsModule";
import { AdminModule } from "./AdminModule";
import type { AddNotification } from "./notifications";

interface DashboardViewProps {
  activeModule: string;
  addNotification?: AddNotification;
  onNavigate?: (moduleId: string) => void;
  initialEmployeeId?: number | null;
  initialProjectId?: string | null;
}

export function DashboardView({
  activeModule,
  addNotification,
  onNavigate,
  initialEmployeeId,
  initialProjectId,
}: DashboardViewProps) {
  switch (activeModule) {
    case "dashboard":
      return <DashboardModule onNavigate={onNavigate} />;
    case "vacations":
      return <VacationsModule addNotification={addNotification} />;
    case "profiles":
      return (
        <ProfilesModule
          onNavigate={onNavigate}
          initialEmployeeId={initialEmployeeId}
        />
      );
    case "projects":
      return (
        <ProjectsModule
          onNavigate={onNavigate}
          initialProjectId={initialProjectId}
        />
      );
    case "reviews":
      return <ReviewsModule />;
    case "onboarding":
      return <OnboardingModule onNavigate={onNavigate} />;
    case "training":
      return <TrainingModule onNavigate={onNavigate} />;
    case "compensation":
      return <CompensationModule onNavigate={onNavigate} />;
    case "feedback":
      return <FeedbackModule />;
    case "timetracking":
      return <TimeTrackingModule />;
    case "mobility":
      return <MobilityModule />;
    case "documents":
      return <DocumentsModule />;
    case "assets":
      return <AssetsModule />;
    case "orgchart":
      return <OrgChartModule onNavigate={onNavigate} />;
    case "analytics":
      return <AnalyticsModule onNavigate={onNavigate} />;
    case "announcements":
      return <AnnouncementsModule />;
    case "admin":
      return <AdminModule />;
    default:
      return <DashboardModule onNavigate={onNavigate} />;
  }
}
