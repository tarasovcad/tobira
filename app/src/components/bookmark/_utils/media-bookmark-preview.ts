import type {Bookmark} from "@/components/bookmark/types";
import type {ImageItem, MediaImages, VideoItem} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import type {BookmarkMediaPreviewSize} from "./media-grid-image-config";
import {isMediaImages} from "./bookmark-image-guards";

type MediaItem = MediaImages["items"][number];

export type MediaBookmarkPreviewItem = {
  type: "image" | "video";
  src: string;
  thumbnailSrc?: string;
  fullSizeSrc?: string;
  poster?: string;
  width: number;
  height: number;
  alt: string;
};

function getMediaItems(images: Bookmark["images"] | undefined): MediaImages["items"] {
  if (!isMediaImages(images)) {
    return [];
  }

  return images.items;
}

function isMediaProcessing(images: Bookmark["images"] | undefined) {
  return isMediaImages(images) ? images.processing === true : false;
}

function getMediaItemAtIndex(
  items: MediaImages["items"],
  mediaIndex: number,
): MediaImages["items"][number] | null {
  if (items.length === 0) {
    return null;
  }

  if (mediaIndex >= 0 && mediaIndex < items.length) {
    return items.at(mediaIndex) ?? null;
  }

  return items[0] ?? null;
}

function getBasePreviewItem(mediaItem: MediaItem): Omit<MediaBookmarkPreviewItem, "type" | "src"> {
  return {
    width: mediaItem.width ?? 1200,
    height: mediaItem.height ?? 1200,
    alt: mediaItem.alt ?? "",
  };
}

type MediaAssetSize = BookmarkMediaPreviewSize | "thumb" | "orig";

function buildR2SizedImageUrl(key: string, size: MediaAssetSize, format?: "webp"): string {
  const url = new URL(buildR2PublicUrl(key));
  url.searchParams.set("size", size);

  if (format) {
    url.searchParams.set("format", format);
  } else {
    url.searchParams.delete("format");
  }

  return url.toString();
}

function buildProcessingImageUrl(sourceUrl: string, size: MediaAssetSize): string {
  try {
    const url = new URL(sourceUrl);
    url.searchParams.set("name", size);
    return url.toString();
  } catch {
    return sourceUrl;
  }
}

function rewriteStoredVideoUrl(key: string): string {
  try {
    const url = new URL(buildR2PublicUrl(key));
    url.protocol = "https:";
    url.hostname = "video.tobira.app";
    return url.toString();
  } catch {
    return buildR2PublicUrl(key);
  }
}

function rewriteProcessingVideoUrl(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);

    if (url.hostname === "video.twimg.com") {
      url.protocol = "https:";
      url.hostname = "video.tobira.app";
    }

    return url.toString();
  } catch {
    return sourceUrl;
  }
}

function getGridImagePreviewItem(
  mediaItem: ImageItem,
  processing: boolean,
  previewSize: BookmarkMediaPreviewSize,
): MediaBookmarkPreviewItem {
  const baseItem = getBasePreviewItem(mediaItem);

  return {
    ...baseItem,
    type: "image",
    src: processing
      ? buildProcessingImageUrl(mediaItem.source_url, previewSize)
      : buildR2SizedImageUrl(mediaItem.media_key!, previewSize, "webp"),
    thumbnailSrc: processing
      ? buildProcessingImageUrl(mediaItem.source_url, "thumb")
      : buildR2SizedImageUrl(mediaItem.media_key!, "thumb", "webp"),
    fullSizeSrc: processing
      ? buildProcessingImageUrl(mediaItem.source_url, "orig")
      : buildR2SizedImageUrl(mediaItem.media_key!, "orig"),
  };
}

function getMenuImagePreviewItem(
  mediaItem: ImageItem,
  processing: boolean,
): MediaBookmarkPreviewItem {
  const baseItem = getBasePreviewItem(mediaItem);

  return {
    ...baseItem,
    type: "image",
    src: processing
      ? buildProcessingImageUrl(mediaItem.source_url, "small")
      : buildR2SizedImageUrl(mediaItem.media_key!, "small"),
    thumbnailSrc: processing
      ? buildProcessingImageUrl(mediaItem.source_url, "thumb")
      : buildR2SizedImageUrl(mediaItem.media_key!, "thumb", "webp"),
    fullSizeSrc: processing
      ? buildProcessingImageUrl(mediaItem.source_url, "orig")
      : buildR2SizedImageUrl(mediaItem.media_key!, "orig"),
  };
}

function getGridVideoPreviewItem(
  mediaItem: VideoItem,
  processing: boolean,
  previewSize: BookmarkMediaPreviewSize,
): MediaBookmarkPreviewItem {
  const baseItem = getBasePreviewItem(mediaItem);
  const processingPoster = mediaItem.source_thumbnail_url ?? undefined;

  return {
    ...baseItem,
    type: "video",
    src: processing
      ? rewriteProcessingVideoUrl(mediaItem.source_url)
      : rewriteStoredVideoUrl(mediaItem.key!),
    thumbnailSrc: processingPoster
      ? buildProcessingImageUrl(processingPoster, "thumb")
      : processing
        ? undefined
        : buildR2SizedImageUrl(mediaItem.key_thumbnail!, "thumb", "webp"),
    poster: processingPoster
      ? buildProcessingImageUrl(processingPoster, previewSize)
      : processing
        ? undefined
        : buildR2SizedImageUrl(mediaItem.key_thumbnail!, previewSize),
  };
}

function getMenuVideoPreviewItem(
  mediaItem: VideoItem,
  processing: boolean,
): MediaBookmarkPreviewItem {
  const baseItem = getBasePreviewItem(mediaItem);
  const previewSrc = processing
    ? (mediaItem.source_thumbnail_url ?? "")
    : buildR2SizedImageUrl(mediaItem.key_thumbnail!, "small");

  return {
    ...baseItem,
    type: "image",
    src: previewSrc,
    thumbnailSrc: processing
      ? mediaItem.source_thumbnail_url
        ? buildProcessingImageUrl(mediaItem.source_thumbnail_url, "thumb")
        : undefined
      : buildR2SizedImageUrl(mediaItem.key_thumbnail!, "thumb", "webp"),
    fullSizeSrc: processing ? previewSrc : buildR2SizedImageUrl(mediaItem.key_thumbnail!, "orig"),
  };
}

export function getMediaBookmarkGridPreviewItem(
  item: Bookmark,
  mediaIndex = 0,
  previewSize: BookmarkMediaPreviewSize = "medium",
): MediaBookmarkPreviewItem | null {
  const mediaItem = getMediaItemAtIndex(getMediaItems(item.images), mediaIndex);

  if (!mediaItem) {
    return null;
  }

  const processing = isMediaProcessing(item.images);

  if (mediaItem.type === "image") {
    return getGridImagePreviewItem(mediaItem, processing, previewSize);
  }

  return getGridVideoPreviewItem(mediaItem, processing, previewSize);
}

export function getMediaBookmarkMenuPreviewItem(
  item: Bookmark,
  mediaIndex = 0,
): MediaBookmarkPreviewItem | null {
  const mediaItem = getMediaItemAtIndex(getMediaItems(item.images), mediaIndex);

  if (!mediaItem) {
    return null;
  }

  const processing = isMediaProcessing(item.images);

  if (mediaItem.type === "image") {
    return getMenuImagePreviewItem(mediaItem, processing);
  }

  return getMenuVideoPreviewItem(mediaItem, processing);
}

export function getMediaBookmarkGridTileCount(item: Bookmark): number {
  const itemCount = getMediaItems(item.images).length;
  return itemCount > 0 ? itemCount : 1;
}
