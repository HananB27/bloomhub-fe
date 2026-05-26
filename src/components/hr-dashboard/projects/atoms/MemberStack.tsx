import { MemberAvatar } from "./MemberAvatar";
import type { ProjectMember } from "../types";

interface MemberStackProps {
  members: ProjectMember[];
  max?: number;
}

export function MemberStack({ members, max = 3 }: MemberStackProps) {
  return (
    <div className="inline-flex">
      {members.slice(0, max).map((m, i) => (
        <div
          key={m.id}
          className="rounded-full border-2 border-white"
          style={{ marginLeft: i === 0 ? 0 : -8 }}
        >
          <MemberAvatar name={m.name} size={24} color={m.color} />
        </div>
      ))}
      {members.length > max ? (
        <div
          className="grid place-items-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-semibold text-gray-600"
          style={{ marginLeft: -8, width: 24, height: 24 }}
        >
          +{members.length - max}
        </div>
      ) : null}
    </div>
  );
}
