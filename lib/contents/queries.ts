import { createClient } from "@/lib/supabase/server";

import type { WatchedPrecision } from "@/lib/records/dates";
import type { TmdbType } from "@/lib/tmdb/classify";

import type { ContentKind } from "./kinds";

export const CONTENT_IMAGE_BUCKET = "content-images";

export type Content = {
  id: string;
  title: string;
  kind: ContentKind;
  episode_count: number | null;
  image_path: string | null;
  source: "custom" | "tmdb";
  tmdb_type: TmdbType | null;
  tmdb_id: number | null;
  poster_path: string | null;
  season_count: number | null;
  // Set for one season (기수) of a multi-season anime.
  tmdb_season: number | null;
  rating: number | null;
  review: string | null;
};

// A content as pages show it; id is null for a TMDB title not saved yet.
export type ContentView = Omit<Content, "id"> & { id: string | null };

export const CONTENT_COLUMNS =
  "id, title, kind, episode_count, image_path, source, tmdb_type, tmdb_id, poster_path, season_count, tmdb_season, rating, review";

export type ContentWithRecords = Content & {
  watch_records: {
    season: number | null;
    episode: number | null;
    watched_on: string | null;
    watched_precision: WatchedPrecision;
  }[];
};

// Hand-added contents plus TMDB contents the user has recorded, with the
// episodes recorded for each (for progress).
export async function listMyContents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .select(`${CONTENT_COLUMNS}, watch_records(season, episode, watched_on, watched_precision)`)
    .order("created_at", { ascending: false })
    .returns<ContentWithRecords[]>();
  if (error) throw error;
  return data.filter(
    (c) => c.source === "custom" || c.watch_records.length > 0,
  );
}

export async function getContent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_COLUMNS)
    .eq("id", id)
    .maybeSingle<Content>();
  if (error) throw error;
  return data;
}

// Hand-added contents the user can find by part of the title.
export async function searchMyCustomContents(query: string) {
  // Drop characters PostgREST treats as pattern or filter syntax.
  const term = query.replace(/[%_,()*\\]/g, " ").trim();
  if (!term) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_COLUMNS)
    .eq("source", "custom")
    .ilike("title", `%${term}%`)
    .order("created_at", { ascending: false })
    .returns<Content[]>();
  if (error) throw error;
  return data;
}

// Images live in a private bucket, so pages render short-lived signed URLs.
export async function signImageUrls(paths: (string | null)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (unique.length === 0) return new Map<string, string>();

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(CONTENT_IMAGE_BUCKET)
    .createSignedUrls(unique, 60 * 60);
  if (error) throw error;

  const urls = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
