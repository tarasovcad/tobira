"use client";

import {useCallback, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";

import {emptyBin, permanentlyDeleteBookmarks} from "@/app/actions/bookmarks/delete";
import {restoreBookmarks} from "@/app/actions/bookmarks/update";
import type {Bookmark} from "@/components/bookmark/types";
import {Button} from "@/components/ui/coss/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/coss/empty";
import {toastManager} from "@/components/ui/coss/toast";
import {AllItemsList} from "@/features/all-items/components/AllItemsList";
import fetchDeletedBookmarksPageAction from "@/features/bin/queries/fetchDeletedBookmarksPageAction";
import {useBookmarksSelection} from "@/features/home/hooks/use-bookmarks-selection";
import {useHomeFilters} from "@/features/home/hooks/use-home-filters";
import {useHomeInfiniteScroll} from "@/features/home/hooks/use-home-infinite-scroll";
import {HomeToolbar} from "@/features/home/components/HomeToolbar";
import {PAGE_SIZE} from "@/features/home/constants";
import type {SortMode, TypeFilter} from "@/features/home/types";
import {useViewOptionsStore} from "@/store/use-view-options";
import {BinHeader, type BinHeaderStats} from "./BinHeader";
import {BinSelectionActionBar} from "./BinSelectionActionBar";
import {trackClientEvent} from "@/lib/analytics/client";
import {
  getBookmarkActionProperties,
  getBookmarkActionPropertiesFromStats,
  getBookmarksByIds,
} from "@/components/bookmark/_utils/bookmark-analytics";

type BinPageClientProps = {
  userId: string;
  stats: BinHeaderStats;
  initialBookmarks: Bookmark[];
  initialTypeFilter: TypeFilter;
  initialSort: SortMode;
};

type BinBookmarkAction = {
  ids: string[];
  action: "restore" | "deleteForever";
};

export function BinPageClient({
  userId,
  stats,
  initialBookmarks,
  initialTypeFilter,
  initialSort,
}: BinPageClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    typeFilter,
    sort,
    handleTypeChange: setHomeTypeFilter,
    handleSortChange: setHomeSort,
  } = useHomeFilters({bin: true});
  const view = useViewOptionsStore((state) => state.view);
  const [scrollAreaRoot, setScrollAreaRoot] = useState<HTMLDivElement | null>(null);
  const [bottomSentinel, setBottomSentinel] = useState<HTMLDivElement | null>(null);
  const isInitialQuery = typeFilter === initialTypeFilter && sort === initialSort;
  const binActionIds = useMutationState({
    filters: {mutationKey: ["bin-bookmark-action"]},
    select: (mutation) => {
      if (mutation.state.status !== "pending" && mutation.state.status !== "success") return null;
      return mutation.state.variables as BinBookmarkAction | undefined;
    },
  }).filter((action): action is BinBookmarkAction => Boolean(action));
  const removingIds = useMemo(
    () =>
      new Map(
        binActionIds.flatMap(({ids, action}) =>
          ids.map((id) => [id, action === "deleteForever" ? "delete" : "archive"] as const),
        ),
      ),
    [binActionIds],
  );

  const deletedBookmarksQuery = useInfiniteQuery({
    queryKey: ["bookmarks", "bin", userId, PAGE_SIZE, typeFilter, sort],
    initialPageParam: 0,
    queryFn: async ({pageParam}) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const {data} = await fetchDeletedBookmarksPageAction({
        userId,
        offset,
        limit: PAGE_SIZE,
        sort,
        typeFilter,
      });
      const nextOffset = data.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;

      return {items: data, nextOffset};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialData: isInitialQuery
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

  const allBookmarks = useMemo(
    () => deletedBookmarksQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [deletedBookmarksQuery.data],
  );
  const visibleBookmarks = useMemo(
    () => allBookmarks.filter((item) => !removingIds.has(item.id)),
    [allBookmarks, removingIds],
  );

  const {
    selectionMode,
    selectedIds,
    selectedCount,
    allSelected,
    setSelectionEnabled,
    toggleSelected,
    setSelected,
    handleClearSelection,
    handleSelectAll,
  } = useBookmarksSelection(visibleBookmarks, allBookmarks);

  const binBookmarkActionMutation = useMutation({
    mutationKey: ["bin-bookmark-action"],
    mutationFn: async ({ids, action}: BinBookmarkAction) => {
      if (action === "restore") {
        return restoreBookmarks(ids);
      }

      return permanentlyDeleteBookmarks(ids);
    },
    onSuccess: async (_data, variables) => {
      const isRestore = variables.action === "restore";
      const count = variables.ids.length;
      const actionBookmarks = getBookmarksByIds(allBookmarks, variables.ids);
      const actionProperties = getBookmarkActionProperties(
        actionBookmarks.length === variables.ids.length
          ? actionBookmarks
          : variables.ids.map(() => ({kind: typeFilter})),
      );

      trackClientEvent(
        isRestore ? "bookmark_restored" : "bookmark_permanently_deleted",
        actionProperties,
      );

      toastManager.add({
        title: isRestore
          ? count === 1
            ? "Bookmark restored"
            : `${count} bookmarks restored`
          : count === 1
            ? "Bookmark deleted forever"
            : `${count} bookmarks deleted forever`,
        type: "success",
      });

      await queryClient.invalidateQueries({queryKey: ["bookmarks", "bin"]});
      router.refresh();
    },
    onError: (error, variables) => {
      const isRestore = variables.action === "restore";
      console.error(`[BinPageClient] ${isRestore ? "restore" : "delete forever"} failed`, {
        ids: variables.ids,
        error,
      });
      toastManager.add({
        title: isRestore ? "Restore failed" : "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : isRestore
              ? "Failed to restore bookmark"
              : "Failed to permanently delete bookmark",
        type: "error",
      });
    },
  });

  const emptyBinMutation = useMutation({
    mutationKey: ["bin-empty"],
    mutationFn: emptyBin,
    onSuccess: async ({deletedCount}) => {
      trackClientEvent("bookmark_permanently_deleted", {
        ...getBookmarkActionPropertiesFromStats(stats),
        count: deletedCount,
      });

      handleClearSelection();
      toastManager.add({
        title: deletedCount <= 1 ? "Bin emptied" : `${deletedCount} bookmarks deleted forever`,
        type: "success",
      });

      await queryClient.invalidateQueries({queryKey: ["bookmarks", "bin"]});
      router.refresh();
    },
    onError: (error) => {
      console.error("[BinPageClient] empty bin failed", {error});
      toastManager.add({
        title: "Empty bin failed",
        description: error instanceof Error ? error.message : "Failed to empty bin",
        type: "error",
      });
    },
  });

  const {hasNextPage, isFetchingNextPage, fetchNextPage} = deletedBookmarksQuery;
  const isInitialLoad = deletedBookmarksQuery.isLoading && allBookmarks.length === 0;
  const showEmptyState =
    !isInitialLoad && !deletedBookmarksQuery.isError && allBookmarks.length === 0;

  useHomeInfiniteScroll({
    scrollAreaRoot,
    bottomSentinel,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  const handleTypeChange = useCallback(
    (nextType: TypeFilter) => {
      handleClearSelection();
      setHomeTypeFilter(nextType);
    },
    [handleClearSelection, setHomeTypeFilter],
  );

  const handleSortChange = useCallback(
    (nextSort: SortMode) => {
      handleClearSelection();
      setHomeSort(nextSort);
    },
    [handleClearSelection, setHomeSort],
  );

  const handleRestore = useCallback(
    (item: Bookmark) => {
      handleClearSelection();
      binBookmarkActionMutation.mutate({ids: [item.id], action: "restore"});
    },
    [binBookmarkActionMutation, handleClearSelection],
  );

  const handleDeleteForever = useCallback(
    (item: Bookmark) => {
      handleClearSelection();
      binBookmarkActionMutation.mutate({ids: [item.id], action: "deleteForever"});
    },
    [binBookmarkActionMutation, handleClearSelection],
  );

  const handleRestoreSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    handleClearSelection();
    binBookmarkActionMutation.mutate({ids, action: "restore"});
  }, [binBookmarkActionMutation, handleClearSelection, selectedIds]);

  const handleDeleteSelectedForever = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    handleClearSelection();
    binBookmarkActionMutation.mutate({ids, action: "deleteForever"});
  }, [binBookmarkActionMutation, handleClearSelection, selectedIds]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <BinHeader
        stats={stats}
        emptyBinPending={emptyBinMutation.isPending}
        onEmptyBin={() => emptyBinMutation.mutate()}
      />
      <HomeToolbar
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        sort={sort}
        onSortChange={handleSortChange}
        selectionMode={selectionMode}
        onSelectionEnabledChange={setSelectionEnabled}
      />
      {deletedBookmarksQuery.isError ? (
        <BinLoadError onRetry={() => deletedBookmarksQuery.refetch()} />
      ) : showEmptyState ? (
        <BinEmptyState typeFilter={typeFilter} />
      ) : (
        <AllItemsList
          view={view}
          typeFilter={typeFilter}
          sort={sort}
          visibleItems={visibleBookmarks}
          animatingUrl={null}
          animatingItemCount={0}
          resolvedBookmarks={[]}
          isInitialLoad={isInitialLoad}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          scrollAreaRootRef={setScrollAreaRoot}
          bottomSentinelRef={setBottomSentinel}
          fetchNextPage={fetchNextPage}
          onTransitionDone={() => {}}
          toggleSelected={toggleSelected}
          setSelected={setSelected}
          onMenuArchive={() => {}}
          onMenuDelete={() => {}}
          onRestore={handleRestore}
          onDeleteForever={handleDeleteForever}
          actionsEnabled={false}
          itemSurface="bin"
          scrollTopPadding
        />
      )}
      <BinSelectionActionBar
        visible={selectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        allSelected={allSelected}
        disabled={binBookmarkActionMutation.isPending}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onRestore={handleRestoreSelected}
        onDeleteForever={handleDeleteSelectedForever}
      />
    </div>
  );
}

function BinEmptyState({typeFilter}: {typeFilter: TypeFilter}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TrashIcon />
        </EmptyMedia>
        <EmptyTitle>{getEmptyTitle(typeFilter)}</EmptyTitle>
        <EmptyDescription>
          Deleted {getTypeLabel(typeFilter).toLowerCase()} will appear here before you restore or
          permanently delete them.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function BinLoadError({onRetry}: {onRetry: () => void}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TrashIcon />
        </EmptyMedia>
        <EmptyTitle>Could not load bin</EmptyTitle>
        <EmptyDescription>Something went wrong while loading deleted bookmarks.</EmptyDescription>
      </EmptyHeader>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </Empty>
  );
}

function getEmptyTitle(typeFilter: TypeFilter) {
  switch (typeFilter) {
    case "media":
      return "No deleted media";
    case "post":
      return "No deleted posts";
    default:
      return "No deleted websites";
  }
}

function getTypeLabel(typeFilter: TypeFilter) {
  switch (typeFilter) {
    case "media":
      return "media items";
    case "post":
      return "posts";
    default:
      return "websites";
  }
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334Z"
        fill="currentColor"
      />
    </svg>
  );
}
