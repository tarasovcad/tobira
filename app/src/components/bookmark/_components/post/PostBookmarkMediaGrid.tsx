"use client";

import {useEffect, useMemo} from "react";

import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import {MediaGalleryTilePreview} from "@/features/media/components/MediaGalleryTilePreview";
import {MediaGalleryOverlay} from "@/features/media/components/MediaGalleryOverlay";
import {useMediaGalleryPreview} from "@/features/media/hooks/useMediaGalleryPreview";
import {
  createMediaGalleryController,
  useMediaGalleryControllerSnapshot,
  type MediaGalleryController,
} from "@/features/media/hooks/useMediaGalleryController";
import type {PostBookmark} from "../../types";
import {
  buildPostBookmarkMediaGalleryEntries,
  type PostBookmarkMediaGalleryEntry,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";

type PostMediaGalleryContext = {
  entries: PostBookmarkMediaGalleryEntry[];
  controller: MediaGalleryController;
};

const DEFAULT_MEDIA_ASPECT_RATIO = 1.777;
const MAX_GRID_ITEMS = 4;

function getPreviewItemAspectRatio(item: PostBookmarkPreviewItem) {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  return item.width > 0 && item.height > 0 ? item.width / item.height : DEFAULT_MEDIA_ASPECT_RATIO;
}

function getMediaGridItems(media: PostBookmarkPreviewItem[]) {
  return media.slice(0, MAX_GRID_ITEMS);
}

function getMediaGridAspectRatio(items: PostBookmarkPreviewItem[]) {
  return items.length === 1 ? getPreviewItemAspectRatio(items[0]) : DEFAULT_MEDIA_ASPECT_RATIO;
}

function getMediaGridClassName(count: number) {
  return cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2");
}

function MediaGridContent({
  media,
  gallery,
}: {
  media: PostBookmarkPreviewItem[];
  gallery?: PostMediaGalleryContext;
}) {
  if (!media.length) return null;

  const items = getMediaGridItems(media);
  const count = items.length;

  return (
    <div
      className="bg-muted/30 dark:border-border mt-3 overflow-hidden rounded-[16px] border border-[#CFD9DE]"
      style={{
        aspectRatio: getMediaGridAspectRatio(items),
        maxHeight: count === 1 ? 512 : undefined,
      }}>
      <div className={getMediaGridClassName(count)}>
        {items.map((item, index) => (
          <MediaGridTile key={item.key} item={item} index={index} count={count} gallery={gallery} />
        ))}
      </div>
    </div>
  );
}

function MediaGridTile({
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
      className={cn(
        "bg-muted relative h-full w-full overflow-hidden",
        count === 3 && index === 0 && "row-span-2",
      )}>
      {gallery && galleryEntry ? (
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
          className="h-full w-full object-cover"
          buttonClassName="h-full w-full"
          loading="lazy"
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
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}

function PostMediaGalleryGrid({
  media,
  galleryEntries,
}: {
  media: PostBookmarkPreviewItem[];
  galleryEntries: PostBookmarkMediaGalleryEntry[];
}) {
  const {galleryController, galleryPreview} = usePostMediaGallery(galleryEntries);

  return (
    <>
      <MediaGridContent
        media={media}
        gallery={{entries: galleryEntries, controller: galleryController}}
      />
      <MediaGalleryOverlay
        entries={galleryEntries}
        controller={galleryController}
        isFetchingNextPage={false}
        {...galleryPreview}
      />
    </>
  );
}

function usePostMediaGallery(galleryEntries: PostBookmarkMediaGalleryEntry[]) {
  const galleryController = useMemo(() => createMediaGalleryController(), []);
  const galleryState = useMediaGalleryControllerSnapshot(galleryController);
  const boundedCurrentMediaIndex =
    galleryState.currentIndex === null || galleryEntries.length === 0
      ? null
      : Math.min(galleryState.currentIndex, galleryEntries.length - 1);
  const currentMediaEntry =
    boundedCurrentMediaIndex !== null
      ? (galleryEntries.at(boundedCurrentMediaIndex) ?? null)
      : null;

  const galleryPreview = useMediaGalleryPreview({
    type: currentMediaEntry?.previewItem.type ?? "image",
    addZoom: true,
    onEscape: galleryController.requestClose,
    onOpenChange: (open) => {
      if (!open) {
        galleryController.handlePreviewClosed();
      }
    },
  });

  useEffect(() => {
    galleryController.attachPreview(galleryPreview);
    return () => {
      galleryController.attachPreview(null);
    };
  }, [galleryController, galleryPreview]);

  useEffect(() => {
    if (!galleryState.open) {
      return;
    }

    if (
      galleryEntries.length === 0 ||
      galleryState.currentIndex === null ||
      galleryState.currentIndex >= galleryEntries.length
    ) {
      galleryController.requestClose();
    }
  }, [galleryController, galleryEntries.length, galleryState.currentIndex, galleryState.open]);

  return {galleryController, galleryPreview};
}

export function PostBookmarkMediaPreviewGrid({media}: {media: PostBookmarkPreviewItem[]}) {
  return <MediaGridContent media={media} />;
}

export default function PostBookmarkMediaGrid({item}: {item: PostBookmark}) {
  const galleryEntries = useMemo(
    () => buildPostBookmarkMediaGalleryEntries(item, "main", "list"),
    [item],
  );
  const media = useMemo(() => galleryEntries.map((entry) => entry.previewItem), [galleryEntries]);

  if (!media.length) return null;

  if (galleryEntries.length > 1) {
    return <PostMediaGalleryGrid media={media} galleryEntries={galleryEntries} />;
  }

  return <MediaGridContent media={media} />;
}
