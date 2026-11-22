import { describe, expect, it } from "vitest";

import {
  computeProgress,
  computeSeasonProgress,
  progressLabel,
  seasonProgressLabels,
} from "./progress";

describe("computeProgress", () => {
  it("서로 다른 회차만 세고 재시청은 한 번으로 친다", () => {
    const records = [
      ...Array.from({ length: 12 }, (_, i) => ({ season: null, episode: i + 1 })),
      { season: null, episode: 3 },
    ];
    const progress = computeProgress({ kind: "drama", episode_count: 16 }, records);
    expect(progressLabel(progress)).toBe("12/16화 · 75%");
  });

  it("시즌이 다르면 같은 화 번호도 다른 회차로 센다", () => {
    const progress = computeProgress({ kind: "drama", episode_count: 22 }, [
      { season: 1, episode: 1 },
      { season: 2, episode: 1 },
    ]);
    expect(progress).toMatchObject({ watched: 2, total: 22 });
  });

  it("기수 범위를 주면 그 기의 회차만 그 기의 길이로 센다", () => {
    const records = [1, 2, 3, 26, 27].map((episode) => ({ season: 1, episode }));
    const content = { kind: "anime", episode_count: 75 };
    expect(progressLabel(computeProgress(content, records, { start: 1, end: 25 }))).toBe(
      "3/25화 · 12%",
    );
    expect(progressLabel(computeProgress(content, records, { start: 26, end: 50 }))).toBe(
      "2/25화 · 8%",
    );
  });

  it("시즌별 진행률은 그 시즌의 회차만 그 시즌의 길이로 센다", () => {
    const records = [
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
      { season: 1, episode: 2 },
      { season: 2, episode: 1 },
    ];
    expect(progressLabel(computeSeasonProgress(records, 1, 7))).toBe("2/7화 · 29%");
    expect(
      seasonProgressLabels(records, [
        { season_number: 1, episode_count: 7 },
        { season_number: 2, episode_count: 13 },
        { season_number: 3, episode_count: 13 },
      ]),
    ).toEqual(["시즌 1 2/7화 · 29%", "시즌 2 1/13화 · 8%"]);
  });

  it("영화는 진행률을 표시하지 않는다", () => {
    expect(
      progressLabel(computeProgress({ kind: "movie", episode_count: null }, [{ season: null, episode: null }])),
    ).toBeNull();
  });
});
