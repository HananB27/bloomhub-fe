export const USER_TEMPLATE_SNIPPETS_API_PATH =
  "/api/documents/template-snippets/";

export function userTemplateSnippetPath(id: number | string): string {
  return `${USER_TEMPLATE_SNIPPETS_API_PATH}${id}/`;
}
