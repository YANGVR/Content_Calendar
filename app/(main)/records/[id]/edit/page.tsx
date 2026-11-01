import { notFound } from "next/navigation";

import { todayInKorea } from "@/lib/records/dates";
import { EditRecordForm } from "@/lib/records/edit-record-form";
import {
  getContentParts,
  getEpisodeOptions,
  partNumberOf,
} from "@/lib/records/episode-options";
import { getRecord } from "@/lib/records/queries";
import { SeasonPicker } from "@/lib/records/season-picker";

export default async function EditRecordPage({
  params,
  searchParams,
}: PageProps<"/records/[id]/edit">) {
  const { id } = await params;
  const { season: seasonParam, part: partParam } = await searchParams;
  const record = await getRecord(id);
  if (!record) notFound();

  // Without ?part=, open the part (기수) the recorded episode belongs to.
  const part =
    Number(partParam) ||
    partNumberOf(await getContentParts(record.content), record.episode);
  const options = await getEpisodeOptions(
    record.content,
    Number(seasonParam) || record.season || undefined,
    part,
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">기록 수정</h1>
        <p className="text-sm text-muted-foreground">{record.content.title}</p>
      </div>
      <SeasonPicker
        seasons={options.seasons}
        current={options.season}
        hrefFor={(season) => `/records/${record.id}/edit?season=${season}`}
      />
      {options.parts && (
        <SeasonPicker
          seasons={options.parts.map((p) => p.number)}
          current={options.part?.number ?? null}
          hrefFor={(p) => `/records/${record.id}/edit?part=${p}`}
          label={(n) => `${n}기`}
          ariaLabel="기수"
        />
      )}
      <EditRecordForm
        recordId={record.id}
        contentId={record.content_id}
        season={options.season}
        episodes={options.episodes}
        episode={
          options.season === record.season &&
          (!options.part ||
            (record.episode !== null &&
              record.episode >= options.part.start &&
              record.episode <= options.part.end))
            ? record.episode
            : null
        }
        episodeOffset={options.part ? options.part.start - 1 : 0}
        part={options.part?.number}
        watchedOn={record.watched_on}
        watchedPrecision={record.watched_precision}
        today={todayInKorea()}
      />
    </>
  );
}
