"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/hr-dashboard/ui/utils";
import {
  fallbackTechColor,
  getTechBrand,
  techLogoUrl,
} from "@/lib/tech/techCatalog";

interface TechBadgeProps {
  name: string;
  size?: "sm" | "md";
  onRemove?: () => void;
  className?: string;
}

export function TechBadge({
  name,
  size = "md",
  onRemove,
  className,
}: TechBadgeProps) {
  const brand = getTechBrand(name);
  const [logoFailed, setLogoFailed] = useState(false);

  const showLogo = brand && !logoFailed;
  const fallback = brand
    ? { bg: `#${brand.hex}1A`, fg: `#${brand.hex}`, border: `#${brand.hex}33` }
    : fallbackTechColor(name);

  const pad =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]";
  const iconSize = size === "sm" ? 10 : 12;
  const display = brand?.name ?? name;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        pad,
        className
      )}
      style={{
        backgroundColor: fallback.bg,
        color: fallback.fg,
        borderColor: fallback.border,
      }}
    >
      {showLogo ? (
        <img
          src={techLogoUrl(brand!)}
          alt=""
          width={iconSize}
          height={iconSize}
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className="grid shrink-0 place-items-center rounded-full font-bold uppercase"
          style={{
            width: iconSize + 4,
            height: iconSize + 4,
            backgroundColor: fallback.fg,
            color: "white",
            fontSize: Math.max(8, iconSize - 4),
          }}
        >
          {name.trim().charAt(0) || "?"}
        </span>
      )}
      <span className="leading-none">{display}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${display}`}
          className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-70 hover:opacity-100"
          style={{ color: fallback.fg }}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      ) : null}
    </span>
  );
}
