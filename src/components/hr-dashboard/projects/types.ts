export type ProjectStatus = "Active" | "On hold" | "Completed" | "Archived";

export type ProjectStageId =
  | "intake"
  | "scoping"
  | "triage"
  | "estimation"
  | "review_approval"
  | "proposal_sent"
  | "kickoff"
  | "delivery";

export type MemberRole = "Lead" | "Contributor";

export type AvatarColor = "gray" | "green" | "indigo" | "rose" | "orange";

export interface ProjectMember {
  id: number;
  name: string;
  role: MemberRole;
  color: AvatarColor;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  status: ProjectStatus;
  stage: ProjectStageId;
  stage_note: string;
  progress: number;
  start_date: string;
  end_date: string;
  last_activity: string;
  technologies: string[];
  members: ProjectMember[];
  hours_logged: number;
  document_count: number;
  description: string;
}

export interface ProjectStage {
  id: ProjectStageId;
  label: string;
  shortLabel: string;
  color: string;
  soft: string;
  desc: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  category: string;
  uploaded_by: string;
  uploaded_at: string;
  size: string;
}

export interface ProjectActivityEvent {
  id: string;
  at: string;
  actor: string;
  message: string;
}

export type ProjectsListView = "grid" | "list";

export interface ProjectsListFilters {
  status: ProjectStatus | "All";
  client: string;
  sort: "Newest" | "Oldest" | "Name (A-Z)" | "Progress";
}

export type ProjectActionKind =
  | "open"
  | "edit"
  | "status"
  | "duplicate"
  | "share"
  | "archive"
  | "delete";
