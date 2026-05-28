export function CompensationSkeleton() {
  return (
    <div className="mx-auto max-w-[1480px] px-7 pb-12 pt-6">
      <div className="mb-[18px] flex items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="comp-skeleton h-7 w-52" />
          <div className="comp-skeleton h-3 w-72" />
        </div>
        <div className="flex gap-2">
          <div className="comp-skeleton h-9 w-24" />
          <div className="comp-skeleton h-9 w-28" />
          <div className="comp-skeleton h-9 w-36" />
        </div>
      </div>
      <div className="comp-skeleton mb-3.5 h-12 w-full rounded-xl" />
      <div className="mb-[18px] grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="comp-skeleton h-[110px] rounded-xl" />
        ))}
      </div>
      <div className="mb-[18px] grid grid-cols-[6fr_4fr] gap-3">
        <div className="comp-skeleton h-[260px] rounded-xl" />
        <div className="comp-skeleton h-[260px] rounded-xl" />
      </div>
      <div className="comp-skeleton h-[520px] rounded-xl" />
    </div>
  );
}
