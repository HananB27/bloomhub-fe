interface Props {
  name: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function pickPalette(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (
    parts
      .map((p) => p[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
}

export function InitialsAvatar({ name, size = 32, className = "" }: Props) {
  const initials = initialsOf(name);
  const palette = pickPalette(name);
  return (
    <span
      className={`inline-grid place-items-center rounded-full font-semibold ${palette} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
