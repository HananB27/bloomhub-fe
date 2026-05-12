import { avatarColor, initials } from "./reviewsModuleHelpers";

interface PersonAvatarProps {
  name: string;
  size?: number;
}

export function PersonAvatar({ name, size = 36 }: PersonAvatarProps) {
  return (
    <div
      className="rounded-full text-white grid place-items-center font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: avatarColor(name),
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initials(name)}
    </div>
  );
}
