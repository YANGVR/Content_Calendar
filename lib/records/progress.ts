export type Progress =
  | { kind: "movie"; watched: boolean }
  | { kind: "series"; watched: number; total: number; percent: number };

// Distinct episodes watched out of the content's total. Rewatches count once,
// and undated records count too.
export function computeProgress(
  content: { kind: string; episode_count: number | null },
  records: { season: number | null; episode: number | null }[],
  // When given, only this range of episode numbers (a 기수) is counted, out of
  // the range's own length.
  range?: { start: number; end: number },
): Progress {
  if (content.kind === "movie" || content.episode_count === null) {
    return { kind: "movie", watched: records.length > 0 };
  }
  const distinct = new Set(
    records
      .filter(
        (r) =>
          r.episode !== null &&
          (!range || (r.episode >= range.start && r.episode <= range.end)),
      )
      .map((r) => `${r.season ?? 0}:${r.episode}`),
  );
  const total = range ? range.end - range.start + 1 : content.episode_count;
  const watched = Math.min(distinct.size, total);
  return { kind: "series", watched, total, percent: Math.round((watched / total) * 100) };
}

// Distinct episodes of one season watched out of that season's own episode count.
export function computeSeasonProgress(
  records: { season: number | null; episode: number | null }[],
  season: number,
  total: number,
): Progress {
  const distinct = new Set(
    records.filter((r) => r.season === season && r.episode !== null).map((r) => r.episode),
  );
  const watched = Math.min(distinct.size, total);
  return {
    kind: "series",
    watched,
    total,
    percent: total > 0 ? Math.round((watched / total) * 100) : 0,
  };
}

// Progress of each season that has at least one record, e.g. "시즌 2 5/13화 · 38%".
export function seasonProgressLabels(
  records: { season: number | null; episode: number | null }[],
  seasons: { season_number: number; episode_count: number }[],
) {
  return seasons.flatMap((season) => {
    const progress = computeSeasonProgress(records, season.season_number, season.episode_count);
    return progress.kind === "series" && progress.watched > 0
      ? [`시즌 ${season.season_number} ${progressLabel(progress)}`]
      : [];
  });
}

// Progress of each 기수 that has at least one record, e.g. "2기 8/25화 · 32%".
export function partProgressLabels(
  content: { kind: string; episode_count: number | null },
  records: { season: number | null; episode: number | null }[],
  parts: { number: number; start: number; end: number }[],
) {
  return parts.flatMap((part) => {
    const progress = computeProgress(content, records, part);
    return progress.kind === "series" && progress.watched > 0
      ? [`${part.number}기 ${progressLabel(progress)}`]
      : [];
  });
}

// Movies have no progress to show; only series get a label.
export function progressLabel(progress: Progress) {
  return progress.kind === "movie"
    ? null
    : `${progress.watched}/${progress.total}화 · ${progress.percent}%`;
}
