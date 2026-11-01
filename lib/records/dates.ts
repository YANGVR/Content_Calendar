// Viewing dates are calendar days in Korea, independent of the server's zone.
const TIME_ZONE = "Asia/Seoul";

export function todayInKorea(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function formatKoreanDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

// "11.1 (일)" for dates shown inside a week, month or year group.
export function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split("-").map(Number);
  const weekday = formatKoreanDate(isoDate).slice(-2, -1);
  return `${month}.${day} (${weekday})`;
}

// Local-midnight Date for a "YYYY-MM-DD" string, for calendar components.
export function isoToLocalDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export type WatchedPrecision = "day" | "year";

// How a record's viewing date reads: a full date, just a year, or "기타"
// when no date was recorded.
export function formatWatched(
  watchedOn: string | null,
  precision: WatchedPrecision,
) {
  if (!watchedOn) return "기타";
  return precision === "year" ? `${watchedOn.slice(0, 4)}년` : formatKoreanDate(watchedOn);
}
