"use client";

import {useRef} from "react";
import NumberFlow from "@number-flow/react";

// Components
import {BookmarkMenu} from "@/components/bookmark/BookmarkMenu";
import {DeleteBookmarkDialog} from "./home-client/DeleteBookmarkDialog";
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {CollectionHeader} from "./home-client/CollectionHeader";
import {TagHeader} from "./home-client/TagHeader";
import {AllItemsList} from "./home-client/AllItemsList";
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

  // ── View & filter state ──
  const view = useViewOptionsStore((state) => state.view);
  const setView = useViewOptionsStore((state) => state.setView);

  // ── Query Hook ──
  const {
    bookmarksQuery,
    allBookmarks,
    currentTotalCount,
    activeCollection,
    activeTag,
    isInitialLoad,
  } = useBookmarksQuery({
    userId,
    initialBookmarks,
    initialActiveTag,
    totalCount,
    sort,
    tagFilter,
    collectionFilter,
    typeFilter,
    isServerDataMatching,
  });

  // ── Mutation Hook ──
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
    allBookmarks,
  });

  // ── Derived visible items ──
  const visibleItems = allBookmarks.filter((item) => {
    const isBeingRemoved = removingIds.has(item.id);
    const isDuplicateOfResolved = resolvedBookmarks.some((b) => b.id === item.id);

    return !isBeingRemoved && !isDuplicateOfResolved;
  });

  // ── Selection Hook ──
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

  // ── Keyboard shortcuts ──
  useHomeShortcuts({
    selectionMode,
    handleClearSelection,
    view,
    typeFilter,
    setView,
  });

  // ── Dialogs ──
  const {
    menuOpen,
    setMenuOpen,
    menuItem,
    deleteDialogOpen,
    setDeleteDialogOpen,
    itemsToDelete,
    openMenu,
    openDeleteDialog,
    handleDeleteSelected,
  } = useHomeDialogs({
    allBookmarks,
    selectedIds,
  });

  // ── Refs for infinite scroll ──
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
    onArchiveSingleDone: () => setMenuOpen(false),
    onArchiveSelectedDone: handleClearSelection,
  });

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
      {!activeCollection && !tagFilter && userId && (
        <div
          className={cn(
            "text-muted-foreground border-border flex items-center gap-1 px-6 py-3 text-sm",
            view === "compact" && "border-b",
            view === "list" && "border-b",
          )}>
          <NumberFlow value={currentTotalCount} /> items
        </div>
      )}
      {/* Scrollable content area */}
      {isCollectionNotFound ? (
        <CollectionNotFoundState collectionName={collectionFilter} />
      ) : isTagNotFound ? (
        <TagNotFoundState tagName={tagFilter} />
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
          openMenu={openMenu}
          openDeleteDialog={openDeleteDialog}
        />
      )}

      {/* ── Floating selection action bar ── */}
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
      {/* Portalled overlays */}
      <BookmarkMenu
        item={menuItem}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onDelete={openDeleteDialog}
        onArchive={handleArchive}
      />
      <DeleteBookmarkDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        items={itemsToDelete}
        onDeleted={() => {
          handleClearSelection();
          setMenuOpen(false);
        }}
      />
    </div>
  );
}
