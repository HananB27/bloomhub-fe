import { API_BASE_URL } from "@/lib/config";
import { get, post, del } from "../../helpers/httpClient";
import { fetchWithAuthRetry } from "../../refresh";
import {
  TEMPLATES_CATEGORIES_PATH,
  templatesListPath,
  templatePath,
  templateDuplicatePath,
  templateUsePath,
} from "../../constants/templatesEndpoints";
import {
  TemplateCategory,
  TemplateFieldType,
  TemplateStatus,
  TemplateVisibility,
  type DocumentTemplate,
  type TemplateField,
  type TemplatePayload,
  type TemplateCategoryOption,
  type UseTemplatePayload,
  type TemplateOutputFormat,
} from "@/lib/templates/templatesHelpers";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface GeneratedDocument {
  id: number | string;
  name: string;
  sourceTemplate: number | string | null;
  sourceTemplateName: string;
  resolvedContent: string;
  fieldValues: Record<string, string | boolean | number>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Re-export all helper types for convenience
export type {
  DocumentTemplate,
  TemplateField,
  TemplatePayload,
  TemplateCategoryOption,
  UseTemplatePayload,
  TemplateOutputFormat,
};
export {
  TemplateCategory,
  TemplateFieldType,
  TemplateStatus,
  TemplateVisibility,
};

// ─── Raw API shapes ───────────────────────────────────────────────────────────
// The backend now returns camelCase aliases that match the frontend types
// directly, so the mapping layer is a thin pass-through.

interface ApiTemplateField {
  id?: string | number;
  key?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: string;
  order?: number;
}

interface ApiDocumentTemplate {
  id?: number | string;
  name?: string;
  description?: string;
  category?: string;
  visibility?: string;
  status?: string;
  content?: string;
  fields?: ApiTemplateField[];
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
  is_system_template?: boolean;
}

interface ApiGeneratedDocument {
  id?: number | string;
  name?: string;
  source_template?: number | string | null;
  source_template_name?: string;
  resolved_content?: string;
  field_values?: Record<string, string | boolean | number>;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapTemplateField(raw: ApiTemplateField): TemplateField {
  return {
    id: String(raw.id ?? ""),
    key: String(raw.key ?? ""),
    label: String(raw.label ?? ""),
    type: (raw.type as TemplateFieldType) ?? TemplateFieldType.Text,
    placeholder: String(raw.placeholder ?? ""),
    required: Boolean(raw.required),
    defaultValue: String(raw.defaultValue ?? ""),
    options: String(raw.options ?? ""),
  };
}

function mapGeneratedDocument(raw: ApiGeneratedDocument): GeneratedDocument {
  return {
    id: raw.id ?? "",
    name: String(raw.name ?? ""),
    sourceTemplate: raw.source_template ?? null,
    sourceTemplateName: String(raw.source_template_name ?? ""),
    resolvedContent: String(raw.resolved_content ?? ""),
    fieldValues:
      (raw.field_values as Record<string, string | boolean | number>) ?? {},
    createdBy: String(raw.created_by_name ?? ""),
    createdAt: String(raw.created_at ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
  };
}

function mapTemplate(raw: ApiDocumentTemplate): DocumentTemplate {
  return {
    id: raw.id ?? "",
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    category: (raw.category as TemplateCategory) ?? TemplateCategory.Other,
    visibility:
      (raw.visibility as TemplateVisibility) ?? TemplateVisibility.Private,
    status: (raw.status as TemplateStatus) ?? TemplateStatus.Draft,
    content: String(raw.content ?? ""),
    fields: Array.isArray(raw.fields) ? raw.fields.map(mapTemplateField) : [],
    createdBy: String(raw.created_by_name ?? ""),
    createdAt: String(raw.created_at ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
    isSystem: Boolean(raw.is_system_template),
  };
}

// ─── Error parser ─────────────────────────────────────────────────────────────

async function parseResponseError(
  response: Response,
  fallbackMessage: string
): Promise<Error> {
  const errorData = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (errorData && typeof errorData.detail === "string") {
    return new Error(errorData.detail);
  }
  if (errorData && typeof errorData.message === "string") {
    return new Error(errorData.message);
  }
  return new Error(fallbackMessage);
}

// ─── API client ───────────────────────────────────────────────────────────────

export const templatesApi = {
  /**
   * TODO [BACKEND REQUIRED]: GET /api/documents/templates/ — list templates with optional filters
   * Supports query params: category, search, status, visibility
   */
  async list(query?: {
    category?: TemplateCategory;
    search?: string;
    status?: TemplateStatus;
    visibility?: TemplateVisibility;
  }): Promise<DocumentTemplate[]> {
    const data = await get<
      ApiDocumentTemplate[] | { results?: ApiDocumentTemplate[] }
    >(
      `${API_BASE_URL}${templatesListPath(query)}`,
      "Failed to fetch templates"
    );
    const rows = Array.isArray(data) ? data : (data.results ?? []);
    return rows.map(mapTemplate);
  },

  /**
   * TODO [BACKEND REQUIRED]: GET /api/documents/templates/{id}/ — retrieve a single template by id
   */
  async get(id: number | string): Promise<DocumentTemplate> {
    const data = await get<ApiDocumentTemplate>(
      `${API_BASE_URL}${templatePath(id)}`,
      "Failed to fetch template"
    );
    return mapTemplate(data);
  },

  /**
   * TODO [BACKEND REQUIRED]: POST /api/documents/templates/ — create a new template
   * Body: TemplatePayload (name, description, category, visibility, status, content, fields)
   */
  async create(payload: TemplatePayload): Promise<DocumentTemplate> {
    const response = await fetchWithAuthRetry(
      `${API_BASE_URL}/api/documents/templates/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      throw await parseResponseError(response, "Failed to create template");
    }
    return mapTemplate((await response.json()) as ApiDocumentTemplate);
  },

  /**
   * TODO [BACKEND REQUIRED]: PUT /api/documents/templates/{id}/ — update an existing template
   * Body: TemplatePayload (name, description, category, visibility, status, content, fields)
   */
  async update(
    id: number | string,
    payload: TemplatePayload
  ): Promise<DocumentTemplate> {
    const response = await fetchWithAuthRetry(
      `${API_BASE_URL}${templatePath(id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      throw await parseResponseError(response, "Failed to update template");
    }
    return mapTemplate((await response.json()) as ApiDocumentTemplate);
  },

  /**
   * TODO [BACKEND REQUIRED]: DELETE /api/documents/templates/{id}/ — permanently delete a template
   */
  async delete(id: number | string): Promise<void> {
    return del(
      `${API_BASE_URL}${templatePath(id)}`,
      "Failed to delete template"
    );
  },

  /**
   * TODO [BACKEND REQUIRED]: POST /api/documents/templates/{id}/duplicate/ — clone template, return new DocumentTemplate
   */
  async duplicate(id: number | string): Promise<DocumentTemplate> {
    const data = await post<ApiDocumentTemplate>(
      `${API_BASE_URL}${templateDuplicatePath(id)}`,
      {},
      "Failed to duplicate template"
    );
    return mapTemplate(data);
  },

  /**
   * POST /api/documents/templates/{id}/use/ — instantiate template into a new document.
   * Body: { fieldValues: Record<string, string | boolean | number>, format: "pdf" | "docx" }
   * Returns: { documentId, resolvedContent }  where resolvedContent is the substituted HTML.
   */
  async use(
    id: number | string,
    payload: UseTemplatePayload
  ): Promise<{ documentId: number | string; resolvedContent: string }> {
    // Backend returns TemplateGeneratedDocument which includes resolved_content
    const data = await post<{
      id?: number | string;
      document_id?: number | string;
      documentId?: number | string;
      resolved_content?: string;
    }>(
      `${API_BASE_URL}${templateUsePath(id)}`,
      payload,
      "Failed to use template"
    );
    return {
      documentId: data.id ?? data.document_id ?? data.documentId ?? "",
      resolvedContent: data.resolved_content ?? "",
    };
  },

  async listGenerated(): Promise<GeneratedDocument[]> {
    const data = await get<
      ApiGeneratedDocument[] | { results?: ApiGeneratedDocument[] }
    >(
      `${API_BASE_URL}/api/documents/templates/generated/`,
      "Failed to fetch generated documents"
    );
    const rows = Array.isArray(data) ? data : (data.results ?? []);
    return rows.map(mapGeneratedDocument);
  },

  /**
   * TODO [BACKEND REQUIRED]: GET /api/documents/templates/categories/ — return category options list
   */
  async getCategories(): Promise<TemplateCategoryOption[]> {
    const data = await get<
      TemplateCategoryOption[] | { results?: TemplateCategoryOption[] }
    >(
      `${API_BASE_URL}${TEMPLATES_CATEGORIES_PATH}`,
      "Failed to fetch template categories"
    );
    return Array.isArray(data) ? data : (data.results ?? []);
  },
};
