import type { ContentKind } from "@/lib/contents/kinds";

export type TmdbType = "movie" | "tv";

const ANIMATION = 16;
const REALITY = 10764;
const TALK = 10767;

// Spec assumption: TMDB movies are movies; TV is anime if animated, variety
// if reality or talk, and drama otherwise.
export function classifyTmdb(type: TmdbType, genreIds: number[]): ContentKind {
  if (type === "movie") return "movie";
  if (genreIds.includes(ANIMATION)) return "anime";
  if (genreIds.includes(REALITY) || genreIds.includes(TALK)) return "variety";
  return "drama";
}

export type TmdbSeasonSummary = {
  season_number: number;
  episode_count: number;
  air_date?: string | null;
  poster_path?: string | null;
};

// Regular seasons only: season 0 holds specials, which progress leaves out.
export function regularSeasons(seasons: TmdbSeasonSummary[]) {
  return seasons
    .filter((s) => s.season_number >= 1 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);
}

export function regularEpisodeTotal(seasons: TmdbSeasonSummary[]) {
  return regularSeasons(seasons).reduce((sum, s) => sum + s.episode_count, 0);
}

export function posterUrl(posterPath: string | null, size = "w185") {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : undefined;
}

// Multi-season anime is split into one content per season (기수).
export function splitsIntoSeasons(kind: ContentKind, seasons: TmdbSeasonSummary[]) {
  return kind === "anime" && regularSeasons(seasons).length > 1;
}

export function seasonTitle(title: string, season: number) {
  return `${title} ${season}기`;
}
