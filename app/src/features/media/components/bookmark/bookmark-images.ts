import type {MediaImages, WebsiteImages} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import type {Bookmark} from "@/components/bookmark/types";

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

export function getBookmarkMediaPreviewItems(item: Bookmark): BookmarkMediaPreviewItem[] {
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
        src: toPublicUrl(mediaItem.key_small ?? mediaItem.key_large, mediaItem.source_url),
        fullSizeSrc: toPublicUrl(mediaItem.key_large ?? mediaItem.key_small, mediaItem.source_url),
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
): BookmarkMediaPreviewItem | null {
  const previewItems = getBookmarkMediaPreviewItems(item);

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
