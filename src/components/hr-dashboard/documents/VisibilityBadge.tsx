"use client";

import { Shield } from "lucide-react";
import { DocumentAccessRole } from "@/lib/documents/documentsHelpers";
import { DocumentVisibilityScope } from "@/lib/documents/documentVisibilityPresets";
import {
  documentVisibilityLabel,
  documentVisibilityTooltip,
} from "@/lib/documents/documentVisibilityHelpers";

interface VisibilityBadgeProps {
  scope: DocumentVisibilityScope;
  allowedRoles: DocumentAccessRole[];
}

const VISIBILITY_BADGE_CLASSES =
  "inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-px rounded border border-gray-200 text-gray-600 bg-white";

export function VisibilityBadge({ scope, allowedRoles }: VisibilityBadgeProps) {
  const label = documentVisibilityLabel(scope, allowedRoles);
  const tooltip = documentVisibilityTooltip(scope, allowedRoles);
  return (
    <span title={tooltip} className={VISIBILITY_BADGE_CLASSES}>
      <Shield className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
