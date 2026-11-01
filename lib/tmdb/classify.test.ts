import { describe, expect, it } from "vitest";

import {
  classifyTmdb,
  posterUrl,
  regularEpisodeTotal,
  regularSeasons,
  seasonTitle,
  splitsIntoSeasons,
} from "./classify";

describe("classifyTmdb", () => {
  it("영화는 장르와 상관없이 영화로 분류한다", () => {
    expect(classifyTmdb("movie", [16])).toBe("movie");
  });

  it("TV는 애니메이션 → 애니, 리얼리티·토크 → 예능, 나머지 → 드라마", () => {
    expect(classifyTmdb("tv", [16, 35])).toBe("anime");
    expect(classifyTmdb("tv", [35, 10764])).toBe("variety");
    expect(classifyTmdb("tv", [10767])).toBe("variety");
    expect(classifyTmdb("tv", [18, 80])).toBe("drama");
  });
});

describe("regular seasons", () => {
  const seasons = [
    { season_number: 0, episode_count: 3 },
    { season_number: 2, episode_count: 8 },
    { season_number: 1, episode_count: 10 },
    { season_number: 3, episode_count: 0 },
  ];

  it("스페셜(시즌 0)과 빈 시즌을 빼고 시즌 번호순으로 정렬한다", () => {
    expect(regularSeasons(seasons).map((s) => s.season_number)).toEqual([1, 2]);
  });

  it("정규 시즌의 회차만 더한다", () => {
    expect(regularEpisodeTotal(seasons)).toBe(18);
  });
});

describe("posterUrl", () => {
  it("포스터 경로로 TMDB 이미지 주소를 만든다", () => {
    expect(posterUrl("/a.jpg")).toBe("https://image.tmdb.org/t/p/w185/a.jpg");
    expect(posterUrl(null)).toBeUndefined();
  });
});

describe("splitsIntoSeasons", () => {
  const two = [
    { season_number: 0, episode_count: 3 },
    { season_number: 1, episode_count: 23 },
    { season_number: 2, episode_count: 24 },
  ];
  const one = [
    { season_number: 0, episode_count: 3 },
    { season_number: 1, episode_count: 12 },
  ];

  it("정규 시즌이 두 개 이상인 애니메이션만 기수로 나눈다", () => {
    expect(splitsIntoSeasons("anime", two)).toBe(true);
    expect(splitsIntoSeasons("anime", one)).toBe(false);
    expect(splitsIntoSeasons("drama", two)).toBe(false);
  });

  it("기수 제목을 '제목 N기'로 만든다", () => {
    expect(seasonTitle("무직전생", 2)).toBe("무직전생 2기");
  });
});
