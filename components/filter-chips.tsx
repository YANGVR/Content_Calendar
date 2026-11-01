import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export type FilterChip = { key: string; label: string; href: string; active: boolean };

// A row of link chips that switch a list's filter or grouping via the URL.
export function FilterChips({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-current={chip.active ? "page" : undefined}
          className={buttonVariants({
            variant: chip.active ? "default" : "outline",
            size: "sm",
          })}
        >
          {chip.label}
        </Link>
      ))}
    </nav>
  );
}

// Builds "path?a=1&b=2", dropping empty values.
export function hrefWith(path: string, params: Record<string, string | null>) {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]),
  ).toString();
  return query ? `${path}?${query}` : path;
}
