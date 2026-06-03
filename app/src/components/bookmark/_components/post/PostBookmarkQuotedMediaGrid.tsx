"use client";

import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import {formatVideoTime} from "@/features/video-player/utils";
import type {PostBookmarkPreviewItem} from "../../_utils/post-bookmark-preview";

export function PostBookmarkQuotedCompactMediaGrid({media}: {media: PostBookmarkPreviewItem[]}) {
  if (!media.length) return null;

  const items = media.slice(0, 4);
  const count = items.length;

  return (
    <div
      className={cn(
        "mt-2 w-[100px] shrink-0 overflow-hidden rounded-xl border",
        count === 2 ? "h-[50px]" : "h-[100px]",
      )}>
      <div
        className={cn(
          "grid h-full w-full gap-[2px]",
          count === 1 ? "grid-cols-1" : "grid-cols-2",
          count > 2 && "grid-rows-2",
        )}>
        {items.map((item, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = item.type === "video";

          return (
            <div
              key={item.key}
              role="img"
              aria-label={item.alt}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              {isVideo ? (
                <QuotedVideoPlaceholder item={item} />
              ) : (
                <MediaPreview
                  src={item.src}
                  fullSizeSrc={item.fullSizeSrc}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  className="h-full w-full object-cover"
                  buttonClassName="h-full w-full"
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuotedVideoPlaceholder({item}: {item: PostBookmarkPreviewItem}) {
  return (
    <div className="relative h-full w-full">
      {item.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.poster}
          alt={item.alt}
          width={item.width}
          height={item.height}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="bg-muted h-full w-full" />
      )}
      {item.durationMillis != null ? (
        <div
          className="absolute right-0 bottom-0 left-0 mx-2 mb-2 h-5.25 w-fit rounded-[5px] px-2"
          style={{backgroundColor: "rgba(0, 0, 0, 0.77)"}}>
          <p className="truncate text-[13px] leading-5.25 font-[450] text-white">
            {formatVideoTime(item.durationMillis / 1000)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function PostBookmarkQuotedFullMediaGrid({media}: {media: PostBookmarkPreviewItem[]}) {
  if (!media.length) return null;

  const items = media.slice(0, 4);
  const count = items.length;

  let containerAspect = 1.777;
  if (count === 1) {
    containerAspect = getPreviewItemAspectRatio(items[0]);
  }

  return (
    <div
      className="bg-muted/30 mt-4 overflow-hidden rounded-b-xl"
      style={{aspectRatio: containerAspect}}>
      <div
        className={cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((item, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = item.type === "video";

          return (
            <div
              key={item.key}
              role="img"
              aria-label={item.alt}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              <MediaPreview
                src={item.src}
                fullSizeSrc={isVideo ? undefined : item.fullSizeSrc}
                alt={item.alt}
                width={item.width}
                height={item.height}
                poster={item.poster}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                buttonClassName="h-full w-full"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPreviewItemAspectRatio(item: PostBookmarkPreviewItem) {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  return item.width > 0 && item.height > 0 ? item.width / item.height : 1.777;
}
