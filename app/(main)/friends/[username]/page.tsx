import Link from "next/link";
import { notFound } from "next/navigation";
import { LockIcon, StarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contentImageSrc } from "@/lib/contents/image";
import { CONTENT_KIND_LABELS } from "@/lib/contents/kinds";
import { listMyContents, signImageUrls } from "@/lib/contents/queries";
import { Thumbnail } from "@/lib/contents/thumbnail";
import { getFriend } from "@/lib/friends/queries";
import { todayInKorea } from "@/lib/records/dates";
import { groupByPeriod } from "@/lib/records/period";
import { computeProgress, progressLabel } from "@/lib/records/progress";
import { listMyDatedRecords } from "@/lib/records/queries";
import { RecordItem } from "@/lib/records/record-item";
import { RecordsCalendar } from "@/lib/records/records-calendar";

// A friend's records and contents, read-only. Shown only for accepted
// friends; a private account shows nothing but its name.
export default async function FriendPage({ params }: PageProps<"/friends/[username]">) {
  const { username } = await params;
  const friend = await getFriend(decodeURIComponent(username));
  if (!friend) notFound();

  const header = (
    <div className="flex flex-col gap-1">
      <Link href="/friends" className="text-sm text-muted-foreground hover:underline">
        ← 친구 목록
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{friend.nickname}</h1>
      <p className="text-sm text-muted-foreground">@{friend.username}</p>
    </div>
  );

  if (!friend.is_public) {
    return (
      <>
        {header}
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LockIcon />
            </EmptyMedia>
            <EmptyTitle>비공개 계정이에요</EmptyTitle>
            <EmptyDescription>
              {friend.nickname}님이 기록을 공개하면 볼 수 있어요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    );
  }

  const [records, contents] = await Promise.all([
    listMyDatedRecords(friend.id),
    listMyContents(friend.id),
  ]);
  const imageUrls = await signImageUrls([
    ...records.map((r) => r.content.image_path),
    ...contents.map((c) => c.image_path),
  ]);
  const dayRecords = records.filter((r) => r.watched_precision === "day");
  const groups = groupByPeriod(dayRecords, (r) => r.watched_on, "day");

  return (
    <>
      {header}
      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">시청 기록</TabsTrigger>
          <TabsTrigger value="calendar">달력</TabsTrigger>
          <TabsTrigger value="contents">콘텐츠 {contents.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="flex flex-col gap-6 pt-4">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">날짜가 있는 기록이 없어요.</p>
          ) : (
            groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((record) => (
                    <RecordItem
                      key={record.id}
                      record={record}
                      imageUrl={contentImageSrc(record.content, imageUrls)}
                      linkable={false}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </TabsContent>

        <TabsContent value="calendar" className="pt-4">
          <RecordsCalendar
            records={dayRecords}
            imageUrls={Object.fromEntries(imageUrls)}
            episodeTexts={{}}
            today={todayInKorea()}
            linkable={false}
          />
        </TabsContent>

        <TabsContent value="contents" className="pt-4">
          {contents.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 콘텐츠가 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {contents.map((content) => {
                const progress = progressLabel(computeProgress(content, content.watch_records));
                return (
                  <li key={content.id} className="flex items-center gap-3 rounded-lg p-2">
                    <Thumbnail src={contentImageSrc(content, imageUrls)} alt={content.title} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{content.title}</span>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{CONTENT_KIND_LABELS[content.kind]}</Badge>
                        {progress && <span>{progress}</span>}
                        {content.rating !== null && (
                          <span className="flex items-center gap-1">
                            <StarIcon className="size-3.5 fill-rating text-rating" />
                            {content.rating}
                          </span>
                        )}
                      </div>
                      {content.review && (
                        <p className="truncate text-sm text-muted-foreground">“{content.review}”</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
