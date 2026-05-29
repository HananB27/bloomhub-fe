import { API_BASE_URL } from "../config";
import {
  buildQueryString,
  del,
  get,
  handleListResponse,
  patch,
  post,
} from "./helpers/httpClient";

export type AnnouncementType = "general" | "news" | "celebration" | "urgent";

export interface AnnouncementListItem {
  id: number;
  title: string;
  type: AnnouncementType;
  author_id: number;
  author_name: string;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  reaction_counts?: Record<string, number>;
  my_reactions?: string[];
  comments_count?: number;
}

export interface AnnouncementDetail extends AnnouncementListItem {
  body: string;
}

export interface AnnouncementListParams {
  type?: AnnouncementType;
  search?: string;
  ordering?:
    | "published_at"
    | "-published_at"
    | "scheduled_at"
    | "-scheduled_at"
    | "created_at"
    | "-created_at"
    | "updated_at"
    | "-updated_at";
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  type?: AnnouncementType;
  scheduled_at?: string | null;
  send_email_notifications?: boolean;
}

export interface AnnouncementComment {
  id: number;
  announcement?: number;
  author_id?: number;
  author_name?: string;
  user_id?: number;
  user_name?: string;
  body: string;
  created_at: string;
  updated_at?: string;
}

export interface AnnouncementReaction {
  id?: number;
  announcement?: number;
  user_id?: number;
  user_name?: string;
  reaction_type: string;
  created_at?: string;
  active?: boolean;
}

export interface AnnouncementDiscordChannel {
  id: number;
  announcement_type: AnnouncementType;
  channel_name: string;
  has_webhook_url: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementDiscordChannelListParams {
  announcement_type?: AnnouncementType;
  enabled?: boolean;
}

export interface AnnouncementDiscordChannelPayload {
  announcement_type: AnnouncementType;
  channel_name: string;
  webhook_url?: string;
  enabled: boolean;
}

const base = `${API_BASE_URL}/api/announcements`;
const discordChannelsBase = `${API_BASE_URL}/api/announcement-discord-channels`;

export const announcementApi = {
  async list(
    params?: AnnouncementListParams,
    opts?: { signal?: AbortSignal }
  ): Promise<{ results: AnnouncementListItem[]; count: number }> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    const data = await get<unknown>(
      `${base}/${qs}`,
      "Failed to load announcements",
      {
        signal: opts?.signal,
      }
    );
    return handleListResponse<AnnouncementListItem>(
      data as
        | { results?: AnnouncementListItem[]; count?: number }
        | AnnouncementListItem[]
    );
  },

  async get(
    id: number,
    opts?: { signal?: AbortSignal }
  ): Promise<AnnouncementDetail> {
    return get<AnnouncementDetail>(
      `${base}/${id}/`,
      "Failed to load announcement",
      { signal: opts?.signal }
    );
  },

  async create(payload: AnnouncementPayload): Promise<AnnouncementDetail> {
    return post<AnnouncementDetail>(
      `${base}/`,
      payload,
      "Failed to create announcement"
    );
  },

  async update(
    id: number,
    payload: Partial<AnnouncementPayload>
  ): Promise<AnnouncementDetail> {
    return patch<AnnouncementDetail>(
      `${base}/${id}/`,
      payload,
      "Failed to update announcement"
    );
  },

  async delete(id: number): Promise<void> {
    return del(`${base}/${id}/`, "Failed to delete announcement");
  },

  async listComments(id: number): Promise<AnnouncementComment[]> {
    const data = await get<unknown>(
      `${base}/${id}/comments/`,
      "Failed to load comments"
    );
    return handleListResponse<AnnouncementComment>(
      data as
        | { results?: AnnouncementComment[]; count?: number }
        | AnnouncementComment[]
    ).results;
  },

  async createComment(id: number, body: string): Promise<AnnouncementComment> {
    return post<AnnouncementComment>(
      `${base}/${id}/comments/`,
      { body },
      "Failed to add comment"
    );
  },

  async deleteComment(id: number, commentId: number): Promise<void> {
    return del(
      `${base}/${id}/comments/${commentId}/`,
      "Failed to delete comment"
    );
  },

  async listReactions(id: number): Promise<AnnouncementReaction[]> {
    const data = await get<unknown>(
      `${base}/${id}/reactions/`,
      "Failed to load reactions"
    );
    return handleListResponse<AnnouncementReaction>(
      data as
        | { results?: AnnouncementReaction[]; count?: number }
        | AnnouncementReaction[]
    ).results;
  },

  async toggleReaction(
    id: number,
    reactionType: string
  ): Promise<AnnouncementReaction> {
    return post<AnnouncementReaction>(
      `${base}/${id}/reactions/`,
      { reaction_type: reactionType },
      "Failed to update reaction"
    );
  },
};

export const announcementDiscordChannelApi = {
  async list(
    params?: AnnouncementDiscordChannelListParams,
    opts?: { signal?: AbortSignal }
  ): Promise<{ results: AnnouncementDiscordChannel[]; count: number }> {
    const qs = buildQueryString(
      params as
        | Record<string, string | number | boolean | null | undefined>
        | undefined
    );
    const data = await get<unknown>(
      `${discordChannelsBase}/${qs}`,
      "Failed to load Discord announcement channels",
      { signal: opts?.signal }
    );
    return handleListResponse<AnnouncementDiscordChannel>(
      data as
        | {
            results?: AnnouncementDiscordChannel[];
            count?: number;
          }
        | AnnouncementDiscordChannel[]
    );
  },

  async create(
    payload: AnnouncementDiscordChannelPayload
  ): Promise<AnnouncementDiscordChannel> {
    return post<AnnouncementDiscordChannel>(
      `${discordChannelsBase}/`,
      payload,
      "Failed to create Discord announcement channel"
    );
  },

  async update(
    id: number,
    payload: Partial<AnnouncementDiscordChannelPayload>
  ): Promise<AnnouncementDiscordChannel> {
    return patch<AnnouncementDiscordChannel>(
      `${discordChannelsBase}/${id}/`,
      payload,
      "Failed to update Discord announcement channel"
    );
  },

  async delete(id: number): Promise<void> {
    return del(
      `${discordChannelsBase}/${id}/`,
      "Failed to delete Discord announcement channel"
    );
  },
};
