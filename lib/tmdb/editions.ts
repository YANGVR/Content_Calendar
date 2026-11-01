// Alternate editions TMDB lists as separate titles with no link between them
// (e.g. a re-edited "director's cut"). Each entry adds a button on the base
// title's page and gives the edition season a Korean title.

export type Edition = {
  label: string;
  tmdbId: number;
  season: number;
  title: string;
};

type EditionEntry = Edition & { baseId: number; basePart: number };

const EDITIONS: EditionEntry[] = [
  {
    // Re:ゼロから始める異世界生活 新編集版: season 1 re-edited into 13 episodes (2020).
    baseId: 65942,
    basePart: 1,
    label: "1기 감독판",
    tmdbId: 330431,
    season: 1,
    title: "Re: 제로부터 시작하는 이세계 생활 1기 감독판",
  },
];

export function editionPath(edition: Pick<Edition, "tmdbId" | "season">) {
  return `/tmdb/tv/${edition.tmdbId}/${edition.season}`;
}

// Editions to offer on a base title's page, placed after the given part.
export function editionsOf(baseId: number) {
  return EDITIONS.filter((e) => e.baseId === baseId);
}

// The edition a TMDB season is, if any, with the way back to its base title.
export function editionFor(tmdbId: number, season: number) {
  return EDITIONS.find((e) => e.tmdbId === tmdbId && e.season === season) ?? null;
}
