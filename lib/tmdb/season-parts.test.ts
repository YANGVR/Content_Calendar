import { describe, expect, it } from "vitest";

import { MANUAL_PARTS, partEpisodeLabel, partsFromGroup } from "./season-parts";

const ep = (n: number, season = 1) => ({ season_number: season, episode_number: n });
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => ep(a + i));

describe("partsFromGroup", () => {
  it("리제로처럼 시즌 1의 회차를 이어지는 기수로 나눈다(스페셜 묶음은 무시)", () => {
    const groups = [
      { order: 1, episodes: range(1, 25) },
      { order: 2, episodes: range(26, 50) },
      { order: 0, episodes: [ep(1, 0), ep(2, 0)] },
      { order: 3, episodes: range(51, 66) },
      { order: 4, episodes: range(67, 85) },
    ];
    expect(partsFromGroup(groups, 85)).toEqual([
      { number: 1, start: 1, end: 25 },
      { number: 2, start: 26, end: 50 },
      { number: 3, start: 51, end: 66 },
      { number: 4, start: 67, end: 85 },
    ]);
  });

  it("빠지거나 겹치는 회차가 있으면 쓰지 않는다", () => {
    expect(partsFromGroup([{ order: 1, episodes: range(1, 10) }, { order: 2, episodes: range(12, 20) }], 20)).toBeNull();
    expect(partsFromGroup([{ order: 1, episodes: range(1, 12) }, { order: 2, episodes: range(10, 20) }], 20)).toBeNull();
    expect(partsFromGroup([{ order: 1, episodes: range(1, 10) }, { order: 2, episodes: range(11, 19) }], 20)).toBeNull();
  });

  it("묶음이 하나뿐이면 나누지 않는다", () => {
    expect(partsFromGroup([{ order: 1, episodes: range(1, 20) }], 20)).toBeNull();
  });
});

describe("partEpisodeLabel", () => {
  it("TMDB 회차 번호를 기수 안의 화 번호로 바꾼다", () => {
    const parts = [
      { number: 1, start: 1, end: 25 },
      { number: 2, start: 26, end: 50 },
    ];
    expect(partEpisodeLabel(parts, 28)).toBe("2기 3화");
    expect(partEpisodeLabel(parts, 1)).toBe("1기 1화");
  });
});

describe("MANUAL_PARTS", () => {
  it("직접 적은 기수는 1화부터 빠짐없이 이어진다", () => {
    for (const parts of Object.values(MANUAL_PARTS)) {
      let next = 1;
      for (const part of parts) {
        expect(part.start).toBe(next);
        next = part.end + 1;
      }
    }
  });

  it("전생 귀족 25화는 3기 1화로 표시한다", () => {
    expect(partEpisodeLabel(MANUAL_PARTS[237150], 25)).toBe("3기 1화");
  });
});
