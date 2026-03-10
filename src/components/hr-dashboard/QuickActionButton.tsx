"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

export interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
}

export function QuickActionButton({
  label,
  icon: Icon,
  onClick,
  variant = "outline",
  disabled = false,
}: QuickActionButtonProps) {
  return (
    <Button
      type="button"
      variant={variant === "primary" ? "primary" : "outline"}
      disabled={disabled}
      onClick={onClick}
      className="w-full justify-start gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
