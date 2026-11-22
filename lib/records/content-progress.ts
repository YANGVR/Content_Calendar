import type { ContentView } from "@/lib/contents/queries";

import { getContentParts, getContentSeasons } from "./episode-options";
import {
  computeProgress,
  partProgressLabels,
  progressLabel,
  seasonProgressLabels,
} from "./progress";

type ProgressRecord = { season: number | null; episode: number | null };

// Progress labels of a content for list rows: one per 기수 (split anime) or per
// season (multi-season series) that has records, else a single overall label.
// Movies have none.
export async function contentProgressLabels(
  content: ContentView & { episode_count: number | null },
  records: ProgressRecord[],
) {
  const parts = await getContentParts(content);
  if (parts) return partProgressLabels(content, records, parts);

  const seasons = await getContentSeasons(content);
  if (seasons) return seasonProgressLabels(records, seasons);

  const label = progressLabel(computeProgress(content, records));
  return label ? [label] : [];
}
