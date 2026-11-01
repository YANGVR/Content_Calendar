import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ContentDetail } from "@/lib/contents/content-detail";
import { CONTENT_KIND_LABELS } from "@/lib/contents/kinds";
import {
  isTmdbType,
  tmdbPath,
  viewTmdbContent,
} from "@/lib/contents/tmdb-content";
import { addTmdbRecords } from "@/lib/records/actions";
import { editionPath, editionsOf } from "@/lib/tmdb/editions";
import { getEpisodeOptions } from "@/lib/records/episode-options";
import { listRecordsForContent } from "@/lib/records/queries";
import { getTmdbDetails } from "@/lib/tmdb/api";
import {
  posterUrl,
  regularSeasons,
  seasonTitle,
  splitsIntoSeasons,
} from "@/lib/tmdb/classify";

// A TMDB title, shown from TMDB's details. Viewing saves nothing; the first
// record saves it as the user's content. Multi-season anime shows a season
// (기수) chooser instead, since each season is its own content.
export default async function TmdbContentPage({
  params,
  searchParams,
}: PageProps<"/tmdb/[type]/[id]">) {
  const { type, id } = await params;
  const { season, part } = await searchParams;
  const tmdbId = Number(id);
  if (!isTmdbType(type) || !Number.isInteger(tmdbId)) notFound();

  const content = await viewTmdbContent(type, tmdbId);
  if (!content) notFound();

  // A whole-series row saved before anime was split keeps its own page.
  if (type === "tv" && content.kind === "anime" && content.id === null) {
    const details = await getTmdbDetails("tv", tmdbId);
    if (details && splitsIntoSeasons("anime", details.seasons)) {
      return (
        <SeasonChooser
          tmdbId={tmdbId}
          title={details.title}
          seasons={regularSeasons(details.seasons)}
          fallbackPoster={details.posterPath}
        />
      );
    }
  }

  const [records, options] = await Promise.all([
    content.id ? listRecordsForContent(content.id) : [],
    getEpisodeOptions(content, Number(season) || undefined, Number(part) || undefined),
  ]);

  return (
    <ContentDetail
      content={content}
      imageSrc={posterUrl(content.poster_path, "w342")}
      options={options}
      records={records}
      recordAction={addTmdbRecords.bind(null, type, tmdbId, null)}
      seasonHref={(s) => `${tmdbPath(type, tmdbId, null)}?season=${s}`}
      partHref={(p) => `${tmdbPath(type, tmdbId, null)}?part=${p}`}
      partExtras={editionsOf(tmdbId).map((e) => ({
        label: e.label,
        href: editionPath(e),
        after: e.basePart,
      }))}
    />
  );
}

function SeasonChooser({
  tmdbId,
  title,
  seasons,
  fallbackPoster,
}: {
  tmdbId: number;
  title: string;
  seasons: ReturnType<typeof regularSeasons>;
  fallbackPoster: string | null;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{CONTENT_KIND_LABELS.anime}</Badge>
          <span>기수 {seasons.length}개 · 정보 제공 TMDB</span>
        </div>
        <p className="text-sm text-muted-foreground">
          기록할 기수를 골라 주세요. 기수마다 따로 기록돼요.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {seasons.map((season) => {
          const src = posterUrl(season.poster_path ?? fallbackPoster, "w342");
          return (
            <li key={season.season_number}>
              <Link
                href={tmdbPath("tv", tmdbId, season.season_number)}
                className="group flex flex-col gap-2"
              >
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
                  {src && (
                    // TMDB posters are already sized by the image CDN.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={seasonTitle(title, season.season_number)}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {season.season_number}기
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {season.air_date?.slice(0, 4) ?? ""} · {season.episode_count}화
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
