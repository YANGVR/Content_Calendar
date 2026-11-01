import Link from "next/link";
import { Fragment } from "react";

import { buttonVariants } from "@/components/ui/button";

// Season switcher for multi-season series; each season is a link so the
// server loads that season's real episodes.
export function SeasonPicker({
  seasons,
  current,
  hrefFor,
  label = (season) => `시즌 ${season}`,
  ariaLabel = "시즌",
  extras = [],
}: {
  seasons: number[];
  current: number | null;
  hrefFor: (season: number) => string;
  label?: (season: number) => string;
  ariaLabel?: string;
  // Extra links placed right after season `after`, e.g. an alternate edition.
  extras?: { label: string; href: string; after: number; active?: boolean }[];
}) {
  if (seasons.length < 2) return null;
  const chip = (active: boolean) =>
    buttonVariants({ variant: active ? "default" : "outline", size: "sm" });
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {seasons.map((season) => (
        <Fragment key={season}>
          <Link
            href={hrefFor(season)}
            aria-current={season === current ? "page" : undefined}
            className={chip(season === current)}
          >
            {label(season)}
          </Link>
          {extras
            .filter((extra) => extra.after === season)
            .map((extra) => (
              <Link
                key={extra.href}
                href={extra.href}
                aria-current={extra.active ? "page" : undefined}
                className={chip(!!extra.active)}
              >
                {extra.label}
              </Link>
            ))}
        </Fragment>
      ))}
    </nav>
  );
}
