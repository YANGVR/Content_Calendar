"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContent, type ContentView } from "@/lib/contents/queries";
import {
  ensureTmdbContent,
  tmdbPath,
  viewTmdbContent,
} from "@/lib/contents/tmdb-content";
import { createClient } from "@/lib/supabase/server";
import type { TmdbType } from "@/lib/tmdb/classify";

import { isIsoDate, todayInKorea, type WatchedPrecision } from "./dates";
import { getEpisodeOptions } from "./episode-options";
import { parseEpisodes } from "./episodes";

export type RecordFormState = { error?: string; savedAt?: number };

type Watched = { watched_on: string | null; watched_precision: WatchedPrecision };

// Reads the date field: a full date, just a year, or none ("기타").
function readWatched(formData: FormData): Watched | undefined {
  const mode = String(formData.get("date_mode") ?? "day");
  if (mode === "none") return { watched_on: null, watched_precision: "day" };
  if (mode === "year") {
    const year = Number(formData.get("watched_year"));
    const thisYear = Number(todayInKorea().slice(0, 4));
    if (!Number.isInteger(year) || year < 1900 || year > thisYear) return undefined;
    return { watched_on: `${year}-01-01`, watched_precision: "year" };
  }
  const date = String(formData.get("watched_on") ?? "");
  return isIsoDate(date) ? { watched_on: date, watched_precision: "day" } : undefined;
}

const DATE_ERROR = "시청일이나 연도를 입력하거나 '기타'를 선택해 주세요.";

function readSeason(formData: FormData) {
  const season = Number(formData.get("season"));
  return Number.isInteger(season) && season >= 1 ? season : undefined;
}

function readPart(formData: FormData) {
  const part = Number(formData.get("part"));
  return Number.isInteger(part) && part >= 1 ? part : undefined;
}

type RecordRow = { season: number | null; episode: number | null } & Watched;

// Validates the add form against the content's real episodes.
async function readNewRecords(
  content: ContentView,
  formData: FormData,
): Promise<{ error: string } | { rows: RecordRow[] }> {
  const watched = readWatched(formData);
  if (watched === undefined) return { error: DATE_ERROR };

  const options = await getEpisodeOptions(content, readSeason(formData), readPart(formData));
  let episodes: (number | null)[] = [null];
  if (options.episodes !== null) {
    episodes = parseEpisodes(
      formData.getAll("episodes").map(String),
      options.episodes,
    );
    if (episodes.length === 0) {
      return { error: "본 회차를 하나 이상 골라 주세요." };
    }
  }
  return {
    rows: episodes.map((episode) => ({
      season: episode === null ? null : options.season,
      episode,
      ...watched,
    })),
  };
}

// Saves records; recording a movie or episode again overwrites its date.
async function insertRecords(contentId: string, rows: RecordRow[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("watch_records")
    .upsert(
      rows.map((row) => ({ ...row, content_id: contentId })),
      { onConflict: "content_id,season,episode" },
    );
  return error;
}

function revalidateRecordViews(contentId: string) {
  revalidatePath("/records");
  revalidatePath("/contents");
  revalidatePath(`/contents/${contentId}`);
}

export async function addRecords(
  contentId: string,
  _prev: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const content = await getContent(contentId);
  if (!content) return { error: "콘텐츠를 찾을 수 없습니다." };

  const result = await readNewRecords(content, formData);
  if ("error" in result) return result;

  const error = await insertRecords(contentId, result.rows);
  if (error) return { error: `기록하지 못했습니다. (${error.message})` };

  revalidateRecordViews(contentId);
  return { savedAt: Date.now() };
}

// Records a TMDB title. The title is saved as the user's content only now,
// after the form is valid, so browsing never saves anything.
export async function addTmdbRecords(
  type: TmdbType,
  tmdbId: number,
  season: number | null,
  _prev: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const view = await viewTmdbContent(type, tmdbId, season);
  if (!view) return { error: "콘텐츠를 찾을 수 없습니다." };

  const result = await readNewRecords(view, formData);
  if ("error" in result) return result;

  const content = await ensureTmdbContent(type, tmdbId, season);
  if (!content) return { error: "콘텐츠를 저장하지 못했습니다." };

  const error = await insertRecords(content.id, result.rows);
  if (error) return { error: `기록하지 못했습니다. (${error.message})` };

  revalidateRecordViews(content.id);
  revalidatePath(tmdbPath(type, tmdbId, season));
  return { savedAt: Date.now() };
}

export async function updateRecord(
  recordId: string,
  contentId: string,
  _prev: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const content = await getContent(contentId);
  if (!content) return { error: "콘텐츠를 찾을 수 없습니다." };

  const watched = readWatched(formData);
  if (watched === undefined) return { error: DATE_ERROR };

  const options = await getEpisodeOptions(content, readSeason(formData), readPart(formData));
  let episode: number | null = null;
  if (options.episodes !== null) {
    const [picked] = parseEpisodes(
      [String(formData.get("episode") ?? "")],
      options.episodes,
    );
    if (picked === undefined) return { error: "회차를 골라 주세요." };
    episode = picked;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("watch_records")
    .update({ season: episode === null ? null : options.season, episode, ...watched })
    .eq("id", recordId);
  if (error?.code === "23505") {
    return { error: "이 회차는 이미 기록되어 있어요. 그 기록을 수정해 주세요." };
  }
  if (error) return { error: `기록을 고치지 못했습니다. (${error.message})` };

  revalidateRecordViews(contentId);
  redirect(`/contents/${contentId}`);
}

export async function deleteRecord(recordId: string, contentId: string) {
  const supabase = await createClient();
  await supabase.from("watch_records").delete().eq("id", recordId);
  revalidateRecordViews(contentId);
}
