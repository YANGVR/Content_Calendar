import Link from "next/link";
import { FilmIcon, StarIcon } from "lucide-react";

import { hrefWith } from "@/components/filter-chips";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DeleteContentButton } from "@/lib/contents/delete-content-button";
import { contentImageSrc } from "@/lib/contents/image";
import { countByKind, KindFilter, parseKind } from "@/lib/contents/kind-filter";
import { CONTENT_KIND_LABELS } from "@/lib/contents/kinds";
import {
  listMyContents,
  signImageUrls,
  type ContentWithRecords,
} from "@/lib/contents/queries";
import { Thumbnail } from "@/lib/contents/thumbnail";
import { computeProgress, progressLabel } from "@/lib/records/progress";

export default async function ContentsPage({ searchParams }: PageProps<"/contents">) {
  const kind = parseKind((await searchParams).kind);
  const all = await listMyContents();
  const contents = kind ? all.filter((c) => c.kind === kind) : all;
  const imageUrls = await signImageUrls(contents.map((c) => c.image_path));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">내 콘텐츠</h1>
        <Link href="/contents/new" className={buttonVariants()}>
          직접 추가
        </Link>
      </div>

      {all.length > 0 && (
        <KindFilter
          current={kind}
          counts={countByKind(all)}
          hrefFor={(k) => hrefWith("/contents", { kind: k })}
        />
      )}

      {all.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilmIcon />
            </EmptyMedia>
            <EmptyTitle>아직 내 콘텐츠가 없어요</EmptyTitle>
            <EmptyDescription>
              작품을 검색해 기록하거나, 없는 작품은 직접 추가해 보세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/search" className={buttonVariants()}>
              작품 검색
            </Link>
          </EmptyContent>
        </Empty>
      ) : contents.length === 0 ? (
        <p className="text-sm text-muted-foreground">이 종류의 콘텐츠가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {contents.map((content) => (
            <ContentRow
              key={content.id}
              content={content}
              imageSrc={contentImageSrc(content, imageUrls)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function ContentRow({
  content,
  imageSrc,
}: {
  content: ContentWithRecords;
  imageSrc?: string;
}) {
  const progress = progressLabel(computeProgress(content, content.watch_records));
  return (
    <li className="flex items-center gap-2">
      <Link
        href={`/contents/${content.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
      >
        <Thumbnail src={imageSrc} alt={content.title} />
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
      </Link>
      {content.source === "custom" && (
        <DeleteContentButton contentId={content.id} title={content.title} />
      )}
    </li>
  );
}
