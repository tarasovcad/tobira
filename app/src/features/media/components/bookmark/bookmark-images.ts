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

function getFirstMediaItem(
  images: Bookmark["images"] | undefined,
): MediaImages["items"][number] | null {
  if (
    !images ||
    typeof images !== "object" ||
    !("items" in images) ||
    !Array.isArray(images.items)
  ) {
    return null;
  }

  return images.items[0] ?? null;
}

function toPublicUrl(key: string | undefined, fallback: string) {
  return key ? buildR2PublicUrl(key) : fallback;
}

export function getBookmarkMediaPreviewItem(item: Bookmark): BookmarkMediaPreviewItem | null {
  const firstItem = getFirstMediaItem(item.images);
  if (!firstItem) return null;

  const baseItem = {
    width: firstItem.width ?? 1200,
    height: firstItem.height ?? 1200,
    alt: firstItem.alt ?? "",
  };

  if (firstItem.type === "image") {
    return {
      ...baseItem,
      type: "image",
      src: toPublicUrl(firstItem.key_small ?? firstItem.key_large, firstItem.source_url),
      fullSizeSrc: toPublicUrl(firstItem.key_large ?? firstItem.key_small, firstItem.source_url),
    };
  }

  return {
    ...baseItem,
    type: "video",
    src: buildR2PublicUrl(firstItem.key),
    poster: firstItem.key_thumbnail ? buildR2PublicUrl(firstItem.key_thumbnail) : undefined,
  };
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
