import Link from "next/link";
import { CalendarDaysIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contentImageSrc } from "@/lib/contents/image";
import { KindFilter, parseKind } from "@/lib/contents/kind-filter";
import type { ContentKind } from "@/lib/contents/kinds";
import { signImageUrls } from "@/lib/contents/queries";
import { FilterChips, hrefWith } from "@/components/filter-chips";
import { formatShortDate, todayInKorea } from "@/lib/records/dates";
import { groupByPeriod, parsePeriod, PERIOD_LABELS, PERIODS } from "@/lib/records/period";
import { listMyDatedRecords } from "@/lib/records/queries";
import { getContentParts } from "@/lib/records/episode-options";
import { RecordItem } from "@/lib/records/record-item";
import { partEpisodeLabel } from "@/lib/tmdb/season-parts";
import { RecordsCalendar } from "@/lib/records/records-calendar";

export default async function RecordsPage({ searchParams }: PageProps<"/records">) {
  const params = await searchParams;
  const kind = parseKind(params.kind);
  const period = parsePeriod(params.by) ?? "day";
  const allRecords = await listMyDatedRecords();
  const records = kind
    ? allRecords.filter((r) => r.content.kind === kind)
    : allRecords;
  const counts: Partial<Record<ContentKind, number>> = {};
  for (const r of allRecords) {
    counts[r.content.kind] = (counts[r.content.kind] ?? 0) + 1;
  }
  const imageUrls = await signImageUrls(
    records.map((r) => r.content.image_path),
  );
  // "2기 3화" labels for single-season anime split into display-only parts.
  const contentsById = new Map(records.map((r) => [r.content.id, r.content]));
  const partsById = new Map(
    await Promise.all(
      [...contentsById.values()].map(
        async (c) => [c.id, await getContentParts(c)] as const,
      ),
    ),
  );
  const episodeTexts: Record<string, string> = {};
  for (const r of records) {
    const parts = partsById.get(r.content.id);
    if (parts && r.episode !== null) episodeTexts[r.id] = partEpisodeLabel(parts, r.episode);
  }
  const groups = groupByPeriod(
    records,
    (r) => (period === "year" || r.watched_precision === "day" ? r.watched_on : null),
    period,
  );
  const byParam = period === "day" ? null : period;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">시청 기록</h1>
        <Link href="/search" className={buttonVariants()}>
          기록 추가
        </Link>
      </div>

      {allRecords.length > 0 && (
        <KindFilter
          current={kind}
          counts={counts}
          hrefFor={(k) => hrefWith("/records", { kind: k, by: byParam })}
        />
      )}

      {records.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDaysIcon />
            </EmptyMedia>
            <EmptyTitle>아직 날짜가 있는 기록이 없어요</EmptyTitle>
            <EmptyDescription>
              콘텐츠를 고르고 본 회차와 날짜를 기록해 보세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/search" className={buttonVariants()}>
              기록 추가
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="calendar">달력</TabsTrigger>
            <TabsTrigger value="list">목록</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="flex flex-col gap-6 pt-4">
            <FilterChips
              label="묶어 보기"
              chips={PERIODS.map((p) => ({
                key: p,
                label: PERIOD_LABELS[p],
                href: hrefWith("/records", { kind, by: p === "day" ? null : p }),
                active: p === period,
              }))}
            />
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {group.label}
                  {period !== "day" && ` · ${group.items.length}건`}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((record) => (
                    <RecordItem
                      key={record.id}
                      record={record}
                      imageUrl={contentImageSrc(record.content, imageUrls)}
                      episodeText={episodeTexts[record.id]}
                      dateLabel={
                        period === "day" || !record.watched_on
                          ? undefined
                          : record.watched_precision === "year"
                            ? "연도만 기록"
                            : formatShortDate(record.watched_on)
                      }
                    />
                  ))}
                </ul>
              </section>
            ))}
          </TabsContent>
          <TabsContent value="calendar" className="pt-4">
            <RecordsCalendar
              records={records.filter((r) => r.watched_precision === "day")}
              imageUrls={Object.fromEntries(imageUrls)}
              episodeTexts={episodeTexts}
              today={todayInKorea()}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
