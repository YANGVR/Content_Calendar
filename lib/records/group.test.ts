import { describe, expect, it } from "vitest";

import { groupByDate } from "./group";

describe("groupByDate", () => {
  it("날짜별로 묶고 최신 날짜부터 정렬한다", () => {
    const groups = groupByDate([
      { id: "a", watched_on: "2026-10-01" },
      { id: "b", watched_on: "2026-10-03" },
      { id: "c", watched_on: "2026-10-01" },
    ]);

    expect(groups.map((g) => g.date)).toEqual(["2026-10-03", "2026-10-01"]);
    expect(groups[1].records.map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("날짜 모름 기록은 날짜별 보기에서 뺀다", () => {
    expect(groupByDate([{ id: "a", watched_on: null }])).toEqual([]);
  });
});
