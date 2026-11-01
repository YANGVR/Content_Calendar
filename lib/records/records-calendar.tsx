"use client";

import { ko } from "react-day-picker/locale";
import { useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { contentImageSrc } from "@/lib/contents/image";

import { formatKoreanDate, isoToLocalDate, localDateToIso } from "./dates";
import { groupByDate } from "./group";
import type { WatchRecord } from "./queries";
import { RecordItem } from "./record-item";

// Month calendar marking days with records; picking a day lists its records.
export function RecordsCalendar({
  records,
  imageUrls,
  episodeTexts,
  today,
}: {
  records: WatchRecord[];
  imageUrls: Record<string, string>;
  episodeTexts: Record<string, string>;
  today: string;
}) {
  const groups = useMemo(() => groupByDate(records), [records]);
  const byDate = useMemo(
    () => new Map(groups.map((g) => [g.date, g.records])),
    [groups],
  );
  const [selected, setSelected] = useState(today);
  const selectedRecords = byDate.get(selected) ?? [];

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <Calendar
        mode="single"
        locale={ko}
        selected={isoToLocalDate(selected)}
        onSelect={(date) => date && setSelected(localDateToIso(date))}
        defaultMonth={isoToLocalDate(today)}
        modifiers={{ watched: groups.map((g) => isoToLocalDate(g.date)) }}
        modifiersClassNames={{
          watched:
            "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
        }}
        className="rounded-lg border [--cell-size:--spacing(10)]"
      />
      <section className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="font-medium">{formatKoreanDate(selected)}</h2>
        {selectedRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">이날 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {selectedRecords.map((record) => (
              <RecordItem
                key={record.id}
                record={record}
                imageUrl={contentImageSrc(record.content, imageUrls)}
                episodeText={episodeTexts[record.id]}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
