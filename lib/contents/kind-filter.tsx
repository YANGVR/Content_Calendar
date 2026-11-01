import { FilterChips } from "@/components/filter-chips";

import { CONTENT_KIND_LABELS, CONTENT_KINDS, isContentKind, type ContentKind } from "./kinds";

export function parseKind(value: string | string[] | undefined) {
  return typeof value === "string" && isContentKind(value) ? value : null;
}

// Kind chips (전체 · 영화 · 드라마 · …) with counts. Kinds with nothing to
// show are left out.
export function KindFilter({
  current,
  counts,
  hrefFor,
}: {
  current: ContentKind | null;
  counts: Partial<Record<ContentKind, number>>;
  hrefFor: (kind: ContentKind | null) => string;
}) {
  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  return (
    <FilterChips
      label="종류"
      chips={[
        { key: "all", label: `전체 ${total}`, href: hrefFor(null), active: current === null },
        ...CONTENT_KINDS.filter((kind) => counts[kind]).map((kind) => ({
          key: kind,
          label: `${CONTENT_KIND_LABELS[kind]} ${counts[kind]}`,
          href: hrefFor(kind),
          active: current === kind,
        })),
      ]}
    />
  );
}

export function countByKind(items: { kind: ContentKind }[]) {
  const counts: Partial<Record<ContentKind, number>> = {};
  for (const item of items) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  return counts;
}
