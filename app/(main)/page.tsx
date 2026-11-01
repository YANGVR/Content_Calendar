import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTENT_KIND_LABELS } from "@/lib/contents/kinds";
import {
  expandAnimeSeasons,
  getLatest,
  type LatestKind,
  type TmdbListItem,
} from "@/lib/tmdb/api";
import { posterUrl } from "@/lib/tmdb/classify";

const KINDS: LatestKind[] = ["movie", "drama", "anime", "variety"];

// Home: TMDB's latest titles by kind, each opening its page to record.
export default async function HomePage() {
  const lists = await Promise.allSettled(
    KINDS.map(async (kind) => {
      const items = await getLatest(kind);
      return kind === "anime" ? expandAnimeSeasons(items, () => true) : items;
    }),
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">최신 콘텐츠</h1>
        <p className="text-sm text-muted-foreground">
          지금 상영 중인 영화와 최근 방영을 시작한 작품이에요.
        </p>
      </div>
      <Tabs defaultValue="movie">
        <TabsList>
          {KINDS.map((kind) => (
            <TabsTrigger key={kind} value={kind}>
              {CONTENT_KIND_LABELS[kind]}
            </TabsTrigger>
          ))}
        </TabsList>
        {KINDS.map((kind, i) => {
          const list = lists[i];
          return (
            <TabsContent key={kind} value={kind} className="pt-4">
              {list.status === "rejected" ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    TMDB에서 목록을 가져오지 못했어요. 잠시 뒤 다시 시도해 주세요.
                  </AlertDescription>
                </Alert>
              ) : list.value.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  지금은 보여줄 작품이 없어요.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                  {list.value.map((item) => (
                    <LatestCard key={item.href} item={item} />
                  ))}
                </ul>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}

function LatestCard({ item }: { item: TmdbListItem }) {
  const src = posterUrl(item.posterPath, "w342");
  return (
    <li>
      <Link
        href={item.href}
        className="group flex flex-col gap-2"
      >
        <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
          {src && (
            // TMDB posters are already sized by the image CDN.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={item.title}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="line-clamp-2 text-sm font-medium">{item.title}</span>
          {item.date && (
            <span className="text-xs text-muted-foreground">
              {item.date.replaceAll("-", ".")}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
