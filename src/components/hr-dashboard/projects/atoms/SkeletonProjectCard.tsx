import { Skeleton } from "../../ui/skeleton";

export function SkeletonProjectCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-[18px]">
      <div className="mb-3 flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-[18px] w-[60px] rounded-full" />
      </div>
      <Skeleton className="mt-[14px] h-2.5 w-[70%]" />
      <Skeleton className="mt-2 h-2.5 w-[50%]" />
      <Skeleton className="mt-[14px] h-1.5 w-full rounded-full" />
      <div className="mt-[14px] flex gap-1.5">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonProjectGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-3.5"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProjectCard key={i} />
      ))}
    </div>
  );
}
