import type {Bookmark} from "@/components/bookmark/types";
import {getMediaBookmarkGridTileCount} from "@/components/bookmark/_utils/media-bookmark-preview";

export type MediaGridRenderEntry<T extends Bookmark = Bookmark> = {
  item: T;
  bookmarkIndex: number;
  mediaIndex: number;
  renderId: string;
};

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
