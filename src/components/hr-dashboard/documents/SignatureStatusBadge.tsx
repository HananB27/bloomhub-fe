"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PenLine,
  XCircle,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { SignatureStatus } from "@/lib/documents/documentsHelpers";

interface SignatureStatusBadgeProps {
  status: SignatureStatus;
  signedCount?: number;
  totalCount?: number;
  compact?: boolean;
  className?: string;
}

const STATUS_META: Record<
  SignatureStatus,
  {
    label: string;
    aria: string;
    variant: "success" | "warning" | "error" | "primary";
    icon: typeof CheckCircle2;
  }
> = {
  [SignatureStatus.Signed]: {
    label: "Signed",
    aria: "Signature status: Signed",
    variant: "success",
    icon: CheckCircle2,
  },
  [SignatureStatus.Pending]: {
    label: "Pending",
    aria: "Signature status: Pending",
    variant: "warning",
    icon: Clock3,
  },
  [SignatureStatus.Rejected]: {
    label: "Rejected",
    aria: "Signature status: Rejected",
    variant: "error",
    icon: XCircle,
  },
  [SignatureStatus.Expired]: {
    label: "Expired",
    aria: "Signature status: Expired",
    variant: "error",
    icon: AlertTriangle,
  },
  [SignatureStatus.NotRequired]: {
    label: "Unsigned",
    aria: "Signature status: Unsigned, no signature required",
    variant: "primary",
    icon: PenLine,
  },
};

export function SignatureStatusBadge({
  status,
  signedCount = 0,
  totalCount = 0,
  compact = false,
  className,
}: SignatureStatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META[SignatureStatus.NotRequired];
  const Icon = meta.icon;
  const progress =
    status === SignatureStatus.Pending && totalCount > 0
      ? `${signedCount}/${totalCount} signed`
      : null;
  const label =
    compact && progress ? `${signedCount}/${totalCount}` : meta.label;
  const ariaLabel = progress ? `${meta.aria}, ${progress}` : meta.aria;

  return (
    <Badge
      variant={meta.variant}
      aria-label={ariaLabel}
      className={cn(
        "min-h-6 gap-1.5 rounded-md px-2 text-[12px]",
        compact && "px-1.5",
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{label}</span>
      {!compact && progress && (
        <span className="font-mono text-[11px] opacity-80">{progress}</span>
      )}
    </Badge>
  );
}
