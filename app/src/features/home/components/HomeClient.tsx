"use client";

import {useCallback, useMemo, useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";

// Components
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {CollectionHeader} from "@/features/home/components/CollectionHeader";
import {TagHeader} from "@/features/home/components/TagHeader";
import {HomeToolbar} from "@/features/home/components/HomeToolbar";
import {
  PostBookmarkDetailView,
  type PostDetailErrorCode,
} from "@/features/home/components/PostBookmarkDetailView";

import {SlotText} from "@/components/ui/slot-text";

// Hooks
import {useBookmarksSelection} from "@/features/home/hooks/use-bookmarks-selection";
import {useBookmarksMutations} from "@/features/home/hooks/use-bookmarks-mutations";
import {useHomeArchiveActions} from "@/features/home/hooks/use-home-archive-actions";
import {useHomeDialogs} from "@/features/home/hooks/use-home-dialogs";
import {useHomeFilters} from "@/features/home/hooks/use-home-filters";
import {useHomeInfiniteScroll} from "@/features/home/hooks/use-home-infinite-scroll";
import {useHomeShortcuts} from "@/features/home/hooks/use-home-shortcuts";
import {usePostDetailUrl} from "@/features/home/hooks/use-post-detail-url";

import {useBookmarksQuery} from "@/features/home/hooks/use-bookmarks-query";
import {HomeEmptyState} from "@/features/home/components/HomeEmptyState";
import {CollectionNotFoundState} from "@/features/home/components/CollectionNotFoundState";
import {TagNotFoundState} from "@/features/home/components/TagNotFoundState";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import {cn} from "@/lib/utils";
import type {TypeFilter, SortMode, TagWithCount} from "@/features/home/types";
import {AllItemsList} from "@/features/all-items/components/AllItemsList";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import {getCurrentAllItemsView} from "@/features/all-items/components/all-items-list-view-options";
import {getPostBookmarkById} from "@/app/actions/bookmarks/getPostBookmarkById";

/**
 * Main client component for the All Items / Home page.
 * Orchestrates fetching, filtering, selection, and mutations for bookmarks.
 */
export function HomeClient({
  userId,
  initialBookmarks,
  initialActiveTag,
  totalCount,
  serverFilters,
}: {
  userId: string | null;
  initialBookmarks: Bookmark[];
  initialActiveTag: TagWithCount | null;
  totalCount: number;
  serverFilters?: {
    tagFilter: string | null;
    collectionFilter: string | null;
    typeFilter: TypeFilter;
    sortFilter: SortMode;
  };
}) {
  const {tagFilter, collectionFilter, typeFilter, sort, handleTypeChange, handleSortChange} =
    useHomeFilters();
  const {detailBookmarkId, isPostDetailOpen, openPostDetail, closePostDetail} = usePostDetailUrl();
  const handleOpenPostDetail = useCallback(
    (item: Bookmark) => {
      if (item.kind !== "post") {
        return;
      }

      openPostDetail(item.id);
    },
    [openPostDetail],
  );

  const isServerDataMatching = serverFilters
    ? serverFilters.tagFilter === tagFilter &&
      serverFilters.collectionFilter === collectionFilter &&
      serverFilters.typeFilter === typeFilter &&
      serverFilters.sortFilter === sort
    : false;

  // View & filter state
  const view = useViewOptionsStore((state) => state.view);
  const setView = useViewOptionsStore((state) => state.setView);
  const currentView = getCurrentAllItemsView(view, typeFilter);

  // Query Hook
  const {
    bookmarksQuery,
    allBookmarks,
    totalCount: currentTotalCount,
    activeCollection,
    activeTag,
    isInitialLoad,
  } = useBookmarksQuery({
    userId,
    initialBookmarks,
    initialActiveTag,
    initialTotalCount: totalCount,
    sort,
    tagFilter,
    collectionFilter,
    typeFilter,
    isServerDataMatching,
  });
  const loadedDetailBookmark = useMemo(() => {
    if (!detailBookmarkId) {
      return null;
    }

    return (
      allBookmarks.find(
        (item): item is PostBookmark => item.kind === "post" && item.id === detailBookmarkId,
      ) ?? null
    );
  }, [allBookmarks, detailBookmarkId]);

  const detailBookmarkQuery = useQuery({
    queryKey: ["bookmarks", "post-detail", userId, detailBookmarkId],
    enabled: Boolean(userId && detailBookmarkId && !loadedDetailBookmark),
    queryFn: async () => {
      if (!detailBookmarkId) {
        return {ok: false as const, code: "NOT_FOUND" as const};
      }

      return await getPostBookmarkById(detailBookmarkId);
    },
    retry: false,
  });
  const fetchedDetailBookmark = detailBookmarkQuery.data?.ok
    ? detailBookmarkQuery.data.bookmark
    : null;
  const detailBookmark = loadedDetailBookmark ?? fetchedDetailBookmark;
  const detailErrorCode: PostDetailErrorCode | null = loadedDetailBookmark
    ? null
    : detailBookmarkQuery.data && !detailBookmarkQuery.data.ok
      ? detailBookmarkQuery.data.code
      : detailBookmarkQuery.isError
        ? "UNKNOWN_ERROR"
        : !userId
          ? "UNAUTHORIZED"
          : null;
  // Mutation Hook
  const {
    removingIds,
    animatedOutIds,
    handleItemRemoved,
    animatingUrl,
    animatingItemCount,
    animatingTags,
    pendingMediaItems,
    resolvedBookmarks,
    handleTransitionDone,
    archiveMutation,
  } = useBookmarksMutations({
    typeFilter,
    tagFilter,
    activeTagName: activeTag?.name ?? null,
    allBookmarks,
  });

  // Derived visible items
  const visibleItems = useMemo(() => {
    if (allBookmarks.length === 0) return [];

    const resolvedIds = new Set(resolvedBookmarks.map((bookmark) => bookmark.id));

    return allBookmarks.filter((item) => {
      const isBeingRemoved = removingIds.has(item.id);
      const isAnimatedOut = animatedOutIds.has(item.id);
      const isDuplicateOfResolved = resolvedIds.has(item.id);

      return !isBeingRemoved && !isAnimatedOut && !isDuplicateOfResolved;
    });
  }, [allBookmarks, animatedOutIds, removingIds, resolvedBookmarks]);
  const selectionItems = useMemo(
    () => (isPostDetailOpen && detailBookmark ? [detailBookmark] : visibleItems),
    [detailBookmark, isPostDetailOpen, visibleItems],
  );
  const selectionBookmarks = useMemo(() => {
    if (!detailBookmark || allBookmarks.some((item) => item.id === detailBookmark.id)) {
      return allBookmarks;
    }

    return [detailBookmark, ...allBookmarks];
  }, [allBookmarks, detailBookmark]);

  // Selection Hook
  const {
    selectionMode,
    selectedIds,
    selectedCount,
    allSelected,
    setSelected,
    toggleSelected,
    setSelectionEnabled,
    handleClearSelection,
    handleSelectAll,
    handleCopySelected,
  } = useBookmarksSelection(selectionItems, selectionBookmarks);

  // Keyboard shortcuts
  useHomeShortcuts({
    selectionMode,
    handleClearSelection,
    view,
    typeFilter,
    setView,
  });

  // Dialogs
  const {openDeleteDialog, handleDeleteSelected} = useHomeDialogs({
    allBookmarks: selectionBookmarks,
    selectedIds,
    onDeleted: handleClearSelection,
  });
  const openMenu = useBookmarkMenuStore((state) => state.openMenu);
  const closeMenu = useBookmarkMenuStore((state) => state.closeMenu);

  // Refs for infinite scroll
  const scrollAreaRootRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  const {hasNextPage, isFetchingNextPage, fetchNextPage} = bookmarksQuery;
  const showEmptyState =
    !isInitialLoad &&
    !isFetchingNextPage &&
    visibleItems.length === 0 &&
    !animatingUrl &&
    resolvedBookmarks.length === 0;

  const isCollectionNotFound = collectionFilter && !activeCollection && !isInitialLoad;
  const isTagNotFound = tagFilter && !activeTag && !isInitialLoad;

  useHomeInfiniteScroll({
    scrollAreaRootRef,
    bottomSentinelRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const {handleArchive, handleArchiveSelected} = useHomeArchiveActions({
    selectedIds,
    archive: archiveMutation.mutate,
    onArchiveSingleDone: closeMenu,
    onArchiveSelectedDone: handleClearSelection,
  });
  const handleOpenDetailMenu = useCallback(
    (item: Bookmark) =>
      openMenu(item, {
        onArchive: handleArchive,
        onDelete: openDeleteDialog,
      }),
    [handleArchive, openDeleteDialog, openMenu],
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {activeCollection ? (
        <CollectionHeader
          activeCollection={activeCollection}
          currentTotalCount={currentTotalCount}
        />
      ) : tagFilter && activeTag ? (
        <TagHeader activeTag={activeTag} currentTotalCount={currentTotalCount} />
      ) : null}

      {/* Toolbar */}
      <HomeToolbar
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        sort={sort}
        onSortChange={handleSortChange}
        selectionMode={selectionMode}
        onSelectionEnabledChange={setSelectionEnabled}
      />
      {/* Item count */}
      {!isPostDetailOpen && !activeCollection && !tagFilter && userId && (
        <div
          className={cn(
            "text-muted-foreground border-border flex items-center gap-1 px-6 py-3 text-sm",
            currentView === "compact" && "border-b",
            currentView === "list" && "border-b",
          )}>
          <SlotTextWithFallback text={String(currentTotalCount)} /> items
        </div>
      )}

      {/* Scrollable content area */}
      {isPostDetailOpen && detailBookmarkId ? (
        <div className="min-h-0 flex-1">
          <PostBookmarkDetailView
            detailBookmarkId={detailBookmarkId}
            item={detailBookmark}
            errorCode={detailErrorCode}
            isLoading={!detailBookmark && detailBookmarkQuery.isLoading}
            selectionMode={selectionMode}
            isSelected={detailBookmark ? selectedIds.has(detailBookmark.id) : false}
            onBack={closePostDetail}
            onOpenMenu={handleOpenDetailMenu}
            setSelected={setSelected}
            toggleSelected={toggleSelected}
          />
        </div>
      ) : isCollectionNotFound ? (
        <CollectionNotFoundState collectionName={collectionFilter} />
      ) : isTagNotFound ? (
        <TagNotFoundState />
      ) : showEmptyState ? (
        <HomeEmptyState userId={userId} />
      ) : (
        <AllItemsList
          view={view}
          typeFilter={typeFilter}
          visibleItems={visibleItems}
          onOpenDetail={handleOpenPostDetail}
          animatingUrl={animatingUrl}
          animatingItemCount={animatingItemCount}
          animatingTags={animatingTags}
          pendingMediaItems={pendingMediaItems}
          resolvedBookmarks={resolvedBookmarks}
          isInitialLoad={isInitialLoad}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          removingIds={removingIds}
          scrollAreaRootRef={scrollAreaRootRef}
          bottomSentinelRef={bottomSentinelRef}
          fetchNextPage={fetchNextPage}
          onTransitionDone={handleTransitionDone}
          onItemRemoved={handleItemRemoved}
          toggleSelected={toggleSelected}
          setSelected={setSelected}
          onMenuArchive={handleArchive}
          onMenuDelete={openDeleteDialog}
        />
      )}

      {/* Floating selection action bar */}
      <SelectionActionBar
        visible={selectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onCopy={handleCopySelected}
        onArchive={handleArchiveSelected}
        onDelete={handleDeleteSelected}
      />
    </div>
  );
}

function SlotTextWithFallback({text}: {text: string}) {
  const [isReady, setIsReady] = useState(false);

  return (
    <span className="relative inline-block tabular-nums">
      <span
        aria-hidden={isReady}
        className={cn("inline-block leading-[inherit]", isReady && "invisible")}>
        {text}
      </span>
      <SlotText
        aria-hidden={!isReady}
        className={cn(
          "absolute inset-0 inline-flex leading-[inherit] [&_.char-face]:block [&_.char-face]:text-center [&_.char-face]:leading-[inherit] [&_.char-slot]:leading-[inherit]",
          !isReady && "invisible",
        )}
        onReady={() => setIsReady(true)}
        text={text}
      />
    </span>
  );
}
