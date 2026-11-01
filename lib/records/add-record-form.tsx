"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import type { RecordFormState } from "./actions";
import { DateField } from "./date-field";
import { EpisodePicker } from "./episode-picker";

export function AddRecordForm({
  action,
  season,
  episodes,
  today,
  watchedEpisodes,
  episodeOffset = 0,
  part,
}: {
  // Server action bound to the content (saved or TMDB) being recorded.
  action: (state: RecordFormState, formData: FormData) => Promise<RecordFormState>;
  season: number | null;
  // Real episode numbers to pick from; null for movies.
  episodes: number[] | null;
  today: string;
  watchedEpisodes: number[];
  // Subtracted from TMDB episode numbers for display (a part's first episode - 1).
  episodeOffset?: number;
  // Display-only part (기수) being shown, sent back for validation.
  part?: number;
}) {
  const [state, formAction, pending] = useActionState<
    RecordFormState,
    FormData
  >(action, {});
  const watched = new Set(watchedEpisodes);

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
        {/* Remount after each save so the picked episodes and date reset. */}
        {episodes !== null && (
          <EpisodePicker
            key={`episodes-${season}-${state.savedAt ?? 0}`}
            episodes={episodes}
            watched={watched}
            offset={episodeOffset}
          />
        )}
        <DateField key={`date-${state.savedAt ?? 0}`} defaultDate={today} />
      </FieldGroup>
      <Button type="submit" className="self-start" disabled={pending}>
        기록하기
      </Button>
    </form>
  );
}
