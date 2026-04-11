"use client";

import {useMemo, useRef} from "react";
import NumberFlow from "@number-flow/react";

// Components
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {CollectionHeader} from "./home-client/CollectionHeader";
import {TagHeader} from "./home-client/TagHeader";
import {HomeToolbar} from "./home-client/HomeToolbar";

// Hooks
import {useBookmarksSelection} from "../_hooks/use-bookmarks-selection";
import {useBookmarksMutations} from "../_hooks/use-bookmarks-mutations";
import {useHomeArchiveActions} from "../_hooks/home-client/use-home-archive-actions";
import {useHomeDialogs} from "../_hooks/home-client/use-home-dialogs";
import {useHomeFilters} from "../_hooks/home-client/use-home-filters";
import {useHomeInfiniteScroll} from "../_hooks/home-client/use-home-infinite-scroll";
import {useHomeShortcuts} from "../_hooks/use-home-shortcuts";

import {useBookmarksQuery} from "../_hooks/use-bookmarks-query";
import {HomeEmptyState} from "./home-client/HomeEmptyState";
import {CollectionNotFoundState} from "./home-client/CollectionNotFoundState";
import {TagNotFoundState} from "./home-client/TagNotFoundState";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {Bookmark} from "@/components/bookmark/types";
import {cn} from "@/lib/utils";
import type {TypeFilter, SortMode} from "../_types";
import type {TagWithCount} from "../_types";
import {AllItemsList} from "./home-client/AllItemsList";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";

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

  const isServerDataMatching = serverFilters
    ? serverFilters.tagFilter === tagFilter &&
      serverFilters.collectionFilter === collectionFilter &&
      serverFilters.typeFilter === typeFilter &&
      serverFilters.sortFilter === sort
    : false;

  // â”€â”€ View & filter state â”€â”€
  const view = useViewOptionsStore((state) => state.view);
  const setView = useViewOptionsStore((state) => state.setView);

  // â”€â”€ Query Hook â”€â”€
  const {bookmarksQuery, allBookmarks, activeCollection, activeTag, isInitialLoad} =
    useBookmarksQuery({
      userId,
      initialBookmarks,
      initialActiveTag,
      sort,
      tagFilter,
      collectionFilter,
      typeFilter,
      isServerDataMatching,
    });

  // â”€â”€ Mutation Hook â”€â”€
  const {
    removingIds,
    handleItemRemoved,
    animatingUrl,
    animatingItemCount,
    animatingTags,
    resolvedBookmarks,
    handleTransitionDone,
    archiveMutation,
  } = useBookmarksMutations({
    tagFilter,
    activeTagName: activeTag?.name ?? null,
    allBookmarks,
  });

  // â”€â”€ Derived visible items â”€â”€
  const visibleItems = useMemo(() => {
    if (allBookmarks.length === 0) return [];

    const resolvedIds = new Set(resolvedBookmarks.map((bookmark) => bookmark.id));

    return allBookmarks.filter((item) => {
      const isBeingRemoved = removingIds.has(item.id);
      const isDuplicateOfResolved = resolvedIds.has(item.id);

      return !isBeingRemoved && !isDuplicateOfResolved;
    });
  }, [allBookmarks, removingIds, resolvedBookmarks]);

  // â”€â”€ Selection Hook â”€â”€
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
  } = useBookmarksSelection(visibleItems, allBookmarks);

  // â”€â”€ Keyboard shortcuts â”€â”€
  useHomeShortcuts({
    selectionMode,
    handleClearSelection,
    view,
    typeFilter,
    setView,
  });

  // â”€â”€ Dialogs â”€â”€
  const {openDeleteDialog, handleDeleteSelected} = useHomeDialogs({
    allBookmarks,
    selectedIds,
    onDeleted: handleClearSelection,
  });
  const closeMenu = useBookmarkMenuStore((state) => state.closeMenu);

  // â”€â”€ Refs for infinite scroll â”€â”€
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

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {activeCollection ? (
        <CollectionHeader activeCollection={activeCollection} currentTotalCount={totalCount} />
      ) : tagFilter && activeTag ? (
        <TagHeader activeTag={activeTag} currentTotalCount={totalCount} />
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
      {!activeCollection && !tagFilter && userId && (
        <div
          className={cn(
            "text-muted-foreground border-border flex items-center gap-1 px-6 py-3 text-sm",
            view === "compact" && "border-b",
            view === "list" && "border-b",
          )}>
          <NumberFlow value={totalCount} /> items
        </div>
      )}
      {/* Scrollable content area */}
      {isCollectionNotFound ? (
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
          animatingUrl={animatingUrl}
          animatingItemCount={animatingItemCount}
          animatingTags={animatingTags}
          resolvedBookmarks={resolvedBookmarks}
          isInitialLoad={isInitialLoad}
          isFetchingNextPage={isFetchingNextPage}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          removingIds={removingIds}
          scrollAreaRootRef={scrollAreaRootRef}
          bottomSentinelRef={bottomSentinelRef}
          onTransitionDone={handleTransitionDone}
          onItemRemoved={handleItemRemoved}
          toggleSelected={toggleSelected}
          setSelected={setSelected}
          onMenuArchive={handleArchive}
          onMenuDelete={openDeleteDialog}
        />
      )}

      {/* â”€â”€ Floating selection action bar â”€â”€ */}
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
