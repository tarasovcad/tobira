"use client";

import * as React from "react";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import type {Bookmark} from "@/components/bookmark/types";
import type {
  AllItemsAnimatedVariant,
  AllItemsBookmarkComponentProps,
} from "./all-items-list-layout";

interface AllItemsBookmarkRowProps {
  item: Bookmark;
  index: number;
  isRemoving: boolean;
  removalKind: "delete" | "archive";
  selectionMode: boolean;
  selectedIds: Set<string>;
  animatedVariant: AllItemsAnimatedVariant;
  BookmarkItem: React.ComponentType<AllItemsBookmarkComponentProps>;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  openMenu: (item: Bookmark) => void;
  openDeleteDialog: (item: Bookmark) => void;
}

export function AllItemsBookmarkRow({
  item,
  index,
  isRemoving,
  removalKind,
  selectionMode,
  selectedIds,
  animatedVariant,
  BookmarkItem,
  onItemRemoved,
  toggleSelected,
  setSelected,
  openMenu,
  openDeleteDialog,
}: AllItemsBookmarkRowProps) {
  return (
    <AnimatedItem
      id={item.id}
      isRemoving={isRemoving}
      onRemoved={onItemRemoved}
      variant={animatedVariant}
      kind={removalKind}
      className={animatedVariant === "grid" ? "flex h-full flex-col" : undefined}>
      <div
        className={
          animatedVariant === "grid" ? "relative flex min-h-0 flex-1 flex-col" : "relative"
        }
        onClickCapture={(e) => {
          if (!selectionMode) return;
          e.preventDefault();
          e.stopPropagation();
          toggleSelected(item.id);
        }}>
        <BookmarkItem
          item={item}
          onOpenMenu={openMenu}
          onDelete={openDeleteDialog}
          selectionMode={selectionMode}
          selectionIndex={index}
          selectedIds={selectedIds}
          setSelected={setSelected}
        />
      </div>
    </AnimatedItem>
  );
}
