export interface PromotionRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  previousRoleId: number | null;
  previousRoleName: string;
  newRoleId: number | null;
  newRoleName: string;
  date: string;
  notes: string;
  previousCpfLevel: string;
  newCpfLevel: string;
  relatedListingId: number | null;
  relatedListingTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionFilters {
  employee?: number;
  search?: string;
  ordering?: string;
}

export interface CreatePromotionPayload {
  employeeId: number;
  previousRoleId?: number | null;
  newRoleId?: number | null;
  date: string;
  notes?: string;
  previousCpfLevel?: string;
  newCpfLevel?: string;
  relatedListingId?: number | null;
}

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;
