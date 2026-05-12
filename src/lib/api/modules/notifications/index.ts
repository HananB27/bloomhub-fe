import { API_BASE_URL } from "@/lib/config";
import {
  get,
  post,
  buildQueryString,
  handleListResponse,
} from "../../helpers/httpClient";
import {
  NOTIFICATIONS_API_BASE_PATH,
  NOTIFICATIONS_MARK_ALL_READ_PATH,
  NOTIFICATIONS_UNREAD_COUNT_PATH,
  notificationMarkReadPath,
} from "../../constants/notificationsEndpoints";

// ─── Backend shape ────────────────────────────────────────────────────────────

interface ApiNotification {
  id: number;
  module: string;
  type: string;
  title: string;
  message: string;
  link: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ─── Frontend shape ───────────────────────────────────────────────────────────

export type NotificationType = "info" | "success" | "warning" | "alert";

export interface AppNotification {
  id: number;
  module: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function isNotificationType(value: string): value is NotificationType {
  return (
    value === "info" ||
    value === "success" ||
    value === "warning" ||
    value === "alert"
  );
}

function mapNotification(raw: ApiNotification): AppNotification {
  return {
    id: raw.id,
    module: raw.module,
    type: isNotificationType(raw.type) ? raw.type : "info",
    title: raw.title,
    message: raw.message,
    link: raw.link,
    metadata: raw.metadata ?? {},
    isRead: Boolean(raw.is_read),
    readAt: raw.read_at,
    createdAt: raw.created_at,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  async list(params?: {
    unread?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<AppNotification[]> {
    const url = `${API_BASE_URL}${NOTIFICATIONS_API_BASE_PATH}${buildQueryString(params)}`;
    const data = await get<unknown>(url, "Failed to fetch notifications");
    const { results } = handleListResponse<ApiNotification>(
      data as
        | ApiNotification[]
        | { results?: ApiNotification[]; count?: number }
    );
    return results.map(mapNotification);
  },

  async unreadCount(): Promise<number> {
    const data = await get<{ count: number }>(
      `${API_BASE_URL}${NOTIFICATIONS_UNREAD_COUNT_PATH}`,
      "Failed to fetch unread count"
    );
    return Number(data.count ?? 0);
  },

  async markRead(id: number): Promise<AppNotification> {
    const data = await post<ApiNotification>(
      `${API_BASE_URL}${notificationMarkReadPath(id)}`,
      {},
      "Failed to mark notification as read"
    );
    return mapNotification(data);
  },

  async markAllRead(): Promise<number> {
    const data = await post<{ updated: number }>(
      `${API_BASE_URL}${NOTIFICATIONS_MARK_ALL_READ_PATH}`,
      {},
      "Failed to mark all notifications as read"
    );
    return Number(data.updated ?? 0);
  },
};
