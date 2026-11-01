import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { CONTENT_KIND_LABELS } from "@/lib/contents/kinds";
import { Thumbnail } from "@/lib/contents/thumbnail";

import { episodeLabel } from "./episodes";
import type { WatchRecord } from "./queries";

// One watch record row: thumbnail, title, kind and episode, linking to the content.
export function RecordItem({
  record,
  imageUrl,
  dateLabel,
  episodeText,
  linkable = true,
}: {
  record: WatchRecord;
  imageUrl?: string;
  // Viewing date, shown when the list groups by week, month or year.
  dateLabel?: string;
  // Overrides the episode label, e.g. "2기 3화" for a split single-season anime.
  episodeText?: string;
  // False on a friend's page: their contents are not yours to open.
  linkable?: boolean;
}) {
  const body = (
    <>
        <Thumbnail src={imageUrl} alt={record.content.title} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">{record.content.title}</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {CONTENT_KIND_LABELS[record.content.kind]}
            </Badge>
            <span>
              {episodeText ??
                episodeLabel(record.season, record.episode, record.content.season_count)}
            </span>
            {dateLabel && <span>· {dateLabel}</span>}
          </div>
        </div>
    </>
  );
  return (
    <li>
      {linkable ? (
        <Link
          href={`/contents/${record.content_id}`}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-lg p-2">{body}</div>
      )}
    </li>
  );
}
