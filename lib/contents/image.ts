import { posterUrl } from "@/lib/tmdb/classify";

// Thumbnail source: an uploaded image (signed URL) or the TMDB poster.
export function contentImageSrc(
  content: { image_path: string | null; poster_path: string | null },
  signedUrls: Map<string, string> | Record<string, string>,
) {
  if (content.image_path) {
    return signedUrls instanceof Map
      ? signedUrls.get(content.image_path)
      : signedUrls[content.image_path];
  }
  return posterUrl(content.poster_path);
}
