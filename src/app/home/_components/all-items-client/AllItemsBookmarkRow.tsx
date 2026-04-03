"use client";

import * as React from "react";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import type {Bookmark} from "@/components/bookmark/types";
import type {
  AllItemsAnimatedVariant,
  AllItemsBookmarkComponentProps,
} from "./all-items-list-layout";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import {useDeleteBookmarkDialogStore} from "@/store/use-delete-bookmark-dialog-store";

interface AllItemsBookmarkRowProps {
  item: Bookmark;
  index: number;
  isRemoving: boolean;
  removalKind: "delete" | "archive";
  selectionMode: boolean;
  isSelected: boolean;
  animatedVariant: AllItemsAnimatedVariant;
  BookmarkItem: React.ComponentType<AllItemsBookmarkComponentProps>;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  onMenuArchive: (item: Bookmark) => void;
  onMenuDelete: (item: Bookmark) => void;
}

function AllItemsBookmarkRowImpl({
  item,
  index,
  isRemoving,
  removalKind,
  selectionMode,
  isSelected,
  animatedVariant,
  BookmarkItem,
  onItemRemoved,
  toggleSelected,
  setSelected,
  onMenuArchive,
  onMenuDelete,
}: AllItemsBookmarkRowProps) {
  const openMenu = useBookmarkMenuStore((state) => state.openMenu);
  const openDeleteDialog = useDeleteBookmarkDialogStore((state) => state.openDialog);

  return (
    <AnimatedItem
      id={item.id}
      isRemoving={isRemoving}
      onRemoved={onItemRemoved}
      variant={animatedVariant}
      kind={removalKind}
      className={animatedVariant === "grid" ? "flex h-full flex-col" : undefined}>
      <div
        data-selection-mode={selectionMode}
        className={
          animatedVariant === "grid"
            ? "group/bookmark-row relative flex min-h-0 flex-1 flex-col"
            : "group/bookmark-row relative"
        }
        onClickCapture={(e) => {
          if (!selectionMode) return;
          e.preventDefault();
          e.stopPropagation();
          toggleSelected(item.id);
        }}>
        <BookmarkItem
          item={item}
          onOpenMenu={(bookmark) =>
            openMenu(bookmark, {
              onArchive: onMenuArchive,
              onDelete: onMenuDelete,
            })
          }
          onDelete={(bookmark) => openDeleteDialog([bookmark])}
          selectionIndex={index}
          isSelected={isSelected}
          setSelected={setSelected}
        />
      </div>
    </AnimatedItem>
  );
}

export const AllItemsBookmarkRow = React.memo(
  AllItemsBookmarkRowImpl,
  (prev, next) =>
    prev.item === next.item &&
    prev.index === next.index &&
    prev.isRemoving === next.isRemoving &&
    prev.removalKind === next.removalKind &&
    prev.selectionMode === next.selectionMode &&
    prev.isSelected === next.isSelected &&
    prev.animatedVariant === next.animatedVariant &&
    prev.BookmarkItem === next.BookmarkItem &&
    prev.onItemRemoved === next.onItemRemoved &&
    prev.toggleSelected === next.toggleSelected &&
    prev.setSelected === next.setSelected &&
    prev.onMenuArchive === next.onMenuArchive &&
    prev.onMenuDelete === next.onMenuDelete,
);
