import type {
  Project,
  ProjectActivityEvent,
  ProjectDocument,
  ProjectStage,
  ProjectStageId,
  ProjectStatus,
} from "./types";

export const STAGES: ProjectStage[] = [
  {
    id: "intake",
    label: "Proposal request",
    shortLabel: "Intake",
    color: "#7c3aed",
    soft: "#f5f3ff",
    desc: "Client reaches out with a request for a proposal",
  },
  {
    id: "scoping",
    label: "Scoping",
    shortLabel: "Scoping",
    color: "#0ea5e9",
    soft: "#f0f9ff",
    desc: "Gather information needed to estimate; from a lightweight exchange up to a full discovery phase",
  },
  {
    id: "triage",
    label: "Triage",
    shortLabel: "Triage",
    color: "#0891b2",
    soft: "#ecfeff",
    desc: "Account manager submits the functional specification; CTO reviews and assembles an estimation team",
  },
  {
    id: "estimation",
    label: "Estimation",
    shortLabel: "Estimate",
    color: "#2563eb",
    soft: "#eff6ff",
    desc: "Estimation team breaks the project into modules and estimates effort by type",
  },
  {
    id: "review_approval",
    label: "Review & approval",
    shortLabel: "Review",
    color: "#d97706",
    soft: "#fffbeb",
    desc: "CTO reviews estimates; COO confirms resource feasibility",
  },
  {
    id: "proposal_sent",
    label: "Proposal sent",
    shortLabel: "Proposal",
    color: "#ea580c",
    soft: "#fff7ed",
    desc: "Written estimate and task breakdown sent to client; awaiting decision",
  },
  {
    id: "kickoff",
    label: "Team assembly & kick-off",
    shortLabel: "Kick-off",
    color: "#16a34a",
    soft: "#f0fdf4",
    desc: "Assemble delivery team and hold kick-off meeting with the client",
  },
  {
    id: "delivery",
    label: "Delivery",
    shortLabel: "Delivery",
    color: "#525252",
    soft: "#f3f4f6",
    desc: "Execution; supports both fixed-scope/deadline projects and long-term engagements",
  },
];

export const STAGE_BY_ID: Record<ProjectStageId, ProjectStage> =
  Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<
    ProjectStageId,
    ProjectStage
  >;

interface StatusVisual {
  bg: string;
  fg: string;
  dot: string;
}

export const STATUS_META: Record<ProjectStatus, StatusVisual> = {
  Active: { bg: "#f0fdf4", fg: "#15803d", dot: "#22c55e" },
  "On hold": { bg: "#fffbeb", fg: "#b45309", dot: "#f59e0b" },
  Completed: { bg: "#eff6ff", fg: "#1d4ed8", dot: "#3b82f6" },
  Archived: { bg: "#f3f4f6", fg: "#525252", dot: "#9ca3af" },
};

export const SEED_PROJECTS: Project[] = [];

export const PROJECT_ACTIVITY: Record<string, ProjectActivityEvent[]> = {};

export const PROJECT_DOCUMENTS: Record<string, ProjectDocument[]> = {};

export const PROJECT_STATUSES: ProjectStatus[] = [
  "Active",
  "On hold",
  "Completed",
  "Archived",
];
