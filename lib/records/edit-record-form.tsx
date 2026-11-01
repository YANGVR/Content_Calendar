"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateRecord, type RecordFormState } from "./actions";
import { DateField } from "./date-field";
import type { WatchedPrecision } from "./dates";

export function EditRecordForm({
  recordId,
  contentId,
  season,
  episodes,
  episode,
  watchedOn,
  watchedPrecision,
  today,
  episodeOffset = 0,
  part,
}: {
  recordId: string;
  contentId: string;
  season: number | null;
  // Real episode numbers of that season; null for movies.
  episodes: number[] | null;
  episode: number | null;
  watchedOn: string | null;
  watchedPrecision: WatchedPrecision;
  today: string;
  // Subtracted from TMDB episode numbers for display (a part's first episode - 1).
  episodeOffset?: number;
  // Display-only part (기수) being shown, sent back for validation.
  part?: number;
}) {
  const [state, formAction, pending] = useActionState<
    RecordFormState,
    FormData
  >(updateRecord.bind(null, recordId, contentId), {});
  const episodeItems = (episodes ?? []).map((n) => ({
    value: String(n),
    label: `${n - episodeOffset}화`,
  }));
  const defaultEpisode =
    episode !== null && episodes?.includes(episode) ? String(episode) : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {season !== null && <input type="hidden" name="season" value={season} />}
      {part !== undefined && <input type="hidden" name="part" value={part} />}
      <FieldGroup>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {episodes !== null && (
          <Field>
            <FieldLabel htmlFor="episode">회차</FieldLabel>
            <Select
              name="episode"
              key={season ?? 0}
              items={episodeItems}
              defaultValue={defaultEpisode}
            >
              <SelectTrigger id="episode" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {episodeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <DateField
          defaultMode={
            watchedOn === null ? "none" : watchedPrecision === "year" ? "year" : "day"
          }
          defaultDate={watchedOn && watchedPrecision === "day" ? watchedOn : today}
          defaultYear={watchedOn?.slice(0, 4)}
        />
      </FieldGroup>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          저장
        </Button>
        <Link
          href={`/contents/${contentId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          취소
        </Link>
      </div>
    </form>
  );
}
