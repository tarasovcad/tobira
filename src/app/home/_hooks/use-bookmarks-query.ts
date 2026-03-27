import * as React from "react";
import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {PAGE_SIZE} from "../_constants";
import {tagNamesFromJoin} from "@/lib/bookmark-tags";
import {getCollections} from "@/app/actions/collections";
import {fetchBookmarksPageAction} from "@/app/actions/bookmarks";
import type {Bookmark} from "@/components/bookmark/types";
import type {Collection} from "@/app/actions/collections";
import type {UseBookmarksQueryProps, BookmarkRowWithJoins} from "../_types";

/**
 * Maps the raw database response to the domain Bookmark type.
 */
function mapBookmarkRow(row: BookmarkRowWithJoins): Bookmark {
  const {bookmark_tags, bookmark_collections, ...bookmark} = row;
  return {
    ...(bookmark as Bookmark),
    tags: tagNamesFromJoin(bookmark_tags),
    collections: bookmark_collections?.map((bc) => bc.collections) ?? [],
  };
}

/**
 * Manages fetching, filtering, and pagination for the bookmarks list.
 * This hook centralizes all server-state logic for the home page.
 */
export function useBookmarksQuery({
  userId,
  initialBookmarks,
  totalCount,
  sort,
  tagFilter,
  collectionFilter,
  typeFilter,
  isServerDataMatching = true,
}: UseBookmarksQueryProps) {
  const bookmarksQuery = useInfiniteQuery({
    queryKey: [
      "bookmarks",
      "all-items",
      userId,
      PAGE_SIZE,
      sort,
      tagFilter,
      collectionFilter,
      typeFilter,
    ],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({pageParam}) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      if (!userId) {
        return {
          items: [] as Bookmark[],
          nextOffset: undefined as number | undefined,
          totalCount: 0,
        };
      }

      const {data, count} = await fetchBookmarksPageAction({
        offset,
        limit: PAGE_SIZE,
        sort,
        tagFilter,
        collectionFilter,
        typeFilter,
      });

      const items = ((data ?? []) as BookmarkRowWithJoins[]).map(mapBookmarkRow);
      const nextOffset = items.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;

      return {items, nextOffset, totalCount: count ?? 0};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialData: isServerDataMatching
      ? {
          pageParams: [0],
          pages: [
            {
              items: initialBookmarks,
              nextOffset: initialBookmarks.length < PAGE_SIZE ? undefined : PAGE_SIZE,
              totalCount,
            },
          ],
        }
      : undefined,
  });

  const allBookmarks = React.useMemo(() => {
    return bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [bookmarksQuery.data]);

  // Keep track of the actual total count from the database, falling back to the initial count
  const currentTotalCount = bookmarksQuery.data?.pages[0]?.totalCount ?? totalCount;

  // We fetch collections separately to show the active collection's metadata (e.g., name)
  const {data: collections} = useQuery({
    queryKey: ["collections"],
    queryFn: async () => await getCollections(),
  });

  const activeCollection = React.useMemo(() => {
    if (!collectionFilter || !collections) return null;
    return (collections as Collection[]).find((c) => c.id === collectionFilter) ?? null;
  }, [collectionFilter, collections]);

  return {
    bookmarksQuery,
    allBookmarks,
    currentTotalCount,
    activeCollection,
    // "Initial load" is true only when we are loading and have no data yet
    isInitialLoad: bookmarksQuery.isLoading && allBookmarks.length === 0,
  };
}
