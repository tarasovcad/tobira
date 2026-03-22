"use client";

import {useRef} from "react";
import {useRouter} from "next/navigation";
import NumberFlow from "@number-flow/react";

// Components
import {Bookmark} from "@/components/bookmark/Bookmark";
import {BookmarkMenu} from "@/components/bookmark/BookmarkMenu";
import {DeleteBookmarkDialog} from "./home-client/DeleteBookmarkDialog";
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {DeleteCollectionDialog} from "@/components/providers/DeleteCollectionDialog";
import {CollectionDialog} from "@/components/providers/CollectionDialog";
import {CollectionHeader} from "./home-client/CollectionHeader";
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
import {useViewOptionsStore} from "@/store/use-view-options";

/**
 * Main client component for the All Items / Home page.
 * Orchestrates fetching, filtering, selection, and mutations for bookmarks.
 */
export function HomeClient({
  userId,
  initialBookmarks,
  totalCount,
}: {
  userId: string | null;
  initialBookmarks: Bookmark[];
  totalCount: number;
}) {
  const router = useRouter();
  const {tagFilter, collectionFilter, typeFilter, sort, handleTypeChange, handleSortChange} =
    useHomeFilters();

  // ── View & filter state ──
  const view = useViewOptionsStore((state) => state.view);
  const setView = useViewOptionsStore((state) => state.setView);

  // ── Query Hook ──
  const {bookmarksQuery, allBookmarks, currentTotalCount, activeCollection, isInitialLoad} =
    useBookmarksQuery({
      userId,
      initialBookmarks,
      totalCount,
      sort,
      tagFilter,
      collectionFilter,
      typeFilter,
    });

  // ── Mutation Hook ──
  const {
    removingIds,
    handleItemRemoved,
    animatingUrl,
    animatingItemCount,
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
    deleteCollectionDialogOpen,
    setDeleteCollectionDialogOpen,
    editCollectionDialogOpen,
    setEditCollectionDialogOpen,
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
      {activeCollection && (
        <CollectionHeader
          activeCollection={activeCollection}
          currentTotalCount={currentTotalCount}
          onEdit={() => setEditCollectionDialogOpen(true)}
          onDelete={() => setDeleteCollectionDialogOpen(true)}
        />
      )}

      {/* Toolbar */}
      <HomeToolbar
        activeCollection={activeCollection}
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        sort={sort}
        onSortChange={handleSortChange}
        selectionMode={selectionMode}
        onSelectionEnabledChange={setSelectionEnabled}
      />
      {/* Item count */}
      {!activeCollection && userId && (
        <div className="text-muted-foreground flex items-center gap-1 px-6 py-3 text-sm">
          <NumberFlow value={currentTotalCount} /> items
        </div>
      )}
      {/* Scrollable content area */}
      {showEmptyState ? (
        <HomeEmptyState userId={userId} />
      ) : (
        <AllItemsList
          view={view}
          typeFilter={typeFilter}
          visibleItems={visibleItems}
          animatingUrl={animatingUrl}
          animatingItemCount={animatingItemCount}
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
        onDeleted={handleClearSelection}
      />
      <DeleteCollectionDialog
        open={deleteCollectionDialogOpen}
        onOpenChange={setDeleteCollectionDialogOpen}
        collections={
          activeCollection ? [{id: activeCollection.id, name: activeCollection.name}] : []
        }
        onDeleted={() => {
          router.push("/home");
        }}
      />
      <CollectionDialog
        open={editCollectionDialogOpen}
        onOpenChange={setEditCollectionDialogOpen}
        collection={activeCollection}
      />
    </div>
  );
}
