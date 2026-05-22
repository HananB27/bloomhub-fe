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
      // Inline style guarantees override regardless of variant CSS / Tailwind
      // merge ordering. `currentColor` propagates to the lucide icon stroke.
      style={
        variant !== "primary"
          ? { color: "#111827" } // gray-900
          : undefined
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
