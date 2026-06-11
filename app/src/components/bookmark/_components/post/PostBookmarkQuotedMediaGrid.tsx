"use client";

import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import {MediaGalleryTilePreview} from "@/features/media/components/MediaGalleryTilePreview";
import {formatVideoTime} from "@/features/video-player/utils";
import {
  type PostBookmarkMediaGalleryEntry,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import {PostBookmarkMediaGalleryFrame, type PostMediaGalleryContext} from "./PostBookmarkMediaGrid";

const DEFAULT_MEDIA_ASPECT_RATIO = 1.777;
const MAX_QUOTED_MEDIA_ITEMS = 4;

type PostBookmarkQuotedMediaGridProps = {
  galleryEntries?: PostBookmarkMediaGalleryEntry[];
  media: PostBookmarkPreviewItem[];
};

export function PostBookmarkQuotedCompactMediaGrid({
  galleryEntries,
  media,
}: PostBookmarkQuotedMediaGridProps) {
  if (!media.length) return null;

  if (galleryEntries && galleryEntries.length > 1) {
    return (
      <PostBookmarkMediaGalleryFrame galleryEntries={galleryEntries}>
        {(gallery) => <PostBookmarkQuotedCompactMediaGridContent media={media} gallery={gallery} />}
      </PostBookmarkMediaGalleryFrame>
    );
  }

  return <PostBookmarkQuotedCompactMediaGridContent media={media} />;
}

function PostBookmarkQuotedCompactMediaGridContent({
  gallery,
  media,
}: {
  gallery?: PostMediaGalleryContext;
  media: PostBookmarkPreviewItem[];
}) {
  const items = getQuotedMediaItems(media);
  const count = items.length;

  return (
    <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl border">
      <div className={getQuotedMediaGridClassName(count, {compact: true})}>
        {items.map((item, index) => (
          <QuotedCompactMediaTile
            key={item.key}
            item={item}
            index={index}
            count={count}
            gallery={gallery}
          />
        ))}
      </div>
    </div>
  );
}

function getQuotedMediaItems(media: PostBookmarkPreviewItem[]) {
  return media.slice(0, MAX_QUOTED_MEDIA_ITEMS);
}

function getQuotedMediaGridClassName(count: number, {compact = false}: {compact?: boolean} = {}) {
  return cn(
    "grid h-full w-full gap-[2px]",
    count === 1 ? "grid-cols-1" : "grid-cols-2",
    compact && count > 2 && "grid-rows-2",
  );
}

function getQuotedMediaTileClassName(index: number, count: number) {
  return cn(
    "bg-muted relative h-full w-full overflow-hidden",
    count === 3 && index === 0 && "row-span-2",
  );
}

function QuotedCompactMediaTile({
  count,
  gallery,
  index,
  item,
}: {
  count: number;
  gallery?: PostMediaGalleryContext;
  index: number;
  item: PostBookmarkPreviewItem;
}) {
  const galleryEntry = gallery?.entries.at(index);

  return (
    <div
      role={galleryEntry ? undefined : "img"}
      aria-label={galleryEntry ? undefined : item.alt}
      className={getQuotedMediaTileClassName(index, count)}>
      {gallery && galleryEntry ? (
        <>
          <QuotedGalleryMediaTilePreview
            gallery={gallery}
            galleryEntry={galleryEntry}
            index={index}
            item={item}
            className="h-full w-full object-cover"
          />
          {item.type === "video" ? <QuotedVideoDurationBadge item={item} /> : null}
        </>
      ) : item.type === "video" ? (
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
      <QuotedVideoDurationBadge item={item} />
    </div>
  );
}

function QuotedVideoDurationBadge({item}: {item: PostBookmarkPreviewItem}) {
  if (item.durationMillis == null) return null;

  return (
    <div
      className="pointer-events-none absolute right-0 bottom-0 left-0 mx-2 mb-2 h-5.25 w-fit rounded-[5px] px-2"
      style={{backgroundColor: "rgba(0, 0, 0, 0.77)"}}>
      <p className="truncate text-[13px] leading-5.25 font-[450] text-white">
        {formatVideoTime(item.durationMillis / 1000)}
      </p>
    </div>
  );
}

export function PostBookmarkQuotedFullMediaGrid({
  galleryEntries,
  media,
}: PostBookmarkQuotedMediaGridProps) {
  if (!media.length) return null;

  if (galleryEntries && galleryEntries.length > 1) {
    return (
      <PostBookmarkMediaGalleryFrame galleryEntries={galleryEntries}>
        {(gallery) => <PostBookmarkQuotedFullMediaGridContent media={media} gallery={gallery} />}
      </PostBookmarkMediaGalleryFrame>
    );
  }

  return <PostBookmarkQuotedFullMediaGridContent media={media} />;
}

function PostBookmarkQuotedFullMediaGridContent({
  gallery,
  media,
}: {
  gallery?: PostMediaGalleryContext;
  media: PostBookmarkPreviewItem[];
}) {
  const items = getQuotedMediaItems(media);
  const count = items.length;

  return (
    <div
      className="bg-muted/30 mt-4 overflow-hidden"
      style={{aspectRatio: getFullMediaGridAspectRatio(items)}}>
      <div className={getQuotedMediaGridClassName(count)}>
        {items.map((item, index) => (
          <QuotedFullMediaTile
            key={item.key}
            item={item}
            index={index}
            count={count}
            gallery={gallery}
          />
        ))}
      </div>
    </div>
  );
}

function QuotedFullMediaTile({
  count,
  gallery,
  index,
  item,
}: {
  count: number;
  gallery?: PostMediaGalleryContext;
  index: number;
  item: PostBookmarkPreviewItem;
}) {
  const isVideo = item.type === "video";
  const galleryEntry = gallery?.entries.at(index);

  return (
    <div
      role={galleryEntry ? undefined : "img"}
      aria-label={galleryEntry ? undefined : item.alt}
      className={getQuotedMediaTileClassName(index, count)}>
      {gallery && galleryEntry ? (
        <QuotedGalleryMediaTilePreview
          gallery={gallery}
          galleryEntry={galleryEntry}
          index={index}
          item={item}
          className={cn("h-full w-full", isVideo ? "bg-black object-contain" : "object-cover")}
        />
      ) : (
        <MediaPreview
          src={item.src}
          fullSizeSrc={isVideo ? undefined : item.fullSizeSrc}
          alt={item.alt}
          width={item.width}
          height={item.height}
          poster={item.poster}
          type={isVideo ? "video" : "image"}
          className={cn("h-full w-full", isVideo ? "bg-black object-contain" : "object-cover")}
          buttonClassName="h-full w-full"
          loading="lazy"
        />
      )}
    </div>
  );
}

function QuotedGalleryMediaTilePreview({
  className,
  gallery,
  galleryEntry,
  index,
  item,
}: {
  className: string;
  gallery: PostMediaGalleryContext;
  galleryEntry: PostBookmarkMediaGalleryEntry;
  index: number;
  item: PostBookmarkPreviewItem;
}) {
  const isVideo = item.type === "video";

  return (
    <MediaGalleryTilePreview
      controller={gallery.controller}
      index={index}
      renderId={galleryEntry.renderId}
      src={item.src}
      alt={item.alt}
      width={item.width}
      height={item.height}
      poster={item.poster}
      type={isVideo ? "video" : "image"}
      className={className}
      buttonClassName="h-full w-full"
      loading="lazy"
    />
  );
}

function getFullMediaGridAspectRatio(items: PostBookmarkPreviewItem[]) {
  if (items.length !== 1) {
    return DEFAULT_MEDIA_ASPECT_RATIO;
  }

  const item = items[0];
  const aspectRatio = getPreviewItemAspectRatio(item);

  return item.type === "video" ? Math.max(aspectRatio, DEFAULT_MEDIA_ASPECT_RATIO) : aspectRatio;
}

function getPreviewItemAspectRatio(item: PostBookmarkPreviewItem) {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  return item.width > 0 && item.height > 0 ? item.width / item.height : DEFAULT_MEDIA_ASPECT_RATIO;
}
