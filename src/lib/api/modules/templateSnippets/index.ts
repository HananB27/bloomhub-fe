import { API_BASE_URL } from "@/lib/config";
import { del, get, patch, post } from "../../helpers/httpClient";
import {
  USER_TEMPLATE_SNIPPETS_API_PATH,
  userTemplateSnippetPath,
} from "../../constants/templateSnippetsEndpoints";

export interface UserTemplateSnippetDto {
  id: number | string;
  label: string;
  html: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const templateSnippetsApi = {
  async list(): Promise<UserTemplateSnippetDto[]> {
    const data = await get<
      UserTemplateSnippetDto[] | { results?: UserTemplateSnippetDto[] }
    >(
      `${API_BASE_URL}${USER_TEMPLATE_SNIPPETS_API_PATH}`,
      "Failed to load snippets"
    );
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  async create(body: {
    label: string;
    html: string;
    sort_order?: number;
  }): Promise<UserTemplateSnippetDto> {
    return post<UserTemplateSnippetDto>(
      `${API_BASE_URL}${USER_TEMPLATE_SNIPPETS_API_PATH}`,
      body,
      "Failed to create snippet"
    );
  },

  async update(
    id: number | string,
    body: Partial<{ label: string; html: string; sort_order: number }>
  ): Promise<UserTemplateSnippetDto> {
    return patch<UserTemplateSnippetDto>(
      `${API_BASE_URL}${userTemplateSnippetPath(id)}`,
      body,
      "Failed to update snippet"
    );
  },

  async remove(id: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}${userTemplateSnippetPath(id)}`,
      "Failed to delete snippet"
    );
  },
};
