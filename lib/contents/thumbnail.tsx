import { FilmIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-16 w-11",
  md: "h-24 w-16",
  lg: "h-48 w-32",
};

export function Thumbnail({
  src,
  alt,
  size = "sm",
}: {
  src?: string;
  alt: string;
  size?: keyof typeof SIZES;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
          SIZES[size],
        )}
        aria-label={`${alt} 섬네일 없음`}
      >
        <FilmIcon className="size-5" />
      </div>
    );
  }

  return (
    // Signed Storage URLs expire, so they skip next/image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("shrink-0 rounded-md object-cover", SIZES[size])}
    />
  );
}
