import { RATING_LABELS } from "@/types/reviews";

const RATING_STYLES: Record<number, { background: string; color: string }> = {
  1: { background: "#fef2f2", color: "#b91c1c" },
  2: { background: "#fff7ed", color: "#c2410c" },
  3: { background: "#f3f4f6", color: "#374151" },
  4: { background: "#ecfdf5", color: "#047857" },
  5: { background: "#dcfce7", color: "#15803d" },
};

interface RatingChipProps {
  rating: number;
}

export function RatingChip({ rating }: RatingChipProps) {
  const style = RATING_STYLES[rating] ?? RATING_STYLES[3];
  const label = RATING_LABELS[rating] ?? `${rating}`;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold"
      style={{ background: style.background, color: style.color }}
      title={label}
    >
      {rating}/5 · {label}
    </span>
  );
}
