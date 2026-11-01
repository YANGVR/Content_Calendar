import { describe, expect, it } from "vitest";

import { computeProgress, progressLabel } from "./progress";

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

  it("영화는 진행률을 표시하지 않는다", () => {
    expect(
      progressLabel(computeProgress({ kind: "movie", episode_count: null }, [{ season: null, episode: null }])),
    ).toBeNull();
  });
});
