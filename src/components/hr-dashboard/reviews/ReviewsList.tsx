import { ChevronRight } from "lucide-react";
import type { PerformanceReviewListItem } from "@/types/reviews";
import { REVIEW_TYPE_LABELS } from "@/types/reviews";
import { formatDate } from "@/utils";
import { PersonAvatar } from "./PersonAvatar";
import { StatusPill } from "./StatusPill";
import { RatingChip } from "./RatingChip";
import { daysUntil, dueLabel } from "./reviewsModuleHelpers";

interface ReviewsListProps {
  reviews: PerformanceReviewListItem[];
  emptyText: string;
  onOpen: (review: PerformanceReviewListItem) => void;
}

interface ReviewRowProps {
  review: PerformanceReviewListItem;
  onOpen: (review: PerformanceReviewListItem) => void;
}

const GRID_COLS =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_minmax(0,1fr)_minmax(0,1fr)_140px_32px] items-center gap-4 px-4 py-3";

function DueChip({ iso }: { iso: string }) {
  const n = daysUntil(iso);
  const color =
    n < 0 ? "text-red-600" : n <= 1 ? "text-amber-600" : "text-gray-500";
  return (
    <span className={`text-[11px] font-medium ${color}`}>{dueLabel(iso)}</span>
  );
}

function ReviewRow({ review, onOpen }: ReviewRowProps) {
  const isCompleted = review.status === "completed";
  const hasRating = review.overallRating != null && review.overallRating > 0;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(review)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(review);
        }
      }}
      className={`${GRID_COLS} border-b border-gray-200 last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50 text-gray-900`}
    >
      <div className="flex gap-3 items-center min-w-0">
        <PersonAvatar name={review.employeeName} size={36} />
        <div className="min-w-0">
          <div className="text-[13.5px] font-medium truncate">
            {review.employeeName}
          </div>
          {review.cpfCurrentLevel && (
            <div className="text-[11.5px] text-gray-500 mt-0.5 truncate">
              {review.cpfCurrentLevel}
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-[13px] font-medium truncate">
          {REVIEW_TYPE_LABELS[review.reviewType]}
        </div>
        {review.title && (
          <div className="text-[11.5px] text-gray-500 mt-0.5 truncate">
            {review.title}
          </div>
        )}
      </div>

      <div>
        <div className="text-[12.5px] font-medium">
          {formatDate(review.scheduledDate)}
        </div>
        {!isCompleted && review.status !== "cancelled" && (
          <div className="mt-0.5">
            <DueChip iso={review.scheduledDate} />
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center min-w-0 text-[12.5px]">
        <PersonAvatar name={review.reviewerName} size={22} />
        <span className="truncate">{review.reviewerName.split(" ")[0]}</span>
      </div>

      <div>
        {hasRating ? (
          <RatingChip rating={review.overallRating as number} />
        ) : isCompleted ? (
          <span className="text-[12px] text-gray-400">No rating</span>
        ) : (
          <span className="text-[12px] text-gray-400">—</span>
        )}
      </div>

      <div>
        <StatusPill status={review.status} />
      </div>

      <div className="text-gray-400">
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export function ReviewsList({ reviews, emptyText, onOpen }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg px-6 py-9 text-center text-gray-500 text-[13px]">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden text-gray-900">
      <div
        className={`${GRID_COLS} bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}
      >
        <div>Person</div>
        <div>Type</div>
        <div>When</div>
        <div>Reviewer</div>
        <div>Outcome</div>
        <div>Status</div>
        <div />
      </div>
      {reviews.map((review) => (
        <ReviewRow key={review.id} review={review} onOpen={onOpen} />
      ))}
    </div>
  );
}
