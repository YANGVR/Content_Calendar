import { createClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/user";
import { getTmdbDetails } from "@/lib/tmdb/api";
import {
  classifyTmdb,
  regularEpisodeTotal,
  regularSeasons,
  seasonTitle,
  type TmdbType,
} from "@/lib/tmdb/classify";

import { editionFor } from "@/lib/tmdb/editions";

import { CONTENT_COLUMNS, type Content, type ContentView } from "./queries";

export function isTmdbType(value: string): value is TmdbType {
  return value === "movie" || value === "tv";
}

type TmdbContentFields = Omit<Content, "id" | "image_path" | "rating" | "review">;

// Content fields built from TMDB's current details: the whole title, or one
// season (기수) of a series when `season` is given. Null when TMDB has no
// such title or season.
async function fieldsFromTmdb(
  type: TmdbType,
  tmdbId: number,
  season: number | null,
): Promise<TmdbContentFields | null> {
  const details = await getTmdbDetails(type, tmdbId);
  if (!details) return null;
  const kind = classifyTmdb(type, details.genreIds);
  const base = {
    source: "tmdb" as const,
    tmdb_type: type,
    tmdb_id: tmdbId,
    kind,
  };

  if (season !== null) {
    const summary = regularSeasons(details.seasons).find(
      (s) => s.season_number === season,
    );
    if (type !== "tv" || !summary) return null;
    return {
      ...base,
      title: (editionFor(tmdbId, season)?.title ?? seasonTitle(details.title, season)).slice(0, 100),
      episode_count: summary.episode_count,
      season_count: null,
      tmdb_season: season,
      poster_path: summary.poster_path ?? details.posterPath,
    };
  }

  const isTv = type === "tv";
  return {
    ...base,
    title: details.title.slice(0, 100) || "(제목 없음)",
    // Null for a series TMDB lists no regular episodes for; it cannot be recorded.
    episode_count: isTv ? regularEpisodeTotal(details.seasons) || null : null,
    season_count: isTv ? regularSeasons(details.seasons).length || null : null,
    tmdb_season: null,
    poster_path: details.posterPath,
  };
}

// The user's saved row for a TMDB title (or one of its seasons), if they
// have recorded it before.
export async function findMyTmdbContent(
  type: TmdbType,
  tmdbId: number,
  season: number | null,
) {
  const supabase = await createClient();
  const query = supabase
    .from("contents")
    .select(CONTENT_COLUMNS)
    .eq("owner_id", await currentUserId())
    .eq("tmdb_type", type)
    .eq("tmdb_id", tmdbId);
  const { data, error } = await (season === null
    ? query.is("tmdb_season", null)
    : query.eq("tmdb_season", season)
  ).maybeSingle<Content>();
  if (error) throw error;
  return data;
}

// What a TMDB content page shows: the saved row when there is one,
// otherwise an unsaved view of TMDB's details (id null). Nothing is written.
export async function viewTmdbContent(
  type: TmdbType,
  tmdbId: number,
  season: number | null = null,
): Promise<ContentView | null> {
  const [saved, fields] = await Promise.all([
    findMyTmdbContent(type, tmdbId, season),
    fieldsFromTmdb(type, tmdbId, season),
  ]);
  if (!fields) return saved;
  return {
    ...fields,
    id: saved?.id ?? null,
    image_path: null,
    rating: saved?.rating ?? null,
    review: saved?.review ?? null,
  };
}

// Saves (or refreshes) the user's row for a TMDB title or season at the
// moment they first record it, and returns it.
export async function ensureTmdbContent(
  type: TmdbType,
  tmdbId: number,
  season: number | null,
) {
  const fields = await fieldsFromTmdb(type, tmdbId, season);
  if (!fields) return null;
  if (type === "tv" && fields.episode_count === null) return null;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("contents")
    .upsert(
      { ...fields, owner_id: userId },
      { onConflict: "owner_id,tmdb_type,tmdb_id,tmdb_season" },
    )
    .select(CONTENT_COLUMNS)
    .single<Content>();
  if (error) throw error;
  return data;
}

// Path of a TMDB title or season page.
export function tmdbPath(type: TmdbType, tmdbId: number, season: number | null) {
  return season === null ? `/tmdb/${type}/${tmdbId}` : `/tmdb/${type}/${tmdbId}/${season}`;
}
