interface CompensationPlaceholderTabProps {
  title: string;
  description: string;
}

export function CompensationPlaceholderTab({
  title,
  description,
}: CompensationPlaceholderTabProps) {
  return (
    <div className="comp-rise rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
      <h2 className="text-base font-semibold tracking-tight text-[#171717]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-xs text-[#6b7280]">
        {description}
      </p>
    </div>
  );
}
