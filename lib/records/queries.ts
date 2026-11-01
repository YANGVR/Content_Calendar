import { createClient } from "@/lib/supabase/server";

import { CONTENT_COLUMNS, type Content } from "@/lib/contents/queries";

import type { WatchedPrecision } from "./dates";

export type WatchRecord = {
  id: string;
  content_id: string;
  season: number | null;
  episode: number | null;
  watched_on: string | null;
  watched_precision: WatchedPrecision;
  content: Content;
};

const RECORD_COLUMNS = `id, content_id, season, episode, watched_on, watched_precision, content:contents!inner(${CONTENT_COLUMNS})`;

export async function listMyDatedRecords() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_records")
    .select(RECORD_COLUMNS)
    .not("watched_on", "is", null)
    .order("watched_on", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<WatchRecord[]>();
  if (error) throw error;
  return data;
}

export async function listRecordsForContent(contentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_records")
    .select(RECORD_COLUMNS)
    .eq("content_id", contentId)
    .order("watched_on", { ascending: false, nullsFirst: true })
    .order("season", { ascending: true, nullsFirst: true })
    .order("episode", { ascending: true })
    .returns<WatchRecord[]>();
  if (error) throw error;
  return data;
}

export async function getRecord(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watch_records")
    .select(RECORD_COLUMNS)
    .eq("id", id)
    .maybeSingle<WatchRecord>();
  if (error) throw error;
  return data;
}
