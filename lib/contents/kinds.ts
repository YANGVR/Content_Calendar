export const CONTENT_KINDS = ["movie", "drama", "variety", "anime", "other"] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  movie: "영화",
  drama: "드라마",
  variety: "예능",
  anime: "애니메이션",
  other: "기타",
};

export function isContentKind(value: string): value is ContentKind {
  return (CONTENT_KINDS as readonly string[]).includes(value);
}
