interface Props {
  value: number;
  max: number;
  height?: number;
  className?: string;
  fillClassName?: string;
}

export function ProgressBar({
  value,
  max,
  height = 6,
  className = "",
  fillClassName = "bg-indigo-500",
}: Props) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const pct = Math.max(2, Math.round(ratio * 100));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-gray-100 ${className}`}
      style={{ height }}
    >
      <div
        className={`h-full rounded-full ${fillClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
