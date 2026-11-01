import {
  classifyTmdb,
  regularSeasons,
  seasonTitle,
  splitsIntoSeasons,
  type TmdbSeasonSummary,
  type TmdbType,
} from "./classify";
import { editionFor } from "./editions";
import { partsFromGroup } from "./season-parts";

// Server-only: TMDB_API_KEY has no NEXT_PUBLIC_ prefix, so it never reaches
// the browser. Accepts either a v3 API key or a v4 read access token.
async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("language", "ko-KR");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  const isToken = key.startsWith("eyJ");
  if (!isToken) url.searchParams.set("api_key", key);

  const response = await fetch(url, {
    headers: isToken ? { Authorization: `Bearer ${key}` } : undefined,
    next: { revalidate: 60 * 60 },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`TMDB ${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export type TmdbSearchResult = {
  type: TmdbType;
  id: number;
  title: string;
  date: string;
  kind: ReturnType<typeof classifyTmdb>;
  posterPath: string | null;
  href: string;
};

type RawSearchItem = {
  media_type: string;
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  poster_path?: string | null;
};

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{ results: RawSearchItem[] }>("/search/multi", {
    query,
    include_adult: "false",
  });
  return (data?.results ?? [])
    .filter(
      (item): item is RawSearchItem & { media_type: TmdbType } =>
        item.media_type === "movie" || item.media_type === "tv",
    )
    .map((item) => ({
      type: item.media_type,
      id: item.id,
      title: item.title ?? item.name ?? "",
      date: item.release_date ?? item.first_air_date ?? "",
      kind: classifyTmdb(item.media_type, item.genre_ids ?? []),
      posterPath: item.poster_path ?? null,
      href: `/tmdb/${item.media_type}/${item.id}`,
    }));
}

export type TmdbDetails = {
  title: string;
  genreIds: number[];
  posterPath: string | null;
  seasons: TmdbSeasonSummary[];
};

type RawDetails = {
  title?: string;
  name?: string;
  genres?: { id: number }[];
  poster_path?: string | null;
  seasons?: TmdbSeasonSummary[];
};

export async function getTmdbDetails(
  type: TmdbType,
  id: number,
): Promise<TmdbDetails | null> {
  const data = await tmdbFetch<RawDetails>(`/${type}/${id}`);
  if (!data) return null;
  return {
    title: data.title ?? data.name ?? "",
    genreIds: (data.genres ?? []).map((g) => g.id),
    posterPath: data.poster_path ?? null,
    seasons: data.seasons ?? [],
  };
}

// Episode numbers of one season, as TMDB lists them.
export async function getTmdbSeasonEpisodes(seriesId: number, season: number) {
  const data = await tmdbFetch<{ episodes?: { episode_number: number }[] }>(
    `/tv/${seriesId}/season/${season}`,
  );
  return (data?.episodes ?? []).map((e) => e.episode_number);
}

export type LatestKind = "movie" | "drama" | "anime" | "variety";

export type TmdbListItem = {
  type: TmdbType;
  id: number;
  title: string;
  date: string;
  posterPath: string | null;
  href: string;
};

type RawListItem = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

const TV_FILTERS: Record<Exclude<LatestKind, "movie">, Record<string, string>> = {
  drama: { with_genres: "18", without_genres: "16|10764|10767", with_origin_country: "KR" },
  anime: { with_genres: "16", with_origin_country: "KR|JP" },
  variety: { with_genres: "10764|10767", without_genres: "16", with_origin_country: "KR" },
};

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Latest titles per kind: movies now playing in Korea, and TV titles that
// started airing in the last 90 days, most popular first.
export async function getLatest(kind: LatestKind): Promise<TmdbListItem[]> {
  const type: TmdbType = kind === "movie" ? "movie" : "tv";
  const data =
    kind === "movie"
      ? await tmdbFetch<{ results: RawListItem[] }>("/movie/now_playing", {
          region: "KR",
        })
      : await tmdbFetch<{ results: RawListItem[] }>("/discover/tv", {
          ...TV_FILTERS[kind],
          sort_by: "popularity.desc",
          "first_air_date.gte": isoDaysAgo(90),
          "first_air_date.lte": isoDaysAgo(0),
          include_adult: "false",
        });
  return (data?.results ?? []).map((item) => ({
    type,
    id: item.id,
    title: item.title ?? item.name ?? "",
    date: item.release_date ?? item.first_air_date ?? "",
    posterPath: item.poster_path ?? null,
    href: `/tmdb/${type}/${item.id}`,
  }));
}

type Listed = {
  type: TmdbType;
  id: number;
  title: string;
  date: string;
  posterPath: string | null;
  href: string;
};

// Replaces each multi-season anime with one entry per season (기수), each
// opening that season's page.
export async function expandAnimeSeasons<T extends Listed>(
  items: T[],
  isAnime: (item: T) => boolean,
): Promise<T[]> {
  const expanded = await Promise.all(
    items.map(async (item) => {
      if (item.type !== "tv" || !isAnime(item)) return [item];
      const details = await getTmdbDetails("tv", item.id);
      if (!details || !splitsIntoSeasons("anime", details.seasons)) return [item];
      return regularSeasons(details.seasons).map((season) => ({
        ...item,
        title:
          editionFor(item.id, season.season_number)?.title ??
          seasonTitle(item.title, season.season_number),
        date: season.air_date ?? item.date,
        posterPath: season.poster_path ?? item.posterPath,
        href: `/tmdb/tv/${item.id}/${season.season_number}`,
      }));
    }),
  );
  return expanded.flat();
}

type RawEpisodeGroupSummary = { id: string; name: string; type: number };
type RawEpisodeGroup = {
  groups?: {
    order: number;
    episodes: { season_number: number; episode_number: number }[];
  }[];
};

const PRODUCTION_GROUP = 6;

// Display-only seasons for a series TMDB lists as a single long season, from
// the first "Seasons" production episode group that cleanly splits it.
export async function getSeasonParts(seriesId: number, total: number) {
  const list = await tmdbFetch<{ results?: RawEpisodeGroupSummary[] }>(
    `/tv/${seriesId}/episode_groups`,
  );
  const candidates = (list?.results ?? []).filter(
    (g) => g.type === PRODUCTION_GROUP && /season/i.test(g.name),
  );
  for (const candidate of candidates) {
    const group = await tmdbFetch<RawEpisodeGroup>(`/tv/episode_group/${candidate.id}`);
    const parts = partsFromGroup(group?.groups ?? [], total);
    if (parts) return parts;
  }
  return null;
}
