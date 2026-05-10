import {
  TemplateCategory,
  TemplateStatus,
  TemplateVisibility,
} from "@/lib/templates/templatesHelpers";

// TODO [BACKEND REQUIRED]: All paths below assume /api/documents/templates/ as the base

export const TEMPLATES_API_BASE_PATH = "/api/documents/templates/";

// TODO [BACKEND REQUIRED]: GET /api/documents/templates/categories/ — return list of template category options
export const TEMPLATES_CATEGORIES_PATH = `${TEMPLATES_API_BASE_PATH}categories/`;

export function templatesListPath(query?: {
  category?: TemplateCategory;
  search?: string;
  status?: TemplateStatus;
  visibility?: TemplateVisibility;
}): string {
  if (!query) return TEMPLATES_API_BASE_PATH;
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.visibility) params.set("visibility", query.visibility);
  const qs = params.toString();
  return qs ? `${TEMPLATES_API_BASE_PATH}?${qs}` : TEMPLATES_API_BASE_PATH;
}

export function templatePath(id: number | string): string {
  return `${TEMPLATES_API_BASE_PATH}${id}/`;
}

// TODO [BACKEND REQUIRED]: POST /api/documents/templates/{id}/duplicate/ — clone a template, return new DocumentTemplate
export function templateDuplicatePath(id: number | string): string {
  return `${TEMPLATES_API_BASE_PATH}${id}/duplicate/`;
}

// TODO [BACKEND REQUIRED]: POST /api/documents/templates/{id}/use/ — instantiate a template into a document
export function templateUsePath(id: number | string): string {
  return `${TEMPLATES_API_BASE_PATH}${id}/use/`;
}

// TODO [BACKEND REQUIRED]: PATCH /api/documents/templates/{id}/visibility/ — update allowed_roles + visibility_scope
export function templateVisibilityPath(id: number | string): string {
  return `${TEMPLATES_API_BASE_PATH}${id}/visibility/`;
}
