/**
 * Peer-to-peer learning session record.
 */
export interface PeerSession {
  id: number;
  employeeId: number;
  employeeName: string;
  topic: string;
  sessionDate: string; // ISO date
  durationMinutes?: number | null;
  incentiveId?: number | null;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PeerSessionFilters {
  year?: number;
  employeeId?: number;
  search?: string;
  ordering?: string;
}

export interface CreatePeerSessionPayload {
  topic: string;
  sessionDate: string;
  durationMinutes?: number | null;
  incentiveId?: number | null;
  description?: string | null;
  employeeId?: number; // HR only
}

export type UpdatePeerSessionPayload = Partial<
  Omit<CreatePeerSessionPayload, "employeeId">
>;
