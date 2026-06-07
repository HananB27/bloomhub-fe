export type CPFChangeSource = "manual" | "performance_review" | "promotion";

export const CPF_CHANGE_SOURCE_LABELS: Record<CPFChangeSource, string> = {
  manual: "Manual",
  performance_review: "Performance Review",
  promotion: "Promotion",
};

export const CPF_CHANGE_SOURCE_BADGE_COLORS: Record<CPFChangeSource, string> = {
  manual: "bg-gray-100 text-gray-700",
  performance_review: "bg-blue-50 text-blue-700",
  promotion: "bg-emerald-50 text-emerald-700",
};

export type CPFProgressionEventType = "level_change" | "review_assessment";

export const CPF_PROGRESSION_EVENT_TYPE_LABELS: Record<
  CPFProgressionEventType,
  string
> = {
  level_change: "Level Change",
  review_assessment: "Review Assessment",
};

export const CPF_PROGRESSION_EVENT_TYPE_BADGE_COLORS: Record<
  CPFProgressionEventType,
  string
> = {
  level_change: "bg-emerald-50 text-emerald-700",
  review_assessment: "bg-blue-50 text-blue-700",
};

export interface CPFLevelChange {
  id: number;
  employeeId: number;
  employeeName: string;
  previousLevel: string;
  newLevel: string;
  effectiveDate: string;
  source: CPFChangeSource;
  sourceDisplay: string;
  cpfScore: number | null;
  performanceReviewId: number | null;
  promotionId: number | null;
  notes: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CPFProgressionEvent {
  date: string;
  eventType: CPFProgressionEventType;
  previousLevel: string;
  newLevel: string;
  source: string;
  cpfScore: number | null;
  notes: string;
  referenceId: number | null;
  referenceLabel: string;
}

export interface CPFProgression {
  employeeId: number;
  employeeName: string;
  currentLevel: string;
  timeline: CPFProgressionEvent[];
}

export interface CPFLevelChangeFilters {
  employee?: number;
  source?: CPFChangeSource;
  search?: string;
  ordering?: string;
}

export interface CreateCPFLevelChangePayload {
  employeeId: number;
  previousLevel?: string;
  newLevel: string;
  effectiveDate: string;
  source?: CPFChangeSource;
  cpfScore?: number | null;
  performanceReviewId?: number | null;
  promotionId?: number | null;
  notes?: string;
}

export type UpdateCPFLevelChangePayload = Partial<CreateCPFLevelChangePayload>;
