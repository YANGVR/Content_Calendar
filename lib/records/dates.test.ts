import { describe, expect, it } from "vitest";

import {
  formatKoreanDate,
  formatShortDate,
  formatWatched,
  isIsoDate,
  isoToLocalDate,
  localDateToIso,
  todayInKorea,
} from "./dates";

describe("dates", () => {
  it("오늘 날짜를 한국 시간 기준으로 정한다", () => {
    // 2026-11-01 16:00 UTC is already 2026-11-02 in Korea.
    expect(todayInKorea(new Date("2026-11-01T16:00:00Z"))).toBe("2026-11-02");
  });

  it("실제로 있는 YYYY-MM-DD만 날짜로 인정한다", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-2-3")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });

  it("한국어 날짜와 요일로 표시한다", () => {
    expect(formatKoreanDate("2026-11-01")).toBe("2026년 11월 1일 (일)");
  });

  it("시청일을 날짜·연도·기타로 표시한다", () => {
    expect(formatWatched("2026-11-01", "day")).toBe("2026년 11월 1일 (일)");
    expect(formatWatched("2019-01-01", "year")).toBe("2019년");
    expect(formatWatched(null, "day")).toBe("기타");
  });

  it("묶음 안의 날짜는 짧게 표시한다", () => {
    expect(formatShortDate("2026-11-01")).toBe("11.1 (일)");
  });

  it("달력용 Date와 ISO 문자열을 오간다", () => {
    expect(localDateToIso(isoToLocalDate("2026-01-09"))).toBe("2026-01-09");
  });
});
