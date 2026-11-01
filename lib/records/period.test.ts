import { describe, expect, it } from "vitest";

import { groupByPeriod, periodOf } from "./period";

describe("periodOf", () => {
  it("주는 월요일부터 일요일까지로 묶는다", () => {
    // 2026-11-01 is a Sunday, so its week starts Monday 2026-10-26.
    expect(periodOf("2026-11-01", "week")).toEqual({
      key: "2026-10-26",
      label: "2026년 10월 26일 – 11월 1일",
    });
    expect(periodOf("2026-11-04", "week").label).toBe("2026년 11월 2일 – 8일");
  });

  it("월·연도·일 라벨을 만든다", () => {
    expect(periodOf("2026-03-09", "month")).toEqual({ key: "2026-03", label: "2026년 3월" });
    expect(periodOf("2026-03-09", "year")).toEqual({ key: "2026", label: "2026년" });
    expect(periodOf("2026-11-01", "day").label).toBe("2026년 11월 1일 (일)");
  });
});

describe("groupByPeriod", () => {
  it("기간별로 묶고 최신 기간부터, 날짜 없는 항목은 뺀다", () => {
    const groups = groupByPeriod(
      [
        { id: 1, d: "2025-12-31" },
        { id: 2, d: "2026-01-02" },
        { id: 3, d: null },
        { id: 4, d: "2026-05-01" },
      ],
      (x) => x.d,
      "year",
    );
    expect(groups.map((g) => [g.label, g.items.map((x) => x.id)])).toEqual([
      ["2026년", [2, 4]],
      ["2025년", [1]],
    ]);
  });
});
