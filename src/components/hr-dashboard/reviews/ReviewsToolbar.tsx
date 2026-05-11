import { Search } from "lucide-react";
import {
  REVIEW_STATUS_FILTER_OPTIONS,
  type ReviewStatusFilter,
} from "./reviewsModuleHelpers";

interface ReviewsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ReviewStatusFilter;
  onStatusChange: (value: ReviewStatusFilter) => void;
}

export function ReviewsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: ReviewsToolbarProps) {
  return (
    <div className="flex gap-2.5 items-center bg-white border border-gray-200 rounded-lg p-2.5 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by employee or reviewer…"
          className="w-full h-[34px] pl-[34px] pr-3 border border-gray-200 rounded-md bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:bg-white"
        />
      </div>
      <div className="inline-flex border border-gray-200 rounded-md bg-gray-50 p-0.5 gap-0.5">
        {REVIEW_STATUS_FILTER_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`h-7 px-2.5 text-[12px] font-medium rounded transition-colors ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
