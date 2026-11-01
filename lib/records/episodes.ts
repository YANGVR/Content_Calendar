import { partEpisodeLabel, type SeasonPart } from "@/lib/tmdb/season-parts";

// Parses submitted episode numbers, keeping only the content's real episodes.
export function parseEpisodes(values: string[], allowed: number[]) {
  const allowedSet = new Set(allowed);
  const episodes = new Set<number>();
  for (const value of values) {
    const episode = Number(value);
    if (Number.isInteger(episode) && allowedSet.has(episode)) {
      episodes.add(episode);
    }
  }
  return [...episodes].sort((a, b) => a - b);
}

export function episodeRange(count: number) {
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function episodeLabel(
  season: number | null,
  episode: number | null,
  seasonCount: number | null,
  parts: SeasonPart[] | null = null,
) {
  if (episode === null) return "영화";
  if (parts) return partEpisodeLabel(parts, episode);
  return season !== null && (seasonCount ?? 1) > 1
    ? `시즌 ${season} · ${episode}화`
    : `${episode}화`;
}
