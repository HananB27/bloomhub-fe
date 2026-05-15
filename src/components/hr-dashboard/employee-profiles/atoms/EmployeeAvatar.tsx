import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { employeeDisplayInitials } from "../profilesModuleHelpers";
import { cn } from "../../ui/utils";

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  src?: string | null;
  size?: number;
  className?: string;
}

const AVATAR_PALETTE = [
  { bg: "#e5e7eb", fg: "#374151" },
  { bg: "#dcfce7", fg: "#15803d" },
  { bg: "#e0e7ff", fg: "#4338ca" },
  { bg: "#ffe4e6", fg: "#be123c" },
  { bg: "#ffedd5", fg: "#c2410c" },
];

/** Deterministic palette pick based on name hash so cards aren't all grey. */
function pickPalette(name: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

/** Employee avatar — image w/ initials fallback, deterministic colour. */
export function EmployeeAvatar({
  firstName,
  lastName,
  src,
  size = 36,
  className,
}: EmployeeAvatarProps) {
  const initials = employeeDisplayInitials(firstName, lastName);
  const palette = pickPalette(`${firstName} ${lastName}`);
  return (
    <Avatar
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {src ? <AvatarImage src={src} alt={`${firstName} ${lastName}`} /> : null}
      <AvatarFallback
        className="font-semibold"
        style={{
          background: palette.bg,
          color: palette.fg,
          fontSize: Math.max(11, Math.round(size * 0.34)),
        }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
