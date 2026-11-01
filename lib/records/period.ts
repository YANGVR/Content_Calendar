import { formatKoreanDate } from "./dates";

export const PERIODS = ["day", "week", "month", "year"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  day: "일별",
  week: "주별",
  month: "월별",
  year: "연도별",
};

export function parsePeriod(value: string | string[] | undefined): Period | null {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value)
    ? (value as Period)
    : null;
}

function toUtc(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Group key (sortable) and label for a "YYYY-MM-DD" date. Weeks run Monday
// to Sunday.
export function periodOf(isoDate: string, period: Period) {
  const [year, month] = isoDate.split("-").map(Number);
  switch (period) {
    case "day":
      return { key: isoDate, label: formatKoreanDate(isoDate) };
    case "month":
      return { key: isoDate.slice(0, 7), label: `${year}년 ${month}월` };
    case "year":
      return { key: isoDate.slice(0, 4), label: `${year}년` };
    case "week": {
      const date = toUtc(isoDate);
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      const [, sm, sd] = iso(monday).split("-").map(Number);
      const [, em, ed] = iso(sunday).split("-").map(Number);
      return {
        key: iso(monday),
        label: `${monday.getUTCFullYear()}년 ${sm}월 ${sd}일 – ${sm === em ? "" : `${em}월 `}${ed}일`,
      };
    }
  }
}

// Groups items by period of their date, newest first. Items without a date
// are left out.
export function groupByPeriod<T>(
  items: T[],
  dateOf: (item: T) => string | null,
  period: Period,
) {
  const groups = new Map<string, { key: string; label: string; items: T[] }>();
  for (const item of items) {
    const date = dateOf(item);
    if (!date) continue;
    const { key, label } = periodOf(date, period);
    const group = groups.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
}
