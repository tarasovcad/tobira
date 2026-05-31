"use client";

import type {ReactNode} from "react";
import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/ui/coss/skeleton";
import {Tag} from "@/components/ui/app/tag";
import MediaPreview from "@/features/media/components/MediaPreview";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import type {PostBookmarkMetadata} from "@/components/bookmark/types/metadata";
import {
  CROSS_FADE_DURATION_MS,
  getFastDelay,
  usePlaceholderDone,
} from "@/components/bookmark/_hooks/use-placeholder-transition";
import {
  getPostBookmarkMediaPreviewItems,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import CrossFade from "../shared/NewBookmarkCrossFade";

const MAX_LENGTH = 280;

function formatFullDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  return `${time} \u00b7 ${date}`;
}

function getPostMetadata(bookmark: Bookmark | null): PostBookmarkMetadata | null {
  const metadata = bookmark?.metadata as PostBookmarkMetadata | undefined;
  return metadata?.platform === "x" ? metadata : null;
}

function getDisplayedText(text: string) {
  if (text.length <= MAX_LENGTH) return text;

  const truncated = text.slice(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

function MediaGrid({media}: {media: PostBookmarkPreviewItem[]}) {
  if (!media.length) return null;

  const count = Math.min(media.length, 4);
  const items = media.slice(0, count);

  let containerAspect = 1.777;
  if (count === 1) {
    const img = items[0];
    containerAspect = Math.max(0.8, Math.min(2.0, img.width / img.height));
  }

  return (
    <div
      className="bg-muted/30 dark:border-border overflow-hidden rounded-[16px] border border-[#CFD9DE]"
      style={{
        aspectRatio: containerAspect,
        maxHeight: count === 1 ? 512 : undefined,
      }}>
      <div
        className={cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((m, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = m.type === "video";
          return (
            <div
              key={m.key}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              <MediaPreview
                src={m.src}
                fullSizeSrc={isVideo ? undefined : m.fullSizeSrc}
                alt={m.alt}
                width={m.width}
                height={m.height}
                poster={m.poster}
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

function MediaSkeleton() {
  return (
    <div className="bg-muted animate-pulse rounded-[16px]" style={{aspectRatio: 1.777}}>
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}

function TextCrossFade({
  loaded,
  delay,
  skeleton,
  children,
}: {
  loaded: boolean;
  delay: number;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative grid min-w-0 grid-cols-1 items-start *:col-start-1 *:row-start-1">
      <div
        className={cn(
          "w-full min-w-0 transition-all",
          loaded ? "pointer-events-none absolute inset-x-0 top-0 opacity-0" : "opacity-100",
        )}
        style={{
          transitionDelay: `${delay}ms`,
          transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
        }}>
        {skeleton}
      </div>
      <div
        className={cn(
          "w-full min-w-0 transition-all",
          loaded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{
          transitionDelay: `${delay}ms`,
          transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
        }}>
        {children}
      </div>
    </div>
  );
}

export default function PostBookmarkPlaceholderList({
  bookmark,
  onDone,
  tags,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
}) {
  const loaded = !!bookmark;
  const postContentToggles = useViewOptionsStore((state) => state.postContentToggles);
  const meta = getPostMetadata(bookmark);
  const postBookmark = meta ? (bookmark as PostBookmark) : null;
  const mediaItems = postBookmark
    ? getPostBookmarkMediaPreviewItems(postBookmark, "main", "list")
    : [];
  const itemTags = bookmark?.tags ?? [];
  const visibleTags = itemTags.length > 0 ? itemTags : (tags ?? []);
  const hasTags = visibleTags.length > 0;
  const displayedText = getDisplayedText(meta?.text ?? "");
  const isLongText = (meta?.text.length ?? 0) > MAX_LENGTH;

  const showAuthor = postContentToggles.author;
  const showMedia = postContentToggles.media;
  const showTags = postContentToggles.tags;
  const showTimestamp = postContentToggles.timestamp;

  usePlaceholderDone(loaded, onDone);

  return (
    <article className="border-border group relative isolate flex cursor-pointer flex-col gap-[14px] border-b px-4 py-3 pt-6 transition-none!">
      <div className="pointer-events-none absolute inset-0 z-2 opacity-0 transition-opacity duration-200 group-data-[selection-mode=true]/bookmark-row:opacity-100" />

      {showAuthor && (
        <div className="relative z-1 flex items-center">
          <div className="group/author flex w-fit items-center gap-2">
            <CrossFade
              loaded={loaded}
              delay={0}
              className="h-10 w-10 shrink-0"
              skeleton={<Skeleton className="h-10 w-10 rounded-full" />}>
              <div className="bg-muted ring-border h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1">
                {meta?.user_profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.user_profile_image_url}
                    alt={meta.user_name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
            </CrossFade>
            <div className="flex min-w-0 items-center gap-[6px]">
              <CrossFade
                loaded={loaded}
                delay={getFastDelay(80)}
                className="min-w-0"
                skeleton={
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-[18px] w-28 rounded" />
                    <Skeleton className="h-[16px] w-20 rounded" />
                  </div>
                }>
                <div className="flex min-w-0 flex-col gap-0 text-[15px] leading-[20px]">
                  <span className="text-foreground truncate font-semibold">
                    {meta?.user_name ?? ""}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {meta?.user_screen_name ? `@${meta.user_screen_name}` : ""}
                  </span>
                </div>
              </CrossFade>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-1 min-w-0 flex-1 space-y-[14px]">
        <TextCrossFade
          loaded={loaded}
          delay={getFastDelay(200)}
          skeleton={
            <div className="space-y-1.5">
              <Skeleton className="h-[19px] w-full rounded" />
              <Skeleton className="h-[19px] w-4/5 rounded" />
              <Skeleton className="h-[19px] w-3/5 rounded" />
            </div>
          }>
          <div>
            <p className="text-foreground text-[15px] whitespace-pre-wrap">{displayedText}</p>
            {isLongText && <span className="text-[15px] text-[#1D9BF0]">Show more</span>}
          </div>
        </TextCrossFade>

        {showMedia && (!loaded || mediaItems.length > 0) && (
          <CrossFade
            loaded={loaded && mediaItems.length > 0}
            delay={getFastDelay(320)}
            skeleton={<MediaSkeleton />}>
            <MediaGrid media={mediaItems} />
          </CrossFade>
        )}

        {showTags && hasTags && (
          <CrossFade
            loaded={itemTags.length > 0}
            delay={getFastDelay(400)}
            skeleton={
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-[22px] w-16 rounded-sm" />
                <Skeleton className="h-[22px] w-20 rounded-sm" />
              </div>
            }>
            <div className="flex flex-wrap gap-1">
              {itemTags.map((tag) => (
                <Tag key={tag} displayHash={false} size="md" variant="outline">
                  # {tag}
                </Tag>
              ))}
            </div>
          </CrossFade>
        )}

        {showTimestamp && (
          <CrossFade
            loaded={!!meta?.date_epoch}
            delay={getFastDelay(480)}
            skeleton={<Skeleton className="h-[21px] w-36 rounded" />}>
            <div className="flex items-center gap-3 text-[14px] text-[#536471]">
              {meta?.date_epoch ? formatFullDate(meta.date_epoch) : ""}
            </div>
          </CrossFade>
        )}
      </div>
    </article>
  );
}
