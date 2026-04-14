import * as React from "react";
import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {PAGE_SIZE} from "../_constants";
import {fetchBookmarksPageAction} from "@/app/actions/bookmarks";
import {getTagById} from "@/app/actions/tags";
import type {Bookmark} from "@/components/bookmark/types";
import type {Collection} from "@/app/actions/collections";
import type {UseBookmarksQueryProps} from "../_types";
import {useMemo} from "react";
import {collectionsQueryOptions} from "./use-home-metadata-query";

/**
 * Manages fetching, filtering, and pagination for the bookmarks list.
 * This hook centralizes all server-state logic for the home page.
 */
export function useBookmarksQuery({
  userId,
  initialBookmarks,
  initialActiveTag,
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
        };
      }

      const {data} = await fetchBookmarksPageAction({
        offset,
        limit: PAGE_SIZE,
        sort,
        tagFilter,
        collectionFilter,
        typeFilter,
      });

      const items = data ?? [];
      const nextOffset = items.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;

      return {items, nextOffset};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialData: isServerDataMatching
      ? {
          pageParams: [0],
          pages: [
            {
              items: initialBookmarks,
              nextOffset: initialBookmarks.length < PAGE_SIZE ? undefined : PAGE_SIZE,
            },
          ],
        }
      : undefined,
  });

  const allBookmarks = React.useMemo(() => {
    return bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [bookmarksQuery.data]);

  // We fetch collections separately to show the active collection's metadata (e.g., name)
  const {data: collections} = useQuery({
    ...collectionsQueryOptions(userId),
  });

  const {data: activeTagData} = useQuery({
    queryKey: ["active-tag", userId, tagFilter],
    enabled: !!userId && !!tagFilter,
    queryFn: async () => {
      if (!tagFilter) return null;
      return await getTagById(tagFilter);
    },
    initialData: isServerDataMatching ? initialActiveTag : undefined,
  });

  const activeCollection = useMemo(() => {
    if (!collectionFilter || !collections) return null;
    return (collections as Collection[]).find((c) => c.id === collectionFilter) ?? null;
  }, [collectionFilter, collections]);

  const activeTag = tagFilter ? (activeTagData ?? null) : null;

  return {
    bookmarksQuery,
    allBookmarks,
    activeCollection,
    activeTag,
    // "Initial load" is true only when we are loading and have no data yet
    isInitialLoad: bookmarksQuery.isLoading && allBookmarks.length === 0,
  };
}
