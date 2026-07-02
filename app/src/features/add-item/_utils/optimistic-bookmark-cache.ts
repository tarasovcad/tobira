import type {InfiniteData, QueryClient, QueryKey} from "@tanstack/react-query";
import type {
  AddMediaBookmarkResult,
  AddPostBookmarkResult,
  AddWebsiteBookmarkResult,
} from "@/app/actions/bookmarks/create";
import type {Bookmark} from "@/components/bookmark/types";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";
import {normalizeTagName} from "@/lib/bookmarks/tag-utils";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";

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
  optimisticBookmarkId?: string;
  previousBookmarkQueries: [QueryKey, BookmarksInfiniteData | undefined][];
  previousCountQueries: [QueryKey, number | undefined][];
};

export function createOptimisticBookmark({
  input,
  userId,
  collectionItems,
}: {
  input: AddBookmarkMutationInput;
  userId: string | undefined;
  collectionItems: {label: string; value: string}[];
}): Bookmark | null {
  if (!userId || input.kind !== "website") return null;

  const now = new Date().toISOString();
  const collection = input.collectionId
    ? collectionItems.find((item) => item.value === input.collectionId)
    : null;
  const base = {
    id: `optimistic-${crypto.randomUUID()}`,
    title: "",
    // title: "This is tanstack cache",
    // title: input.url,
    description: "",
    created_at: now,
    url: input.url,
    user_id: userId,
    updated_at: now,
    archived_at: "",
    deleted_at: "",
    notes: "",
    tags: input.tags,
    collections: collection ? [{id: collection.value, name: collection.label}] : [],
  };

  return {
    ...base,
    kind: "website",
    images: {
      favicon: {status: "pending"},
      og: {status: "pending", width: 1200, height: 630},
      preview: {status: "pending", width: 1920, height: 1080},
      selected: "preview",
    },
    metadata: {textMetadataStatus: "pending"},
  };
}

export function insertOptimisticBookmark(
  current: BookmarksInfiniteData | undefined,
  optimisticBookmark: Bookmark,
) {
  if (
    !current ||
    current.pages.some((page) => page.items.some((item) => item.id === optimisticBookmark.id))
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
        items: [optimisticBookmark, ...firstPage.items],
      },
      ...current.pages.slice(1),
    ],
  };
}

export function replaceOptimisticBookmarkId({
  queryClient,
  optimisticBookmarkId,
  resultIds,
}: {
  queryClient: QueryClient;
  optimisticBookmarkId: string | undefined;
  resultIds: string[];
}) {
  const [resultId] = resultIds;
  if (!optimisticBookmarkId || !resultId) return;

  queryClient.setQueriesData<BookmarksInfiniteData>(
    {queryKey: ["bookmarks", "all-items"], type: "active"},
    (current) => {
      if (!current) return current;

      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === optimisticBookmarkId ? {...item, id: resultId} : item,
          ),
        })),
      };
    },
  );

  const menuState = useBookmarkMenuStore.getState();
  if (menuState.item?.id === optimisticBookmarkId) {
    const cachedBookmark = findBookmarkInQueryCache(queryClient, resultId);
    menuState.setItem(cachedBookmark ?? {...menuState.item, id: resultId});
  }
}

export function getAddBookmarkResultIds(
  result: AddWebsiteBookmarkResult | AddMediaBookmarkResult | AddPostBookmarkResult,
) {
  if ("ids" in result && result.ids?.length) return result.ids;
  if ("id" in result) return [result.id];
  return [];
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
