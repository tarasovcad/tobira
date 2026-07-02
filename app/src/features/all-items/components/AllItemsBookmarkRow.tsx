"use client";

import {memo, useCallback, type MouseEvent} from "react";
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
  selectionMode: boolean;
  isSelected: boolean;
  animatedVariant: AllItemsAnimatedVariant;
  isMasonry: boolean;
  BookmarkItem: AllItemsBookmarkComponent;
  className?: string;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  onMenuArchive: (item: Bookmark) => void;
  onMenuDelete: (item: Bookmark) => void;
  onRestore?: (item: Bookmark) => void;
  onDeleteForever?: (item: Bookmark) => void;
  actionsEnabled?: boolean;
}

function AllItemsBookmarkRowImpl({
  item,
  onOpenDetail,
  renderId,
  mediaIndex,
  galleryItem,
  selectionIndex,
  selectionMode,
  isSelected,
  animatedVariant,
  isMasonry,
  BookmarkItem,
  className,
  toggleSelected,
  setSelected,
  onMenuArchive,
  onMenuDelete,
  onRestore,
  onDeleteForever,
  actionsEnabled = true,
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
    <div
      data-selection-mode={selectionMode}
      className={
        !isMasonry && animatedVariant === "grid"
          ? "group/bookmark-row relative flex h-full min-h-0 flex-1 flex-col"
          : "group/bookmark-row relative"
      }
      onClickCapture={handleRowClickCapture}>
      <BookmarkItem
        item={item}
        onOpenDetail={onOpenDetail}
        onOpenMenu={actionsEnabled ? handleOpenMenu : undefined}
        onDelete={actionsEnabled ? handleDelete : undefined}
        onRestore={onRestore}
        onDeleteForever={onDeleteForever}
        renderId={renderId}
        mediaIndex={mediaIndex}
        galleryItem={galleryItem}
        selectionIndex={selectionIndex}
        isSelected={isSelected}
        setSelected={setSelected}
        className={className}
      />
    </div>
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
    prev.selectionMode === next.selectionMode &&
    prev.isSelected === next.isSelected &&
    prev.animatedVariant === next.animatedVariant &&
    prev.isMasonry === next.isMasonry &&
    prev.BookmarkItem === next.BookmarkItem &&
    prev.className === next.className &&
    prev.toggleSelected === next.toggleSelected &&
    prev.setSelected === next.setSelected &&
    prev.onMenuArchive === next.onMenuArchive &&
    prev.onMenuDelete === next.onMenuDelete &&
    prev.onRestore === next.onRestore &&
    prev.onDeleteForever === next.onDeleteForever &&
    prev.actionsEnabled === next.actionsEnabled,
);
