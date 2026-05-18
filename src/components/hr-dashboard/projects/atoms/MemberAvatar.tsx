import { cn } from "../../ui/utils";
import type { AvatarColor } from "../types";

interface MemberAvatarProps {
  name: string;
  size?: number;
  color?: AvatarColor;
  className?: string;
}

const PALETTE: Record<AvatarColor, { bg: string; fg: string }> = {
  gray: { bg: "#e5e7eb", fg: "#374151" },
  green: { bg: "#dcfce7", fg: "#15803d" },
  indigo: { bg: "#e0e7ff", fg: "#4338ca" },
  rose: { bg: "#ffe4e6", fg: "#be123c" },
  orange: { bg: "#ffedd5", fg: "#c2410c" },
};

export function MemberAvatar({
  name,
  size = 28,
  color = "gray",
  className,
}: MemberAvatarProps) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const p = PALETTE[color];
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        className
      )}
      style={{
        width: size,
        height: size,
        background: p.bg,
        color: p.fg,
        fontSize: size * 0.34,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
