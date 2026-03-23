"use client";
import {useMemo} from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import type {Bookmark} from "@/components/bookmark/types";
import type {TypeFilter} from "../AllItemsToolbar";
import type {ViewMode} from "@/store/use-view-options";
import {useViewOptionsStore} from "@/store/use-view-options";
import {
  getCurrentAllItemsView,
  getAllItemsListViewOptions,
} from "../all-items-client/all-items-list-view-options";
import {AllItemsAnimatingPlaceholders} from "../all-items-client/AllItemsAnimatingPlaceholders";
import {AllItemsBookmarkRow} from "../all-items-client/AllItemsBookmarkRow";
import {getAllItemsListLayoutConfig} from "../all-items-client/all-items-list-layout";

// Toggle to test new item placeholder with fake data (remove when done)
const SHOW_TEST_PLACEHOLDER = true;

function LoadingSpinner({className}: {className?: string}) {
  return (
    <div className={className}>
      <Spinner className="mx-auto size-4 animate-spin" />
    </div>
  );
}

interface AllItemsListProps {
  view: ViewMode;
  typeFilter: TypeFilter;
  visibleItems: Bookmark[];
  animatingUrl: string | null;
  animatingItemCount: number;
  resolvedBookmarks: Bookmark[];
  isInitialLoad: boolean;
  isFetchingNextPage: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  removingIds: Map<string, "delete" | "archive">;
  scrollAreaRootRef: React.RefObject<HTMLDivElement | null>;
  bottomSentinelRef: React.RefObject<HTMLDivElement | null>;
  onTransitionDone: () => void;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  openMenu: (item: Bookmark) => void;
  openDeleteDialog: (item: Bookmark) => void;
}

export function AllItemsList({
  view,
  typeFilter,
  visibleItems,
  animatingUrl,
  animatingItemCount,
  resolvedBookmarks,
  isFetchingNextPage,
  selectionMode,
  selectedIds,
  removingIds,
  scrollAreaRootRef,
  bottomSentinelRef,
  onTransitionDone,
  onItemRemoved,
  toggleSelected,
  setSelected,
  openMenu,
  openDeleteDialog,
  isInitialLoad,
}: AllItemsListProps) {
  const currentView = getCurrentAllItemsView(view, typeFilter);
  const isMediaGrid = currentView === "grid" && typeFilter === "media";

  const gridGap = useViewOptionsStore((state) => state.gridGap);
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const borderRadius = useViewOptionsStore((state) => state.borderRadius);
  const bookmarkWidth = useViewOptionsStore((state) => state.bookmarkWidth);

  const {borderRadiusClass, gapClass, gridColsClass} = getAllItemsListViewOptions({
    borderRadius,
    gridGap,
    columnSize,
  });

  const layoutConfig = useMemo(
    () =>
      getAllItemsListLayoutConfig({
        view: currentView,
        borderRadiusClass,
        gapClass,
        gridColsClass,
        isMediaGrid,
        bookmarkWidth,
      }),
    [borderRadiusClass, currentView, gapClass, gridColsClass, isMediaGrid, bookmarkWidth],
  );

  const skeletonCount = 12;

  const fakeBookmark: Bookmark = {
    id: "test-placeholder",
    kind: "website",
    title: "Testing",
    description: "This is a sample description for testing the new bookmark placeholder layout.",
    created_at: new Date().toISOString(),
    url: "https://example.com/test-page",
    user_id: "",
    preview_image: "",
    updated_at: "",
    archived_at: "",
    deleted_at: "",
    notes: "",
    tags: ["test", "placeholder"],
  };

  const content = isInitialLoad
    ? Array.from({length: skeletonCount}, (_, index) => layoutConfig.renderSkeletonItem(index))
    : visibleItems.map((item, index) => (
        <AllItemsBookmarkRow
          key={item.id}
          item={item}
          index={index}
          isRemoving={removingIds.has(item.id)}
          removalKind={removingIds.get(item.id) ?? "delete"}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          animatedVariant={layoutConfig.animatedVariant}
          BookmarkItem={layoutConfig.BookmarkItem}
          onItemRemoved={onItemRemoved}
          toggleSelected={toggleSelected}
          setSelected={setSelected}
          openMenu={openMenu}
          openDeleteDialog={openDeleteDialog}
        />
      ));

  const PlaceholderComponent = layoutConfig.NewBookmarkPlaceholder;

  const body = (
    <>
      {/* {SHOW_TEST_PLACEHOLDER && (
        <>
          <div>
            <PlaceholderComponent
              url="https://example.com/loading-bookmark"
              bookmark={null}
              onDone={() => {}}
            />
          </div>
          <div>
            <PlaceholderComponent
              url="https://example.com/test-bookmark"
              bookmark={fakeBookmark}
              onDone={() => {}}
            />
          </div>
        </>
      )} */}
      <AllItemsAnimatingPlaceholders
        animatingUrl={animatingUrl}
        animatingItemCount={animatingItemCount}
        resolvedBookmarks={resolvedBookmarks}
        onTransitionDone={onTransitionDone}
        PlaceholderComponent={layoutConfig.NewBookmarkPlaceholder}
      />
      {content}
      {isFetchingNextPage && <LoadingSpinner className={layoutConfig.fetchSpinnerClassName} />}
    </>
  );

  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" scrollbarGutter>
        <div className={layoutConfig.containerClassName}>
          {layoutConfig.isTable ? <BookmarkTableShell>{body}</BookmarkTableShell> : body}
          <div ref={bottomSentinelRef} aria-hidden className={layoutConfig.sentinelClassName} />
        </div>
      </ScrollArea>
    </div>
  );
}
