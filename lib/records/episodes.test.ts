import { describe, expect, it } from "vitest";

import { episodeLabel, episodeRange, parseEpisodes } from "./episodes";

describe("parseEpisodes", () => {
  it("실제 회차만 남기고 중복을 없앤다", () => {
    expect(
      parseEpisodes(["3", "1", "3", "0", "17", "x", "2.5"], episodeRange(16)),
    ).toEqual([1, 3]);
  });

  it("TMDB 시즌처럼 번호가 이어지지 않아도 목록에 있는 회차만 받는다", () => {
    expect(parseEpisodes(["5", "6", "7"], [5, 7])).toEqual([5, 7]);
  });
});

describe("episodeLabel", () => {
  it("영화, 단일 시즌, 여러 시즌을 구분해 표시한다", () => {
    expect(episodeLabel(null, null, null)).toBe("영화");
    expect(episodeLabel(null, 3, null)).toBe("3화");
    expect(episodeLabel(1, 3, 1)).toBe("3화");
    expect(episodeLabel(2, 3, 2)).toBe("시즌 2 · 3화");
  });
});
