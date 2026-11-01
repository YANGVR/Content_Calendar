import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { deleteRecord, type RecordFormState } from "@/lib/records/actions";
import { AddRecordForm } from "@/lib/records/add-record-form";
import { formatWatched, todayInKorea } from "@/lib/records/dates";
import { partNumberOf, type EpisodeOptions } from "@/lib/records/episode-options";
import { episodeLabel } from "@/lib/records/episodes";
import { computeProgress, progressLabel } from "@/lib/records/progress";
import type { WatchRecord } from "@/lib/records/queries";
import { SeasonPicker } from "@/lib/records/season-picker";

import { CONTENT_KIND_LABELS } from "./kinds";
import type { ContentView } from "./queries";
import { RatingForm } from "./rating-form";
import { Thumbnail } from "./thumbnail";

// Content header, record form and this content's records, shared by saved
// contents and TMDB titles that are not saved yet.
export function ContentDetail({
  content,
  imageSrc,
  options,
  records,
  recordAction,
  seasonHref,
  partHref,
  partExtras,
}: {
  content: ContentView;
  imageSrc?: string;
  options: EpisodeOptions;
  records: WatchRecord[];
  recordAction: (
    state: RecordFormState,
    formData: FormData,
  ) => Promise<RecordFormState>;
  seasonHref: (season: number) => string;
  // Link for a display-only part (기수) of a single-season anime.
  partHref?: (part: number) => string;
  // Extra buttons in the part row, e.g. "1기 감독판".
  partExtras?: { label: string; href: string; after: number }[];
}) {
  const watchedEpisodes = [
    ...new Set(
      records
        .filter((r) => r.season === options.season && r.episode !== null)
        .map((r) => r.episode as number),
    ),
  ];
  const progress = computeProgress(content, records);
  const unrecordable =
    content.kind !== "movie" &&
    (content.episode_count === null ||
      (options.episodes !== null && options.episodes.length === 0));

  return (
    <>
      <div className="flex gap-4">
        <Thumbnail src={imageSrc} alt={content.title} size="md" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {content.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{CONTENT_KIND_LABELS[content.kind]}</Badge>
            {content.episode_count !== null && (
              <span>
                {content.season_count && content.season_count > 1
                  ? `시즌 ${content.season_count}개 · `
                  : ""}
                전체 {content.episode_count}화
              </span>
            )}
            {content.source === "tmdb" && <span>정보 제공 TMDB</span>}
          </div>
          {progress.kind === "series" && (
            <ProgressBar label={progressLabel(progress) ?? ""} percent={progress.percent} />
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">내 평가</h2>
        <RatingForm
          target={
            content.id
              ? { contentId: content.id }
              : {
                  tmdb: {
                    type: content.tmdb_type as "movie" | "tv",
                    id: content.tmdb_id as number,
                    season: content.tmdb_season,
                  },
                }
          }
          rating={content.rating}
          review={content.review}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">기록하기</h2>
        <SeasonPicker
          seasons={options.seasons}
          current={options.season}
          hrefFor={seasonHref}
        />
        {options.parts && partHref && (
          <SeasonPicker
            seasons={options.parts.map((p) => p.number)}
            current={options.part?.number ?? null}
            hrefFor={partHref}
            label={(n) => `${n}기`}
            ariaLabel="기수"
            extras={partExtras}
          />
        )}
        {unrecordable ? (
          <p className="text-sm text-muted-foreground">
            TMDB에 회차 정보가 없어 기록할 수 없어요. 직접 추가로 기록해 주세요.
          </p>
        ) : (
          <AddRecordForm
            action={recordAction}
            season={options.season}
            episodes={options.episodes}
            today={todayInKorea()}
            watchedEpisodes={watchedEpisodes}
            episodeOffset={options.part ? options.part.start - 1 : 0}
            part={options.part?.number}
          />
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">이 콘텐츠의 기록</h2>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {episodeLabel(
                      record.season,
                      record.episode,
                      content.season_count,
                      options.parts,
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatWatched(record.watched_on, record.watched_precision)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/records/${record.id}/edit${
                      options.parts && record.episode !== null
                        ? `?part=${partNumberOf(options.parts, record.episode) ?? ""}`
                        : ""
                    }`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    수정
                  </Link>
                  <form action={deleteRecord.bind(null, record.id, record.content_id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      삭제
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ProgressBar({ label, percent }: { label: string; percent: number }) {
  return (
    <Progress value={percent} aria-label="진행률" className="w-56 flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
    </Progress>
  );
}
