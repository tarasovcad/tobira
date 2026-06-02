"use client";

import {memo, useCallback, type MouseEvent} from "react";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import type {Bookmark} from "@/components/bookmark/types";
import type {
  AllItemsAnimatedVariant,
  AllItemsBookmarkComponent,
  AllItemsBookmarkComponentProps,
} from "./all-items-list-layout";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import {useDeleteBookmarkDialogStore} from "@/store/use-delete-bookmark-dialog-store";

interface AllItemsBookmarkRowProps {
  item: Bookmark;
  onOpenDetail?: (item: Bookmark) => void;
  renderId?: string;
  mediaIndex?: number;
  galleryItem?: AllItemsBookmarkComponentProps["galleryItem"];
  selectionIndex: number;
  isRemoving: boolean;
  removalKind: "delete" | "archive";
  selectionMode: boolean;
  isSelected: boolean;
  animatedVariant: AllItemsAnimatedVariant;
  isMasonry: boolean;
  BookmarkItem: AllItemsBookmarkComponent;
  className?: string;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  onMenuArchive: (item: Bookmark) => void;
  onMenuDelete: (item: Bookmark) => void;
}

function AllItemsBookmarkRowImpl({
  item,
  onOpenDetail,
  renderId,
  mediaIndex,
  galleryItem,
  selectionIndex,
  isRemoving,
  removalKind,
  selectionMode,
  isSelected,
  animatedVariant,
  isMasonry,
  BookmarkItem,
  className,
  onItemRemoved,
  toggleSelected,
  setSelected,
  onMenuArchive,
  onMenuDelete,
}: AllItemsBookmarkRowProps) {
  const openMenu = useBookmarkMenuStore((state) => state.openMenu);
  const openDeleteDialog = useDeleteBookmarkDialogStore((state) => state.openDialog);
  const handleRowClickCapture = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!selectionMode) return;
      e.preventDefault();
      e.stopPropagation();
      toggleSelected(item.id);
    },
    [item.id, selectionMode, toggleSelected],
  );
  const handleOpenMenu = useCallback(
    (bookmark: Bookmark) =>
      openMenu(bookmark, {
        onArchive: onMenuArchive,
        onDelete: onMenuDelete,
      }),
    [onMenuArchive, onMenuDelete, openMenu],
  );
  const handleDelete = useCallback(
    (bookmark: Bookmark) => openDeleteDialog([bookmark]),
    [openDeleteDialog],
  );

  return (
    <AnimatedItem
      id={renderId ?? item.id}
      isRemoving={isRemoving}
      onRemoved={onItemRemoved}
      variant={animatedVariant}
      kind={removalKind}
      stretchContent={!isMasonry && animatedVariant === "grid"}
      className={!isMasonry && animatedVariant === "grid" ? "flex h-full flex-col" : undefined}>
      <div
        data-selection-mode={selectionMode}
        className={
          !isMasonry && animatedVariant === "grid"
            ? "group/bookmark-row relative flex min-h-0 flex-1 flex-col"
            : "group/bookmark-row relative"
        }
        onClickCapture={handleRowClickCapture}>
        <BookmarkItem
          item={item}
          onOpenDetail={onOpenDetail}
          onOpenMenu={handleOpenMenu}
          onDelete={handleDelete}
          renderId={renderId}
          mediaIndex={mediaIndex}
          galleryItem={galleryItem}
          selectionIndex={selectionIndex}
          isSelected={isSelected}
          setSelected={setSelected}
          className={className}
        />
      </div>
    </AnimatedItem>
  );
}

export const AllItemsBookmarkRow = memo(
  AllItemsBookmarkRowImpl,
  (prev, next) =>
    prev.item === next.item &&
    prev.onOpenDetail === next.onOpenDetail &&
    prev.renderId === next.renderId &&
    prev.mediaIndex === next.mediaIndex &&
    prev.galleryItem?.index === next.galleryItem?.index &&
    prev.galleryItem?.renderId === next.galleryItem?.renderId &&
    prev.galleryItem?.controller === next.galleryItem?.controller &&
    prev.selectionIndex === next.selectionIndex &&
    prev.isRemoving === next.isRemoving &&
    prev.removalKind === next.removalKind &&
    prev.selectionMode === next.selectionMode &&
    prev.isSelected === next.isSelected &&
    prev.animatedVariant === next.animatedVariant &&
    prev.isMasonry === next.isMasonry &&
    prev.BookmarkItem === next.BookmarkItem &&
    prev.className === next.className &&
    prev.onItemRemoved === next.onItemRemoved &&
    prev.toggleSelected === next.toggleSelected &&
    prev.setSelected === next.setSelected &&
    prev.onMenuArchive === next.onMenuArchive &&
    prev.onMenuDelete === next.onMenuDelete,
);
