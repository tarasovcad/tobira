import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {PAGE_SIZE} from "@/features/home/constants";
import {getCollectionById} from "@/app/actions/collections";
import {getTagById} from "@/app/actions/tags";
import {getBookmarksCount} from "@/app/actions/bookmarks/getBookmarksCount";
import type {Bookmark} from "@/components/bookmark/types";
import {getBookmarkWorkspaceFilters, type UseBookmarksQueryProps} from "@/features/home/types";
import {useMemo} from "react";
import fetchBookmarksPageAction from "@/features/home/queries/fetchBookmarksPageAction";

/**
 * Manages fetching, filtering, and pagination for the bookmarks list.
 * This hook centralizes all server-state logic for the home page.
 */
export function useBookmarksQuery({
  userId,
  initialBookmarks,
  initialActiveCollection,
  initialActiveTag,
  initialTotalCount,
  scope,
  sort,
  typeFilter,
  isServerDataMatching = true,
}: UseBookmarksQueryProps) {
  const {tagFilter, collectionFilter} = getBookmarkWorkspaceFilters(scope);

  const bookmarksQuery = useInfiniteQuery({
    queryKey: [
      "bookmarks",
      "all-items",
      userId,
      PAGE_SIZE,
      scope.kind,
      scope.kind === "all" ? null : scope.id,
      sort,
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
        userId,
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

  const allBookmarks = useMemo(() => {
    return bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [bookmarksQuery.data]);

  const {data: totalCount} = useQuery({
    queryKey: [
      "bookmarks",
      "count",
      userId,
      scope.kind,
      scope.kind === "all" ? null : scope.id,
      typeFilter,
    ],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 0;

      return await getBookmarksCount({
        userId,
        tagFilter,
        collectionFilter,
        typeFilter,
      });
    },
    initialData: isServerDataMatching ? initialTotalCount : undefined,
    placeholderData: (previousCount) => previousCount,
  });

  const {data: activeCollectionData} = useQuery({
    queryKey: ["active-collection", userId, scope.kind === "collection" ? scope.id : null],
    enabled: !!userId && scope.kind === "collection",
    queryFn: async () => {
      if (scope.kind !== "collection") return null;
      return await getCollectionById(scope.id);
    },
    initialData: isServerDataMatching ? initialActiveCollection : undefined,
  });

  const {data: activeTagData} = useQuery({
    queryKey: ["active-tag", userId, scope.kind === "tag" ? scope.id : null],
    enabled: !!userId && scope.kind === "tag",
    queryFn: async () => {
      if (scope.kind !== "tag") return null;
      return await getTagById(scope.id);
    },
    initialData: isServerDataMatching ? initialActiveTag : undefined,
  });

  const activeCollection = scope.kind === "collection" ? (activeCollectionData ?? null) : null;
  const activeTag = scope.kind === "tag" ? (activeTagData ?? null) : null;

  return {
    bookmarksQuery,
    allBookmarks,
    totalCount: totalCount ?? initialTotalCount,
    activeCollection,
    activeTag,
    // "Initial load" is true only when we are loading and have no data yet
    isInitialLoad: bookmarksQuery.isLoading && allBookmarks.length === 0,
  };
}
