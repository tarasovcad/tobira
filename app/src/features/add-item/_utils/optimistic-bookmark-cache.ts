import type {InfiniteData, QueryClient, QueryKey} from "@tanstack/react-query";
import type {Bookmark} from "@/components/bookmark/types";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";
import {normalizeTagName} from "@/lib/bookmarks/tag-utils";

export function isOptimisticBookmarkId(id: string | undefined | null): boolean {
  return typeof id === "string" && id.startsWith("optimistic-");
}

export function findBookmarkInQueryCache(
  queryClient: QueryClient,
  bookmarkId: string,
): Bookmark | undefined {
  const queries = queryClient.getQueriesData<BookmarksInfiniteData>({
    queryKey: ["bookmarks", "all-items"],
  });

  for (const [, data] of queries) {
    if (!data) continue;

    for (const page of data.pages) {
      const found = page.items.find((item) => item.id === bookmarkId);
      if (found) return found;
    }
  }

  return undefined;
}

export type AddBookmarkMutationInput =
  | {url: string; tags: string[]; collectionId?: string; kind: "website"}
  | {
      url: string;
      tags: string[];
      collectionId?: string;
      kind: "media";
      selectedMediaUrls?: string[];
      selectedMediaItems?: BookmarkMediaItem[];
    }
  | {url: string; tags: string[]; collectionId?: string; kind: "post"};

type BookmarksPage = {
  items: Bookmark[];
  nextOffset: number | undefined;
};

export type BookmarksInfiniteData = InfiniteData<BookmarksPage, number>;

export type AddBookmarkMutationContext = {
  previousBookmarkQueries: [QueryKey, BookmarksInfiniteData | undefined][];
  previousCountQueries: [QueryKey, number | undefined][];
};

export function insertCreatedBookmark(
  current: BookmarksInfiniteData | undefined,
  bookmark: Bookmark,
) {
  if (
    !current ||
    current.pages.some((page) => page.items.some((item) => item.id === bookmark.id))
  ) {
    return current;
  }

  const firstPage = current.pages[0];
  if (!firstPage) return current;

  return {
    ...current,
    pages: [
      {
        ...firstPage,
        items: [bookmark, ...firstPage.items],
      },
      ...current.pages.slice(1),
    ],
  };
}

export function bookmarkListQueryMatchesInput({
  queryKey,
  input,
  userId,
  defaultTagNames,
}: {
  queryKey: QueryKey;
  input: AddBookmarkMutationInput;
  userId: string | undefined;
  defaultTagNames: string[];
}) {
  const [, , queryUserId, , scopeKind, scopeId, , typeFilter] = queryKey;
  return bookmarkQueryScopeMatchesInput({
    queryUserId,
    scopeKind,
    scopeId,
    typeFilter,
    input,
    userId,
    defaultTagNames,
  });
}

export function bookmarkCountQueryMatchesInput({
  queryKey,
  input,
  userId,
  defaultTagNames,
}: {
  queryKey: QueryKey;
  input: AddBookmarkMutationInput;
  userId: string | undefined;
  defaultTagNames: string[];
}) {
  const [, , queryUserId, scopeKind, scopeId, typeFilter] = queryKey;
  return bookmarkQueryScopeMatchesInput({
    queryUserId,
    scopeKind,
    scopeId,
    typeFilter,
    input,
    userId,
    defaultTagNames,
  });
}

function bookmarkQueryScopeMatchesInput({
  queryUserId,
  scopeKind,
  scopeId,
  typeFilter,
  input,
  userId,
  defaultTagNames,
}: {
  queryUserId: unknown;
  scopeKind: unknown;
  scopeId: unknown;
  typeFilter: unknown;
  input: AddBookmarkMutationInput;
  userId: string | undefined;
  defaultTagNames: string[];
}) {
  if (!userId || queryUserId !== userId || typeFilter !== input.kind) {
    return false;
  }

  if (scopeKind === "all") return true;
  if (scopeKind === "collection") return input.collectionId === scopeId;
  if (scopeKind === "tag") return inputHasDefaultTag(input.tags, defaultTagNames);
  return false;
}

function inputHasDefaultTag(inputTags: string[], defaultTagNames: string[]) {
  if (defaultTagNames.length === 0) return false;

  const normalizedInputTags = new Set(inputTags.map(normalizeTagName));
  return defaultTagNames.some((tag) => normalizedInputTags.has(normalizeTagName(tag)));
}
