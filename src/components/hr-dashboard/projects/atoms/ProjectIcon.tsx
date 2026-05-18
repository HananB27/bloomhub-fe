import { Folder } from "lucide-react";
import { cn } from "../../ui/utils";

interface ProjectIconProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: "h-7 w-7 rounded", icon: 13 },
  md: { box: "h-9 w-9 rounded-lg", icon: 16 },
  lg: { box: "h-[52px] w-[52px] rounded-xl", icon: 22 },
};

export function ProjectIcon({ size = "md", className }: ProjectIconProps) {
  const s = SIZES[size];
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center border border-gray-200 text-gray-600",
        s.box,
        className
      )}
      style={{ background: "linear-gradient(180deg,#f9fafb 0%,#f3f4f6 100%)" }}
      aria-hidden
    >
      <Folder size={s.icon} />
    </div>
  );
}
