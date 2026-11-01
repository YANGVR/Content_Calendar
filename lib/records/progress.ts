export type Progress =
  | { kind: "movie"; watched: boolean }
  | { kind: "series"; watched: number; total: number; percent: number };

// Distinct episodes watched out of the content's total. Rewatches count once,
// and undated records count too.
export function computeProgress(
  content: { kind: string; episode_count: number | null },
  records: { season: number | null; episode: number | null }[],
): Progress {
  if (content.kind === "movie" || content.episode_count === null) {
    return { kind: "movie", watched: records.length > 0 };
  }
  const distinct = new Set(
    records
      .filter((r) => r.episode !== null)
      .map((r) => `${r.season ?? 0}:${r.episode}`),
  );
  const total = content.episode_count;
  const watched = Math.min(distinct.size, total);
  return { kind: "series", watched, total, percent: Math.round((watched / total) * 100) };
}

// Movies have no progress to show; only series get a label.
export function progressLabel(progress: Progress) {
  return progress.kind === "movie"
    ? null
    : `${progress.watched}/${progress.total}화 · ${progress.percent}%`;
}
