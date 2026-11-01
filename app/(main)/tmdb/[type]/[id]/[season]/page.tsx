import { notFound } from "next/navigation";

import { ContentDetail } from "@/lib/contents/content-detail";
import { tmdbPath, viewTmdbContent } from "@/lib/contents/tmdb-content";
import { addTmdbRecords } from "@/lib/records/actions";
import { getContentParts, getEpisodeOptions } from "@/lib/records/episode-options";
import { editionFor, editionPath } from "@/lib/tmdb/editions";
import { listRecordsForContent } from "@/lib/records/queries";
import { SeasonPicker } from "@/lib/records/season-picker";
import { getTmdbDetails } from "@/lib/tmdb/api";
import { posterUrl, regularSeasons } from "@/lib/tmdb/classify";

// One season (기수) of a multi-season anime, recorded as its own content.
export default async function TmdbSeasonPage({
  params,
}: PageProps<"/tmdb/[type]/[id]/[season]">) {
  const { type, id, season: seasonParam } = await params;
  const tmdbId = Number(id);
  const season = Number(seasonParam);
  if (type !== "tv" || !Number.isInteger(tmdbId) || !Number.isInteger(season)) {
    notFound();
  }

  const [content, details] = await Promise.all([
    viewTmdbContent("tv", tmdbId, season),
    getTmdbDetails("tv", tmdbId),
  ]);
  if (!content) notFound();

  const [records, options] = await Promise.all([
    content.id ? listRecordsForContent(content.id) : [],
    getEpisodeOptions(content),
  ]);
  const siblings = regularSeasons(details?.seasons ?? []).map(
    (s) => s.season_number,
  );
  const edition = editionFor(tmdbId, season);
  const baseView = edition ? await viewTmdbContent("tv", edition.baseId) : null;
  const baseParts = baseView ? await getContentParts(baseView) : null;

  return (
    <>
      {edition && baseParts ? (
        <SeasonPicker
          seasons={baseParts.map((p) => p.number)}
          current={null}
          hrefFor={(p) => `${tmdbPath("tv", edition.baseId, null)}?part=${p}`}
          label={(n) => `${n}기`}
          ariaLabel="기수"
          extras={[
            { label: edition.label, href: editionPath(edition), after: edition.basePart, active: true },
          ]}
        />
      ) : (
        <SeasonPicker
          seasons={siblings}
          current={season}
          hrefFor={(s) => tmdbPath("tv", tmdbId, s)}
          label={(s) => `${s}기`}
          ariaLabel="기수"
        />
      )}
      <ContentDetail
        content={content}
        imageSrc={posterUrl(content.poster_path, "w342")}
        options={options}
        records={records}
        recordAction={addTmdbRecords.bind(null, "tv", tmdbId, season)}
        seasonHref={() => tmdbPath("tv", tmdbId, season)}
      />
    </>
  );
}
