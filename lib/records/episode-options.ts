import type { ContentView } from "@/lib/contents/queries";
import { getSeasonParts, getTmdbDetails, getTmdbSeasonEpisodes } from "@/lib/tmdb/api";
import { regularSeasons } from "@/lib/tmdb/classify";
import { partOf, type SeasonPart } from "@/lib/tmdb/season-parts";

import { episodeRange } from "./episodes";

export type EpisodeOptions = {
  // Regular season numbers; empty when the content has no seasons.
  seasons: number[];
  season: number | null;
  // Real episode numbers to pick from; null for movies.
  episodes: number[] | null;
  // Display-only seasons (기수) of a single-season anime, and the one shown.
  parts: SeasonPart[] | null;
  part: SeasonPart | null;
};

// Display-only seasons for a single-season TMDB anime, when TMDB has a
// "Seasons" episode group that splits it. Null for everything else.
export async function getContentParts(content: ContentView) {
  if (
    content.source !== "tmdb" ||
    content.tmdb_type !== "tv" ||
    content.tmdb_id === null ||
    content.tmdb_season !== null ||
    content.kind !== "anime" ||
    content.season_count !== 1 ||
    content.episode_count === null
  ) {
    return null;
  }
  return getSeasonParts(content.tmdb_id, content.episode_count);
}

// The episodes a record may point at: 1..N for hand-added content, and the
// requested (or first) season's episodes as TMDB lists them for series. A
// single-season anime split into parts shows only the requested part.
export async function getEpisodeOptions(
  content: ContentView,
  requestedSeason?: number,
  requestedPart?: number,
): Promise<EpisodeOptions> {
  const none = { parts: null, part: null };
  if (content.kind === "movie" || content.episode_count === null) {
    return { seasons: [], season: null, episodes: null, ...none };
  }
  if (content.source === "custom" || content.tmdb_id === null) {
    return { seasons: [], season: null, episodes: episodeRange(content.episode_count), ...none };
  }

  // One season (기수) of a split anime: that season's episodes only.
  if (content.tmdb_season !== null) {
    return {
      seasons: [],
      season: content.tmdb_season,
      episodes: await getTmdbSeasonEpisodes(content.tmdb_id, content.tmdb_season),
      ...none,
    };
  }

  const details = await getTmdbDetails("tv", content.tmdb_id);
  const seasons = regularSeasons(details?.seasons ?? []).map((s) => s.season_number);
  const season =
    requestedSeason !== undefined && seasons.includes(requestedSeason)
      ? requestedSeason
      : (seasons[0] ?? null);
  const episodes =
    season === null ? [] : await getTmdbSeasonEpisodes(content.tmdb_id, season);

  const parts = await getContentParts(content);
  if (parts) {
    const part = parts.find((p) => p.number === requestedPart) ?? parts[0];
    return {
      seasons: [],
      season,
      episodes: episodes.filter((e) => e >= part.start && e <= part.end),
      parts,
      part,
    };
  }
  return { seasons, season, episodes, ...none };
}

// The part (기수) a recorded episode belongs to, for opening its edit page.
export function partNumberOf(parts: SeasonPart[] | null, episode: number | null) {
  return parts && episode !== null ? (partOf(parts, episode)?.number ?? undefined) : undefined;
}
