"use client";

import { StarIcon } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { saveRating, saveReview, type RatingFormState } from "./actions";

// Content-level rating (1-5 stars) and one-line review.
export function RatingForm({
  contentId,
  rating,
  review,
}: {
  contentId: string;
  rating: number | null;
  review: string | null;
}) {
  const [ratingState, ratingAction, ratingPending] = useActionState<
    RatingFormState,
    FormData
  >(saveRating.bind(null, contentId), {});
  const [reviewState, reviewAction, reviewPending] = useActionState<
    RatingFormState,
    FormData
  >(saveReview.bind(null, contentId), {});

  return (
    <div className="flex flex-col gap-6">
      <form action={ratingAction} className="flex flex-col gap-2">
        <span className="text-sm font-medium">별점</span>
        <div className="flex flex-wrap items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              type="submit"
              name="rating"
              value={String(value)}
              variant="ghost"
              size="icon"
              disabled={ratingPending}
              aria-label={`별 ${value}개`}
              aria-pressed={rating === value}
            >
              <StarIcon
                className={cn(
                  "size-6",
                  rating !== null && value <= rating
                    ? "fill-rating text-rating"
                    : "text-muted-foreground",
                )}
              />
            </Button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating === null ? "아직 별점이 없어요" : `${rating}점`}
          </span>
          {rating !== null && (
            <Button
              type="submit"
              name="rating"
              value="clear"
              variant="link"
              size="sm"
              disabled={ratingPending}
            >
              지우기
            </Button>
          )}
        </div>
        {ratingState.error && (
          <p className="text-sm text-destructive">{ratingState.error}</p>
        )}
      </form>

      <form action={reviewAction} className="flex flex-col gap-2">
        <Field>
          <FieldLabel htmlFor="review">한줄평</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <Input
              id="review"
              name="review"
              defaultValue={review ?? ""}
              key={review ?? ""}
              maxLength={100}
              placeholder="이 작품을 한 줄로 남겨 보세요"
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={reviewPending}>
              저장
            </Button>
            {review && (
              <Button
                type="submit"
                name="intent"
                value="clear"
                variant="outline"
                disabled={reviewPending}
              >
                삭제
              </Button>
            )}
          </div>
        </Field>
        {reviewState.error && (
          <p className="text-sm text-destructive">{reviewState.error}</p>
        )}
        {reviewState.savedAt && !reviewState.error && (
          <p className="text-sm text-muted-foreground">저장했어요.</p>
        )}
      </form>
    </div>
  );
}
