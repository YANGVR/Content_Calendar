// Display-only seasons (기수) for anime that TMDB lists as one long season,
// taken from a community "Seasons" episode group. Records keep TMDB's own
// episode numbers; parts only change how episodes are grouped and labelled.

export type SeasonPart = { number: number; start: number; end: number };

type GroupEpisode = { season_number: number; episode_number: number };
type Group = { order: number; episodes: GroupEpisode[] };

// Builds parts from one episode group when it splits season 1's episodes
// 1..total into consecutive, non-overlapping ranges; null otherwise.
export function partsFromGroup(groups: Group[], total: number): SeasonPart[] | null {
  const ranges = groups
    .map((g) => g.episodes.filter((e) => e.season_number === 1).map((e) => e.episode_number))
    .filter((eps) => eps.length > 0)
    .map((eps) => ({ start: Math.min(...eps), end: Math.max(...eps), count: eps.length }))
    .sort((a, b) => a.start - b.start);
  if (ranges.length < 2) return null;

  let next = 1;
  for (const range of ranges) {
    if (range.start !== next || range.count !== range.end - range.start + 1) return null;
    next = range.end + 1;
  }
  if (next - 1 !== total) return null;

  return ranges.map((r, i) => ({ number: i + 1, start: r.start, end: r.end }));
}

export function partOf(parts: SeasonPart[], episode: number) {
  return parts.find((p) => episode >= p.start && episode <= p.end) ?? null;
}

// "2기 3화" for absolute episode 28 when 2기 covers 26–50.
export function partEpisodeLabel(parts: SeasonPart[], episode: number) {
  const part = partOf(parts, episode);
  return part ? `${part.number}기 ${episode - part.start + 1}화` : `${episode}화`;
}
