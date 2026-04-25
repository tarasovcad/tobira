"use client";

import * as React from "react";
import Image from "next/image";
import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {PostBookmarkMetadata} from "@/components/bookmark/types/metadata";

type PostMediaItem = PostBookmarkMetadata["media_extended"][number];

function buildTwitterSizedUrl(url: string, size: "small" | "large"): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pbs.twimg.com")) return null;
    u.searchParams.set("name", size);
    return u.toString();
  } catch {
    return null;
  }
}

function mediaThumbnail(m: PostMediaItem): string {
  return m.thumbnail_url ?? m.url;
}

// ── 0 images ──────────────────────────────────────────────────────────────────

function NoMediaPanel({meta}: {meta: PostBookmarkMetadata}) {
  return (
    <div className="bg-muted relative flex aspect-video w-full items-center justify-center overflow-hidden border-b px-8">
      <div className="flex w-full max-w-[400px] flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-background ring-border h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1">
            <Image
              src={meta.user_profile_image_url}
              alt={meta.user_name}
              width={32}
              height={32}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-foreground truncate text-[13px] font-semibold">
              {meta.user_name}
            </span>
            <span className="text-muted-foreground text-[12px]">@{meta.user_screen_name}</span>
          </div>
        </div>

        <p className="text-foreground line-clamp-5 text-[14px] leading-snug whitespace-pre-wrap">
          {meta.text}
        </p>
      </div>
    </div>
  );
}

// ── 1–4 images ────────────────────────────────────────────────────────────────

function MediaPanel({media}: {media: PostMediaItem[]}) {
  const count = Math.min(media.length, 4);
  const items = media.slice(0, count);

  return (
    <div className="relative aspect-video w-full overflow-hidden border-b">
      <div
        className={cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((m, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = m.type === "video" || m.type === "gif";
          const displaySrc = m.url_small ?? m.url;
          const fullSrc = m.url_large ?? buildTwitterSizedUrl(m.url, "large") ?? m.url;

          return (
            <div
              key={m.url}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              <MediaPreview
                src={displaySrc}
                fullSizeSrc={isVideo ? undefined : fullSrc}
                alt={m.altText ?? ""}
                width={m.size?.width ?? 1200}
                height={m.size?.height ?? 1200}
                poster={mediaThumbnail(m)}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PostBookmarkMenu({meta}: {meta: PostBookmarkMetadata}) {
  const hasMedia = meta.hasMedia && meta.media_extended.length > 0;
  return hasMedia ? <MediaPanel media={meta.media_extended} /> : <NoMediaPanel meta={meta} />;
}
