import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { contentImageSrc } from "@/lib/contents/image";
import { CONTENT_KIND_LABELS } from "@/lib/contents/kinds";
import {
  searchMyCustomContents,
  signImageUrls,
  type Content,
} from "@/lib/contents/queries";
import { Thumbnail } from "@/lib/contents/thumbnail";
import {
  expandAnimeSeasons,
  searchTmdb,
  type TmdbSearchResult,
} from "@/lib/tmdb/api";
import { posterUrl } from "@/lib/tmdb/classify";

const ROW =
  "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim();

  let mine: Content[] = [];
  let tmdb: TmdbSearchResult[] = [];
  let tmdbFailed = false;
  if (query) {
    const [mineResult, tmdbResult] = await Promise.allSettled([
      searchMyCustomContents(query),
      searchTmdb(query),
    ]);
    if (mineResult.status === "fulfilled") mine = mineResult.value;
    if (tmdbResult.status === "fulfilled") {
      tmdb = await expandAnimeSeasons(tmdbResult.value, (r) => r.kind === "anime");
    } else tmdbFailed = true;
  }
  const imageUrls = await signImageUrls(mine.map((c) => c.image_path));
  const noResults = query && mine.length === 0 && tmdb.length === 0;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">콘텐츠 검색</h1>
      <form action="/search" className="flex gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="제목의 일부를 입력하세요"
          aria-label="검색어"
          autoFocus
        />
        <Button type="submit">
          <SearchIcon data-icon="inline-start" />
          검색
        </Button>
      </form>

      {tmdbFailed && (
        <Alert variant="destructive">
          <AlertDescription>
            TMDB 검색에 실패했어요. 잠시 뒤 다시 시도해 주세요.
          </AlertDescription>
        </Alert>
      )}

      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            내가 추가한 콘텐츠
          </h2>
          <ul className="flex flex-col gap-1">
            {mine.map((content) => (
              <li key={content.id}>
                <Link href={`/contents/${content.id}`} className={ROW}>
                  <Thumbnail
                    src={contentImageSrc(content, imageUrls)}
                    alt={content.title}
                  />
                  <ResultText
                    title={content.title}
                    kind={CONTENT_KIND_LABELS[content.kind]}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tmdb.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">TMDB</h2>
          <ul className="flex flex-col gap-1">
            {tmdb.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={ROW}>
                  <Thumbnail src={posterUrl(item.posterPath)} alt={item.title} />
                  <ResultText
                    title={item.title}
                    kind={CONTENT_KIND_LABELS[item.kind]}
                    year={item.date.slice(0, 4)}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {noResults ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>{`'${query}' 검색 결과가 없어요`}</EmptyTitle>
            <EmptyDescription>
              찾는 콘텐츠가 없다면 직접 추가해서 기록할 수 있어요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/contents/new" className={buttonVariants()}>
              직접 추가
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <p className="text-sm text-muted-foreground">
          찾는 콘텐츠가 없나요?{" "}
          <Link
            href="/contents/new"
            className="font-medium text-foreground underline underline-offset-4"
          >
            직접 추가
          </Link>
        </p>
      )}
    </>
  );
}

function ResultText({
  title,
  kind,
  year,
}: {
  title: string;
  kind: string;
  year?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate font-medium">{title}</span>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{kind}</Badge>
        {year && <span>{year}</span>}
      </div>
    </div>
  );
}
