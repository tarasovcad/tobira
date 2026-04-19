import type {Bookmark} from "@/components/bookmark/types";
import {getBookmarkMediaTileCount} from "./bookmark-images";

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
    Array.from({length: getBookmarkMediaTileCount(item)}, (_, mediaIndex) => ({
      item,
      bookmarkIndex,
      mediaIndex,
      renderId: `${item.id}:${mediaIndex}`,
    })),
  );
}
