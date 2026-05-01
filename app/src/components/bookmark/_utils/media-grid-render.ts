import type {Bookmark, MediaBookmark} from "@/components/bookmark/types";
import {
  getMediaBookmarkGridPreviewItem,
  getMediaBookmarkGridTileCount,
  type MediaBookmarkPreviewItem,
} from "@/components/bookmark/_utils/media-bookmark-preview";
import type {BookmarkMediaPreviewSize} from "@/components/bookmark/_utils/media-grid-image-config";

export type MediaGridRenderEntry<T extends Bookmark = Bookmark> = {
  item: T;
  bookmarkIndex: number;
  mediaIndex: number;
  renderId: string;
};

export type MediaGalleryEntry<T extends MediaBookmark = MediaBookmark> = {
  item: T;
  bookmarkIndex: number;
  mediaIndex: number;
  renderId: string;
  previewItem: MediaBookmarkPreviewItem;
};

function isMediaBookmark(item: Bookmark): item is MediaBookmark {
  return item.kind === "media";
}

export function buildMediaGalleryEntries<T extends Bookmark>(
  items: T[],
  previewSize: BookmarkMediaPreviewSize = "medium",
): MediaGalleryEntry<Extract<T, MediaBookmark>>[] {
  const entries: MediaGalleryEntry<Extract<T, MediaBookmark>>[] = [];

  items.forEach((item, bookmarkIndex) => {
    if (!isMediaBookmark(item)) {
      return;
    }

    const tileCount = getMediaBookmarkGridTileCount(item);

    for (let mediaIndex = 0; mediaIndex < tileCount; mediaIndex += 1) {
      const previewItem = getMediaBookmarkGridPreviewItem(item, mediaIndex, previewSize);

      if (!previewItem) {
        continue;
      }

      entries.push({
        item: item as Extract<T, MediaBookmark>,
        bookmarkIndex,
        mediaIndex,
        renderId: `${item.id}:${mediaIndex}`,
        previewItem,
      });
    }
  });

  return entries;
}

export function flattenMediaGridBookmarks<T extends Bookmark>(
  items: T[],
): MediaGridRenderEntry<T>[] {
  return items.flatMap((item, bookmarkIndex) =>
    Array.from({length: getMediaBookmarkGridTileCount(item)}, (_, mediaIndex) => ({
      item,
      bookmarkIndex,
      mediaIndex,
      renderId: `${item.id}:${mediaIndex}`,
    })),
  );
}
