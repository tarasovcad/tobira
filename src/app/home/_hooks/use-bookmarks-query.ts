import * as React from "react";
import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {supabase} from "@/components/utils/supabase/client";
import {PAGE_SIZE} from "../_constants";
import {tagNamesFromJoin} from "@/lib/bookmark-tags";
import {getCollections} from "@/app/actions/collections";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import type {Collection} from "@/app/actions/collections";
import type {UseBookmarksQueryProps, BookmarkRowWithJoins} from "../_types";

/**
 * Builds the Supabase select string based on active filters.
 * Using !inner joins for filtering ensures we only get rows that have the associated records.
 */
function getBookmarksSelect(tagFilter: string | null, collectionFilter: string | null): string {
  const tagsJoin = tagFilter
    ? "bookmark_tags!inner(tags!inner(name))"
    : "bookmark_tags(tags(name))";

  const collectionsJoin = collectionFilter
    ? "bookmark_collections!inner(collections(id, name))"
    : "bookmark_collections(collections(id, name))";

  return `*, ${tagsJoin}, ${collectionsJoin}`;
}

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
}: UseBookmarksQueryProps) {
  // Check if we can use the server-rendered initial data to avoid a double fetch
  const isDefaultView =
    sort === "recent" && !tagFilter && !collectionFilter && typeFilter === "all";

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

      const bookmarksSelect = getBookmarksSelect(tagFilter, collectionFilter);

      // We only request the exact count on the first page to optimize database performance
      let q =
        offset === 0
          ? supabase.from("bookmarks").select(bookmarksSelect as "*", {count: "exact"})
          : supabase.from("bookmarks").select(bookmarksSelect as "*");

      // Filter by ownership and state (exclude archived/deleted)
      q = q.eq("user_id", userId).is("archived_at", null).is("deleted_at", null);

      if (tagFilter) {
        q = q.eq("bookmark_tags.tags.name", tagFilter);
      }

      if (collectionFilter) {
        q = q.eq("bookmark_collections.collection_id", collectionFilter);
      }

      if (typeFilter !== "all") {
        q = q.eq("kind", typeFilter);
      }

      // Handle sorting
      switch (sort) {
        case "oldest":
          q = q.order("created_at", {ascending: true});
          break;
        case "az":
          q = q.order("title", {ascending: true}).order("id", {ascending: true});
          break;
        case "recent":
        default:
          q = q.order("created_at", {ascending: false});
          break;
      }

      const {data, count, error} = await q.range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;

      const items = ((data ?? []) as BookmarkRowWithJoins[]).map(mapBookmarkRow);
      const nextOffset = items.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;

      return {items, nextOffset, totalCount: count ?? 0};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialData: isDefaultView
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
