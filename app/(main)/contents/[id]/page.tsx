import { notFound, redirect } from "next/navigation";

import { ContentDetail } from "@/lib/contents/content-detail";
import { contentImageSrc } from "@/lib/contents/image";
import { getContent, signImageUrls } from "@/lib/contents/queries";
import { tmdbPath } from "@/lib/contents/tmdb-content";
import { addRecords } from "@/lib/records/actions";
import { getEpisodeOptions } from "@/lib/records/episode-options";
import { listRecordsForContent } from "@/lib/records/queries";

export default async function ContentPage({
  params,
  searchParams,
}: PageProps<"/contents/[id]">) {
  const { id } = await params;
  const { season } = await searchParams;
  const content = await getContent(id);
  if (!content) notFound();

  // TMDB titles have one page, keyed by their TMDB identity.
  if (content.source === "tmdb" && content.tmdb_type && content.tmdb_id) {
    const query = typeof season === "string" ? `?season=${season}` : "";
    redirect(
      tmdbPath(content.tmdb_type, content.tmdb_id, content.tmdb_season) + query,
    );
  }

  const [records, imageUrls, options] = await Promise.all([
    listRecordsForContent(id),
    signImageUrls([content.image_path]),
    getEpisodeOptions(content, Number(season) || undefined),
  ]);

  return (
    <ContentDetail
      content={content}
      imageSrc={contentImageSrc(content, imageUrls)}
      options={options}
      records={records}
      recordAction={addRecords.bind(null, content.id)}
      seasonHref={(s) => `/contents/${content.id}?season=${s}`}
    />
  );
}
