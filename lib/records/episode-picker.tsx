"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";

// Episode checkboxes with a select-all toggle. Submits the checked episodes
// as repeated "episodes" fields.
export function EpisodePicker({
  episodes,
  watched,
  offset,
}: {
  episodes: number[];
  // Episodes that already have a record (shown darker).
  watched: Set<number>;
  // Subtracted from TMDB episode numbers for display (a part's first episode - 1).
  offset: number;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const allSelected = selected.size === episodes.length;

  const toggle = (episode: number, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(episode);
      else next.delete(episode);
      return next;
    });

  return (
    <FieldSet>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLegend variant="label" className="mb-0">
          본 회차
        </FieldLegend>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSelected(allSelected ? new Set() : new Set(episodes))}
        >
          {allSelected ? "전체 해제" : "전체 선택"}
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {episodes.map((episode) => (
          <Field key={episode} orientation="horizontal" className="w-auto">
            <Checkbox
              id={`episode-${episode}`}
              name="episodes"
              value={String(episode)}
              checked={selected.has(episode)}
              onCheckedChange={(checked) => toggle(episode, checked === true)}
            />
            <FieldLabel
              htmlFor={`episode-${episode}`}
              className={
                watched.has(episode) ? "font-normal" : "font-normal text-muted-foreground"
              }
            >
              {episode - offset}화
            </FieldLabel>
          </Field>
        ))}
      </div>
    </FieldSet>
  );
}
