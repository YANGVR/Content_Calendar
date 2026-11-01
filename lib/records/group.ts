export type DatedItem = { watched_on: string | null };

// Groups items by viewing date, newest first. Undated items are left out:
// they belong to content history, not to the date views.
export function groupByDate<T extends DatedItem>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!item.watched_on) continue;
    const group = groups.get(item.watched_on) ?? [];
    group.push(item);
    groups.set(item.watched_on, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, records]) => ({ date, records }));
}
