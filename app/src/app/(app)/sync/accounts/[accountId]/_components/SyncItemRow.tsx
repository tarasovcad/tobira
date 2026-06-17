"use client";

import * as React from "react";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import type {Bookmark} from "@/components/bookmark/types";
import type {
  AllItemsAnimatedVariant,
  AllItemsBookmarkComponentProps,
} from "@/features/all-items/components/all-items-list-layout";
import type {SyncItem} from "../_types";

interface SyncItemRowProps {
  item: SyncItem;
  renderId?: string;
  mediaIndex?: number;
  selectionIndex: number;
  isRemoving: boolean;
  removalKind: "delete" | "archive";
  selectionMode: boolean;
  isSelected: boolean;
  animatedVariant: AllItemsAnimatedVariant;
  isMasonry: boolean;
  BookmarkItem: React.ComponentType<AllItemsBookmarkComponentProps>;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  onMenuExclude: (item: SyncItem) => void;
  onItemSave: (item: SyncItem) => void;
  onItemDismiss: (item: SyncItem) => void;
}

function SyncItemRowImpl({
  item,
  renderId,
  mediaIndex,
  selectionIndex,
  isRemoving,
  removalKind,
  selectionMode,
  isSelected,
  animatedVariant,
  isMasonry,
  BookmarkItem,
  onItemRemoved,
  toggleSelected,
  setSelected,
  onMenuExclude,
  onItemSave,
  onItemDismiss,
}: SyncItemRowProps) {
  const handleRowClickCapture = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectionMode) return;
      e.preventDefault();
      e.stopPropagation();
      toggleSelected(item.id);
    },
    [item.id, selectionMode, toggleSelected],
  );

  const handleExclude = React.useCallback(
    (bookmark: Bookmark) => onMenuExclude(bookmark as SyncItem),
    [onMenuExclude],
  );

  const handleSave = React.useCallback(
    (bookmark: Bookmark) => onItemSave(bookmark as SyncItem),
    [onItemSave],
  );

  const handleDismiss = React.useCallback(
    (bookmark: Bookmark) => onItemDismiss(bookmark as SyncItem),
    [onItemDismiss],
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
          onDelete={handleExclude}
          onSave={handleSave}
          onDismiss={handleDismiss}
          mediaIndex={mediaIndex}
          selectionIndex={selectionIndex}
          isSelected={isSelected}
          setSelected={setSelected}
        />
      </div>
    </AnimatedItem>
  );
}

export const SyncItemRow = React.memo(
  SyncItemRowImpl,
  (prev, next) =>
    prev.item === next.item &&
    prev.renderId === next.renderId &&
    prev.mediaIndex === next.mediaIndex &&
    prev.selectionIndex === next.selectionIndex &&
    prev.isRemoving === next.isRemoving &&
    prev.removalKind === next.removalKind &&
    prev.selectionMode === next.selectionMode &&
    prev.isSelected === next.isSelected &&
    prev.animatedVariant === next.animatedVariant &&
    prev.isMasonry === next.isMasonry &&
    prev.BookmarkItem === next.BookmarkItem &&
    prev.onItemRemoved === next.onItemRemoved &&
    prev.toggleSelected === next.toggleSelected &&
    prev.setSelected === next.setSelected &&
    prev.onMenuExclude === next.onMenuExclude &&
    prev.onItemSave === next.onItemSave &&
    prev.onItemDismiss === next.onItemDismiss,
);
