"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { TmdbType } from "@/lib/tmdb/classify";

import { isContentKind } from "./kinds";
import { CONTENT_IMAGE_BUCKET } from "./queries";
import { ensureTmdbContent } from "./tmdb-content";

export type ContentFormState = { error?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function createContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const episodeCountRaw = String(formData.get("episode_count") ?? "").trim();
  const image = formData.get("image");

  if (title.length < 1 || title.length > 100) {
    return { error: "이름은 1–100자여야 합니다." };
  }
  if (!isContentKind(kind)) {
    return { error: "종류를 골라 주세요." };
  }

  let episodeCount: number | null = null;
  if (kind !== "movie") {
    episodeCount = Number(episodeCountRaw);
    if (
      !Number.isInteger(episodeCount) ||
      episodeCount < 1 ||
      episodeCount > 2000
    ) {
      return { error: "회차 수는 1–2000 사이의 정수여야 합니다." };
    }
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  let imagePath: string | null = null;
  if (image instanceof File && image.size > 0) {
    const extension = IMAGE_EXTENSIONS[image.type];
    if (!extension) {
      return { error: "이미지는 JPG, PNG, WEBP, GIF만 올릴 수 있습니다." };
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return { error: "이미지는 5MB 이하만 올릴 수 있습니다." };
    }
    imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(CONTENT_IMAGE_BUCKET)
      .upload(imagePath, image, { contentType: image.type });
    if (error) {
      return { error: `이미지를 올리지 못했습니다. (${error.message})` };
    }
  }

  const { data, error } = await supabase
    .from("contents")
    .insert({ title, kind, episode_count: episodeCount, image_path: imagePath })
    .select("id")
    .single();
  if (error) {
    if (imagePath) {
      await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([imagePath]);
    }
    return { error: `콘텐츠를 추가하지 못했습니다. (${error.message})` };
  }

  redirect(`/contents/${data.id}`);
}

export type DeleteContentState = { error?: string };

// Deletes a hand-added content. Its watch records go with it (cascade), and
// its thumbnail is removed from Storage afterwards.
export async function deleteContent(
  contentId: string,
): Promise<DeleteContentState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .delete()
    .eq("id", contentId)
    .eq("source", "custom")
    .select("image_path");
  if (error) return { error: `삭제하지 못했습니다. (${error.message})` };
  if (data.length === 0) return { error: "삭제할 콘텐츠를 찾을 수 없습니다." };

  const imagePath = data[0].image_path as string | null;
  if (imagePath) {
    await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([imagePath]);
  }

  revalidatePath("/contents");
  revalidatePath("/records");
  return {};
}

export type RatingFormState = { error?: string; savedAt?: number };

// What a rating or review belongs to: a saved content, or a TMDB title (or
// season) that is saved at the moment the first rating or review is given.
export type RatingTarget =
  | { contentId: string }
  | { tmdb: { type: TmdbType; id: number; season: number | null } };

async function updateRatingFields(
  target: RatingTarget,
  fields: { rating?: number | null; review?: string | null },
): Promise<RatingFormState> {
  let contentId: string;
  if ("contentId" in target) {
    contentId = target.contentId;
  } else {
    const { type, id, season } = target.tmdb;
    const saved = await ensureTmdbContent(type, id, season);
    if (!saved) return { error: "콘텐츠를 저장하지 못했습니다." };
    contentId = saved.id;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contents")
    .update(fields)
    .eq("id", contentId)
    .select("id");
  if (error) return { error: `저장하지 못했습니다. (${error.message})` };
  if (data.length === 0) return { error: "콘텐츠를 찾을 수 없습니다." };
  revalidatePath("/contents");
  revalidatePath(`/contents/${contentId}`);
  revalidatePath("/tmdb", "layout");
  return { savedAt: Date.now() };
}

// Sets the 1-5 star rating, or clears it when "clear" is submitted.
export async function saveRating(
  target: RatingTarget,
  _prev: RatingFormState,
  formData: FormData,
): Promise<RatingFormState> {
  const value = String(formData.get("rating") ?? "");
  if (value === "clear") return updateRatingFields(target, { rating: null });
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "별점은 1–5 사이로 골라 주세요." };
  }
  return updateRatingFields(target, { rating });
}

// Saves the one-line review; an empty review or "clear" removes it.
export async function saveReview(
  target: RatingTarget,
  _prev: RatingFormState,
  formData: FormData,
): Promise<RatingFormState> {
  if (formData.get("intent") === "clear") {
    return updateRatingFields(target, { review: null });
  }
  const review = String(formData.get("review") ?? "").trim();
  if (review.length > 100) return { error: "한줄평은 100자 이하로 써 주세요." };
  return updateRatingFields(target, { review: review || null });
}
