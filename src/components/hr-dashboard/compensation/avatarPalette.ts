import type { AvatarColor } from "@/lib/api/compensation";

export const AVATAR_PALETTE: Record<AvatarColor, { bg: string; fg: string }> = {
  green: { bg: "#dcfce7", fg: "#15803d" },
  indigo: { bg: "#e0e7ff", fg: "#4338ca" },
  rose: { bg: "#ffe4e6", fg: "#be123c" },
  gray: { bg: "#e5e7eb", fg: "#374151" },
  orange: { bg: "#ffedd5", fg: "#c2410c" },
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}
