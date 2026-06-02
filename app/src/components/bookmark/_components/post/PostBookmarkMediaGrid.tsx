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

function getPreviewItemAspectRatio(item: PostBookmarkPreviewItem) {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  return item.width > 0 && item.height > 0 ? item.width / item.height : 1.777;
}

function MediaGridContent({
  media,
  gallery,
}: {
  media: PostBookmarkPreviewItem[];
  gallery?: PostMediaGalleryContext;
}) {
  if (!media.length) return null;

  const count = Math.min(media.length, 4);
  const items = media.slice(0, count);

  let containerAspect = 1.777;
  if (count === 1) {
    containerAspect = getPreviewItemAspectRatio(items[0]);
  }

  return (
    <div
      className="bg-muted/30 dark:border-border mt-3 overflow-hidden rounded-[16px] border border-[#CFD9DE]"
      style={{
        aspectRatio: containerAspect,
        maxHeight: count === 1 ? 512 : undefined,
      }}>
      <div
        className={cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((m, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = m.type === "video";
          const galleryEntry = gallery?.entries.at(i);

          return (
            <div
              key={m.key}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              {gallery && galleryEntry ? (
                <MediaGalleryTilePreview
                  controller={gallery.controller}
                  index={i}
                  renderId={galleryEntry.renderId}
                  src={m.src}
                  alt={m.alt}
                  width={m.width}
                  height={m.height}
                  poster={m.poster}
                  type={isVideo ? "video" : "image"}
                  className="h-full w-full object-cover"
                  buttonClassName="h-full w-full"
                  loading="lazy"
                />
              ) : (
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
              )}
            </div>
          );
        })}
      </div>
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
