import type {MediaImages, WebsiteImages} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import type {Bookmark} from "@/components/bookmark/types";
import type {ColumnSize} from "@/store/use-view-options";

export function isWebsiteImages(images: Bookmark["images"] | undefined): images is WebsiteImages {
  return (
    !!images &&
    typeof images === "object" &&
    ("favicon" in images || "og" in images || "preview" in images || "selected" in images)
  );
}

type BookmarkMediaPreviewItem = {
  type: "image" | "video";
  src: string;
  fullSizeSrc?: string;
  poster?: string;
  width: number;
  height: number;
  alt: string;
};

export type BookmarkMediaPreviewSize = "small" | "medium" | "large";

function getMediaItems(images: Bookmark["images"] | undefined): MediaImages["items"] {
  if (
    !images ||
    typeof images !== "object" ||
    !("items" in images) ||
    !Array.isArray(images.items)
  ) {
    return [];
  }

  return images.items;
}

function toPublicUrl(key: string | undefined, fallback: string) {
  return key ? buildR2PublicUrl(key) : fallback;
}

function getImagePreviewSrc(
  mediaItem: Extract<MediaImages["items"][number], {type: "image"}>,
  previewSize: BookmarkMediaPreviewSize,
) {
  switch (previewSize) {
    case "small":
      return toPublicUrl(
        mediaItem.key_small ?? mediaItem.key_medium ?? mediaItem.key_large,
        mediaItem.source_url,
      );
    case "medium":
      return toPublicUrl(
        mediaItem.key_medium ?? mediaItem.key_small ?? mediaItem.key_large,
        mediaItem.source_url,
      );
    case "large":
      return toPublicUrl(
        mediaItem.key_large ?? mediaItem.key_medium ?? mediaItem.key_small,
        mediaItem.source_url,
      );
  }
}

export function getBookmarkMediaPreviewSizeForColumnSize(
  columnSize: ColumnSize,
): BookmarkMediaPreviewSize {
  if (columnSize >= 4) return "small";
  if (columnSize >= 2) return "medium";
  return "large";
}

export function getBookmarkMediaSizesForColumnSize(columnSize: ColumnSize): string {
  switch (columnSize) {
    case 1:
      return "100vw";
    case 2:
      return "(max-width: 640px) 100vw, 50vw";
    case 3:
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
    case 4:
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw";
    case 5:
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";
    case 6:
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16.67vw";
  }
}

export function getBookmarkMediaQualityForColumnSize(columnSize: ColumnSize): 50 | 60 | 75 {
  if (columnSize === 1) return 75;
  if (columnSize <= 3) return 60;
  return 50;
}

export function getBookmarkMediaPreviewItems(
  item: Bookmark,
  previewSize: BookmarkMediaPreviewSize = "medium",
): BookmarkMediaPreviewItem[] {
  return getMediaItems(item.images).map((mediaItem) => {
    const baseItem = {
      width: mediaItem.width ?? 1200,
      height: mediaItem.height ?? 1200,
      alt: mediaItem.alt ?? "",
    };

    if (mediaItem.type === "image") {
      return {
        ...baseItem,
        type: "image" as const,
        src: getImagePreviewSrc(mediaItem, previewSize),
        fullSizeSrc: toPublicUrl(
          mediaItem.key_large ?? mediaItem.key_medium ?? mediaItem.key_small,
          mediaItem.source_url,
        ),
      };
    }

    return {
      ...baseItem,
      type: "video" as const,
      src: buildR2PublicUrl(mediaItem.key),
      poster: mediaItem.key_thumbnail ? buildR2PublicUrl(mediaItem.key_thumbnail) : undefined,
    };
  });
}

export function getBookmarkMediaPreviewItem(
  item: Bookmark,
  mediaIndex = 0,
  previewSize: BookmarkMediaPreviewSize = "medium",
): BookmarkMediaPreviewItem | null {
  const previewItems = getBookmarkMediaPreviewItems(item, previewSize);

  if (mediaIndex >= 0 && mediaIndex < previewItems.length) {
    return previewItems.at(mediaIndex) ?? null;
  }

  return previewItems[0] ?? null;
}

export function getBookmarkMediaTileCount(item: Bookmark) {
  const previewItems = getBookmarkMediaPreviewItems(item);
  return previewItems.length > 0 ? previewItems.length : 1;
}

export function getBookmarkImageSrc(
  item: Bookmark,
  bookmarkId: string,
  type: "preview" | "favicon" | "og",
) {
  const websiteKeys = buildWebsiteImageKeys(bookmarkId);
  const websiteImages = isWebsiteImages(item.images) ? item.images : undefined;

  switch (type) {
    case "preview":
      return buildR2PublicUrl(websiteImages?.preview?.key ?? websiteKeys.preview);
    case "favicon":
      return buildR2PublicUrl(websiteImages?.favicon?.key ?? websiteKeys.favicon);
    case "og":
      return buildR2PublicUrl(websiteImages?.og?.key ?? websiteKeys.og);
  }
}
