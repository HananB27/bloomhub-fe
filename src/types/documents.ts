import type { DocumentAccessRole } from "@/lib/documents/documentsHelpers";
import type { DocumentVisibilityPreset } from "@/lib/documents/documentVisibilityPresets";

export type { DocumentVisibilityPreset } from "@/lib/documents/documentVisibilityPresets";

export interface DocumentVisibilitySettings {
  preset: DocumentVisibilityPreset;
  allowedRoles: DocumentAccessRole[];
}
